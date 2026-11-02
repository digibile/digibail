import mysql from "mysql2/promise";

const database = process.env.MARIADB_DATABASE || "digibail_vamcitydigibilepay";
const socketPath = process.env.MARIADB_SOCKET || "";
const config = {
  database,
  user: process.env.MARIADB_USER,
  password: process.env.MARIADB_PASSWORD,
  ...(socketPath
    ? { socketPath }
    : {
        host: process.env.MARIADB_HOST || "127.0.0.1",
        port: Number(process.env.MARIADB_PORT || 3306)
      }),
  connectTimeout: 10000,
  charset: "utf8mb4",
  supportBigNumbers: true,
  bigNumberStrings: true,
  multipleStatements: false
};

if (!config.user || !process.env.MARIADB_PASSWORD) {
  console.error("MARIADB_AUDIT_BLOCKED=missing_credentials");
  process.exit(2);
}

const candidates = {
  identity: ["AspNetUsers", "AspNetRoles", "AspNetUserRoles", "AspNetUserClaims", "AspNetRoleClaims", "AspNetUserLogins", "AspNetUserTokens"],
  customers: ["Customers", "Contacts", "Organization"],
  loanCatalog: ["Loans", "LoanTags", "LoanRequestStatuses", "LoanAssuranceRequirements"],
  loanRequests: ["UserLoanRequests", "UserLoanRequestStatusHistories", "UserLoanRequestAuthorizationItems", "UserLoanRequestAuthorizationItemAttachments"],
  loanAccounts: ["UserLoans", "UserLoanPayments", "UserLoanPaymentRequests", "UserLoanContact", "UserLoanSponsoreDueDate"],
  finance: ["Purchases", "MemberPurchases", "Withdraws", "OnlineMoneyTransfer", "ThirdPartyTransfer", "SubAgentTransactions", "CustomerMarketerCommissions", "AffiliateCommissions", "Expenses"],
  site: ["SiteContents", "Product", "Tags", "Reliability"],
  messaging: ["AppSms", "AppEmails", "SmsPatterns", "AppSettings", "InquirySettings"]
};

const appTables = [
  "users", "sms_provider_settings", "captcha_challenges", "otp_challenges",
  "audit_logs", "legacy_customers", "sms_templates", "sms_logs",
  "legacy_source_data", "customer_documents", "customer_contracts",
  "beta_inquiries", "loan_products", "access_roles", "user_role_assignments",
  "loan_requests", "loan_request_comments", "loan_request_status_history",
  "user_role_overrides", "ai_story_assets", "customer_loan_applications",
  "homepage_content", "newsletter_subscribers", "blog_posts"
];

let connection;
try {
  connection = await mysql.createConnection(config);
  const [[dbInfo]] = await connection.query(
    "SELECT DATABASE() AS database_name, VERSION() AS server_version, @@character_set_database AS charset_name, @@collation_database AS collation_name"
  );
  const [tables] = await connection.query(
    "SELECT TABLE_NAME AS table_name, TABLE_TYPE AS table_type, ENGINE AS engine, TABLE_ROWS AS estimated_rows, DATA_LENGTH AS data_bytes, INDEX_LENGTH AS index_bytes FROM information_schema.TABLES WHERE TABLE_SCHEMA=? ORDER BY TABLE_NAME",
    [database]
  );
  const [columns] = await connection.query(
    "SELECT TABLE_NAME AS table_name, COLUMN_NAME AS column_name, ORDINAL_POSITION AS ordinal_position, COLUMN_TYPE AS column_type, IS_NULLABLE AS is_nullable, COLUMN_DEFAULT AS column_default, EXTRA AS extra, COLUMN_KEY AS column_key FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=? ORDER BY TABLE_NAME, ORDINAL_POSITION",
    [database]
  );
  const [indexes] = await connection.query(
    "SELECT TABLE_NAME AS table_name, INDEX_NAME AS index_name, NON_UNIQUE AS non_unique, SEQ_IN_INDEX AS sequence, COLUMN_NAME AS column_name, SUB_PART AS sub_part, INDEX_TYPE AS index_type FROM information_schema.STATISTICS WHERE TABLE_SCHEMA=? ORDER BY TABLE_NAME, INDEX_NAME, SEQ_IN_INDEX",
    [database]
  );
  const [foreignKeys] = await connection.query(
    "SELECT TABLE_NAME AS table_name, COLUMN_NAME AS column_name, CONSTRAINT_NAME AS constraint_name, REFERENCED_TABLE_NAME AS referenced_table, REFERENCED_COLUMN_NAME AS referenced_column, ORDINAL_POSITION AS ordinal_position FROM information_schema.KEY_COLUMN_USAGE WHERE TABLE_SCHEMA=? AND REFERENCED_TABLE_NAME IS NOT NULL ORDER BY TABLE_NAME, CONSTRAINT_NAME, ORDINAL_POSITION",
    [database]
  );

  const tableNames = new Set(tables.map(row => row.table_name));
  const columnsByTable = new Map();
  for (const column of columns) {
    if (!columnsByTable.has(column.table_name)) columnsByTable.set(column.table_name, []);
    columnsByTable.get(column.table_name).push(column);
  }
  const mapping = Object.fromEntries(Object.entries(candidates).map(([domain, names]) => [
    domain,
    names.map(name => ({
      table: name,
      exists: tableNames.has(name),
      columns: (columnsByTable.get(name) || []).map(column => ({
        name: column.column_name,
        type: column.column_type,
        nullable: column.is_nullable === "YES",
        key: column.column_key || null
      }))
    }))
  ]));

  const report = {
    generatedAt: new Date().toISOString(),
    readOnly: true,
    database: dbInfo,
    totals: {
      tables: tables.length,
      columns: columns.length,
      indexParts: indexes.length,
      foreignKeyParts: foreignKeys.length,
      estimatedRows: tables.reduce((sum, row) => sum + Number(row.estimated_rows || 0), 0)
    },
    applicationTableNameCollisions: appTables
      .filter(name => tableNames.has(name))
      .map(name => ({ name, columns: (columnsByTable.get(name) || []).length })),
    applicationTablesWithoutSameName: appTables.filter(name => !tableNames.has(name)),
    candidateMapping: mapping,
    tables: tables.map(row => ({
      ...row,
      estimated_rows: Number(row.estimated_rows || 0),
      data_bytes: Number(row.data_bytes || 0),
      index_bytes: Number(row.index_bytes || 0)
    })),
    columns,
    indexes,
    foreignKeys
  };

  process.stdout.write(JSON.stringify(report, null, 2) + "\n");
  console.error("MARIADB_SCHEMA_AUDIT=PASS tables=" + tables.length + " columns=" + columns.length + " index_parts=" + indexes.length + " foreign_key_parts=" + foreignKeys.length);
} catch (error) {
  console.error("MARIADB_SCHEMA_AUDIT=FAILED code=" + String(error.code || "unknown"));
  process.exitCode = 1;
} finally {
  if (connection) await connection.end().catch(() => {});
}
