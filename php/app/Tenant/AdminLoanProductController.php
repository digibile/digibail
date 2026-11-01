<?php

declare(strict_types=1);

namespace App\Tenant;

use App\Core\Database\ConnectionFactory;
use App\Core\Http\Request;
use App\Core\Http\Response;
use App\Security\JwtService;
use PDO;
use Throwable;

final class AdminLoanProductController
{
    private PDO $db;

    public function __construct()
    {
        $this->db = ConnectionFactory::create();
    }

    public function list(Request $request): Response
    {
        if (($denied = $this->authorize($request)) !== null) return $denied;
        try {
            $tenantId = $this->tenantId($request);
            $statement = $this->db->prepare(
                'SELECT * FROM LoanProducts WHERE TenantId = :tenant_id ORDER BY SortOrder, CreatedOn DESC'
            );
            $statement->execute(['tenant_id' => $tenantId]);
            return Response::json(array_map(fn (array $row): array => $this->adminShape($row), $statement->fetchAll()));
        } catch (Throwable $exception) {
            error_log('Admin loan product list failed: ' . $exception->getMessage());
            return Response::json(['message' => 'فهرست طرح‌ها در دسترس نیست.'], 503);
        }
    }

    public function create(Request $request): Response
    {
        if (($denied = $this->authorize($request)) !== null) return $denied;
        $input = $this->validatedInput($request->input);
        if (isset($input['error'])) return Response::json(['message' => $input['error']], 400);

        try {
            $tenantId = $this->tenantId($request);
            $check = $this->db->prepare('SELECT 1 FROM LoanProducts WHERE TenantId = :tenant_id AND Slug = :slug LIMIT 1');
            $check->execute(['tenant_id' => $tenantId, 'slug' => $input['slug']]);
            if ($check->fetchColumn()) return Response::json(['message' => 'این شناسه قبلاً ثبت شده'], 409);

            $id = self::uuid();
            $statement = $this->db->prepare(
                'INSERT INTO LoanProducts
                (Id,TenantId,Name,Slug,Description,Badge,MinAmount,MaxAmount,IntervalDays,TiersJson,ConditionsJson,DocumentsJson,
                 IsActive,SortOrder,CreatedOn,InterestMethod,InterestPercent,LateDailyCoef,EarlyDailyCoef,ShowInList,SendReminders,
                 Title,ImageUrl,LabelsJson,FullDescriptionHtml,OperationalCostsJson)
                 VALUES
                (:id,:tenant_id,:name,:slug,:description,:badge,:min_amount,:max_amount,:interval_days,:tiers,:conditions,:documents,
                 :active,:sort_order,:created_on,:interest_method,:interest_percent,:late_coef,:early_coef,:show_list,:reminders,
                 :title,:image_url,:labels,:html,:costs)'
            );
            $statement->execute($this->dbValues($id, $tenantId, $input));
            return Response::json(['id' => $id], 200);
        } catch (Throwable $exception) {
            error_log('Admin loan product create failed: ' . $exception->getMessage());
            return Response::json(['message' => 'ثبت طرح انجام نشد.'], 503);
        }
    }

    public function update(Request $request): Response
    {
        if (($denied = $this->authorize($request)) !== null) return $denied;
        $id = (string) ($request->params['id'] ?? '');
        if (!self::validUuid($id)) return Response::json(['message' => 'شناسه طرح معتبر نیست.'], 400);
        $input = $this->validatedInput($request->input);
        if (isset($input['error'])) return Response::json(['message' => $input['error']], 400);

        try {
            $tenantId = $this->tenantId($request);
            $check = $this->db->prepare('SELECT 1 FROM LoanProducts WHERE TenantId = :tenant_id AND Slug = :slug AND Id <> :id LIMIT 1');
            $check->execute(['tenant_id' => $tenantId, 'slug' => $input['slug'], 'id' => $id]);
            if ($check->fetchColumn()) return Response::json(['message' => 'این شناسه قبلاً ثبت شده'], 409);

            $values = $this->dbValues($id, $tenantId, $input);
            unset($values['id'], $values['tenant_id'], $values['created_on']);
            $values['id'] = $id;
            $values['tenant_id'] = $tenantId;
            $statement = $this->db->prepare(
                'UPDATE LoanProducts SET Name=:name,Slug=:slug,Description=:description,Badge=:badge,
                 MinAmount=:min_amount,MaxAmount=:max_amount,IntervalDays=:interval_days,TiersJson=:tiers,
                 ConditionsJson=:conditions,DocumentsJson=:documents,IsActive=:active,SortOrder=:sort_order,
                 InterestMethod=:interest_method,InterestPercent=:interest_percent,LateDailyCoef=:late_coef,
                 EarlyDailyCoef=:early_coef,ShowInList=:show_list,SendReminders=:reminders,Title=:title,
                 LabelsJson=:labels,FullDescriptionHtml=:html,OperationalCostsJson=:costs
                 WHERE Id=:id AND TenantId=:tenant_id'
            );
            $statement->execute($values);
            if ($statement->rowCount() === 0) {
                $exists = $this->db->prepare('SELECT 1 FROM LoanProducts WHERE Id=:id AND TenantId=:tenant_id');
                $exists->execute(['id' => $id, 'tenant_id' => $tenantId]);
                if (!$exists->fetchColumn()) return Response::json(['message' => 'طرح پیدا نشد.'], 404);
            }
            return Response::json(['ok' => true]);
        } catch (Throwable $exception) {
            error_log('Admin loan product update failed: ' . $exception->getMessage());
            return Response::json(['message' => 'ویرایش طرح انجام نشد.'], 503);
        }
    }

