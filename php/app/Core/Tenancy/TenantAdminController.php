<?php

declare(strict_types=1);

namespace App\Core\Tenancy;

use App\Core\Database\ConnectionFactory;
use App\Core\Http\Request;
use App\Core\Http\Response;
use App\Security\AuthContext;
use PDO;
use Throwable;

final class TenantAdminController
{
    private PDO $db;
    private AuthContext $auth;

    public function __construct()
    {
        $this->db = ConnectionFactory::create();
        $this->auth = new AuthContext();
    }

    public function list(Request $request): Response
    {
        if (($denied = $this->guard($request)) !== null) return $denied;
        try {
            $tenants = $this->db->query('SELECT Id,Name,Slug,BrandJson,IsDefault,IsActive FROM Tenants ORDER BY CreatedOn')->fetchAll();
            $domains = $this->db->query('SELECT Id,TenantId,Host,IsPrimary FROM TenantDomains ORDER BY Host')->fetchAll();
            $byTenant = [];
            foreach ($domains as $domain) {
                $byTenant[(string) $domain['TenantId']][] = [
                    'id' => $domain['Id'], 'host' => $domain['Host'], 'isPrimary' => (bool) $domain['IsPrimary'],
                ];
            }
            return Response::json(array_map(static function (array $tenant) use ($byTenant): array {
                $brand = json_decode((string) $tenant['BrandJson'], true);
                return [
                    'id' => $tenant['Id'], 'name' => $tenant['Name'], 'slug' => $tenant['Slug'],
                    'isDefault' => (bool) $tenant['IsDefault'], 'isActive' => (bool) $tenant['IsActive'],
                    'brand' => is_array($brand) ? $brand : new \stdClass(),
                    'domains' => $byTenant[(string) $tenant['Id']] ?? [],
                ];
            }, $tenants));
        } catch (Throwable $exception) {
            error_log('Tenant admin list failed: ' . $exception->getMessage());
            return Response::json(['message' => 'فهرست مجموعه‌ها در دسترس نیست.'], 503);
        }
    }

    public function create(Request $request): Response
    {
        if (($denied = $this->guard($request)) !== null) return $denied;
        $name = trim((string) ($request->input['name'] ?? ''));
        $slug = trim((string) ($request->input['slug'] ?? ''));
        $active = !empty($request->input['isActive']);
        $brand = $request->input['brand'] ?? [];
        if ($name === '' || mb_strlen($name) > 120 || preg_match('/^[a-z0-9-]{2,40}$/D', $slug) !== 1 || !is_array($brand)) {
            return Response::json(['message' => 'نام، شناسه انگلیسی و تنظیمات برند معتبر الزامی است.'], 400);
        }
        try {
            $check = $this->db->prepare('SELECT 1 FROM Tenants WHERE Slug=:slug LIMIT 1');
            $check->execute(['slug' => $slug]);
            if ($check->fetchColumn()) return Response::json(['message' => 'این شناسه قبلاً ثبت شده است.'], 409);
            $id = self::uuid();
            $insert = $this->db->prepare(
                'INSERT INTO Tenants (Id,Name,Slug,BrandJson,IsDefault,IsActive,CreatedOn)
                 VALUES (:id,:name,:slug,:brand,0,:active,UTC_TIMESTAMP(6))'
            );
            $insert->execute([
                'id' => $id, 'name' => $name, 'slug' => $slug,
                'brand' => json_encode($brand, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR),
                'active' => (int) $active,
            ]);
            return Response::json(['id' => $id]);
        } catch (Throwable $exception) {
            error_log('Tenant create failed: ' . $exception->getMessage());
            return Response::json(['message' => 'ایجاد مجموعه انجام نشد.'], 503);
        }
    }

    public function update(Request $request): Response
    {
        if (($denied = $this->guard($request)) !== null) return $denied;
        $id = (string) ($request->params['id'] ?? '');
        if (!self::validUuid($id)) return Response::json(['message' => 'شناسه مجموعه معتبر نیست.'], 400);
        $name = trim((string) ($request->input['name'] ?? ''));
        $active = !empty($request->input['isActive']);
        $brand = $request->input['brand'] ?? null;
        if ($name === '' || mb_strlen($name) > 120 || ($brand !== null && !is_array($brand))) {
            return Response::json(['message' => 'نام یا تنظیمات برند معتبر نیست.'], 400);
        }
        try {
            $query = $this->db->prepare('SELECT IsDefault FROM Tenants WHERE Id=:id LIMIT 1');
            $query->execute(['id' => $id]);
            $default = $query->fetchColumn();
            if ($default === false) return Response::json(['message' => 'مجموعه پیدا نشد.'], 404);
            if ((bool) $default && !$active) return Response::json(['message' => 'مجموعه پیش‌فرض غیرفعال نمی‌شود.'], 400);

            $sql = 'UPDATE Tenants SET Name=:name,IsActive=:active';
            $params = ['name' => $name, 'active' => (int) $active, 'id' => $id];
            if (is_array($brand)) {
                $sql .= ',BrandJson=:brand';
                $params['brand'] = json_encode($brand, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR);
            }
            $sql .= ' WHERE Id=:id';
            $this->db->prepare($sql)->execute($params);
            return Response::json(['ok' => true]);
        } catch (Throwable $exception) {
            error_log('Tenant update failed: ' . $exception->getMessage());
            return Response::json(['message' => 'ویرایش مجموعه انجام نشد.'], 503);
        }
    }

