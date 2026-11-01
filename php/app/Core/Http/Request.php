<?php

declare(strict_types=1);

namespace App\Core\Http;

final readonly class Request
{
    /**
     * @param array<string, string> $headers
     */
    public function __construct(
        public string $method,
        public string $path,
        public array $headers = []
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

        return new self(
            strtoupper((string) ($_SERVER['REQUEST_METHOD'] ?? 'GET')),
            $path,
            $normalizedHeaders
        );
    }
}