    public function toggle(Request $request): Response
    {
        if (($denied = $this->authorize($request)) !== null) return $denied;
        $id = (string) ($request->params['id'] ?? '');
        if (!self::validUuid($id)) return Response::json(['message' => 'شناسه طرح معتبر نیست.'], 400);
        try {
            $tenantId = $this->tenantId($request);
            $statement = $this->db->prepare('UPDATE LoanProducts SET IsActive = 1 - IsActive WHERE Id=:id AND TenantId=:tenant_id');
            $statement->execute(['id' => $id, 'tenant_id' => $tenantId]);
            $read = $this->db->prepare('SELECT IsActive FROM LoanProducts WHERE Id=:id AND TenantId=:tenant_id');
            $read->execute(['id' => $id, 'tenant_id' => $tenantId]);
            $active = $read->fetchColumn();
            return $active === false ? Response::json(['message' => 'طرح پیدا نشد.'], 404) : Response::json(['isActive' => (bool) $active]);
        } catch (Throwable $exception) {
            error_log('Admin loan product toggle failed: ' . $exception->getMessage());
            return Response::json(['message' => 'تغییر وضعیت طرح انجام نشد.'], 503);
        }
    }

    public function labels(Request $request): Response
    {
        if (($denied = $this->authorize($request)) !== null) return $denied;
        try {
            $statement = $this->db->prepare('SELECT LabelsJson FROM LoanProducts WHERE TenantId=:tenant_id');
            $statement->execute(['tenant_id' => $this->tenantId($request)]);
            $labels = [];
            foreach ($statement->fetchAll(PDO::FETCH_COLUMN) as $json) {
                $items = json_decode((string) $json, true);
                if (is_array($items)) foreach ($items as $item) if (is_string($item) && $item !== '') $labels[$item] = true;
            }
            $result = array_keys($labels);
            sort($result, SORT_STRING);
            return Response::json($result);
        } catch (Throwable $exception) {
            error_log('Admin loan product labels failed: ' . $exception->getMessage());
            return Response::json(['message' => 'برچسب‌ها در دسترس نیستند.'], 503);
        }
    }

    private function authorize(Request $request): ?Response
    {
        $authorization = (string) ($request->headers['authorization'] ?? '');
        $token = preg_match('/^Bearer\s+(.+)$/i', $authorization, $match) === 1
            ? trim($match[1])
            : '';
        if ($token === '') {
            foreach (explode(';', (string) ($request->headers['cookie'] ?? '')) as $cookie) {
                $pair = explode('=', trim($cookie), 2);
                if (($pair[0] ?? '') === 'db_session') $token = (string) ($pair[1] ?? '');
            }
        }
        if ($token === '') return Response::json(['message' => 'ورود الزامی است.'], 401);
        try {
            $claims = (new JwtService((string) getenv('JWT_SECRET'), 'digibail'))->verify($token);
        } catch (Throwable) {
            $claims = null;
        }
        if (!is_array($claims)) return Response::json(['message' => 'نشست معتبر نیست.'], 401);
        $roles = $claims['roles'] ?? [($claims['role'] ?? '')];
        if (!is_array($roles)) $roles = [];
        foreach ($roles as $role) if (is_string($role) && in_array(strtolower($role), ['admin', 'superadmin'], true)) return null;
        return Response::json(['message' => 'دسترسی مدیر لازم است.'], 403);
    }

