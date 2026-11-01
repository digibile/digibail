# DigiBail PHP migration track

This directory is the isolated PHP implementation track. The existing Node.js, Next.js, C# and HTML assets remain untouched while PHP parity is built and verified. This is a parallel migration, not a claim that the production application has already been replaced.

## Runtime policy

- Target runtime: PHP 8.5.12.
- Compatibility floor: PHP 8.3.
- CI matrix: PHP 8.3, 8.4 and 8.5.
- Required extensions: PDO, PDO MySQL, mbstring, OpenSSL and JSON. Image uploads also use PHP Fileinfo.
- Database target: the existing MariaDB schema, accessed through PDO and native prepared statements.
- Configuration is supplied through environment variables; secrets must not be committed.

## Implemented increments

### Runtime and identity

- HTTP bootstrap, request/response primitives, GET/POST/PUT/PATCH/DELETE routing, parameterized paths with UUID constraints, JSON/form/query parsing, HTTP 404/405 handling and health/readiness routes.
- PDO MariaDB connection factory with native prepared statements.
- ASP.NET Identity v3 password-hash verification for PRF values SHA-1, SHA-256 and SHA-512, plus bcrypt verification.
- New bcrypt cost-12 hash generation for controlled legacy hash upgrade after successful login.
- Primary MariaDB account lookup against `AspNetUsers` and role resolution through `AspNetUserRoles` / `AspNetRoles`. Inactive, locked and ambiguous identities fail closed.
- Customer registration writes to the existing `AspNetUsers` table and assigns the configured customer role through `AspNetUserRoles`. It does not create a parallel user table.
- New PHP registrations receive an explicit GUID in `PhpIdentityLinks`, bridging the legacy BIGINT Identity key to the GUID-based core domain without changing either identifier. Existing accounts are not auto-mapped.
- HS256 JWT issue/verification compatible with the current API contract (issuer `digibail`, subject, role claims, phone and 8-hour access-token lifetime).
- Database-backed, one-use CAPTCHA challenges, hashed OTP challenges, OTP expiry/resend/attempt limits, one-time registration/reset tickets and persistent rate-limit buckets.
- Password login, OTP login, customer registration, password reset and current-user endpoints at canonical `/api/v1/security/*` paths, with legacy aliases under `/api/v1/Auth/*`.
- Kavenegar delivery adapter with TLS verification, optional verify/lookup template and SMS-text fallback.

### Tenancy and loan products

- Additive MariaDB tables for `Tenants`, `TenantDomains` and `LoanProducts`, matching the identified C# `Tenant` and `LoanProduct` model fields.
- Host-based tenant resolution, safe default-tenant bootstrap and domain-to-tenant lookup.
- Public tenant configuration and public loan-product list/detail endpoints.
- Admin loan-product list/create/update/toggle/seed/labels endpoints with live account-role checks.
- Product image upload/delete with a 1.5 MB limit, file-signature MIME verification and randomized storage names.
- Validation for product slug, amounts, repayment intervals, tiers, interest rates, daily coefficients, labels and operational costs.
- HTML allowlist sanitization for product descriptions.

### Database migrations and tests

- Additive security DDL: `database/mysql/migrations/20261101_php_security_support.sql`.
- Additive tenancy/loan-product DDL: `database/mysql/migrations/20261101_php_tenancy_loan_products.sql`.
- Additive legacy-to-core identity bridge DDL: `database/mysql/migrations/20261101_php_identity_links.sql`.
- Strict identity-map importer: `php/scripts/import_identity_links.php`, which requires an externally reconciled CSV and verifies phone plus national-code equality before inserting any mapping.
- Existing SQL Server-derived identity/business tables are not modified by these migrations.
- CI tests cover password formats, JWT signatures/expiry/role claims, HTTP routing, route parameters and PHP syntax across PHP 8.3, 8.4 and 8.5.

## Apply additive schema

