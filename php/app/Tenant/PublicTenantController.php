<?php

declare(strict_types=1);

namespace App\Tenant;

use App\Core\Database\ConnectionFactory;
use App\Core\Http\Request;
use App\Core\Http\Response;
use PDO;
use PDOException;
use Throwable;

final class PublicTenantController
{
    private PDO $db;

    public function __construct()
    {
        $this->db = ConnectionFactory::create();
    }

    public function config(Request $request): Response
    {
        try {
            $tenant = $this->resolveTenant($request);
            $brand = $this->decodeObject($tenant['BrandJson'] ?? null);

            return Response::json([
                'data' => [
                    'id' => $tenant['Id'],
                    'name' => $tenant['Name'],
                    'brand' => [
                        'logoText' => (string) ($brand['logoText'] ?? mb_substr((string) $tenant['Name'], 0, 1, 'UTF-8')),
                        'primary' => (string) ($brand['primary'] ?? '#4a2a86'),
                        'accent' => (string) ($brand['accent'] ?? '#ffb629'),
                    ],
                ],
            ]);
        } catch (PDOException $exception) {
            error_log('Tenant config query failed: ' . $exception->getMessage());
            return Response::json(['message' => 'تنظیمات پایگاه داده مستأجر در دسترس نیست.'], 503);
        } catch (Throwable $exception) {
            error_log('Tenant resolution failed: ' . $exception->getMessage());
            return Response::json(['message' => 'تنظیمات مجموعه پیدا نشد.'], 404);
        }
    }

    public function products(Request $request): Response
    {
        try {
            $tenant = $this->resolveTenant($request);
            $statement = $this->db->prepare(
                'SELECT Id, Name, Slug, Description, Badge, MinAmount, MaxAmount,
                        IntervalDays, TiersJson, ConditionsJson, DocumentsJson,
                        IsActive, SortOrder, InterestMethod, InterestPercent,
                        LateDailyCoef, EarlyDailyCoef, ShowInList, SendReminders,
                        Title, ImageUrl, LabelsJson, FullDescriptionHtml,
                        OperationalCostsJson
                 FROM LoanProducts
                 WHERE TenantId = :tenant_id AND IsActive = 1 AND ShowInList = 1
                 ORDER BY SortOrder ASC, CreatedOn DESC'
            );
            $statement->execute(['tenant_id' => $tenant['Id']]);
            $rows = $statement->fetchAll();

            return new Response(
                200,
                json_encode(
                    array_map(fn (array $row): array => $this->shapeProduct($row), $rows),
                    JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR
                ),
                [
                    'Content-Type' => 'application/json; charset=utf-8',
                    'Cache-Control' => 'public, max-age=10, stale-while-revalidate=30',
                    'X-Content-Type-Options' => 'nosniff',
                ]
            );
        } catch (PDOException $exception) {
            error_log('Public loan products query failed: ' . $exception->getMessage());
            return Response::json(['message' => 'فهرست طرح‌ها موقتاً در دسترس نیست.'], 503);
        } catch (Throwable $exception) {
            error_log('Public loan products tenant resolution failed: ' . $exception->getMessage());
            return Response::json(['message' => 'تنظیمات مجموعه پیدا نشد.'], 404);
        }
    }

    public function product(Request $request): Response
    {
        $slug = trim((string) ($request->params['slug'] ?? ''));
        if ($slug === '' || strlen($slug) > 40 || preg_match('/^[a-zA-Z0-9آ-ی_-]+$/uD', $slug) !== 1) {
            return Response::json(['message' => 'شناسه طرح معتبر نیست.'], 400);
        }

        try {
            $tenant = $this->resolveTenant($request);
            $statement = $this->db->prepare(
                'SELECT Id, Name, Slug, Description, Badge, MinAmount, MaxAmount,
                        IntervalDays, TiersJson, ConditionsJson, DocumentsJson,
                        IsActive, SortOrder, InterestMethod, InterestPercent,
                        LateDailyCoef, EarlyDailyCoef, ShowInList, SendReminders,
                        Title, ImageUrl, LabelsJson, FullDescriptionHtml,
                        OperationalCostsJson
                 FROM LoanProducts
                 WHERE TenantId = :tenant_id AND Slug = :slug
                   AND IsActive = 1 AND ShowInList = 1
                 LIMIT 1'
            );
            $statement->execute(['tenant_id' => $tenant['Id'], 'slug' => $slug]);
            $row = $statement->fetch();

            if (!is_array($row)) {
                return Response::json(['message' => 'طرح وام پیدا نشد.'], 404);
            }

            return new Response(
                200,
                json_encode($this->shapeProduct($row), JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR),
                [
                    'Content-Type' => 'application/json; charset=utf-8',
                    'Cache-Control' => 'public, max-age=10, stale-while-revalidate=30',
                    'X-Content-Type-Options' => 'nosniff',
                ]
            );
        } catch (PDOException $exception) {
            error_log('Public loan product query failed: ' . $exception->getMessage());
            return Response::json(['message' => 'طرح وام موقتاً در دسترس نیست.'], 503);
        } catch (Throwable $exception) {
            error_log('Public loan product tenant resolution failed: ' . $exception->getMessage());
            return Response::json(['message' => 'تنظیمات مجموعه پیدا نشد.'], 404);
        }
    }

