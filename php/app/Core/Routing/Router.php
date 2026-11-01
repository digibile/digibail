<?php

declare(strict_types=1);

namespace App\Core\Routing;

use App\Core\Http\Request;
use App\Core\Http\Response;

final class Router
{
    /** @var array<string, array<string, callable(Request): Response>> */
    private array $routes = [];

    /**
     * @param callable(Request): Response $handler
     */
    public function get(string $path, callable $handler): void
    {
        $this->routes['GET'][$this->normalizePath($path)] = $handler;
    }

    public function dispatch(Request $request): Response
    {
        $method = strtoupper($request->method);
        $path = $this->normalizePath($request->path);
        $handler = $this->routes[$method][$path] ?? null;

        if ($handler === null) {
            return Response::json(['error' => 'not_found'], 404);
        }

        return $handler($request);
    }

    private function normalizePath(string $path): string
    {
        $normalized = '/' . trim($path, '/');

        return $normalized === '/' ? '/' : $normalized;
    }
}
