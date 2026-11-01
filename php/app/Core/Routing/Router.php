<?php

declare(strict_types=1);

namespace App\Core\Routing;

use App\Core\Http\Request;
use App\Core\Http\Response;

final class Router
{
    /** @var array<string, array<string, callable(Request): Response>> */
    private array $routes = [];

    /** @param callable(Request): Response $handler */
    public function get(string $path, callable $handler): void
    {
        $this->add('GET', $path, $handler);
    }

    /** @param callable(Request): Response $handler */
    public function post(string $path, callable $handler): void
    {
        $this->add('POST', $path, $handler);
    }

    /** @param callable(Request): Response $handler */
    public function put(string $path, callable $handler): void
    {
        $this->add('PUT', $path, $handler);
    }

    /** @param callable(Request): Response $handler */
    public function patch(string $path, callable $handler): void
    {
        $this->add('PATCH', $path, $handler);
    }

    /** @param callable(Request): Response $handler */
    public function delete(string $path, callable $handler): void
    {
        $this->add('DELETE', $path, $handler);
    }

    /** @param callable(Request): Response $handler */
    private function add(string $method, string $path, callable $handler): void
    {
        $this->routes[$method][$this->normalizePath($path)] = $handler;
    }

    public function dispatch(Request $request): Response
    {
        $method = strtoupper($request->method);
        $path = $this->normalizePath($request->path);
        $handler = $this->routes[$method][$path] ?? null;

        if ($handler !== null) {
            return $handler($request);
        }

        $allowed = [];
        foreach ($this->routes as $registeredMethod => $routes) {
            if (isset($routes[$path])) {
                $allowed[] = $registeredMethod;
            }
        }

        if ($allowed !== []) {
            sort($allowed);
            return new Response(
                405,
                '{"error":"method_not_allowed"}',
                [
                    'Content-Type' => 'application/json; charset=utf-8',
                    'Cache-Control' => 'no-store',
                    'Allow' => implode(', ', $allowed),
                    'X-Content-Type-Options' => 'nosniff',
                ]
            );
        }

        return Response::json(['error' => 'not_found'], 404);
    }

    private function normalizePath(string $path): string
    {
        $normalized = '/' . trim($path, '/');

        return $normalized === '/' ? '/' : $normalized;
    }
}
