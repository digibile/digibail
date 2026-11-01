# DigiBail PHP foundation

This directory contains the isolated PHP implementation track. It does not replace the current Node.js/Next.js application.

## Runtime policy

- Target runtime: PHP 8.5.
- Compatibility floor: PHP 8.3.
- CI matrix: PHP 8.3, 8.4 and 8.5.
- Required extensions: PDO, PDO MySQL, mbstring, OpenSSL and JSON.
- Database: MariaDB through PDO with native prepared statements.
- Configuration is supplied through environment variables; secrets must not be committed.

## Local checks

From this directory:

```sh
composer validate --strict
composer install
composer test
find . -name '*.php' -print0 | xargs -0 -n1 php -l
```

## Current scope

The first increment provides the HTTP foundation, safe error handling, health/readiness routes, PDO connection factory and isolated core CSS tokens. No business endpoint or database migration is claimed as implemented yet. Domain modules will be added only against the audited API/database mapping.
