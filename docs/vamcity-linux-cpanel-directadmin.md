# VamCity: Windows to Linux / cPanel / DirectAdmin

## Single database target

The final database is `vamcitydigibilepay` (MariaDB 10.6+ or MySQL 8.0+), not three separate databases.

| SQL Server source | Tables | Rows |
|---|---:|---:|
| `vamcityc_vamcity_import_20261028` | 88 | 531,172 |
| `vamcityc_bluvamdb_import_20261028` | 56 | 286,597 |
| `vamcityc_transferDb_import_20261028` | 12 | 29 |
| **Total** | **156** | **817,798** |

These are source inventory counts, not proof of a completed MariaDB import.

## Unified schema

`database/mysql/vamcitydigibilepay.sql` combines the three DDL files in one database. Main-source table names are retained; BluVam and transfer tables receive `bluvamdb__` and `transferdb__` prefixes to avoid collisions. The file contains schema only, not customer records.

Regenerate it with Node.js 22+:

```bash
node scripts/build-vamcity-unified-schema.mjs
```

## Data migration gate

The checked-in files include schema metadata, but no complete `.bak` payload or exported source rows were found in the inspected repository paths. DDL cannot recreate 817,798 records. Real migration requires the source backups or controlled access to the restored SQL Server databases. Import must preserve all columns, NULLs, identities, binary values, dates, and keys; duplicate keys must stop the import rather than be ignored or overwritten. Verify row counts for every table before declaring completion. Never commit production backups, credentials, or customer data to a public repository.

## Linux hosting

### cPanel

Use Node.js 22+ with Application Manager / Setup Node.js App enabled, plus MariaDB 10.6+ or MySQL 8.0+. The hosting plan must allow a persistent Node process, environment variables, and CLI migrations. A static-only plan cannot run a server-rendered Next.js application.

### DirectAdmin

Run the Node application as a private loopback service and configure Nginx/Apache reverse proxy to its local port. Keep the app port private. The plan must allow a persistent process and the required Node runtime.

### ASP.NET source requirement

The current repository is a Node.js/Next.js application. The complete Windows VamCity ASP.NET solution (`.sln`, `.csproj`, controllers, services, jobs, and related source) is not present in the inspected root files. A full Windows-to-Linux application conversion cannot be completed from SQL schemas or published DLLs alone. If ASP.NET Core is retained, the host must support the matching Linux .NET runtime and a persistent service; ordinary shared cPanel/DirectAdmin plans do not guarantee this. Otherwise the application logic must be ported to Node/PHP.

## Completion checklist

- [ ] Full application source available
- [ ] Linux build and automated tests pass
- [ ] 156-table unified schema applied
- [ ] Every source row imported and per-table counts reconciled
- [ ] Authentication, roles, loan requests, repayments, payments, SMS, and background jobs tested
- [ ] Separate cPanel and DirectAdmin installation guides verified

Until these checks pass, do not describe the migration as complete.
