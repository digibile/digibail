<?php

declare(strict_types=1);

namespace App\Core\Routing;

use App\Core\Http\Request;
use App\Core\Http\Response;

final class Router
{
    /** @var array<string, list<array{regex: string, names: list<string>, handler: callable(Request): Response, path: string}>> */
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
        $normalized = $this->normalizePath($path);
        $names = [];
        $segments = explode('/', trim($normalized, '/'));
        $compiled = [];

        foreach ($segments as $segment) {
            if (preg_match('/^\{([A-Za-z][A-Za-z0-9_]*)\}$/D', $segment, $match) === 1) {
                $names[] = $match[1];
                $compiled[] = '(?P<' . $match[1] . '>[^/]+)';
            } else {
                $compiled[] = preg_quote($segment, '~');
            }
        }

        $regex = $normalized === '/'
            ? '~^/$~D'
            : '~^/' . implode('/', $compiled) . '/?$~D';

        $this->routes[$method][] = [
            'regex' => $regex,
            'names' => $names,
            'handler' => $handler,
            'path' => $normalized,
        ];
    }

    public function dispatch(Request $request): Response
    {
        $method = strtoupper($request->method);
        $path = $this->normalizePath($request->path);

        foreach ($this->routes[$method] ?? [] as $route) {
            $matches = [];
            if (preg_match($route['regex'], $path, $matches) === 1) {
                $params = [];
                foreach ($route['names'] as $name) {
                    $params[$name] = rawurldecode((string) ($matches[$name] ?? ''));
                }

                $matchedRequest = new Request(
                    $request->method,
                    $request->path,
                    $request->headers,
                    $request->query,
                    $request->input,
                    $request->files,
                    $params
                );

                return ($route['handler'])($matchedRequest);
            }
        }

        $allowed = [];
        foreach ($this->routes as $registeredMethod => $routes) {
            foreach ($routes as $route) {
                if (preg_match($route['regex'], $path) === 1) {
                    $allowed[] = $registeredMethod;
                    break;
                }
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
