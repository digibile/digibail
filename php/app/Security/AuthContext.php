<?php

declare(strict_types=1);

namespace App\Security;

use App\Core\Database\ConnectionFactory;
use App\Core\Http\Request;
use App\Identity\LegacyIdentityRepository;

final class AuthContext
{
    private ?JwtService $jwt = null;
    private ?LegacyIdentityRepository $identities = null;

    /** @return array<string,mixed>|null */
    public function user(Request $request): ?array
    {
        $token = $this->token($request);
        if ($token === '') {
            return null;
        }

        try {
            $secret = (string) getenv('JWT_SECRET');
            if (strlen($secret) < 32) {
                return null;
            }
            $this->jwt ??= new JwtService($secret, 'digibail');
            $claims = $this->jwt->verify($token);
            if ($claims === null || !isset($claims['sub'])) {
                return null;
            }

            $this->identities ??= new LegacyIdentityRepository(ConnectionFactory::create());
            return $this->identities->findActiveById((string) $claims['sub']);
        } catch (\Throwable $exception) {
            error_log('Authorization context lookup failed: ' . $exception->getMessage());
            return null;
        }
    }

    /** @param list<string> $roles
     *  @param array<string,mixed> $user
     */
    public function hasAnyRole(array $user, array $roles): bool
    {
        $actual = $user['roles'] ?? [];
        if (in_array('SuperAdmin', $actual, true)) {
            $actual[] = 'Admin';
        }

        return array_intersect($roles, $actual) !== [];
    }

    private function token(Request $request): string
    {
        $authorization = (string) ($request->headers['authorization'] ?? '');
        if (preg_match('/^Bearer\s+(.+)$/i', $authorization, $matches) === 1) {
            return trim($matches[1]);
        }

        foreach (explode(';', (string) ($request->headers['cookie'] ?? '')) as $part) {
            $pair = explode('=', trim($part), 2);
            if (count($pair) === 2 && $pair[0] === 'db_session') {
                return trim($pair[1]);
            }
        }

        return '';
    }
}
