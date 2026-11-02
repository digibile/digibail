# MariaDB Runtime Cutover Matrix

Status: discovery completed; runtime cutover NOT performed.

Target database: `digibail_vamcitydigibilepay` (MariaDB 10.6.17), managed with phpMyAdmin.
Repository: `digibile/digibail`.
Branch: `migration/mariadb-single-database-foundation`.

## Safety rules

- Do not drop, truncate, rename, or rebuild any production table.
- Do not remove the PostgreSQL container or `digibail_pgdata` until every runtime consumer has moved and a verified rollback exists.
- Do not copy PostgreSQL identities into `AspNetUsers` as a routine dual-write. The current `DigibailUserIdentity` mirror is transitional and creates two identity authorities.
- Do not create parallel loan, payment, customer, or content tables when an established MariaDB table already owns that domain.
- No production cutover until a full MariaDB backup has been created, restored to an isolated database, and checked.

## Confirmed runtime architecture

| Area | Current implementation | Cutover requirement |
|---|---|---|
| Main API | `backend/api.js` imports `pg.Pool`; `DATABASE_URL` is required | Replace all PostgreSQL queries and transaction usage with MariaDB-native operations |
| Site content | `backend/site-content.js` creates its own PostgreSQL pool | Reconcile homepage content with existing `SiteContents`; newsletter/blog require an explicit decision because no equivalent tables were found in the supplied legacy schema |
| Admin directory | Reads `AspNetUsers`, `bluvamdb__AspNetUsers`, `OnlineMoneyTransfer__AspNetUsers` in MariaDB, then unions PostgreSQL `users` | Make the intended main tenant/source authoritative; retain other prefixed datasets as separate historical sources unless an approved merge is defined |
| User mirror | `backend/mariadb-user-sync.js` writes PostgreSQL users into `AspNetUsers` and maintains `DigibailUserIdentity` | Retire dual-write only after account creation, login, password reset, roles and session identity all use MariaDB |
| Compose | Starts PostgreSQL 16 and persists `digibail_pgdata`; app depends on it | Remove PostgreSQL only in the final cutover after a rollback window |
| Deploy workflow | Requires PostgreSQL credentials and runs PostgreSQL health/migration checks | Replace deployment validation and smoke tests with MariaDB-only checks |
| CI | PostgreSQL service is used for tests | Add MariaDB integration service and run all DB tests against it |

## Confirmed PostgreSQL-only application tables

The migration SQL and runtime DDL define these application-owned tables. Their names are not present as equivalent tables in the supplied MariaDB schema unless a mapping is listed below.

| Current PostgreSQL table | Candidate MariaDB owner | Decision |
|---|---|---|
| `users` | `AspNetUsers`, `AspNetRoles`, `AspNetUserRoles` | Map identity fields and role membership; IDs and password hash compatibility must be verified. Never copy rows blindly. |
| `sms_provider_settings` | `AppSettings` and/or provider-specific settings fields | Map only after field-level review; encrypted secret format and current settings must be preserved. |
| `captcha_challenges` | No confirmed equivalent | Add a MariaDB table only if required by the active captcha flow; define TTL/indexes and cleanup. |
| `otp_challenges` | No confirmed equivalent | Add a MariaDB table only if required; preserve purpose, attempt count, expiry and consumed state. |
| `audit_logs` | No exact equivalent confirmed; `AppSms` is not an audit log | Add a dedicated audit table if the application audit trail is required. |
| `legacy_customers` | `Customers` | Use existing customer records as source; do not duplicate them into a new customer table. Confirm tenant/customer semantics first. |
| `sms_templates` | `SmsPatterns` | Field and status mapping required; schema semantics are not assumed equivalent. |
| `sms_logs` | `AppSms` | Verify provider IDs, recipient masking, status semantics and retention before mapping. |
| `legacy_source_data` | No equivalent confirmed | This is an import staging/archive store, not a live business entity. Keep import tooling separate or replace with a controlled archive only if still needed. |
| `customer_documents` | Existing authorization attachment tables and assurance tables | Not a one-to-one mapping. Determine document type, owner, binary storage and review-state semantics before implementation. |
| `customer_contracts` | No exact equivalent confirmed | Requires a reviewed MariaDB design or an existing contract source discovered in full schema. |
| `beta_inquiries` | `UserRefahBeta` / `AppInquirys` are candidates only | Verify provider and status semantics before mapping. |
| `loan_products` | `Loans` | Strong domain candidate, but PostgreSQL UUID/JSON model differs from legacy fields; map columns and preserve existing loan rows. |
| `access_roles` | `AspNetRoles` | Reuse existing roles and normalize role codes; no second role catalog. |
| `user_role_assignments` | `AspNetUserRoles` | Reuse existing join table. |
| `loan_requests` | `UserLoanRequests` | Strong domain candidate; PostgreSQL numeric IDs differ from MariaDB UUID primary keys. Requires explicit ID mapping and full relationship review. |
| `loan_request_comments` | No exact equivalent confirmed | Inspect existing history/comment columns and related tables before deciding. |
| `loan_request_status_history` | `UserLoanRequestStatusHistories` | Strong candidate; compare all columns, status IDs, actor IDs and chronology. |
| `user_role_overrides` | `AspNetUserRoles` / role claims | Remove overrides only after role update and authorization flows use the canonical Identity tables. |
| `ai_story_assets` | No exact equivalent confirmed | Keep separate only if feature is approved; otherwise do not create an unused production table. |
| `customer_loan_applications` | `UserLoanRequests` | Do not create a second application/request entity. Map the application lifecycle to the existing request model after field review. |
| `homepage_content` | `SiteContents` | Store section data using existing tenant/customer scope and JSON convention only after the correct CustomerId is established. |
| `newsletter_subscribers` | No exact equivalent confirmed | New table may be justified; define consent, unsubscribe, uniqueness and retention. |
| `blog_posts` | No exact equivalent confirmed | New table may be justified; verify no CMS/blog module exists outside the supplied schema first. |

