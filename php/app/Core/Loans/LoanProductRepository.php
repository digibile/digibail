<?php

declare(strict_types=1);

namespace App\Core\Loans;

use PDO;

final class LoanProductRepository
{
    public function __construct(private readonly PDO $db) {}

    /** @return list<array<string,mixed>> */
    public function publicList(string $tenantId): array
    {
        $statement = $this->db->prepare(
            'SELECT * FROM LoanProducts
             WHERE TenantId = :tenant_id AND IsActive = 1 AND ShowInList = 1
             ORDER BY SortOrder ASC, CreatedOn DESC'
        );
        $statement->execute(['tenant_id' => $tenantId]);
        return array_map([self::class, 'shape'], $statement->fetchAll());
    }

    /** @return array<string,mixed>|null */
    public function publicOne(string $tenantId, string $slug): ?array
    {
        $statement = $this->db->prepare(
            'SELECT * FROM LoanProducts
             WHERE TenantId = :tenant_id AND Slug = :slug AND IsActive = 1
             LIMIT 1'
        );
        $statement->execute(['tenant_id' => $tenantId, 'slug' => $slug]);
        $row = $statement->fetch();
        return is_array($row) ? self::shape($row) : null;
    }

    /** @return list<array<string,mixed>> */
    public function adminList(string $tenantId): array
    {
        $statement = $this->db->prepare(
            'SELECT * FROM LoanProducts
             WHERE TenantId = :tenant_id ORDER BY SortOrder ASC, CreatedOn DESC'
        );
        $statement->execute(['tenant_id' => $tenantId]);
        return array_map(static function (array $row): array {
            return [
                'id' => $row['Id'],
                'shape' => self::shape($row),
                'isActive' => (bool) $row['IsActive'],
                'sortOrder' => (int) $row['SortOrder'],
                'showInList' => (bool) $row['ShowInList'],
                'sendReminders' => (bool) $row['SendReminders'],
            ];
        }, $statement->fetchAll());
    }

