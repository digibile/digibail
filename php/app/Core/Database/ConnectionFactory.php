<?php

declare(strict_types=1);

namespace App\Core\Database;

use PDO;
use RuntimeException;

final class ConnectionFactory
{
    public static function isConfigured(): bool
    {
        return self::env('DB_HOST') !== ''
            && self::env('DB_NAME') !== ''
            && self::env('DB_USER') !== '';
    }

    public static function create(): PDO
    {
        if (!self::isConfigured()) {
            throw new RuntimeException('Database connection is not configured.');
        }

        $host = self::env('DB_HOST');
        $port = self::env('DB_PORT') ?: '3306';
        $database = self::env('DB_NAME');
        $charset = self::env('DB_CHARSET') ?: 'utf8mb4';
        $timeout = max(1, (int) (self::env('DB_CONNECTION_TIMEOUT') ?: '5'));

        $dsn = sprintf(
            'mysql:host=%s;port=%s;dbname=%s;charset=%s',
            $host,
            $port,
            $database,
            $charset
        );

        return new PDO(
            $dsn,
            self::env('DB_USER'),
            self::env('DB_PASSWORD'),
            [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
                PDO::ATTR_TIMEOUT => $timeout,
            ]
        );
    }

    private static function env(string $name): string
    {
        $value = getenv($name);

        return $value === false ? '' : trim($value);
    }
}