    public function addDomain(Request $request): Response
    {
        if (($denied = $this->guard($request)) !== null) return $denied;
        $id = (string) ($request->params['id'] ?? '');
        if (!self::validUuid($id)) return Response::json(['message' => 'شناسه مجموعه معتبر نیست.'], 400);
        $host = strtolower(trim((string) ($request->input['host'] ?? '')));
        $primary = !empty($request->input['isPrimary']);
        if (strlen($host) > 253 || preg_match('/^(?=.{4,253}$)([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/D', $host) !== 1) {
            return Response::json(['message' => 'نام دامنه معتبر نیست.'], 400);
        }
        try {
            $tenant = $this->db->prepare('SELECT 1 FROM Tenants WHERE Id=:id LIMIT 1');
            $tenant->execute(['id' => $id]);
            if (!$tenant->fetchColumn()) return Response::json(['message' => 'مجموعه پیدا نشد.'], 404);
            $exists = $this->db->prepare('SELECT 1 FROM TenantDomains WHERE Host=:host LIMIT 1');
            $exists->execute(['host' => $host]);
            if ($exists->fetchColumn()) return Response::json(['message' => 'این دامنه قبلاً به یک مجموعه متصل شده است.'], 409);

            $this->db->beginTransaction();
            if ($primary) {
                $clear = $this->db->prepare('UPDATE TenantDomains SET IsPrimary=0 WHERE TenantId=:tenant_id AND IsPrimary=1');
                $clear->execute(['tenant_id' => $id]);
            }
            $insert = $this->db->prepare(
                'INSERT INTO TenantDomains (Id,TenantId,Host,IsPrimary,CreatedOn)
                 VALUES (:id,:tenant_id,:host,:primary,UTC_TIMESTAMP(6))'
            );
            $insert->execute(['id' => self::uuid(), 'tenant_id' => $id, 'host' => $host, 'primary' => (int) $primary]);
            $this->db->commit();
            return Response::json([
                'host' => $host,
                'nextSteps' => 'رکورد DNS دامنه را به IP سرور متصل کنید، دامنه را در DirectAdmin/nginx اضافه کنید و گواهی SSL بگیرید.',
            ]);
        } catch (Throwable $exception) {
            if ($this->db->inTransaction()) $this->db->rollBack();
            error_log('Tenant domain create failed: ' . $exception->getMessage());
            return Response::json(['message' => 'اتصال دامنه انجام نشد.'], 503);
        }
    }

    public function deleteDomain(Request $request): Response
    {
        if (($denied = $this->guard($request)) !== null) return $denied;
        $id = (string) ($request->params['id'] ?? '');
        $domainId = (string) ($request->params['domainId'] ?? '');
        if (!self::validUuid($id) || !self::validUuid($domainId)) return Response::json(['message' => 'شناسه مجموعه یا دامنه معتبر نیست.'], 400);
        try {
            $delete = $this->db->prepare('DELETE FROM TenantDomains WHERE Id=:domain_id AND TenantId=:tenant_id');
            $delete->execute(['domain_id' => $domainId, 'tenant_id' => $id]);
            return $delete->rowCount() === 0
                ? Response::json(['message' => 'دامنه پیدا نشد.'], 404)
                : new Response(204, '', ['Cache-Control' => 'no-store']);
        } catch (Throwable $exception) {
            error_log('Tenant domain delete failed: ' . $exception->getMessage());
            return Response::json(['message' => 'حذف دامنه انجام نشد.'], 503);
        }
    }

    private function guard(Request $request): ?Response
    {
        $user = $this->auth->user($request);
        if ($user === null) return Response::json(['message' => 'ورود مدیرکل الزامی است.'], 401);
        return $this->auth->hasAnyRole($user, ['SuperAdmin'])
            ? null
            : Response::json(['message' => 'فقط مدیرکل به مدیریت مجموعه‌ها دسترسی دارد.'], 403);
    }

    private static function uuid(): string
    {
        $data = random_bytes(16); $data[6] = chr((ord($data[6]) & 0x0f) | 0x40); $data[8] = chr((ord($data[8]) & 0x3f) | 0x80);
        $hex = bin2hex($data);
        return substr($hex,0,8).'-'.substr($hex,8,4).'-'.substr($hex,12,4).'-'.substr($hex,16,4).'-'.substr($hex,20);
    }

    private static function validUuid(string $id): bool
    {
        return preg_match('/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iD', $id) === 1;
    }
}