    /** @param array<string,mixed> $input */
    public function create(string $tenantId, array $input): string
    {
        $id = self::uuid();
        $statement = $this->db->prepare(
            'INSERT INTO LoanProducts (
                Id, TenantId, Name, Slug, Description, Badge, MinAmount, MaxAmount,
                IntervalDays, TiersJson, ConditionsJson, DocumentsJson, IsActive,
                SortOrder, CreatedOn, InterestMethod, InterestPercent, LateDailyCoef,
                EarlyDailyCoef, ShowInList, SendReminders, Title, ImageUrl,
                LabelsJson, FullDescriptionHtml, OperationalCostsJson
            ) VALUES (
                :id, :tenant_id, :name, :slug, :description, :badge, :min_amount,
                :max_amount, :interval_days, :tiers, :conditions, :documents,
                :is_active, :sort_order, UTC_TIMESTAMP(6), :interest_method,
                :interest_percent, :late_daily_coef, :early_daily_coef, :show_in_list,
                :send_reminders, :title, :image_url, :labels, :full_description_html,
                :operational_costs
            )'
        );
        $statement->execute(self::parameters($id, $tenantId, $input));
        return $id;
    }

    /** @param array<string,mixed> $input */
    public function update(string $tenantId, string $id, array $input): bool
    {
        $statement = $this->db->prepare(
            'UPDATE LoanProducts SET
                Name = :name, Slug = :slug, Description = :description, Badge = :badge,
                MinAmount = :min_amount, MaxAmount = :max_amount, IntervalDays = :interval_days,
                TiersJson = :tiers, ConditionsJson = :conditions, DocumentsJson = :documents,
                IsActive = :is_active, SortOrder = :sort_order, InterestMethod = :interest_method,
                InterestPercent = :interest_percent, LateDailyCoef = :late_daily_coef,
                EarlyDailyCoef = :early_daily_coef, ShowInList = :show_in_list,
                SendReminders = :send_reminders, Title = :title,
                FullDescriptionHtml = :full_description_html, LabelsJson = :labels,
                OperationalCostsJson = :operational_costs
             WHERE Id = :id AND TenantId = :tenant_id'
        );
        $params = self::parameters($id, $tenantId, $input);
        unset($params['image_url']);
        $statement->execute($params);
        return $statement->rowCount() > 0 || $this->exists($tenantId, $id);
    }

    public function toggle(string $tenantId, string $id): ?bool
    {
        $this->db->beginTransaction();
        try {
            $query = $this->db->prepare(
                'SELECT IsActive FROM LoanProducts
                 WHERE Id = :id AND TenantId = :tenant_id FOR UPDATE'
            );
            $query->execute(['id' => $id, 'tenant_id' => $tenantId]);
            $row = $query->fetch();
            if (!is_array($row)) {
                $this->db->commit();
                return null;
            }

            $active = !(bool) $row['IsActive'];
            $update = $this->db->prepare(
                'UPDATE LoanProducts SET IsActive = :active
                 WHERE Id = :id AND TenantId = :tenant_id'
            );
            $update->execute(['active' => (int) $active, 'id' => $id, 'tenant_id' => $tenantId]);
            $this->db->commit();
            return $active;
        } catch (\Throwable $exception) {
            if ($this->db->inTransaction()) $this->db->rollBack();
            throw $exception;
        }
    }

    public function setImageUrl(string $tenantId, string $id, string $url): bool
    {
        $statement = $this->db->prepare(
            'UPDATE LoanProducts SET ImageUrl = :url
             WHERE Id = :id AND TenantId = :tenant_id'
        );
        $statement->execute(['url' => $url, 'id' => $id, 'tenant_id' => $tenantId]);
        return $statement->rowCount() > 0 || $this->exists($tenantId, $id);
    }

    public function imageUrl(string $tenantId, string $id): ?string
    {
        $statement = $this->db->prepare(
            'SELECT ImageUrl FROM LoanProducts WHERE Id = :id AND TenantId = :tenant_id LIMIT 1'
        );
        $statement->execute(['id' => $id, 'tenant_id' => $tenantId]);
        $value = $statement->fetchColumn();
        return $value === false ? null : (string) $value;
    }

    /** @return list<string> */
    public function labels(string $tenantId): array
    {
        $statement = $this->db->prepare('SELECT LabelsJson FROM LoanProducts WHERE TenantId = :tenant_id');
        $statement->execute(['tenant_id' => $tenantId]);
        $labels = [];
        foreach ($statement->fetchAll() as $row) {
            $decoded = json_decode((string) $row['LabelsJson'], true);
            if (is_array($decoded)) {
                foreach ($decoded as $label) {
                    if (is_string($label) && $label !== '') $labels[$label] = true;
                }
            }
        }
        $result = array_keys($labels);
        sort($result, SORT_STRING);
        return $result;
    }

    /** @param array<string,mixed> $row
     *  @return array<string,mixed>
     */
    public static function shape(array $row): array
    {
        $decode = static function (string $key, mixed $fallback) use ($row): mixed {
            $value = json_decode((string) ($row[$key] ?? ''), true);
            return json_last_error() === JSON_ERROR_NONE ? $value : $fallback;
        };

        return [
            'id' => (string) $row['Slug'],
            'name' => (string) $row['Name'],
            'description' => (string) $row['Description'],
            'badge' => (string) $row['Badge'],
            'isActive' => (bool) $row['IsActive'],
            'minAmount' => (float) $row['MinAmount'],
            'maxAmount' => (float) $row['MaxAmount'],
            'intervalMonths' => self::intervalMonthsFromStored((int) $row['IntervalDays']),
            'intervalDays' => (int) $row['IntervalDays'],
            'tiers' => $decode('TiersJson', []),
            'conditions' => $decode('ConditionsJson', (object) []),
            'documents' => $decode('DocumentsJson', []),
            'title' => (string) (($row['Title'] ?? '') !== '' ? $row['Title'] : $row['Name']),
            'imageUrl' => (string) $row['ImageUrl'],
            'fullDescriptionHtml' => (string) $row['FullDescriptionHtml'],
            'labels' => $decode('LabelsJson', []),
            'operationalCosts' => $decode('OperationalCostsJson', []),
            'interestMethod' => (string) $row['InterestMethod'],
            'interestPercent' => (float) $row['InterestPercent'],
            'lateDailyCoef' => (float) $row['LateDailyCoef'],
            'earlyDailyCoef' => (float) $row['EarlyDailyCoef'],
            'showInList' => (bool) $row['ShowInList'],
            'sendReminders' => (bool) $row['SendReminders'],
        ];
    }

    /** @param array<string,mixed> $input
     *  @return array<string,mixed>
     */
    private static function parameters(string $id, string $tenantId, array $input): array
    {
        return [
            'id' => $id,
            'tenant_id' => $tenantId,
            'name' => $input['name'],
            'slug' => $input['slug'],
            'description' => $input['description'],
            'badge' => $input['badge'],
            'min_amount' => $input['minAmount'],
            'max_amount' => $input['maxAmount'],
            'interval_days' => $input['intervalDays'],
            'tiers' => json_encode($input['tiers'], JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR),
            'conditions' => json_encode($input['conditions'], JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR),
            'documents' => json_encode($input['documents'], JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR),
            'is_active' => (int) $input['isActive'],
            'sort_order' => $input['sortOrder'],
            'interest_method' => $input['interestMethod'],
            'interest_percent' => $input['interestPercent'],
            'late_daily_coef' => $input['lateDailyCoef'],
            'early_daily_coef' => $input['earlyDailyCoef'],
            'show_in_list' => (int) $input['showInList'],
            'send_reminders' => (int) $input['sendReminders'],
            'title' => $input['title'],
            'image_url' => $input['imageUrl'],
            'labels' => json_encode($input['labels'], JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR),
            'full_description_html' => $input['fullDescriptionHtml'],
            'operational_costs' => json_encode($input['operationalCosts'], JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR),
        ];
    }

    private function exists(string $tenantId, string $id): bool
    {
        $statement = $this->db->prepare('SELECT 1 FROM LoanProducts WHERE TenantId = :tenant_id AND Id = :id LIMIT 1');
        $statement->execute(['tenant_id' => $tenantId, 'id' => $id]);
        return $statement->fetchColumn() !== false;
    }

    private static function intervalMonthsFromStored(int $value): int
    {
        if ($value >= 1 && $value <= 12) return $value;
        $ranges = [
            [28, 31, 1], [59, 62, 2], [89, 93, 3], [118, 124, 4],
            [148, 155, 5], [178, 186, 6], [208, 217, 7], [238, 248, 8],
            [268, 279, 9], [298, 310, 10], [328, 341, 11], [358, 372, 12],
        ];
        foreach ($ranges as [$minimum, $maximum, $months]) {
            if ($value >= $minimum && $value <= $maximum) return $months;
        }
        return 1;
    }

    private static function uuid(): string
    {
        $bytes = random_bytes(16);
        $bytes[6] = chr((ord($bytes[6]) & 0x0f) | 0x40);
        $bytes[8] = chr((ord($bytes[8]) & 0x3f) | 0x80);
        $hex = bin2hex($bytes);
        return substr($hex, 0, 8) . '-' . substr($hex, 8, 4) . '-' . substr($hex, 12, 4)
            . '-' . substr($hex, 16, 4) . '-' . substr($hex, 20);
    }
}
