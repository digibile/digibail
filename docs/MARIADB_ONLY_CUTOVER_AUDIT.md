# MariaDB-only cutover audit

Date: 2026-11-02
Repository: digibile/digibail
Baseline: main
Target database: `digibail_vamcitydigibilepay` (MariaDB)

## Scope and safety

This branch is an isolated preparation branch. This audit does not change production data, database schemas, credentials, Docker volumes, or server state. It does not remove PostgreSQL/SQL Server databases or deploy anything.

The only approved application database target for the intended final architecture is the existing MariaDB database:
`digibail_vamcitydigibilepay`.

Do not drop or recreate any database, table, volume, or user as part of this code migration. Do not overwrite existing MariaDB tables or import duplicate data. Preserve all current rows, including loan plans, loan requests, payments, user identities, and audit history.

## Verified baseline findings

The following were read from the repository's `main` branch:

- `docker-compose.yml` still declares `postgres:16-alpine`, the `digibail_pgdata` volume, PostgreSQL health checks, and a required `DATABASE_URL`. The app also mounts the MariaDB socket, so it currently has two database connection paths.
- `package.json` still depends on `pg` and describes the API as PostgreSQL-backed. It already includes `mysql2`.
- `.github/workflows/deploy-digebail-server.yml` requires `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, and `DATABASE_URL`, and constructs a PostgreSQL URL during deployment.
- `backend/api.js` imports both `Pool` from `pg` and `createPool` from `mysql2/promise`. It builds a PostgreSQL pool and a separate MariaDB pool.
- User directory logic combines MariaDB source tables with PostgreSQL `users`; PostgreSQL-only accounts are explicitly added to the directory. This must be redesigned without losing identities or role assignments.
- `dbHealth()` checks PostgreSQL. The health/status route separately reports both database systems.
- The API's migration/bootstrap code creates PostgreSQL-specific tables and uses PostgreSQL syntax.
- PostgreSQL syntax found in the API includes positional parameters `$1`, `RETURNING`, `JSONB`, `BIGSERIAL`, `TIMESTAMPTZ`, `ILIKE`, `::date`, `::int`, `FILTER (WHERE ...)`, `ON CONFLICT`, `json_agg`, `json_build_array`, `regexp_replace`, `->>`, `to_char`, and `EXTRACT(EPOCH FROM ...)`.
- Several business modules currently use PostgreSQL-owned tables, including loan products, loan requests/comments/status history, customer loan applications, documents/contracts, OTP/captcha challenges, SMS templates/logs, AI story assets, audit logs, and legacy import manifests/data. Each table and every read/write path must be mapped to the canonical MariaDB schema before removing the PostgreSQL driver.
- `start.js` runs the migration/bootstrap sequence before starting the API. A partial conversion can therefore prevent the application from starting.

## Required conversion work

### 1. Inventory all PostgreSQL dependencies

Search the entire repository, not only `backend/api.js`, for:
- imports and packages: `pg`, `Pool`, `Client`, `DATABASE_URL`;
- PostgreSQL SQL syntax and data types;
- migrations, seeders, scripts, tests, Docker configuration, deployment workflow, health checks, docs, and environment templates;
- every PostgreSQL table and every route that reads or writes it.

Produce a table map with: current PostgreSQL table, canonical MariaDB table (or approved new MariaDB table), columns, primary/foreign keys, indexes, data types, row count, read paths, write paths, and migration/verification method.

### 2. Canonical MariaDB schema mapping

Use only `digibail_vamcitydigibilepay`. Inspect the live MariaDB schema before writing DDL. Reuse existing tables where their meaning and constraints match. If a required table does not exist, propose a MariaDB-compatible additive migration; do not silently create parallel copies of existing business entities.

Use InnoDB, utf8mb4, explicit primary/foreign keys, appropriate indexes, and MariaDB-compatible JSON handling. Preserve exact identifiers and legacy references where needed. Never assume a PostgreSQL UUID maps to a MariaDB integer or vice versa; verify actual values and referencing columns first.

### 3. Data reconciliation before cutover

For every PostgreSQL-owned table, compare source row counts and key ranges with the canonical MariaDB destination. Reconcile duplicates, nullability, uniqueness, foreign keys, and JSON payloads. Preserve IDs or create a documented stable ID mapping where preservation is impossible. Validate loan-plan totals and active/listed counts, users/roles, loan applications/requests, payment records, contracts, documents, OTP/security records, audit history, and imported legacy data.

No destructive cleanup until counts and representative records reconcile and the application is verified against MariaDB only.

### 4. Rewrite data access

Replace PostgreSQL-specific query semantics with MariaDB-compatible queries using parameter placeholders supported by `mysql2`. Use explicit transaction connections for multi-statement transactions. Do not run `BEGIN`, `COMMIT`, or `ROLLBACK` on an arbitrary pooled connection. Replace `RETURNING` with safe insert-id / follow-up-select patterns as appropriate. Replace PostgreSQL JSON operators with MariaDB JSON functions and validate their return semantics. Replace PostgreSQL-only date, regex, aggregate-filter, and upsert syntax.

Keep authentication, authorization, roles, OTP, audit logging, loan workflows, payments, and customer records on the same canonical MariaDB connection.

### 5. Remove dual-database infrastructure only after code conversion

After all application queries and migrations are MariaDB-compatible and tests pass:
- remove `pg` dependency and PostgreSQL imports;
- remove PostgreSQL service, health check, environment variables, and volume from Compose;
- update deploy workflow preflight/recovery/environment handling to require MariaDB only;
- update Docker health checks and API health/status output;
- update environment examples and operational documentation.

Do not delete a production PostgreSQL volume or database as part of this repository change. Infrastructure cleanup is a separate, explicitly verified operation after a successful MariaDB-only production cutover.

### 6. Verification gates

Required before merge/deploy:
- dependency scan reports no runtime `pg` import or PostgreSQL connection configuration;
- static scan finds no unconverted PostgreSQL SQL syntax in runtime paths;
- migration runs against a disposable MariaDB test database with the same schema/version;
- tests cover signup/login/OTP/password reset, roles and admin edits, loan plan list/create/update/activate, 112-plan reconciliation (or actual verified total), loan request detail/status/comments, document upload/review, contracts/signature, SMS templates/logs, AI story assets, legacy import browsing, audit logs;
- smoke tests verify health, public plan listing, admin login, and customer login;
- production row counts and critical business totals are compared before/after;
- deployment has a tested rollback path that does not discard or overwrite MariaDB data.

## Current status

- Isolated branch created: `migration/mariadb-only-cutover`.
- Baseline inspection completed for Compose, package metadata, deployment workflow, API, and startup sequence.
- No application code, schema, data, secrets, or server configuration has been changed.
- This is not yet a MariaDB-only implementation and must not be deployed as one.

## Immediate next engineering tasks

1. Enumerate every PostgreSQL table created/referenced in `backend/api.js` and all migration files.
2. Inspect the live MariaDB table definitions and row counts for the corresponding business entities.
3. Build and review the table/column mapping before changing runtime queries.
4. Convert one cohesive module at a time, with tests, keeping the existing production deployment untouched until all gates pass.
