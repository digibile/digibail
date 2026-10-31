import crypto from "node:crypto";
import { Pool } from "pg";
import { createPool } from "mysql2/promise";
import { migrate, closePool } from "../../backend/api.js";

const APPLY = process.argv.includes("--apply");
const BATCH = Math.max(1, Math.min(250, Number(process.env.DIGIBAIL_MIGRATION_BATCH_SIZE || 100)));
const pgUrl = process.env.DIGIBAIL_SOURCE_DATABASE_URL || process.env.DATABASE_URL || "";
const mysqlOptions = {
  ...(process.env.MARIADB_HOST
    ? { host: process.env.MARIADB_HOST, port: Number(process.env.MARIADB_PORT || 3306) }
    : { socketPath: process.env.MARIADB_SOCKET || "/tmp/mysql.sock" }),
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
  bigNumberStrings: true,
  dateStrings: true
};

const applicationTables = [
  "access_roles","users","user_role_assignments","user_role_overrides",
  "audit_logs","captcha_challenges","otp_challenges","sms_provider_settings",
  "legacy_customers","sms_templates","sms_logs","legacy_source_data",
  "customer_documents","customer_contracts","beta_inquiries","loan_products",
  "loan_requests","loan_request_comments","loan_request_status_history",
  "ai_story_assets","customer_loan_applications"
];

