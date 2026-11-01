# DigiBail PHP migration track

This directory is the isolated PHP implementation track. The existing Node.js, Next.js, C# and HTML assets remain untouched while PHP parity is built and verified. This is a parallel migration, not a claim that the production application has already been replaced.

## Runtime policy

- Target runtime: PHP 8.5.12.
- Compatibility floor: PHP 8.3.
- CI matrix: PHP 8.3, 8.4 and 8.5.
- Required extensions: PDO, PDO MySQL, mbstring, OpenSSL and JSON.
- Database target: the existing MariaDB schema, accessed through PDO and native prepared statements.
- Configuration is supplied through environment variables; secrets must not be committed.

## Implemented increments

- HTTP bootstrap, request/response primitives, GET/POST/PUT/PATCH/DELETE routing, parameterized paths, JSON/form/query parsing, HTTP 404/405 handling and health/readiness routes.
- PDO MariaDB connection factory.
- ASP.NET Identity v3 password-hash verification for PRF values SHA-1, SHA-256 and SHA-512, plus bcrypt verification.
- New bcrypt cost-12 hash generation for controlled hash upgrade after successful legacy login.
- Initial account lookup against the primary MariaDB `AspNetUsers` and `AspNetUserRoles` / `AspNetRoles` tables, including inactive-account and lockout checks. Ambiguous identity matches fail closed.
- HS256 JWT issue/verification compatible with the current Node token contract (issuer `digibail`, `sub`, `role`, `roles`, `phone`, 8-hour lifetime), with signature and expiry validation.
- Database-backed, one-use CAPTCHA challenges and persistent rate-limit buckets using separate `CAPTCHA_PEPPER` and `OTP_PEPPER` secrets.
- Password login endpoints at both canonical `/api/v1/security/*` and legacy `/api/v1/Auth/*` paths: CAPTCHA, login and current-user lookup. Login returns the access token and an HttpOnly session cookie.
- Additive MariaDB DDL for PHP security challenge/rate-limit storage. It does not alter existing identity or business tables.
- Automated tests for password hash formats, JWT signatures/expiry/role claims, HTTP methods and route parameters; GitHub Actions validates PHP 8.3, 8.4 and 8.5.

## Apply the additive security schema

Before enabling the PHP CAPTCHA/login routes on a MariaDB instance, apply this file once using the existing database administration process:

```sql
database/mysql/migrations/20261101_php_security_support.sql
```

Then configure `DB_*`, `JWT_SECRET`, `OTP_PEPPER` and `CAPTCHA_PEPPER` in the server's private environment file. Use independent random secrets of at least 32 bytes. Do not put real secrets in Git.

## Still not implemented

The current login adapter reads the primary `AspNetUsers` tables only. It does not yet reconcile BlueVam or transfer-database identities, and no claim is made that these are duplicate-free or fully merged.

OTP request/verification and Kavenegar delivery, registration, password reset, complete claims/policy authorization, all customer/agent/loan/payment/wallet/accounting/document/contract APIs, DigitalPay modules, server-rendered page conversion, full database import reconciliation, and production deployment remain outstanding.

These modules must be ported against the audited API parity matrix and the real MariaDB schemas. Existing source files and tables are retained. Do not remove or replace the current runtime until feature parity, source-by-source data reconciliation, rollback and production acceptance tests pass.

## Local checks

From this directory:

```sh
composer validate --strict
composer install
composer test
find . -name '*.php' -print0 | xargs -0 -n1 php -l
```
