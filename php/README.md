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

- HTTP bootstrap, request/response primitives, exact-path router and health/readiness routes.
- PDO MariaDB connection factory.
- ASP.NET Identity v3 password-hash verification for PRF values SHA-1, SHA-256 and SHA-512, plus bcrypt verification.
- New bcrypt cost-12 hash generation for controlled hash upgrade after successful legacy login.
- Initial read-only account lookup against the existing `AspNetUsers` and `AspNetUserRoles` / `AspNetRoles` tables, including inactive-account and lockout checks. Ambiguous identity matches fail closed.
- Password compatibility test vector and PHP 8.3/8.4/8.5 CI.

## Still not implemented

No claim is made that the following are complete: JWT/session compatibility, captcha, OTP and Kavenegar delivery, registration and password reset, full role/claim authorization, customer/agent/loan/payment/wallet/accounting/document/contract APIs, DigitalPay modules, server-rendered page conversion, database import reconciliation, or production deployment.

These modules must be ported against the audited API parity matrix and the real MariaDB schema. Existing source files and tables are retained. Do not remove or replace the current runtime until feature parity, data reconciliation, rollback and production acceptance tests pass.

## Local checks

From this directory:

```sh
composer validate --strict
composer install
composer test
find . -name '*.php' -print0 | xargs -0 -n1 php -l
```