    /** @return array<string, mixed> */
    private function validatedInput(array $input): array
    {
        $name = trim((string) ($input['name'] ?? ''));
        $slug = (string) ($input['slug'] ?? '');
        if ($name === '' || strlen($name) > 120 || preg_match('/^[a-z0-9-]{2,40}$/D', $slug) !== 1) return ['error' => 'نام و شناسه معتبر طرح الزامی است.'];
        $method = (string) ($input['interestMethod'] ?? 'Monthly');
        $interest = filter_var($input['interestPercent'] ?? 0, FILTER_VALIDATE_FLOAT);
        $late = filter_var($input['lateDailyCoef'] ?? 0, FILTER_VALIDATE_FLOAT);
        $early = filter_var($input['earlyDailyCoef'] ?? 0, FILTER_VALIDATE_FLOAT);
        $min = filter_var($input['minAmount'] ?? 0, FILTER_VALIDATE_FLOAT);
        $max = filter_var($input['maxAmount'] ?? 0, FILTER_VALIDATE_FLOAT);
        $days = filter_var($input['intervalDays'] ?? 30, FILTER_VALIDATE_INT);
        $tiers = $input['tiers'] ?? null;
        $conditions = $input['conditions'] ?? [];
        $documents = $input['documents'] ?? [];
        $labels = $input['labels'] ?? [];
        $costs = $input['operationalCosts'] ?? [];
        $beta = is_array($conditions) && ($conditions['kind'] ?? '') === 'beta';
        if (!in_array($method, ['Monthly', 'Annual', 'Flat'], true) || $interest === false || $interest < 0 || $interest > 100 ||
            $late === false || $late < 0 || $late > 1 || $early === false || $early < 0 || $early > 1) return ['error' => 'نرخ سود یا ضرایب روزانه معتبر نیستند.'];
        if (strlen((string) ($input['title'] ?? '')) > 160 || !is_array($tiers) || (!$beta && ($min === false || $min <= 0 || $max === false || $max < $min || $days === false || $days < 1 || $days > 365 || $tiers === []))) return ['error' => 'مبالغ، فاصله اقساط یا پله‌های طرح معتبر نیستند.'];
        if (!is_array($conditions) || !is_array($documents) || !is_array($labels) || count($labels) > 10 || !is_array($costs) || count($costs) > 10) return ['error' => 'ساختار شرایط، مدارک، برچسب‌ها یا هزینه‌ها معتبر نیست.'];
        foreach ($labels as $label) if (!is_string($label) || $label === '' || mb_strlen($label) > 30) return ['error' => 'برچسب طرح معتبر نیست.'];
        foreach ($tiers as $tier) if (!is_array($tier) || (int) ($tier['months'] ?? 0) < 1 || (float) ($tier['feePercent'] ?? -1) < 0) return ['error' => 'پله‌های اقساط معتبر نیستند.'];
        foreach ($costs as $cost) if (!is_array($cost) || trim((string) ($cost['title'] ?? '')) === '' || (float) ($cost['percent'] ?? -1) < 0 || (float) ($cost['percent'] ?? 101) > 100) return ['error' => 'هزینه عملیاتی معتبر نیست.'];

        return [
            'name'=>$name,'slug'=>$slug,'description'=>mb_substr((string)($input['description']??''),0,500),
            'badge'=>mb_substr((string)($input['badge']??''),0,40),'min_amount'=>$min === false ? 0 : $min,
            'max_amount'=>$max === false ? 0 : $max,'interval_days'=>$days === false ? 30 : $days,
            'tiers'=>json_encode($tiers,JSON_UNESCAPED_UNICODE|JSON_THROW_ON_ERROR),
            'conditions'=>json_encode($conditions,JSON_UNESCAPED_UNICODE|JSON_THROW_ON_ERROR),
            'documents'=>json_encode($documents,JSON_UNESCAPED_UNICODE|JSON_THROW_ON_ERROR),
            'active'=>!empty($input['isActive'])?1:0,'sort_order'=>(int)($input['sortOrder']??0),
            'interest_method'=>$method,'interest_percent'=>$interest,'late_coef'=>$late,'early_coef'=>$early,
            'show_list'=>!array_key_exists('showInList',$input)||!empty($input['showInList'])?1:0,
            'reminders'=>!array_key_exists('sendReminders',$input)||!empty($input['sendReminders'])?1:0,
            'title'=>mb_substr(trim((string)($input['title']??'')),0,160),
            'image_url'=>'','labels'=>json_encode($labels,JSON_UNESCAPED_UNICODE|JSON_THROW_ON_ERROR),
            'html'=>strip_tags((string)($input['fullDescriptionHtml']??''),'<p><br><b><strong><i><em><ul><ol><li><h2><h3><a>'),
            'costs'=>json_encode($costs,JSON_UNESCAPED_UNICODE|JSON_THROW_ON_ERROR),
        ];
    }

