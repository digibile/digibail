import crypto from "node:crypto";
import { Pool } from "pg";
import { createPool } from "mysql2/promise";
import { migrate } from "../backend/api.js";

const BATCH_SIZE = Math.max(1, Math.min(50, Number(process.env.DIGIBAIL_MIGRATION_BATCH_SIZE || 10)));
const APPLY = process.argv.includes("--apply");
const sourceUrl = process.env.DATABASE_URL || "";
const mariaConfig = {
  socketPath: process.env.MARIADB_SOCKET || "/tmp/mysql.sock",
  user: process.env.MARIADB_USER || "",
  password: process.env.MARIADB_PASSWORD || "",
  database: process.env.MARIADB_DATABASE || "digibail_vamcitydigibilepay",
  waitForConnections: true,
  connectionLimit: 4,
  queueLimit: 20,
  connectTimeout: 15000,
  charset: "utf8mb4",
  timezone: "Z",
  supportBigNumbers: true,
  bigNumberStrings: true
};

const publicTables = [
  "access_roles",
  "users",
  "user_role_assignments",
  "user_role_overrides",
  "audit_logs",
  "captcha_challenges",
  "otp_challenges",
  "sms_provider_settings",
  "legacy_customers",
  "sms_templates",
  "sms_logs",
  "legacy_source_data",
  "customer_documents",
  "customer_contracts",
  "beta_inquiries",
  "loan_products",
  "loan_requests",
  "loan_request_comments",
  "loan_request_status_history",
  "ai_story_assets",
  "customer_loan_applications"
];

