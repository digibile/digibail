<?php

declare(strict_types=1);

namespace App\Core\Http;

final readonly class Request
{
    /**
     * @param array<string, string> $headers
     * @param array<string, mixed> $query
     * @param array<string, mixed> $input
     * @param array<string, mixed> $files
     */
    public function __construct(
        public string $method,
        public string $path,
        public array $headers = [],
        public array $query = [],
        public array $input = [],
        public array $files = []
    ) {
    }

    public static function fromGlobals(): self
    {
        $uri = (string) ($_SERVER['REQUEST_URI'] ?? '/');
        $path = parse_url($uri, PHP_URL_PATH);

        if (!is_string($path) || $path === '') {
            $path = '/';
        }

        $headers = function_exists('getallheaders') ? getallheaders() : [];
        $normalizedHeaders = [];

        foreach ($headers as $name => $value) {
            if (is_string($name) && is_string($value)) {
                $normalizedHeaders[strtolower($name)] = $value;
            }
        }

        $input = $_POST;
        $contentType = strtolower(trim(explode(';', $normalizedHeaders['content-type'] ?? '')[0]));

        if ($contentType === 'application/json') {
            $raw = file_get_contents('php://input');
            if (is_string($raw) && $raw !== '') {
                $decoded = json_decode($raw, true);
                $input = is_array($decoded) ? $decoded : [];
            }
        }

        return new self(
            strtoupper((string) ($_SERVER['REQUEST_METHOD'] ?? 'GET')),
            $path,
            $normalizedHeaders,
            $_GET,
            $input,
            $_FILES
        );
    }
}