    /** @return array<string, mixed> */
    private function resolveTenant(Request $request): array
    {
        $host = strtolower(trim(explode(':', (string) ($request->headers['host'] ?? ''))[0]));
        if ($host !== '' && strlen($host) <= 253) {
            $statement = $this->db->prepare(
                'SELECT t.Id, t.Name, t.BrandJson
                 FROM TenantDomains d
                 INNER JOIN Tenants t ON t.Id = d.TenantId
                 WHERE LOWER(d.Host) = :host AND t.IsActive = 1
                 LIMIT 1'
            );
            $statement->execute(['host' => $host]);
            $tenant = $statement->fetch();
            if (is_array($tenant)) {
                return $tenant;
            }
        }

        $statement = $this->db->query(
            'SELECT Id, Name, BrandJson FROM Tenants
             WHERE IsDefault = 1 AND IsActive = 1
             ORDER BY CreatedOn ASC LIMIT 2'
        );
        $rows = $statement->fetchAll();
        if (count($rows) !== 1) {
            throw new \RuntimeException('An active default tenant must be configured uniquely.');
        }

        return $rows[0];
    }

    private static function intervalMonthsFromStored(int $value): int
    {
        if ($value >= 1 && $value <= 12) {
            return $value;
        }

        $ranges = [
            [28, 31, 1], [59, 62, 2], [89, 93, 3], [118, 124, 4],
            [148, 155, 5], [178, 186, 6], [208, 217, 7], [238, 248, 8],
            [268, 279, 9], [298, 310, 10], [328, 341, 11], [358, 372, 12],
        ];
        foreach ($ranges as [$minimum, $maximum, $months]) {
            if ($value >= $minimum && $value <= $maximum) {
                return $months;
            }
        }

        return 1;
    }

    /** @return array<string, mixed> */
    private function shapeProduct(array $row): array
    {
        $interval = self::intervalMonthsFromStored((int) $row['IntervalDays']);
        return [
            'id' => (string) $row['Slug'],
            'name' => (string) $row['Name'],
            'title' => (string) ($row['Title'] ?: $row['Name']),
            'description' => (string) $row['Description'],
            'badge' => (string) $row['Badge'],
            'isActive' => (bool) $row['IsActive'],
            'minAmount' => (float) $row['MinAmount'],
            'maxAmount' => (float) $row['MaxAmount'],
            'intervalMonths' => $interval,
            'intervalDays' => $interval,
            'tiers' => $this->decodeValue($row['TiersJson']),
            'conditions' => $this->decodeValue($row['ConditionsJson']),
            'documents' => $this->decodeValue($row['DocumentsJson']),
            'imageUrl' => (string) $row['ImageUrl'],
            'fullDescriptionHtml' => (string) $row['FullDescriptionHtml'],
            'labels' => $this->decodeValue($row['LabelsJson']),
            'operationalCosts' => $this->decodeValue($row['OperationalCostsJson']),
            'interestMethod' => (string) $row['InterestMethod'],
            'interestPercent' => (float) $row['InterestPercent'],
            'lateDailyCoef' => (float) $row['LateDailyCoef'],
            'earlyDailyCoef' => (float) $row['EarlyDailyCoef'],
            'showInList' => (bool) $row['ShowInList'],
            'sendReminders' => (bool) $row['SendReminders'],
        ];
    }

    private function decodeValue(mixed $value): mixed
    {
        if (!is_string($value) || $value === '') {
            return [];
        }

        try {
            return json_decode($value, true, 64, JSON_THROW_ON_ERROR);
        } catch (\JsonException) {
            return [];
        }
    }

    /** @return array<string, mixed> */
    private function decodeObject(mixed $value): array
    {
        $decoded = $this->decodeValue($value);
        return is_array($decoded) ? $decoded : [];
    }
}