function qpg(value) {
  return '"' + String(value).replace(/"/g, '""') + '"';
}
function qmy(value) {
  return "\`" + String(value).replace(/\`/g, "\`\`") + "\`";
}
function jsonValue(value) {
  return JSON.stringify(value, (_key, item) => {
    if (Buffer.isBuffer(item)) return { __digibail_binary_base64: item.toString("base64") };
    if (item && item.type === "Buffer" && Array.isArray(item.data)) {
      return { __digibail_binary_base64: Buffer.from(item.data).toString("base64") };
    }
    if (item instanceof Date) return item.toISOString();
    return item;
  });
}
function mysqlValue(value, pgType) {
  if (value === undefined || value === null) return null;
  if (pgType === "json" || pgType === "jsonb" || pgType === "ARRAY") return jsonValue(value);
  if (value instanceof Date) {
    if (value.getUTCFullYear() < 1000) return "1000-01-01 00:00:00.000000";
    return value;
  }
  if (typeof value === "string") {
    const yearMatch=/^(\\d{4})-\\d{2}-\\d{2}(?:[ T].*)?$/.exec(value);
    if(yearMatch&&Number(yearMatch[1])<1000)return "1000-01-01 00:00:00.000000";
  }
  if (typeof value === "boolean") return value ? 1 : 0;
  return value;
}
async function pgTableExists(pg, schema, table) {
  const r = await pg.query(
    "SELECT 1 FROM information_schema.tables WHERE table_schema=$1 AND table_name=$2 AND table_type='BASE TABLE'",
    [schema,table]
  );
  return r.rowCount > 0;
}
async function pgColumns(pg, schema, table) {
  const r = await pg.query(
    "SELECT column_name,data_type,udt_name,is_nullable,ordinal_position " +
    "FROM information_schema.columns WHERE table_schema=$1 AND table_name=$2 ORDER BY ordinal_position",
    [schema,table]
  );
  return r.rows;
}
async function pgPrimaryKeys(pg, schema, table) {
  const r = await pg.query(
    "SELECT kcu.column_name,kcu.ordinal_position FROM information_schema.table_constraints tc " +
    "JOIN information_schema.key_column_usage kcu ON tc.constraint_name=kcu.constraint_name " +
    "AND tc.table_schema=kcu.table_schema AND tc.table_name=kcu.table_name " +
    "WHERE tc.constraint_type='PRIMARY KEY' AND tc.table_schema=$1 AND tc.table_name=$2 " +
    "ORDER BY kcu.ordinal_position",
    [schema,table]
  );
  return r.rows.map(x=>x.column_name);
}
async function pgForeignKeys(pg, schema, table) {
  const r = await pg.query(
    "SELECT kcu.column_name,ccu.table_schema AS referenced_schema,ccu.table_name AS referenced_table,ccu.column_name AS referenced_column " +
    "FROM information_schema.table_constraints tc " +
    "JOIN information_schema.key_column_usage kcu ON tc.constraint_name=kcu.constraint_name " +
    "AND tc.table_schema=kcu.table_schema AND tc.table_name=kcu.table_name " +
    "JOIN information_schema.constraint_column_usage ccu ON ccu.constraint_name=tc.constraint_name " +
    "AND ccu.constraint_schema=tc.constraint_schema " +
    "WHERE tc.constraint_type='FOREIGN KEY' AND tc.table_schema=$1 AND tc.table_name=$2",
    [schema,table]
  );
  return r.rows;
}
async function myColumns(mysql, table) {
  const [rows] = await mysql.query(
    "SELECT COLUMN_NAME,DATA_TYPE FROM information_schema.columns " +
    "WHERE table_schema=DATABASE() AND table_name=? ORDER BY ORDINAL_POSITION",
    [table]
  );
  return rows;
}
async function countPg(pg, schema, table) {
  const result = await pg.query("SELECT COUNT(*)::bigint AS n FROM "+qpg(schema)+"."+qpg(table));
  return Number(result.rows[0].n);
}
async function countMy(mysql, table, where="", values=[]) {
  const [rows] = await mysql.query("SELECT COUNT(*) AS n FROM "+qmy(table)+" "+where,values);
  return Number(rows[0].n);
}
async function copyPublicTable(pg,mysql,table) {
  if (!(await pgTableExists(pg,"public",table))) {
    console.log("PUBLIC_TABLE_ABSENT="+table);
    return {table,absent:true};
  }
  const cols=await pgColumns(pg,"public",table);
  const pks=await pgPrimaryKeys(pg,"public",table);
  const targets=await myColumns(mysql,table);
  const targetTypes=new Map(targets.map(c=>[c.COLUMN_NAME,String(c.DATA_TYPE).toLowerCase()]));
  const missing=cols.filter(c=>!targetTypes.has(c.column_name)).map(c=>c.column_name);
  if(missing.length)throw new Error("Target schema mismatch "+table+" missing "+missing.join(","));

  const sourceCount=await countPg(pg,"public",table);
  const before=await countMy(mysql,table);
  if(before>sourceCount) {
    throw new Error("Destination table has unexpected extra records: "+table+" source="+sourceCount+" destination_before="+before);
  }
  const names=cols.map(c=>qpg(c.column_name)).join(",");
  const order=pks.length?pks.map(qpg).join(","):"ctid";
  let offset=0;
  while(offset<sourceCount) {
    const batch=await pg.query(
      "SELECT "+names+" FROM public."+qpg(table)+" ORDER BY "+order+" LIMIT $1 OFFSET $2",
      [BATCH,offset]
    );
    if(!batch.rows.length)break;
    const colNames=cols.map(c=>c.column_name);
    const values=[];
    for(const row of batch.rows) {
      for(const col of cols) values.push(mysqlValue(row[col.column_name],col.data_type));
    }
    const tuple="("+colNames.map(()=>"?").join(",")+")";
    const updates=colNames.filter(n=>n!=="id");
    const duplicate=updates.length
      ?" ON DUPLICATE KEY UPDATE "+updates.map(n=>qmy(n)+"=VALUES("+qmy(n)+")").join(",")
      :" ON DUPLICATE KEY UPDATE "+qmy(colNames[0])+"=VALUES("+qmy(colNames[0])+")";
    const sql="INSERT INTO "+qmy(table)+" ("+colNames.map(qmy).join(",")+") VALUES "+
      batch.rows.map(()=>tuple).join(",")+duplicate;
    await mysql.query(sql,values);
    offset+=batch.rows.length;
    console.log("PUBLIC_COPY_PROGRESS="+table+" "+offset+"/"+sourceCount);
  }
  const destination=await countMy(mysql,table);
  if(destination!==sourceCount)throw new Error("PUBLIC_COUNT_MISMATCH="+table+" source="+sourceCount+" destination="+destination);
  console.log("PUBLIC_COUNT_VERIFIED="+table+" rows="+sourceCount);
  return {table,sourceCount,destination};
}
async function storeLegacyColumns(pg,mysql,table,columns,pks) {
  const fks=await pgForeignKeys(pg,"legacy_digibail",table);
  const fkByColumn=new Map(fks.map(x=>[x.column_name,x]));
  const tuple="("+Array(10).fill("?").join(",")+")";
  const values=[];
  for(const col of columns) {
    const fk=fkByColumn.get(col.column_name);
    values.push(
      "legacy_digibail",table,col.column_name,col.data_type,
      col.is_nullable,Number(col.ordinal_position),
      pks.includes(col.column_name)?pks.indexOf(col.column_name)+1:null,
      fk?.referenced_schema||null,fk?.referenced_table||null,fk?.referenced_column||null
    );
  }
  if(!values.length)return;
  const sql="INSERT INTO digibail_legacy_columns " +
    "(source_schema,source_table,column_name,data_type,is_nullable,ordinal_position,primary_key_order,referenced_schema,referenced_table,referenced_column) VALUES "+
    columns.map(()=>tuple).join(",")+
    " ON DUPLICATE KEY UPDATE data_type=VALUES(data_type),is_nullable=VALUES(is_nullable),ordinal_position=VALUES(ordinal_position),primary_key_order=VALUES(primary_key_order),referenced_schema=VALUES(referenced_schema),referenced_table=VALUES(referenced_table),referenced_column=VALUES(referenced_column)";
  await mysql.query(sql,values);
}
async function copyLegacyTable(pg,mysql,table) {
  const columns=await pgColumns(pg,"legacy_digibail",table);
  const pks=await pgPrimaryKeys(pg,"legacy_digibail",table);
  const sourceCount=await countPg(pg,"legacy_digibail",table);
  await storeLegacyColumns(pg,mysql,table,columns,pks);
  const where="WHERE source_schema=? AND source_table=?";
  const before=await countMy(mysql,"digibail_legacy_relational_rows",where,["legacy_digibail",table]);
  if(before>sourceCount) {
    throw new Error("Legacy relational destination has unexpected extra records: "+table+" source="+sourceCount+" destination_before="+before);
  }
  const colNames=columns.map(c=>c.column_name);
  const order=pks.length?pks.map(qpg).join(","):"ctid";
  let offset=0;
  while(offset<sourceCount) {
    const result=await pg.query(
      "SELECT * FROM legacy_digibail."+qpg(table)+" ORDER BY "+order+" LIMIT $1 OFFSET $2",
      [BATCH,offset]
    );
    if(!result.rows.length)break;
    const tuples=[];
    for(let i=0;i<result.rows.length;i++) {
      const row=result.rows[i];
      const idMaterial=pks.length
        ?jsonValue(pks.map(k=>row[k]))
        :"row-"+String(offset+i+1);
      const legacyId=crypto.createHash("sha256").update(idMaterial).digest("hex");
      tuples.push(["legacy_digibail",table,legacyId,jsonValue(row)]);
    }
    await mysql.query(
      "INSERT INTO digibail_legacy_relational_rows(source_schema,source_table,legacy_id,payload) VALUES "+
      tuples.map(()=>"(?,?,?,?)").join(",")+
      " ON DUPLICATE KEY UPDATE payload=VALUES(payload)",
      tuples.flat()
    );
    offset+=result.rows.length;
    console.log("LEGACY_COPY_PROGRESS="+table+" "+offset+"/"+sourceCount);
  }
  const destination=await countMy(mysql,"digibail_legacy_relational_rows",where,["legacy_digibail",table]);
  if(destination!==sourceCount)throw new Error("LEGACY_COUNT_MISMATCH="+table+" source="+sourceCount+" destination="+destination);
  console.log("LEGACY_COUNT_VERIFIED="+table+" rows="+sourceCount);
  return {table,sourceCount,destination};
}
async function copyImportManifest(pg,mysql) {
  if(!(await pgTableExists(pg,"legacy_digibail","_import_manifest")))return 0;
  const rows=(await pg.query(
    "SELECT source_schema,source_table,source_rows,imported_rows,imported_at FROM legacy_digibail._import_manifest ORDER BY source_schema,source_table"
  )).rows;
  for(const r of rows) {
    await mysql.query(
      "INSERT INTO digibail_legacy_manifest(source_schema,source_table,source_rows,imported_rows,imported_at) VALUES(?,?,?,?,?) "+
      "ON DUPLICATE KEY UPDATE source_rows=VALUES(source_rows),imported_rows=VALUES(imported_rows),imported_at=VALUES(imported_at)",
      [r.source_schema,r.source_table,Number(r.source_rows),Number(r.imported_rows),r.imported_at]
    );
  }
  return rows.length;
}
async function importExistingMariaIdentityMap(mysql) {
  const [exists]=await mysql.query(
    "SELECT 1 FROM information_schema.tables WHERE table_schema=DATABASE() AND table_name='DigibailUserIdentity'"
  );
  if(!exists.length)return 0;
  const [maps]=await mysql.query("SELECT PostgresUserId,MariaDbUserId,RoleCode FROM DigibailUserIdentity");
  for(const item of maps) {
    await mysql.query(
      "INSERT INTO DigibailAppUserIdentity(AppUserId,LegacySource,MariaDbUserId,MariaDbUserKey,RoleCode) VALUES(?,'mariadb.AspNetUsers',?,NULL,?) "+
      "ON DUPLICATE KEY UPDATE MariaDbUserId=VALUES(MariaDbUserId),MariaDbUserKey=NULL,RoleCode=VALUES(RoleCode)",
      [item.PostgresUserId,item.MariaDbUserId,item.RoleCode||"customer"]
    );
  }
  console.log("EXISTING_MARIADB_IDENTITY_MAPS_IMPORTED="+maps.length);
  return maps.length;
}
async function main() {
  if(!pgUrl.startsWith("postgres://")&&!pgUrl.startsWith("postgresql://")) {
    throw new Error("Temporary DIGIBAIL_SOURCE_DATABASE_URL is missing or is not a PostgreSQL URL.");
  }
  if(!mysqlOptions.user||!mysqlOptions.password)throw new Error("MariaDB credentials are not configured.");
  if(APPLY&&process.env.DIGIBAIL_MIGRATION_BACKUP_VERIFIED!=="YES") {
    throw new Error("Verified source and MariaDB backups are required before --apply.");
  }
  const pg=new Pool({connectionString:pgUrl,max:2,connectionTimeoutMillis:15000,statement_timeout:180000});
  const mysql=createPool(mysqlOptions);
  try {
    await pg.query("SELECT 1");
    await mysql.query("SELECT 1");
    if(APPLY)await migrate();

    const publicResults=[];
    for(const table of applicationTables) {
      if(!(await pgTableExists(pg,"public",table)))continue;
      const sourceCount=await countPg(pg,"public",table);
      console.log("PUBLIC_TABLE_PLAN="+table+" rows="+sourceCount);
      if(APPLY)publicResults.push(await copyPublicTable(pg,mysql,table));
    }

    const legacyTables=(await pg.query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema='legacy_digibail' AND table_type='BASE TABLE' ORDER BY table_name"
    )).rows.map(x=>x.table_name);
    if(!legacyTables.length)throw new Error("Source schema legacy_digibail is absent or empty.");
    const operationalTables=legacyTables.filter(x=>!x.startsWith("_"));
    if(operationalTables.length!==59) {
      throw new Error("Expected all 59 imported legacy tables; found "+operationalTables.length+". No source data was removed.");
    }
    console.log("LEGACY_TABLE_INVENTORY_VERIFIED=59 plus "+(legacyTables.length-59)+" manifest tables");
    for(const table of legacyTables) {
      const n=await countPg(pg,"legacy_digibail",table);
      console.log("LEGACY_TABLE_PLAN="+table+" rows="+n);
      if(APPLY)await copyLegacyTable(pg,mysql,table);
    }

    if(APPLY) {
      const manifestRows=await copyImportManifest(pg,mysql);
      const oldMaps=await importExistingMariaIdentityMap(mysql);
      for(const table of applicationTables) {
        if(!(await pgTableExists(pg,"public",table)))continue;
        const sourceCount=await countPg(pg,"public",table);
        const targetCount=await countMy(mysql,table);
        if(targetCount!==sourceCount)throw new Error("FINAL_PUBLIC_VERIFY_FAILED="+table+" source="+sourceCount+" destination="+targetCount);
      }
      for(const table of legacyTables) {
        const sourceCount=await countPg(pg,"legacy_digibail",table);
        const targetCount=await countMy(mysql,"digibail_legacy_relational_rows",
          "WHERE source_schema=? AND source_table=?",["legacy_digibail",table]);
        if(targetCount!==sourceCount)throw new Error("FINAL_LEGACY_VERIFY_FAILED="+table+" source="+sourceCount+" destination="+targetCount);
      }
      console.log("DIGIBAIL_SOURCE_MIGRATION=PASS application_tables="+publicResults.length+" legacy_tables="+legacyTables.length+" manifest_rows="+manifestRows+" preserved_identity_links="+oldMaps);
    } else {
      console.log("DRY_RUN_ONLY=1; no rows were written. Review the inventory, create backups, then run with --apply.");
    }
  } finally {
    await Promise.allSettled([pg.end(),mysql.end(),closePool()]);
  }
}
main().catch(error=>{
  console.error("DIGIBAIL_SOURCE_MIGRATION_FAILED="+String(error.code||error.name||"unknown")+":"+String(error.message||error).slice(0,800));
  process.exitCode=1;
});
