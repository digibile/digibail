import { execFileSync } from "node:child_process";
import { mkdtempSync, writeFileSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

// Full import covers VamCity, BluVam and TransferDb source archives.
const ROOT = "/home/digibail/domains/digebail.ir";
const SQLC = "public_html-db-1";
const SOURCE_DB = "vamcityc_vamcity_import_20261028";
const SOURCE_DATABASES = [{name:SOURCE_DB,alias:"dbo"},{name:"vamcityc_bluvamdb_import_20261028",alias:"bluvam"},{name:"vamcityc_transferDb_import_20261028",alias:"transferdb"}];
const MAX_BUFFER = 1024 * 1024 * 1024;
const dockerPrefix = (() => {
  try { execFileSync("sudo", ["-n","docker","info"], {stdio:"ignore"}); return ["sudo","-n","docker"]; }
  catch { execFileSync("docker", ["info"], {stdio:"ignore"}); return ["docker"]; }
})();
function docker(args, options={}) {
  return execFileSync(dockerPrefix[0], [...dockerPrefix.slice(1), ...args], {
    encoding:"utf8", maxBuffer:MAX_BUFFER, ...options
  });
}
function clean(v) { return String(v ?? "").trim(); }
function jsonRows(raw, label) {
  const first=raw.indexOf("["); const last=raw.lastIndexOf("]");
  if(first<0 || last<first) {
    if(!raw.trim()) return [];
    throw new Error("SQL JSON output missing for "+label+": "+raw.slice(-300));
  }
  return JSON.parse(raw.slice(first,last+1).replace(/[\r\n]/g,""));
}
let SQLCMD="", SA_PASS="";
const temp=mkdtempSync(join(tmpdir(),"digibail-full-vamcity-import-"));
try {
  SQLCMD=clean(docker(["exec",SQLC,"sh","-lc","command -v /opt/mssql-tools18/bin/sqlcmd || command -v /opt/mssql-tools/bin/sqlcmd || command -v sqlcmd"])).split("\n")[0];
  SA_PASS=clean(docker(["exec",SQLC,"printenv","MSSQL_SA_PASSWORD"]));
  if(!SQLCMD || !SA_PASS) throw new Error("Restored SQL Server source or credentials unavailable");
  function sql(query, extra=[], db=SOURCE_DB) {
    return docker(["exec","-e","SQLCMDPASSWORD",SQLC,SQLCMD,"-S","localhost","-U","sa","-C","-b","-w","65535","-y","0","-d",db,...extra,"-Q",query], {
      env:{...process.env,SQLCMDPASSWORD:SA_PASS}
    });
  }
  function rows(query,label,db=SOURCE_DB) { return jsonRows(sql("SET NOCOUNT ON; "+query,[],db),label); }
  function count(table,db=SOURCE_DB,schema="dbo") {
    const raw=sql("SET NOCOUNT ON; SELECT COUNT_BIG(*) FROM ["+schema.replace(/]/g,"]]" )+"].["+table.replace(/]/g,"]]")+"]; ",[],db);
    const numericLines=raw.split(/\r?\n/).map(x=>x.trim()).filter(x=>/^\d+$/.test(x));
    const n=Number(numericLines[numericLines.length-1]);
    if(!Number.isSafeInteger(n)) throw new Error("Could not count source table "+db+".dbo."+table);
    return n;
  }
  const genericTables=[],schemaDefinitions=[],columnDefinitions=[],primaryKeys=[],foreignKeys=[];
  const sourceInventory={};
  let totalRows=0;
  const exportedByDatabase=new Map();
  for(const db of SOURCE_DATABASES) {
    const onlineRaw=sql("SET NOCOUNT ON; SELECT COUNT(*) FROM sys.databases WHERE name=N'"+db.name+"' AND state_desc='ONLINE';",[],db.name);
    const online=onlineRaw.split(/\r?\n/).map(x=>x.trim()).filter(x=>/^\d+$/.test(x)).slice(-1)[0]||"";
    if(online!=="1") throw new Error("Required restored source database is not ONLINE: "+db.name);
    const tableRows=rows(
      "SELECT s.name AS schemaName,t.name AS tableName FROM sys.tables t JOIN sys.schemas s ON s.schema_id=t.schema_id WHERE t.is_ms_shipped=0 ORDER BY s.name,t.name FOR JSON PATH, INCLUDE_NULL_VALUES;",
      "table list "+db.name,db.name
    );
    if(!tableRows.length) throw new Error("No user tables found in "+db.name);
    const targetSchema=(sourceSchema)=>db.alias==="dbo"&&sourceSchema==="dbo"?"dbo":db.alias+"_"+sourceSchema;
    const tables=tableRows.map(x=>({sourceSchema:x.schemaName,schemaName:targetSchema(x.schemaName),tableName:x.tableName}));
    schemaDefinitions.push(...tables.map(t=>({sourceTable:t.schemaName+"."+t.tableName})));
    const cols=rows(
      "SELECT s.name AS schemaName,t.name AS tableName,c.name AS columnName,ty.name AS dataType,c.max_length AS maxLength,c.precision AS [precision],c.scale AS scale,c.is_nullable AS isNullable,c.is_identity AS isIdentity "+
      "FROM sys.columns c JOIN sys.tables t ON t.object_id=c.object_id JOIN sys.schemas s ON s.schema_id=t.schema_id JOIN sys.types ty ON ty.user_type_id=c.user_type_id "+
      "WHERE t.is_ms_shipped=0 ORDER BY s.name,t.name,c.column_id FOR JSON PATH, INCLUDE_NULL_VALUES;",
      "column metadata "+db.name,db.name
    );
    const pks=rows(
      "SELECT s.name AS schemaName,t.name AS tableName,i.name AS constraintName,c.name AS columnName,ic.key_ordinal AS keyOrdinal "+
      "FROM sys.indexes i JOIN sys.index_columns ic ON ic.object_id=i.object_id AND ic.index_id=i.index_id JOIN sys.columns c ON c.object_id=ic.object_id AND c.column_id=ic.column_id "+
      "JOIN sys.tables t ON t.object_id=i.object_id JOIN sys.schemas s ON s.schema_id=t.schema_id "+
      "WHERE i.is_primary_key=1 AND t.is_ms_shipped=0 ORDER BY s.name,t.name,ic.key_ordinal FOR JSON PATH, INCLUDE_NULL_VALUES;",
      "primary key metadata "+db.name,db.name
    );
    const fks=rows(
      "SELECT ps.name AS schemaName,pt.name AS tableName,fk.name AS constraintName,pc.name AS columnName,rs.name AS referencedSchemaName,rt.name AS referencedTableName,rc.name AS referencedColumnName,fkc.constraint_column_id AS keyOrdinal,fk.delete_referential_action_desc AS deleteAction,fk.update_referential_action_desc AS updateAction "+
      "FROM sys.foreign_keys fk JOIN sys.foreign_key_columns fkc ON fkc.constraint_object_id=fk.object_id "+
      "JOIN sys.tables pt ON pt.object_id=fkc.parent_object_id JOIN sys.schemas ps ON ps.schema_id=pt.schema_id JOIN sys.columns pc ON pc.object_id=fkc.parent_object_id AND pc.column_id=fkc.parent_column_id "+
      "JOIN sys.tables rt ON rt.object_id=fkc.referenced_object_id JOIN sys.schemas rs ON rs.schema_id=rt.schema_id JOIN sys.columns rc ON rc.object_id=fkc.referenced_object_id AND rc.column_id=fkc.referenced_column_id "+
      "WHERE pt.is_ms_shipped=0 AND rt.is_ms_shipped=0 ORDER BY ps.name,pt.name,fk.name,fkc.constraint_column_id FOR JSON PATH, INCLUDE_NULL_VALUES;",
      "foreign key metadata "+db.name,db.name
    );
    columnDefinitions.push(...cols.map(x=>({...x,schemaName:targetSchema(x.schemaName)})));
    primaryKeys.push(...pks.map(x=>({...x,schemaName:targetSchema(x.schemaName)})));
    foreignKeys.push(...fks.map(x=>({...x,schemaName:targetSchema(x.schemaName),referencedSchemaName:targetSchema(x.referencedSchemaName)})));
    const dbCounts={tables:tables.length,rows:0};
    for(const t of tables) {
      const name=t.tableName;
      const safeColumns=cols.filter(x=>x.schemaName===t.sourceSchema&&x.tableName===name&&!((name.toLowerCase()==="aspnetusers"&&["passwordhash","securitystamp","concurrencystamp","otp"].includes(String(x.columnName).toLowerCase()))||(name.toLowerCase()==="customers"&&String(x.columnName).toLowerCase()==="initpassword")));
      if(!safeColumns.length)throw new Error("No exportable columns for "+db.name+"."+t.sourceSchema+"."+name);
      const projection=safeColumns.map(x=>"["+x.columnName.replace(/]/g,"]]")+"]").join(",");
      const data=rows("SELECT "+projection+" FROM ["+t.sourceSchema.replace(/]/g,"]]")+ "].["+name.replace(/]/g,"]]")+"] FOR JSON PATH, INCLUDE_NULL_VALUES;",db.name+"."+t.sourceSchema+"."+name,db.name);
      const expected=count(name,db.name,t.sourceSchema);
      if(data.length!==expected) throw new Error("Row count mismatch for "+db.name+"."+t.sourceSchema+"."+name+": expected "+expected+" got "+data.length);
      genericTables.push({sourceTable:t.schemaName+"."+name,rows:data});
      totalRows+=data.length;dbCounts.rows+=data.length;
      console.log("SOURCE_TABLE_EXPORTED="+db.name+"."+t.sourceSchema+"."+name+" rows="+data.length);
    }
    sourceInventory[db.name]=dbCounts;
    exportedByDatabase.set(db.name,new Set(tables.map(t=>t.sourceSchema+"."+t.tableName)));
    console.log("SOURCE_DATABASE_EXPORTED="+db.name+" "+JSON.stringify(dbCounts));
  }
  const mainTables=exportedByDatabase.get(SOURCE_DB);
  for(const required of ["AspNetUsers","AspNetRoles","AspNetUserRoles","Customers"])if(!mainTables.has("dbo."+required))throw new Error("Required main identity/customer table missing: "+required);
  const countMain=table=>count(table,SOURCE_DB);
  const counts={users:countMain("AspNetUsers"),roles:countMain("AspNetRoles"),userRoles:countMain("AspNetUserRoles"),customers:countMain("Customers")};
  console.log("SOURCE_CUSTOMER_INVENTORY="+JSON.stringify(counts));
  if(counts.users!==54628||counts.roles!==8||counts.userRoles!==54625||counts.customers!==2)throw new Error("Main VamCity identity counts differ from audited inventory; refusing partial import");
  const users=rows(
    "SELECT CAST(u.Id AS nvarchar(40)) AS legacyId,NULLIF(LTRIM(RTRIM(u.UserName)),'') AS username,"+
    "NULLIF(LTRIM(RTRIM(CONCAT(ISNULL(u.FirstName,''),' ',ISNULL(u.LastName,'')))),'') AS fullName,"+
    "NULLIF(LTRIM(RTRIM(u.Email)),'') AS email,NULLIF(LTRIM(RTRIM(u.NationalCode)),'') AS nationalCode,"+
    "CAST(u.IsActive AS bit) AS isActive,COALESCE(NULLIF(LTRIM(RTRIM(u.Mobile)),''),NULLIF(LTRIM(RTRIM(u.PhoneNumber)),''),NULLIF(LTRIM(RTRIM(u.Phone)),'')) AS phone,"+
    "COALESCE((SELECT STRING_AGG(r.Name,',') FROM dbo.AspNetUserRoles ur JOIN dbo.AspNetRoles r ON r.Id=ur.RoleId WHERE ur.UserId=u.Id),'') AS roles,"+
    "u.RegDate AS createdAt,CONVERT(nvarchar(36),u.CustomerId) AS customerId,CAST(u.AgentId AS nvarchar(40)) AS agentId,"+
    "CAST(u.CustomerMarketerId AS nvarchar(40)) AS customerMarketerId,CONVERT(nvarchar(36),u.AgentMetaDataId) AS agentMetaDataId "+
    "FROM dbo.AspNetUsers u FOR JSON PATH, INCLUDE_NULL_VALUES;","AspNetUsers",SOURCE_DB);
  const identityRoles=rows("SELECT CAST(Id AS nvarchar(40)) AS Id,Name FROM dbo.AspNetRoles FOR JSON PATH, INCLUDE_NULL_VALUES;","AspNetRoles",SOURCE_DB);
  const identityUserRoles=rows("SELECT CAST(UserId AS nvarchar(40)) AS UserId,CAST(RoleId AS nvarchar(40)) AS RoleId FROM dbo.AspNetUserRoles FOR JSON PATH, INCLUDE_NULL_VALUES;","AspNetUserRoles",SOURCE_DB);
  const customers=rows(
    "SELECT CONVERT(nvarchar(36),Id) AS legacyId,Name AS name,Mobile AS mobile,Email AS email,Code AS code,RegDate AS createdAt,ExpireDate AS expiresAt,Permanent AS permanent,Purchased AS purchased,AffCode AS affiliateCode,ParkDomain AS parkedDomain FROM dbo.Customers FOR JSON PATH, INCLUDE_NULL_VALUES;",
    "Customers",SOURCE_DB
  );
  if(users.length!==counts.users||identityRoles.length!==counts.roles||identityUserRoles.length!==counts.userRoles||customers.length!==counts.customers)throw new Error("Exported customer/account rows do not match main source counts");
  const smsPatterns=[];
  const input={users,customers,identityRoles,identityUserRoles,smsPatterns,genericTables,schemaDefinitions,columnDefinitions,primaryKeys,foreignKeys};
  const inputPath=join(temp,"legacy-migration.json");
  writeFileSync(inputPath,JSON.stringify(input),{mode:0o600});
  console.log("FULL_LEGACY_IMPORT_PAYLOAD_READY="+JSON.stringify({databases:sourceInventory,tables:schemaDefinitions.length,columns:columnDefinitions.length,primaryKeys:primaryKeys.length,foreignKeyColumns:foreignKeys.length,sourceRows:totalRows,users:users.length,roles:identityRoles.length,userRoles:identityUserRoles.length,customers:customers.length,bytes:readFileSync(inputPath).length}));
  const output=docker(["compose","run","--rm","-T","--no-deps","-u","0","-v",inputPath+":/tmp/legacy-migration.json:ro","app","node","/app/scripts/migrate-legacy-digibail.js","/tmp/legacy-migration.json"],{cwd:ROOT});
  console.log(output.slice(-10000));
  const verifyCmd='export PGPASSWORD="$POSTGRES_PASSWORD"; psql -X -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d "$POSTGRES_DB" -At';
  const verify=docker(["compose","exec","-T","db","sh","-lc",verifyCmd],{cwd:ROOT,input:
    "SELECT 'users='||COUNT(*) FROM users WHERE legacy_source='aspnetusers';\n"+
    "SELECT 'role_assignments='||COUNT(*) FROM user_role_assignments WHERE legacy_source='aspnetuserroles';\n"+
    "SELECT 'business_customers='||COUNT(*) FROM legacy_digibail.\"dbo__Customers\";\n"+
    "SELECT 'agent_metadata='||COUNT(*) FROM legacy_digibail.\"dbo__AgentMetaData\";\n"+
    "SELECT 'subagent_transactions='||COUNT(*) FROM legacy_digibail.\"dbo__SubAgentTransactions\";\n"+
    "SELECT 'legacy_tables='||COUNT(*) FROM legacy_digibail.\"_import_manifest\";\n"+
    "SELECT 'legacy_rows='||COALESCE(SUM(imported_rows),0) FROM legacy_digibail.\"_import_manifest\";\n"+
    "SELECT 'manifest_mismatches='||COUNT(*) FROM legacy_digibail.\"_import_manifest\" WHERE source_rows<>imported_rows;\n"
  });
  console.log("CUSTOMER_IMPORT_TARGET_COUNTS_BEGIN\n"+verify+"CUSTOMER_IMPORT_TARGET_COUNTS_END");
  if(!verify.includes("users="+counts.users)||!verify.includes("role_assignments="+counts.userRoles)||!verify.includes("business_customers="+counts.customers)||!verify.includes("legacy_tables="+schemaDefinitions.length)||!verify.includes("legacy_rows="+totalRows)||!verify.includes("manifest_mismatches=0")) {
    throw new Error("Linux production row counts or relational import manifest did not match all three Windows source databases");
  }
  console.log("VAMCITY_ALL_DATABASES_IMPORT_VERIFIED=1");
} catch(error) {
  console.error("VAMCITY_CUSTOMER_IMPORT_FAILED="+String(error.code||error.name||"unknown")+":"+String(error.message||"").slice(0,700));
  process.exitCode=1;
} finally {
  SA_PASS="";
  rmSync(temp,{recursive:true,force:true});
}
