<?php

declare(strict_types=1);

namespace App\Tenancy;

use PDO;
use RuntimeException;

final class TenantResolver
{
    public function __construct(private readonly PDO $db) {}

    /** @return array{id:string,name:string,slug:string,brand:array<string,mixed>} */
    public function resolve(): array
    {
        $host = $this->requestHost();
        if ($host !== '') {
            $query = $this->db->prepare(
                'SELECT t.Id, t.Name, t.Slug, t.BrandJson
                 FROM TenantDomains d
                 INNER JOIN Tenants t ON t.Id = d.TenantId
                 WHERE d.Host = :host AND t.IsActive = 1 LIMIT 1'
            );
            $query->execute(['host' => $host]);
            $row = $query->fetch();
            if (is_array($row)) return $this->shape($row);
        }

        $row = $this->db->query(
            'SELECT Id, Name, Slug, BrandJson FROM Tenants
             WHERE IsDefault = 1 AND IsActive = 1 ORDER BY CreatedOn ASC LIMIT 1'
        )->fetch();

        return $this->shape(is_array($row) ? $row : $this->createDefaultTenant());
    }

    /** @return array<string,mixed> */
    private function createDefaultTenant(): array
    {
        $lock = $this->db->query("SELECT GET_LOCK('digibail_php_default_tenant', 5)")->fetchColumn();
        if ((int) $lock !== 1) throw new RuntimeException('Default tenant creation lock unavailable.');

        try {
            $row = $this->db->query(
                'SELECT Id, Name, Slug, BrandJson FROM Tenants
                 WHERE IsDefault = 1 AND IsActive = 1 ORDER BY CreatedOn ASC LIMIT 1'
            )->fetch();
            if (is_array($row)) return $row;

            $id = self::uuid();
            $name = trim((string) (getenv('BRAND_NAME') ?: 'دیجی‌بایل'));
            $brand = json_encode([
                'logoText' => mb_substr($name, 0, 1, 'UTF-8'),
                'primary' => '#4a2a86',
                'accent' => '#ffb629',
            ], JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR);

            $insert = $this->db->prepare(
                'INSERT INTO Tenants (Id, Name, Slug, BrandJson, IsDefault, IsActive, CreatedOn)
                 VALUES (:id, :name, :slug, :brand, 1, 1, UTC_TIMESTAMP(6))'
            );
            $insert->execute(['id' => $id, 'name' => $name, 'slug' => 'default', 'brand' => $brand]);

            return ['Id' => $id, 'Name' => $name, 'Slug' => 'default', 'BrandJson' => $brand];
        } finally {
            $this->db->query("SELECT RELEASE_LOCK('digibail_php_default_tenant')");
        }
    }

    private function requestHost(): string
    {
        $host = (string) ($_SERVER['HTTP_HOST'] ?? '');
        if (in_array((string) ($_SERVER['REMOTE_ADDR'] ?? ''), ['127.0.0.1', '::1'], true)) {
            $forwarded = trim(explode(',', (string) ($_SERVER['HTTP_X_FORWARDED_HOST'] ?? ''))[0]);
            if ($forwarded !== '') $host = $forwarded;
        }
        $parsed = parse_url('http://' . $host, PHP_URL_HOST);
        return is_string($parsed) ? strtolower(rtrim($parsed, '.')) : '';
    }

    /** @param array<string,mixed> $row
     *  @return array{id:string,name:string,slug:string,brand:array<string,mixed>}
     */
    private function shape(array $row): array
    {
        $brand = json_decode((string) $row['BrandJson'], true);
        return [
            'id' => (string) $row['Id'],
            'name' => (string) $row['Name'],
            'slug' => (string) $row['Slug'],
            'brand' => is_array($brand) ? $brand : [],
        ];
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