## Existing MariaDB domain owners confirmed in schema files

The checked-in schema snapshots contain these authoritative legacy table families:

- Identity: `AspNetUsers`, `AspNetRoles`, `AspNetUserRoles`, `AspNetUserClaims`, `AspNetRoleClaims`, `AspNetUserLogins`, `AspNetUserTokens`.
- Customers and tenants: `Customers`, `Contacts`, `Organization`.
- Loan catalog and contracts: `Loans`, `LoanTags`, `LoanRequestStatuses`, `LoanAssuranceRequirements`, `AssuranceRequirements`, `Assurances`.
- Loan lifecycle: `UserLoanRequests`, `UserLoanRequestStatusHistories`, `UserLoanRequestAuthorizationItems`, `UserLoanRequestAuthorizationItemAttachments`, `UserLoans`, `UserLoanPayments`, `UserLoanPaymentRequests`, `UserLoanContact`, `UserLoanSponsoreDueDate`.
- Finance and settlement: `Purchases`, `MemberPurchases`, `Withdraws`, `OnlineMoneyTransfer`, `ThirdPartyTransfer`, `SubAgentTransactions`, `CustomerMarketerCommissions`, `AffiliateCommissions`, `Expenses`.
- Site and catalog: `SiteContents`, `Product`, `Tags`, `Reliability`, `VirtualCards`, `VirtualCardTxns`.
- Messaging and configuration: `AppSms`, `AppEmails`, `SmsPatterns`, `AppSettings`, `InquirySettings`.
- Operations: Hangfire tables and `__EFMigrationsHistory`.

The supplied snapshots also contain separate prefixed datasets such as `bluvamdb__AspNetUsers` and `OnlineMoneyTransfer__AspNetUsers`. These are distinct source datasets, not duplicate tables to merge automatically. The current production schema inspection reported 224 tables; snapshot files may differ by release and must not be treated as a live substitute for a fresh production inventory.

## SQL dialect conversion scope

Static inspection of `backend/api.js` found substantial PostgreSQL-specific behavior, including positional `$n` parameters, `::type` casts, `ILIKE`, `ON CONFLICT`, `RETURNING`, JSONB operators/functions, filtered aggregates, regular-expression operators, PostgreSQL catalog queries, UUID types, identity columns, and transaction handling. `backend/site-content.js` independently uses JSONB and PostgreSQL upserts.

The migration must therefore be performed by domain slice, with MariaDB integration tests for each slice. A generic placeholder replacement is explicitly insufficient.

## Required sequence

1. Create and verify a full production MariaDB backup; restore it to an isolated database and compare table counts, row counts, indexes and foreign keys.
2. Export a fresh production schema inventory and compare it with the checked-in snapshots and `__EFMigrationsHistory`.
3. Complete a column-level mapping for identity, roles, loan products, requests, request histories, loans, installments/payments, customer records, settings, content and audit.
4. Define canonical identity semantics, including the relationship between `AspNetUsers.Id`, tenant/customer IDs, UUID loan IDs and current JWT `sub` values.
5. Implement MariaDB repository operations and migrate one domain at a time. Do not run PostgreSQL migrations against MariaDB.
6. Add MariaDB integration tests for every route, authorization rule, transaction, uniqueness constraint and money calculation.
7. Update CI, compose, deployment workflow, health checks, admin smoke tests and recovery-admin provisioning to use MariaDB only.
8. Perform a controlled cutover with a tested rollback. Keep PostgreSQL data and volume untouched until the rollback window is formally closed.

## Current completion state

- Schema inventory and code-path inspection: partial, based on repository schema snapshots and source.
- Production full data backup and restore verification: NOT CONFIRMED.
- Column-level mapping: NOT COMPLETE.
- MariaDB runtime repository: NOT IMPLEMENTED.
- API SQL conversion: NOT IMPLEMENTED.
- MariaDB CI: NOT IMPLEMENTED.
- Production cutover: NOT PERFORMED.
- PostgreSQL removal: NOT PERFORMED.

This document is an engineering migration record, not a claim that the site has already been transferred.