Before enabling PHP security, tenant or loan-product routes on MariaDB, apply both migration files once using the existing database administration process:

```sql
database/mysql/migrations/20261101_php_security_support.sql
database/mysql/migrations/20261101_php_tenancy_loan_products.sql
database/mysql/migrations/20261101_php_identity_links.sql
```

Then configure the following in the server's private environment file:

- `DB_*` database connection settings.
- `JWT_SECRET`, `OTP_PEPPER` and `CAPTCHA_PEPPER`, each generated independently with at least 32 random bytes.
- `KAVENEGAR_API_KEY`; `KAVENEGAR_TEMPLATE` is optional and selects the verify/lookup API when configured.
- `AUTH_CUSTOMER_ROLE` must match exactly one existing role in `AspNetRoles` (defaults to `Customer`).
- `BRAND_NAME` for the default tenant's initial display name.

Do not put real secrets in Git. The PHP registration adapter deliberately fails if the configured customer role is missing or ambiguous. These schema migrations have been committed but have not been applied to production by this code change.

For existing accounts, first export an audited mapping from the source PostgreSQL identity table with this exact CSV header:

```csv
legacy_user_id,core_user_id,mobile,national_code
```

Then run the importer against the PHP target database:

```sh
php scripts/import_identity_links.php /secure/path/verified-identity-map.csv
```

The importer verifies the legacy row, normalized mobile and ten-digit national code, enforces unique GUIDs through the database constraints, and rolls back the complete import if any row fails. Do not manufacture GUIDs for existing users or map by name alone.

## Important boundaries

- Authentication currently reads the primary MariaDB identity schema only. It does not yet reconcile BlueVam or transfer-database identities, and no claim is made that these populations are duplicate-free or fully merged.
- The legacy `AspNetUsers.Id` is BIGINT while the core C# loan/card/document entities use GUID user IDs. This is a real cross-database identity boundary, not a cast. Existing users must be linked to their original GUIDs using a reconciled export from the source PostgreSQL database. The importer refuses fuzzy matches and rolls back the entire CSV on any mismatch.
- CI does not prove that the production database contains the required customer role, that Kavenegar credentials work, or that every existing account can authenticate. Those require isolated database integration tests and controlled acceptance checks.
- Role links are preserved, but full claims, resource-level policies, tenant scoping and authorization parity across every old controller are not complete.
- New account passwords use bcrypt cost 12. Before running a mixed PHP/.NET environment, verify that every still-active .NET authentication component has its BCrypt verifier dependency installed and tested.
- Gender is initialized to the schema's neutral zero value because the registration form does not collect it. This must be confirmed against the production domain's enum semantics before production rollout.
- The PHP `LoanProducts` table is a new additive target table. Existing PostgreSQL `loan_products` records and legacy `legacy_source_data` loan definitions have not yet been reconciled/imported into it. The old import endpoint is therefore not advertised as complete.
- Tenant host resolution and default-tenant bootstrap are implemented; the full tenant/domain administration API and tenant migration from the existing DigitalPay database are still outstanding.
- New customer registrations receive a new core GUID link. Existing accounts without a verified `PhpIdentityLinks` row must not use GUID-bound core services until their original GUID is reconciled and imported.

## Still outstanding

Loan applications and their lifecycle, customers/agents/representatives and hierarchies, payment declarations, gateways, wallets, accounting/ledger, virtual cards, documents/OCR, contracts, audit and backup operations, DigitalPay modules, server-rendered page conversion, complete source-by-source data reconciliation, and production deployment remain outstanding.

These modules must be ported against the audited API parity matrix and all three MariaDB schemas. Existing source files and tables are retained. Do not remove or replace the current runtime until feature parity, source-by-source data reconciliation, rollback and production acceptance tests pass.

## Local checks

From this directory:

```sh
composer validate --strict
composer install
composer test
find . -name '*.php' -print0 | xargs -0 -n1 php -l
```
