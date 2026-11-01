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

- HTTP bootstrap, request/response primitives, GET/POST/PUT/PATCH/DELETE routing, JSON/form/query parsing, HTTP 404/405 handling and health/readiness routes.
- PDO MariaDB connection factory with native prepared statements.
- ASP.NET Identity v3 password-hash verification for PRF values SHA-1, SHA-256 and SHA-512, plus bcrypt verification.
- New bcrypt cost-12 hash generation for controlled legacy hash upgrade after successful login.
- Primary MariaDB account lookup against `AspNetUsers` and role resolution through `AspNetUserRoles` / `AspNetRoles`. Inactive, locked and ambiguous identities fail closed.
- HS256 JWT issue/verification compatible with the current API contract (issuer `digibail`, subject, role claims, phone and 8-hour access-token lifetime).
- Database-backed, one-use CAPTCHA challenges, hashed OTP challenges, OTP expiry/resend/attempt limits and persistent rate-limit buckets. CAPTCHA and OTP/rate-limit secrets are separate.
- Password login and current-user endpoints at canonical `/api/v1/security/*` paths, with legacy aliases under `/api/v1/Auth/*`.
- OTP login and registration-phone verification using Kavenegar, including the optional verification template and SMS-text fallback.
- Password-reset request, OTP verification ticket and bcrypt password update. Reset rotates the ASP.NET Identity security stamp and clears lockout counters.
- Initial OTP-verified customer registration writes to the existing `AspNetUsers` table, checks duplicate phone/national-code values and assigns the configured role through `AspNetUserRoles`. It does not create a parallel user table. `CustomerId`/tenant association and cross-database identity mapping remain unresolved, so this route is not approved for production yet.
- Public tenant configuration and tenant-scoped loan-product list/detail endpoints, with host-to-tenant resolution and a unique active-default fallback. Existing product rows are read-only in this increment.
- Additive MariaDB DDL for PHP security challenge/rate-limit and tenancy/loan-product support. Existing identity and business tables are not altered.
- CI tests for password hash formats, JWT signatures/expiry/role claims, route registration and PHP syntax across PHP 8.3, 8.4 and 8.5.

## Apply the additive security schema

Before enabling PHP security routes on a MariaDB instance, apply this file once using the existing database administration process:

```sql
database/mysql/migrations/20261101_php_security_support.sql
```

Then configure the following in the server's private environment file:

- `DB_*` database connection settings.
- `JWT_SECRET`, `OTP_PEPPER` and `CAPTCHA_PEPPER`, each generated independently with at least 32 random bytes.
- `KAVENEGAR_API_KEY`; `KAVENEGAR_TEMPLATE` is optional and selects the verify/lookup API when configured.
- `AUTH_CUSTOMER_ROLE` must match exactly one existing role in `AspNetRoles` (defaults to `Customer`).

Do not put real secrets in Git. The PHP registration adapter deliberately fails if the configured role is missing or ambiguous. The database DDL has been reviewed, but this migration has not been applied to production by this code change.

## Important boundaries

- Authentication currently reads the primary MariaDB identity schema only. It does not yet reconcile BlueVam or transfer-database identities, and no claim is made that these populations are duplicate-free or fully merged.
- CI does not prove that the production database contains the required customer role, that Kavenegar credentials work, or that every existing account can authenticate. Those require isolated database integration tests and controlled acceptance checks.
- Role links are preserved, but full claims, resource-level policies, tenant scoping and authorization parity across every old controller are not complete.
- New account passwords use bcrypt cost 12. Before running a mixed PHP/.NET environment, verify that every still-active .NET authentication component has its BCrypt verifier dependency installed and tested.
- Gender is initialized to the schema's neutral zero value because the registration form does not collect it. This must be confirmed against the production domain's enum semantics before production rollout.

## Still outstanding

Loan products and applications, customers/agents/representatives and their hierarchies, payment declarations, gateways, wallets, accounting/ledger, contracts, documents/OCR, audit and backup operations, DigitalPay modules, server-rendered page conversion, complete import reconciliation, and production deployment remain outstanding.

These modules must be ported against the audited API parity matrix and all three MariaDB schemas. Existing source files and tables are retained. Do not remove or replace the current runtime until feature parity, source-by-source data reconciliation, rollback and production acceptance tests pass.

## Local checks

From this directory:

```sh
composer validate --strict
composer install
composer test
find . -name '*.php' -print0 | xargs -0 -n1 php -l
```