function qi(value) {
  return "\`" + String(value).replace(/\`/g, "\`\`") + "\`";
}
function jsonSafe(value) {
  return JSON.stringify(value, (_key, item) => {
    if (Buffer.isBuffer(item)) return { __digibail_binary_base64: item.toString("base64") };
    if (item instanceof Date) return item.toISOString();
    return item;
  });
}
function mysqlValue(value, dataType) {
  if (value === undefined) return null;
  if (value === null) return null;
  if (dataType === "json") return jsonSafe(value);
  if (Buffer.isBuffer(value)) return value;
  if (typeof value === "boolean") return value ? 1 : 0;
  return value;
}

async function mysqlColumns(mysql, table) {
  const [rows] = await mysql.query(
    "SELECT COLUMN_NAME,DATA_TYPE,IS_NULLABLE,COLUMN_DEFAULT,EXTRA,ORDINAL_POSITION " +
    "FROM information_schema.columns WHERE table_schema=DATABASE() AND table_name=? ORDER BY ORDINAL_POSITION",
    [table]
  );
  return rows;
}

async function insertRows(mysql, table, columns, rows) {
  if (!rows.length) return;
  const names = columns.map(c => c.column_name);
  const mysqlCols = await mysqlColumns(mysql, table);
  const mysqlTypes = new Map(mysqlCols.map(c => [c.COLUMN_NAME, String(c.DATA_TYPE).toLowerCase()]));
  const missing = names.filter(name => !mysqlTypes.has(name));
  if (missing.length) {
    throw new Error("MariaDB destination " + table + " is missing columns: " + missing.join(","));
  }
  const values = [];
  const rowSql = "(" + names.map(() => "?").join(",") + ")";
  for (const row of rows) {
    for (const column of columns) values.push(mysqlValue(row[column.column_name], mysqlTypes.get(column.column_name)));
  }
  const updateCols = names.filter(name => !["id"].includes(name));
  const duplicate = updateCols.length
    ? " ON DUPLICATE KEY UPDATE " + updateCols.map(name => qi(name) + "=VALUES(" + qi(name) + ")").join(",")
    : " ON DUPLICATE KEY UPDATE " + qi(names[0]) + "=VALUES(" + qi(names[0]) + ")";
  const sql = "INSERT INTO " + qi(table) + " (" + names.map(qi).join(",") + ") VALUES " +
    rows.map(() => rowSql).join(",") + duplicate;
  await mysql.query(sql, values);
}

async function readTableColumns(pg, schema, table) {
  const result = await pg.query(
    "SELECT column_name,data_type,udt_name,is_nullable,ordinal_position " +
    "FROM information_schema.columns WHERE table_schema=$1 AND table_name=$2 ORDER BY ordinal_position",
    [schema, table]
  );
  return result.rows.map(row => ({
    column_name: row.column_name,
    data_type: row.data_type,
    udt_name: row.udt_name,
    is_nullable: row.is_nullable,
    ordinal_position: Number(row.ordinal_position)
  }));
}

async function copyPublicTable(pg, mysql, table) {
  const columns = await readTableColumns(pg, "public", table);
  if (!columns.length) throw new Error("Source public table missing: " + table);
  const targetColumns = await mysqlColumns(mysql, table);
  const targetNames = new Set(targetColumns.map(c => c.COLUMN_NAME));
  const missing = columns.filter(c => !targetNames.has(c.column_name)).map(c => c.column_name);
  if (missing.length) throw new Error("Destination schema incomplete for " + table + ": " + missing.join(","));

  const sourceCount = Number((await pg.query("SELECT COUNT(*)::bigint AS n FROM public." + qpg(table))).rows[0].n);
  let copied = 0;
  const names = columns.map(c => qpg(c.column_name)).join(",");
  while (copied < sourceCount) {
    const batch = await pg.query(
      "SELECT " + names + " FROM public." + qpg(table) + " ORDER BY 1 LIMIT $1 OFFSET $2",
      [BATCH_SIZE, copied]
    );
    if (!batch.rows.length) break;
    await insertRows(mysql, table, columns, batch.rows);
    copied += batch.rows.length;
    console.log("PUBLIC_TABLE_PROGRESS=" + table + " copied=" + copied + "/" + sourceCount);
  }
  const targetCount = Number((await mysql.query("SELECT COUNT(*) AS n FROM " + qi(table)))[0][0].n);
  if (targetCount !== sourceCount) throw new Error("Count verification failed for public." + table + ": source=" + sourceCount + " target=" + targetCount);
  console.log("PUBLIC_TABLE_VERIFIED=" + table + " source=" + sourceCount + " target=" + targetCount);
  return { table, sourceCount, targetCount };
}

async function legacyPrimaryKeys(pg, table) {
  const result = await pg.query(
    "SELECT kcu.column_name,kcu.ordinal_position " +
    "FROM information_schema.table_constraints tc " +
    "JOIN information_schema.key_column_usage kcu " +
    "ON tc.constraint_name=kcu.constraint_name AND tc.table_schema=kcu.table_schema AND tc.table_name=kcu.table_name " +
    "WHERE tc.constraint_type='PRIMARY KEY' AND tc.table_schema='legacy_digibail' AND tc.table_name=$1 " +
    "ORDER BY kcu.ordinal_position",
    [table]
  );
  return result.rows.map(x => x.column_name);
}

async function storeLegacyColumnMetadata(pg, mysql, table, columns, primaryKeys) {
  const foreignResult = await pg.query(
    "SELECT kcu.column_name,ccu.table_schema AS referenced_schema,ccu.table_name AS referenced_table,ccu.column_name AS referenced_column " +
    "FROM information_schema.table_constraints tc " +
    "JOIN information_schema.key_column_usage kcu ON tc.constraint_name=kcu.constraint_name AND tc.table_schema=kcu.table_schema AND tc.table_name=kcu.table_name " +
    "JOIN information_schema.constraint_column_usage ccu ON ccu.constraint_name=tc.constraint_name AND ccu.constraint_schema=tc.constraint_schema " +
    "WHERE tc.constraint_type='FOREIGN KEY' AND tc.table_schema='legacy_digibail' AND tc.table_name=$1",
    [table]
  );
  const foreign = new Map(foreignResult.rows.map(row => [row.column_name, row]));
  const rows = columns.map(col => {
    const fk = foreign.get(col.column_name);
    return [
      "legacy_digibail",
      table,
      col.column_name,
      col.data_type,
      col.is_nullable,
      col.ordinal_position,
      primaryKeys.indexOf(col.column_name) >= 0 ? primaryKeys.indexOf(col.column_name) + 1 : null,
      fk?.referenced_schema || null,
      fk?.referenced_table || null,
      fk?.referenced_column || null
    ];
  });
  if (rows.length) {
    const sql = "INSERT INTO digibail_legacy_columns " +
      "(source_schema,source_table,column_name,data_type,is_nullable,ordinal_position,primary_key_order,referenced_schema,referenced_table,referenced_column) VALUES " +
      rows.map(() => "(" + Array(10).fill("?").join(",") + ")").join(",") +
      " ON DUPLICATE KEY UPDATE data_type=VALUES(data_type),is_nullable=VALUES(is_nullable),ordinal_position=VALUES(ordinal_position),primary_key_order=VALUES(primary_key_order),referenced_schema=VALUES(referenced_schema),referenced_table=VALUES(referenced_table),referenced_column=VALUES(referenced_column)";
    await mysql.query(sql, rows.flat());
  }
}

async function copyLegacyRelationalTable(pg, mysql, table) {
  const columns = await readTableColumns(pg, "legacy_digibail", table);
  const primaryKeys = await legacyPrimaryKeys(pg, table);
  const sourceCount = Number((await pg.query(
    "SELECT COUNT(*)::bigint AS n FROM legacy_digibail." + qpg(table)
  )).rows[0].n);

  await storeLegacyColumnMetadata(pg, mysql, table, columns, primaryKeys);

  let offset = 0;
  while (offset < sourceCount) {
    const order = primaryKeys.length ? primaryKeys.map(qpg).join(",") : "ctid";
    const result = await pg.query(
      "SELECT * FROM legacy_digibail." + qpg(table) + " ORDER BY " + order + " LIMIT $1 OFFSET $2",
      [BATCH_SIZE, offset]
    );
    if (!result.rows.length) break;

    const inserts = [];
    for (let i = 0; i < result.rows.length; i++) {
      const row = result.rows[i];
      const keyText = primaryKeys.length
        ? primaryKeys.map(name => String(row[name] ?? "")).join(" / ")
        : "row-" + String(offset + i + 1);
      const legacyId = keyText.length <= 255 ? keyText : crypto.createHash("sha256").update(keyText).digest("hex");
      inserts.push(["legacy_digibail", table, legacyId, jsonSafe(row)]);
    }
    const sql = "INSERT INTO digibail_legacy_relational_rows(source_schema,source_table,legacy_id,payload) VALUES " +
      inserts.map(() => "(?,?,?,?)").join(",") +
      " ON DUPLICATE KEY UPDATE payload=VALUES(payload)";
    await mysql.query(sql, inserts.flat());
    offset += result.rows.length;
    console.log("LEGACY_RELATIONAL_PROGRESS=" + table + " copied=" + offset + "/" + sourceCount);
  }

  const [targetRows] = await mysql.query(
    "SELECT COUNT(*) AS n FROM digibail_legacy_relational_rows WHERE source_schema=? AND source_table=?",
    ["legacy_digibail", table]
  );
  if (Number(targetRows.n) !== sourceCount) {
    throw new Error("Legacy relational count mismatch for " + table + ": source=" + sourceCount + " destination=" + targetRows.n);
  }
  return { table, sourceCount, targetCount: Number(targetRows.n) };
}

async function copyLegacyManifest(pg, mysql) {
  const exists = await pg.query(
    "SELECT 1 FROM information_schema.tables WHERE table_schema='legacy_digibail' AND table_name='_import_manifest'"
  );
  if (!exists.rowCount) return 0;
  const rows = (await pg.query(
    "SELECT source_schema,source_table,source_rows,imported_rows,imported_at FROM legacy_digibail._import_manifest ORDER BY source_schema,source_table"
  )).rows;
  if (!rows.length) return 0;
  const values = rows.map(row => [
    row.source_schema,row.source_table,Number(row.source_rows),Number(row.imported_rows),row.imported_at
  ]);
  const sql = "INSERT INTO digibail_legacy_manifest(source_schema,source_table,source_rows,imported_rows,imported_at) VALUES " +
    values.map(() => "(?,?,?,?,?)").join(",") +
    " ON DUPLICATE KEY UPDATE source_rows=VALUES(source_rows),imported_rows=VALUES(imported_rows),imported_at=VALUES(imported_at)";
  await mysql.query(sql, values.flat());
  return rows.length;
}

async function main() {
  if (!sourceUrl.startsWith("postgres://") && !sourceUrl.startsWith("postgresql://")) {
    throw new Error("Temporary source connection is not configured.");
  }
  if (!mariaConfig.user || !mariaConfig.password) throw new Error("MariaDB connection is not configured.");
  if (APPLY && process.env.DIGIBAIL_MIGRATION_BACKUP_VERIFIED !== "YES") {
    throw new Error("Create and verify a compressed backup first; then set DIGIBAIL_MIGRATION_BACKUP_VERIFIED=YES.");
  }

  const pg = new Pool({ connectionString: sourceUrl, max: 2, connectionTimeoutMillis: 15000, statement_timeout: 180000 });
  const mysql = createPool(mariaConfig);
  try {
    await pg.query("SELECT 1");
    await mysql.query("SELECT 1");
    if (APPLY) await migrate();

    const publicResults = [];
    for (const table of publicTables) {
      const sourceExists = await pg.query(
        "SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name=$1",
        [table]
      );
      if (!sourceExists.rowCount) {
        console.log("PUBLIC_TABLE_ABSENT=" + table);
        continue;
      }
      const targetExists = await mysql.query(
        "SELECT 1 FROM information_schema.tables WHERE table_schema=DATABASE() AND table_name=?",
        [table]
      );
      if (!targetExists[0].length) throw new Error("MariaDB application schema is missing table " + table);
      const count = Number((await pg.query("SELECT COUNT(*)::bigint AS n FROM public." + qi(table))).rows[0].n);
      console.log("PUBLIC_TABLE_PLAN=" + table + " rows=" + count);
      if (APPLY) publicResults.push(await copyPublicTable(pg, mysql, table));
    }

    const legacyTables = (await pg.query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema='legacy_digibail' AND table_type='BASE TABLE' ORDER BY table_name"
    )).rows.map(x => x.table_name);
    console.log("LEGACY_RELATIONAL_TABLES=" + legacyTables.length);
    for (const table of legacyTables) {
      const count = Number((await pg.query("SELECT COUNT(*)::bigint AS n FROM legacy_digibail." + qi(table))).rows[0].n);
      console.log("LEGACY_RELATIONAL_PLAN=" + table + " rows=" + count);
      if (APPLY) await copyLegacyRelationalTable(pg, mysql, table);
    }

    if (APPLY) {
      const [oldMapExists]=await mysql.query(
        "SELECT 1 FROM information_schema.tables WHERE table_schema=DATABASE() AND table_name='DigibailUserIdentity'"
      );
      if(oldMapExists.length){
        const [oldMaps]=await mysql.query("SELECT PostgresUserId,MariaDbUserId,RoleCode FROM DigibailUserIdentity");
        for(const row of oldMaps){
          const [appRows]=await mysql.query("SELECT id FROM users WHERE id=? LIMIT 1",[row.PostgresUserId]);
          if(!appRows.length)continue;
          await mysql.query(
            "INSERT INTO DigibailAppUserIdentity(AppUserId,LegacySource,MariaDbUserId,RoleCode) VALUES(?,'mariadb.AspNetUsers',?,?) ON DUPLICATE KEY UPDATE MariaDbUserId=VALUES(MariaDbUserId),RoleCode=VALUES(RoleCode)",
            [row.PostgresUserId,row.MariaDbUserId,row.RoleCode||"customer"]
          );
        }
        console.log("EXISTING_ACCOUNT_MAPS_IMPORTED="+oldMaps.length);
      }
      const manifestCount = await copyLegacyManifest(pg, mysql);
      console.log("LEGACY_MANIFEST_ROWS=" + manifestCount);
      for (const table of publicTables) {
        const sourceExists = await pg.query("SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name=$1",[table]);
        if (!sourceExists.rowCount) continue;
        const expected=Number((await pg.query("SELECT COUNT(*)::bigint AS n FROM public."+qpg(table))).rows[0].n);
        const actual=Number((await mysql.query("SELECT COUNT(*) AS n FROM "+qi(table)))[0][0].n);
        if (actual !== expected) throw new Error("Final verification failed for "+table+": source="+expected+" destination="+actual);
      }
      const sourceUsers=Number((await pg.query("SELECT COUNT(*)::bigint AS n FROM public.users")).rows[0].n);
      const destUsers=Number((await mysql.query("SELECT COUNT(*) AS n FROM users"))[0][0].n);
      if(destUsers!==sourceUsers)throw new Error("Users verification failed: source="+sourceUsers+" destination="+destUsers);
      console.log("DIGIBAIL_MARIADB_MIGRATION=PASS public_users="+sourceUsers+" target_users="+destUsers);
    } else {
      console.log("DRY_RUN_ONLY=1 no data was changed; pass --apply and verified backup flag to migrate.");
    }
  } finally {
    await Promise.allSettled([pg.end(),mysql.end()]);
  }
}

main().catch(error => {
  console.error("DIGIBAIL_MARIADB_MIGRATION_FAILED=" + String(error.code || error.name || "unknown") + ":" + String(error.message || "").slice(0,700));
  process.exitCode = 1;
});
