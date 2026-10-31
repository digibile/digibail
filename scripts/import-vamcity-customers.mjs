import { execFileSync } from "node:child_process";
import { mkdtempSync, writeFileSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const ROOT = "/home/digibail/domains/digebail.ir";
const SQLC = "public_html-db-1";
const SOURCE_DB = "vamcityc_vamcity_import_20261028";
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
  function sql(query, extra=[]) {
    return docker(["exec","-e","SQLCMDPASSWORD",SQLC,SQLCMD,"-S","localhost","-U","sa","-C","-b","-w","65535","-y","0","-d",SOURCE_DB,...extra,"-Q",query], {
      env:{...process.env,SQLCMDPASSWORD:SA_PASS}
    });
  }
  function rows(query,label) { return jsonRows(sql("SET NOCOUNT ON; "+query),label); }
  function count(table) {
    const raw=sql("SET NOCOUNT ON; SELECT COUNT_BIG(*) FROM dbo.["+table+"]; ");
    const numericLines=raw.split(/\r?\n/).map(x=>x.trim()).filter(x=>/^\d+$/.test(x));
    const n=Number(numericLines[numericLines.length-1]);
    if(!Number.isSafeInteger(n)) throw new Error("Could not count source table "+table);
    return n;
  }
  const onlineRaw=sql("SET NOCOUNT ON; SELECT COUNT(*) FROM sys.databases WHERE name=N'"+SOURCE_DB+"' AND state_desc='ONLINE';");
  const online=onlineRaw.split(/\r?\n/).map(x=>x.trim()).filter(x=>/^\d+$/.test(x)).slice(-1)[0]||"";
  if(online!=="1") throw new Error("Main VamCity source database is not ONLINE");
  const counts={
    users:count("AspNetUsers"),
    roles:count("AspNetRoles"),
    userRoles:count("AspNetUserRoles"),
    customers:count("Customers")
  };
  console.log("SOURCE_CUSTOMER_INVENTORY="+JSON.stringify(counts));
  if(counts.users!==54628 || counts.roles!==8 || counts.userRoles!==54625 || counts.customers!==2) {
    throw new Error("Source identity counts differ from the audited inventory; refusing partial import");
  }

  const tableRows=rows(
    "SELECT s.name AS schemaName,t.name AS tableName FROM sys.tables t JOIN sys.schemas s ON s.schema_id=t.schema_id WHERE s.name=N'dbo' AND t.is_ms_shipped=0 ORDER BY t.name FOR JSON PATH, INCLUDE_NULL_VALUES;",
    "selected table list"
  );
  const tables=tableRows.map(x=>({schemaName:x.schemaName,tableName:x.tableName}));
  const present=new Set(tables.map(t=>t.tableName));
  for(const required of ["AspNetUsers","AspNetRoles","AspNetUserRoles","Customers"]) {
    if(!present.has(required)) throw new Error("Required customer table missing: "+required);
  }
  const inList=tables.map(t=>"N'"+t.tableName.replace(/'/g,"''")+"'").join(",");
  const schemaDefinitions=tables.map(t=>({sourceTable:t.schemaName+"."+t.tableName}));
  const columnDefinitions=rows(
    "SELECT s.name AS schemaName,t.name AS tableName,c.name AS columnName,ty.name AS dataType,c.max_length AS maxLength,c.precision AS [precision],c.scale AS scale,c.is_nullable AS isNullable,c.is_identity AS isIdentity "+
    "FROM sys.columns c JOIN sys.tables t ON t.object_id=c.object_id JOIN sys.schemas s ON s.schema_id=t.schema_id JOIN sys.types ty ON ty.user_type_id=c.user_type_id "+
    "WHERE s.name=N'dbo' AND t.name IN ("+inList+") ORDER BY t.name,c.column_id FOR JSON PATH, INCLUDE_NULL_VALUES;",
    "column metadata"
  );
  const primaryKeys=rows(
    "SELECT s.name AS schemaName,t.name AS tableName,i.name AS constraintName,c.name AS columnName,ic.key_ordinal AS keyOrdinal "+
    "FROM sys.indexes i JOIN sys.index_columns ic ON ic.object_id=i.object_id AND ic.index_id=i.index_id JOIN sys.columns c ON c.object_id=ic.object_id AND c.column_id=ic.column_id "+
    "JOIN sys.tables t ON t.object_id=i.object_id JOIN sys.schemas s ON s.schema_id=t.schema_id "+
    "WHERE i.is_primary_key=1 AND s.name=N'dbo' AND t.name IN ("+inList+") ORDER BY t.name,ic.key_ordinal FOR JSON PATH, INCLUDE_NULL_VALUES;",
    "primary key metadata"
  );
  const foreignKeys=rows(
    "SELECT ps.name AS schemaName,pt.name AS tableName,fk.name AS constraintName,pc.name AS columnName,rs.name AS referencedSchemaName,rt.name AS referencedTableName,rc.name AS referencedColumnName,fkc.constraint_column_id AS keyOrdinal,fk.delete_referential_action_desc AS deleteAction,fk.update_referential_action_desc AS updateAction "+
    "FROM sys.foreign_keys fk JOIN sys.foreign_key_columns fkc ON fkc.constraint_object_id=fk.object_id "+
    "JOIN sys.tables pt ON pt.object_id=fkc.parent_object_id JOIN sys.schemas ps ON ps.schema_id=pt.schema_id JOIN sys.columns pc ON pc.object_id=fkc.parent_object_id AND pc.column_id=fkc.parent_column_id "+
    "JOIN sys.tables rt ON rt.object_id=fkc.referenced_object_id JOIN sys.schemas rs ON rs.schema_id=rt.schema_id JOIN sys.columns rc ON rc.object_id=fkc.referenced_object_id AND rc.column_id=fkc.referenced_column_id "+
    "WHERE ps.name=N'dbo' AND rs.name=N'dbo' AND pt.name IN ("+inList+") AND rt.name IN ("+inList+") ORDER BY pt.name,fk.name,fkc.constraint_column_id FOR JSON PATH, INCLUDE_NULL_VALUES;",
    "foreign key metadata"
  );
  const users=rows(
    "SELECT CAST(u.Id AS nvarchar(40)) AS legacyId,NULLIF(LTRIM(RTRIM(u.UserName)),'') AS username,"+
    "NULLIF(LTRIM(RTRIM(CONCAT(ISNULL(u.FirstName,''),' ',ISNULL(u.LastName,'')))),'') AS fullName,"+
    "NULLIF(LTRIM(RTRIM(u.Email)),'') AS email,NULLIF(LTRIM(RTRIM(u.NationalCode)),'') AS nationalCode,"+
    "CAST(u.IsActive AS bit) AS isActive,COALESCE(NULLIF(LTRIM(RTRIM(u.Mobile)),''),NULLIF(LTRIM(RTRIM(u.PhoneNumber)),''),NULLIF(LTRIM(RTRIM(u.Phone)),'')) AS phone,"+
    "COALESCE((SELECT STRING_AGG(r.Name,',') FROM dbo.AspNetUserRoles ur JOIN dbo.AspNetRoles r ON r.Id=ur.RoleId WHERE ur.UserId=u.Id),'') AS roles,"+
    "u.RegDate AS createdAt,CONVERT(nvarchar(36),u.CustomerId) AS customerId,CAST(u.AgentId AS nvarchar(40)) AS agentId,"+
    "CAST(u.CustomerMarketerId AS nvarchar(40)) AS customerMarketerId,CONVERT(nvarchar(36),u.AgentMetaDataId) AS agentMetaDataId "+
    "FROM dbo.AspNetUsers u FOR JSON PATH, INCLUDE_NULL_VALUES;",
    "AspNetUsers"
  );
  const identityRoles=rows("SELECT CAST(Id AS nvarchar(40)) AS Id,Name FROM dbo.AspNetRoles FOR JSON PATH, INCLUDE_NULL_VALUES;","AspNetRoles");
  const identityUserRoles=rows("SELECT CAST(UserId AS nvarchar(40)) AS UserId,CAST(RoleId AS nvarchar(40)) AS RoleId FROM dbo.AspNetUserRoles FOR JSON PATH, INCLUDE_NULL_VALUES;","AspNetUserRoles");
  const customers=rows(
    "SELECT CONVERT(nvarchar(36),Id) AS legacyId,Name AS name,Mobile AS mobile,Email AS email,Code AS code,RegDate AS createdAt,ExpireDate AS expiresAt,Permanent AS permanent,Purchased AS purchased,AffCode AS affiliateCode,ParkDomain AS parkedDomain FROM dbo.Customers FOR JSON PATH, INCLUDE_NULL_VALUES;",
    "Customers"
  );
  if(users.length!==counts.users || identityRoles.length!==counts.roles || identityUserRoles.length!==counts.userRoles || customers.length!==counts.customers) {
    throw new Error("Exported customer/account rows do not match source counts");
  }

  const genericTables=[];
  let totalRows=0;
  for(const t of tables) {
    const name=t.tableName;
    const data=rows("SELECT * FROM dbo.["+name.replace(/]/g,"]]")+"] FOR JSON PATH, INCLUDE_NULL_VALUES;",name);
    const expected=count(name);
    if(data.length!==expected) throw new Error("Row count mismatch for "+name+": expected "+expected+" got "+data.length);
    genericTables.push({sourceTable:"dbo."+name,rows:data});
    totalRows+=data.length;
    console.log("SOURCE_TABLE_EXPORTED="+name+" rows="+data.length);
  }
  const input={users,customers,identityRoles,identityUserRoles,smsPatterns:[],genericTables,schemaDefinitions,columnDefinitions,primaryKeys,foreignKeys};
  const inputPath=join(temp,"legacy-migration.json");
  writeFileSync(inputPath,JSON.stringify(input),{mode:0o600});
  console.log("CUSTOMER_IMPORT_PAYLOAD_READY="+JSON.stringify({tables:tables.length,columns:columnDefinitions.length,primaryKeys:primaryKeys.length,foreignKeyColumns:foreignKeys.length,sourceRows:totalRows,users:users.length,roles:identityRoles.length,userRoles:identityUserRoles.length,customers:customers.length,bytes:readFileSync(inputPath).length}));
  const output=docker(["compose","run","--rm","-T","--no-deps","-u","0","-v",inputPath+":/tmp/legacy-migration.json:ro","app","node","/app/scripts/migrate-legacy-digibail.js","/tmp/legacy-migration.json"],{cwd:ROOT});
  console.log(output.slice(-10000));
  const verifyCmd='export PGPASSWORD="$POSTGRES_PASSWORD"; psql -X -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d "$POSTGRES_DB" -At';
  const verify=docker(["compose","exec","-T","db","sh","-lc",verifyCmd],{cwd:ROOT,input:
    "SELECT 'users='||COUNT(*) FROM users WHERE legacy_source='aspnetusers';\n"+
    "SELECT 'role_assignments='||COUNT(*) FROM user_role_assignments WHERE legacy_source='aspnetuserroles';\n"+
    "SELECT 'business_customers='||COUNT(*) FROM legacy_digibail.\"dbo__Customers\";\n"+
    "SELECT 'agent_metadata='||COUNT(*) FROM legacy_digibail.\"dbo__AgentMetaData\";\n"+
    "SELECT 'subagent_transactions='||COUNT(*) FROM legacy_digibail.\"dbo__SubAgentTransactions\";\n"
  });
  console.log("CUSTOMER_IMPORT_TARGET_COUNTS_BEGIN\n"+verify+"CUSTOMER_IMPORT_TARGET_COUNTS_END");
  if(!verify.includes("users="+counts.users)||!verify.includes("role_assignments="+counts.userRoles)||!verify.includes("business_customers="+counts.customers)) {
    throw new Error("Production target counts did not match the audited customer source");
  }
  console.log("VAMCITY_CUSTOMER_IMPORT_VERIFIED=1");
} catch(error) {
  console.error("VAMCITY_CUSTOMER_IMPORT_FAILED="+String(error.code||error.name||"unknown")+":"+String(error.message||"").slice(0,700));
  process.exitCode=1;
} finally {
  SA_PASS="";
  rmSync(temp,{recursive:true,force:true});
}