    private function dbValues(string $id, string $tenantId, array $v): array
    {
        return [
            'id'=>$id,'tenant_id'=>$tenantId,'name'=>$v['name'],'slug'=>$v['slug'],'description'=>$v['description'],'badge'=>$v['badge'],
            'min_amount'=>$v['min_amount'],'max_amount'=>$v['max_amount'],'interval_days'=>$v['interval_days'],
            'tiers'=>$v['tiers'],'conditions'=>$v['conditions'],'documents'=>$v['documents'],'active'=>$v['active'],
            'sort_order'=>$v['sort_order'],'created_on'=>gmdate('Y-m-d H:i:s.u'),'interest_method'=>$v['interest_method'],
            'interest_percent'=>$v['interest_percent'],'late_coef'=>$v['late_coef'],'early_coef'=>$v['early_coef'],
            'show_list'=>$v['show_list'],'reminders'=>$v['reminders'],'title'=>$v['title'],'image_url'=>$v['image_url'],
            'labels'=>$v['labels'],'html'=>$v['html'],'costs'=>$v['costs'],
        ];
    }

    private function tenantId(Request $request): string
    {
        $host = strtolower(trim(explode(':', (string) ($request->headers['host'] ?? ''))[0]));
        if ($host !== '') {
            $query = $this->db->prepare('SELECT t.Id FROM TenantDomains d INNER JOIN Tenants t ON t.Id=d.TenantId WHERE LOWER(d.Host)=:host AND t.IsActive=1 LIMIT 1');
            $query->execute(['host' => $host]);
            $id = $query->fetchColumn();
            if (is_string($id)) return $id;
        }
        $query = $this->db->query('SELECT Id FROM Tenants WHERE IsDefault=1 AND IsActive=1 ORDER BY CreatedOn LIMIT 2');
        $rows = $query->fetchAll(PDO::FETCH_COLUMN);
        if (count($rows) !== 1) throw new \RuntimeException('A unique active default tenant is required.');
        return (string) $rows[0];
    }

    private function adminShape(array $row): array
    {
        $shape = [
            'id'=>(string)$row['Slug'],'name'=>(string)$row['Name'],'title'=>(string)($row['Title']?:$row['Name']),
            'description'=>(string)$row['Description'],'badge'=>(string)$row['Badge'],'isActive'=>(bool)$row['IsActive'],
            'minAmount'=>(float)$row['MinAmount'],'maxAmount'=>(float)$row['MaxAmount'],
            'intervalMonths'=>$this->intervalMonths((int)$row['IntervalDays']),'intervalDays'=>(int)$row['IntervalDays'],
            'tiers'=>$this->decode($row['TiersJson']),'conditions'=>$this->decode($row['ConditionsJson']),
            'documents'=>$this->decode($row['DocumentsJson']),'imageUrl'=>(string)$row['ImageUrl'],
            'fullDescriptionHtml'=>(string)$row['FullDescriptionHtml'],'labels'=>$this->decode($row['LabelsJson']),
            'operationalCosts'=>$this->decode($row['OperationalCostsJson']),'interestMethod'=>(string)$row['InterestMethod'],
            'interestPercent'=>(float)$row['InterestPercent'],'lateDailyCoef'=>(float)$row['LateDailyCoef'],
            'earlyDailyCoef'=>(float)$row['EarlyDailyCoef'],'showInList'=>(bool)$row['ShowInList'],
            'sendReminders'=>(bool)$row['SendReminders'],
        ];
        return ['id'=>$row['Id'],'shape'=>$shape,'isActive'=>(bool)$row['IsActive'],'sortOrder'=>(int)$row['SortOrder'],'showInList'=>(bool)$row['ShowInList'],'sendReminders'=>(bool)$row['SendReminders']];
    }

    private function decode(mixed $json): mixed
    {
        try { return json_decode((string)$json, true, 64, JSON_THROW_ON_ERROR); } catch (Throwable) { return []; }
    }

    private function intervalMonths(int $days): int
    {
        if ($days >= 1 && $days <= 12) return $days;
        foreach ([[28,31,1],[59,62,2],[89,93,3],[118,124,4],[148,155,5],[178,186,6],[208,217,7],[238,248,8],[268,279,9],[298,310,10],[328,341,11],[358,372,12]] as [$min,$max,$months]) {
            if ($days >= $min && $days <= $max) return $months;
        }
        return 1;
    }

    private static function uuid(): string
    {
        $data = random_bytes(16); $data[6] = chr((ord($data[6]) & 0x0f) | 0x40); $data[8] = chr((ord($data[8]) & 0x3f) | 0x80);
        $hex = bin2hex($data);
        return substr($hex,0,8).'-'.substr($hex,8,4).'-'.substr($hex,12,4).'-'.substr($hex,16,4).'-'.substr($hex,20);
    }

    private static function validUuid(string $id): bool
    {
        return preg_match('/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iD',$id)===1;
    }
}
