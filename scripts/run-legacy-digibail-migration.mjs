import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

const ROOT="/home/digibail/domains/digebail.ir";
const SQL_CONTAINER="public_html-db-1";
const APP_CONTAINER="public_html-web-1";
const DB_NAME="Digibail";
const temp=fs.mkdtempSync(path.join(os.tmpdir(),"digibail-relational-"));
fs.chmodSync(temp,0o700);
function command(bin,args,opts={}) {
  const r=spawnSync(bin,args,{encoding:opts.encoding===null?null:"utf8",maxBuffer:opts.maxBuffer||80*1024*1024,env:{...process.env,...(opts.env||{})}});
  if(r.error)throw r.error;
  if(r.status!==0)throw new Error(bin+" "+args.slice(0,3).join(" ")+" failed ("+r.status+"): "+String(r.stderr||"").slice(-1200));
  return r.stdout;
}
let docker=["docker"];
try{command("sudo",["-n","docker","info"],{maxBuffer:1024*1024});docker=["sudo","-n","docker"];}
catch{command("docker",["info"],{maxBuffer:1024*1024});}
const runDocker=(args,opts={})=>command(docker[0],docker.slice(1).concat(args),opts);
function jsonOutput(raw,label){
 const first=raw.indexOf("[");if(first<0)throw new Error("SQL Server JSON export missing for "+label);
 let depth=0,inString=false,escaped=false,end=-1;
 for(let i=first;i<raw.length;i++){const ch=raw[i];if(inString){if(escaped)escaped=false;else if(ch==="\\\\")escaped=true;else if(ch===\'"\')inString=false;continue;}if(ch===\'"\'){inString=true;continue;}if(ch==="[")depth++;else if(ch==="]"){depth--;if(depth===0){end=i;break;}}}
 if(end<0)throw new Error("SQL Server JSON array is incomplete for "+label);
 return JSON.parse(raw.slice(first,end+1).replace(/[\\r\\n]/g,""));
}
function sql(query,extra=[]){
 const out=runDocker(["exec","-e","SQLCMDPASSWORD="+dbPassword,SQL_CONTAINER,sqlcmd,"-S","localhost","-U",dbUser,"-C","-b","-w","65535","-y","0","-d",DB_NAME,"-Q",query].concat(extra));
 return String(out).replace(/\r/g,"");
}
function writeJson(name,value){const p=path.join(temp,name);fs.writeFileSync(p,JSON.stringify(value),{mode:0o600});return p;}
function parseConnection(s){
 const o={};for(const part of String(s||"").split(";")){const i=part.indexOf("=");if(i>0)o[part.slice(0,i).trim().toLowerCase()]=part.slice(i+1).trim();}
 const pick=(...keys)=>keys.map(k=>o[k]).find(Boolean)||"";
 return {database:pick("initial catalog","database"),user:pick("user id","uid","user"),password:pick("password","pwd")};
}
let sqlcmd="/opt/mssql-tools18/bin/sqlcmd";
let has18=false;try{runDocker(["exec",SQL_CONTAINER,"test","-x",sqlcmd],{maxBuffer:1024*1024});has18=true;}catch{}if(!has18)sqlcmd="/opt/mssql-tools/bin/sqlcmd";
const env=String(runDocker(["inspect","--format","{{range .Config.Env}}{{println .}}{{end}}",SQL_CONTAINER]));
const saPassword=(env.match(/^(?:MSSQL_SA_PASSWORD|SA_PASSWORD)=(.*)$/m)||[])[1]||"";
const appEnv=String(runDocker(["inspect","--format","{{range .Config.Env}}{{println .}}{{end}}",APP_CONTAINER]));
const conn=(appEnv.match(/^ConnectionStrings__DefaultConnection=(.*)$/m)||[])[1]||"";
const appCreds=parseConnection(conn);
let dbPassword=saPassword,dbUser="sa";
if(!dbPassword||!conn)throw new Error("Legacy SQL Server credentials are unavailable.");
try{sql("SET NOCOUNT ON; SELECT 1");}
catch{
 if(!appCreds.user||!appCreds.password)throw new Error("SQL Server authentication failed.");
 dbUser=appCreds.user;dbPassword=appCreds.password;sql("SET NOCOUNT ON; SELECT 1");
}
if(appCreds.database&&appCreds.database.toLowerCase()!==DB_NAME.toLowerCase())throw new Error("Legacy application connection does not point to Digibail.");
console.log("LEGACY_SQL_AUTH=verified");
const composeApp=String(runDocker(["compose","ps","-q","app"],{maxBuffer:1024*1024})).trim();
if(!composeApp)throw new Error("Production app container not found.");
let markerFound=false;try{runDocker(["exec",composeApp,"grep","-q","DIGIBAIL_RELATIONAL_EXPORT_V2","/app/scripts/migrate-legacy-digibail.js"],{maxBuffer:1024*1024});markerFound=true;}catch{}if(!markerFound)throw new Error("Relational importer version marker not found in production app.");
const backupDir=path.join(ROOT,".migration-backups");
fs.mkdirSync(backupDir,{recursive:true,mode:0o700});fs.chmodSync(backupDir,0o700);
const backup=path.join(backupDir,"digibail-before-relational-"+new Date().toISOString().replace(/[-:TZ.]/g,"").slice(0,14)+".sql.gz");
const dump=runDocker(["compose","exec","-T","db","sh","-lc",'export PGPASSWORD="$POSTGRES_PASSWORD"; pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB"'],{encoding:null,maxBuffer:200*1024*1024});
const z=spawnSync("gzip",["-c"],{input:dump,encoding:null,maxBuffer:200*1024*1024});
if(z.status!==0||!z.stdout?.length)throw new Error("PostgreSQL backup compression failed.");
fs.writeFileSync(backup,z.stdout,{mode:0o600});fs.chmodSync(backup,0o600);
console.log("TARGET_BACKUP_CREATED=1");
const qUsers="SET NOCOUNT ON; SELECT CAST(u.Id AS nvarchar(40)) AS legacyId,NULLIF(LTRIM(RTRIM(u.UserName)),'') AS username,NULLIF(LTRIM(RTRIM(CONCAT(ISNULL(u.FirstName,''),' ',ISNULL(u.LastName,'')))),'') AS fullName,NULLIF(LTRIM(RTRIM(u.Email)),'') AS email,NULLIF(LTRIM(RTRIM(u.NationalCode)),'') AS nationalCode,CAST(u.IsActive AS bit) AS isActive,COALESCE(NULLIF(LTRIM(RTRIM(u.Mobile)),''),NULLIF(LTRIM(RTRIM(u.Phone)),'')) AS phone,COALESCE((SELECT STRING_AGG(r.Name, ',') FROM AspNetUserRoles ur JOIN AspNetRoles r ON r.Id=ur.RoleId WHERE ur.UserId=u.Id),'') AS roles,u.RegDate AS createdAt FROM dbo.AspNetUsers u FOR JSON PATH;";
const qCustomers="SET NOCOUNT ON; SELECT CONVERT(nvarchar(36),Id) AS legacyId,Name AS name,Mobile AS mobile,Email AS email,Code AS code,RegDate AS createdAt,ExpireDate AS expiresAt,Permanent AS permanent,Purchased AS purchased,AffCode AS affiliateCode,ParkDomain AS parkedDomain FROM dbo.Customers FOR JSON PATH;";
const qSms="SET NOCOUNT ON; SELECT CONVERT(nvarchar(36),Id) AS legacyId,Title AS title,Pattern AS pattern,IsSystem AS isSystem,Status AS status,Category AS category,SmsPatternPanel AS providerPanel,IsPatternBase AS isPatternBase,PatternBaseCode AS patternBaseCode,RejectReason AS rejectReason,CONVERT(nvarchar(36),CustomerId) AS legacyCustomerId FROM dbo.SmsPatterns FOR JSON PATH;";
const special={
 "users.json":jsonOutput(sql(qUsers),"users"),
 "customers.json":jsonOutput(sql(qCustomers),"customers"),
 "sms.json":jsonOutput(sql(qSms),"sms"),
 "plans.json":jsonOutput(sql("SET NOCOUNT ON; SELECT ROW_NUMBER() OVER (ORDER BY (SELECT NULL)) AS legacyRow,p.* FROM dbo.CustomerPurchasePlan p FOR JSON PATH;"),"plans"),
 "statuses.json":jsonOutput(sql("SET NOCOUNT ON; SELECT ROW_NUMBER() OVER (ORDER BY (SELECT NULL)) AS legacyRow,s.* FROM dbo.LoanRequestStatuses s FOR JSON PATH;"),"statuses"),
 "roles.json":jsonOutput(sql("SET NOCOUNT ON; SELECT ROW_NUMBER() OVER (ORDER BY (SELECT NULL)) AS legacyRow,r.* FROM dbo.AspNetRoles r FOR JSON PATH;"),"roles"),
 "userroles.json":jsonOutput(sql("SET NOCOUNT ON; SELECT ROW_NUMBER() OVER (ORDER BY (SELECT NULL)) AS legacyRow,ur.* FROM dbo.AspNetUserRoles ur FOR JSON PATH;"),"user roles"),
 "claims.json":jsonOutput(sql("SET NOCOUNT ON; SELECT ROW_NUMBER() OVER (ORDER BY (SELECT NULL)) AS legacyRow,c.* FROM dbo.AspNetUserClaims c FOR JSON PATH;"),"claims")
};
for(const [name,value] of Object.entries(special))writeJson(name,value);
const qColumns="SET NOCOUNT ON; SELECT s.name AS schemaName,t.name AS tableName,c.name AS columnName,ty.name AS dataType,c.max_length AS maxLength,c.precision AS precision,c.scale AS scale,c.is_nullable AS isNullable,c.is_identity AS isIdentity FROM sys.tables t JOIN sys.schemas s ON s.schema_id=t.schema_id JOIN sys.columns c ON c.object_id=t.object_id JOIN sys.types ty ON ty.user_type_id=c.user_type_id WHERE t.is_ms_shipped=0 ORDER BY s.name,t.name,c.column_id FOR JSON PATH;";
const qPks="SET NOCOUNT ON; SELECT s.name AS schemaName,t.name AS tableName,kc.name AS constraintName,c.name AS columnName,ic.key_ordinal AS keyOrdinal FROM sys.key_constraints kc JOIN sys.tables t ON t.object_id=kc.parent_object_id JOIN sys.schemas s ON s.schema_id=t.schema_id JOIN sys.index_columns ic ON ic.object_id=t.object_id AND ic.index_id=kc.unique_index_id JOIN sys.columns c ON c.object_id=t.object_id AND c.column_id=ic.column_id WHERE kc.type='PK' ORDER BY s.name,t.name,kc.name,ic.key_ordinal FOR JSON PATH;";
const qFks="SET NOCOUNT ON; SELECT ps.name AS schemaName,pt.name AS tableName,fk.name AS constraintName,pc.name AS columnName,rs.name AS referencedSchemaName,rt.name AS referencedTableName,rc.name AS referencedColumnName,fkc.constraint_column_id AS keyOrdinal,fk.delete_referential_action_desc AS deleteAction,fk.update_referential_action_desc AS updateAction FROM sys.foreign_keys fk JOIN sys.foreign_key_columns fkc ON fkc.constraint_object_id=fk.object_id JOIN sys.tables pt ON pt.object_id=fk.parent_object_id JOIN sys.schemas ps ON ps.schema_id=pt.schema_id JOIN sys.columns pc ON pc.object_id=pt.object_id AND pc.column_id=fkc.parent_column_id JOIN sys.tables rt ON rt.object_id=fk.referenced_object_id JOIN sys.schemas rs ON rs.schema_id=rt.schema_id JOIN sys.columns rc ON rc.object_id=rt.object_id AND rc.column_id=fkc.referenced_column_id ORDER BY ps.name,pt.name,fk.name,fkc.constraint_column_id FOR JSON PATH;";
const columnDefinitions=jsonOutput(sql(qColumns),"column definitions");
const primaryKeys=jsonOutput(sql(qPks),"primary keys");
const foreignKeys=jsonOutput(sql(qFks),"foreign keys");
writeJson("columns.json",columnDefinitions);writeJson("pks.json",primaryKeys);writeJson("fks.json",foreignKeys);
const tableList=String(runDocker(["exec","-e","SQLCMDPASSWORD="+dbPassword,SQL_CONTAINER,sqlcmd,"-S","localhost","-U",dbUser,"-C","-b","-h","-1","-W","-w","65535","-d",DB_NAME,"-Q","SET NOCOUNT ON; SELECT s.name+'.'+t.name FROM sys.tables t JOIN sys.schemas s ON s.schema_id=t.schema_id WHERE t.is_ms_shipped=0 ORDER BY s.name,t.name;"])).replace(/\r/g,"").split("\n").map(x=>x.trim()).filter(x=>x.includes("."));
if(tableList.length!==59)throw new Error("Expected 59 source tables, received "+tableList.length);
const genericTables=[];
for(const fullName of tableList){
 const dot=fullName.indexOf("."),schema=fullName.slice(0,dot),table=fullName.slice(dot+1);
 const esc=s=>s.replace(/]/g,"]]");
 const selectListQuery="SET NOCOUNT ON; DECLARE @cols nvarchar(max); SELECT @cols=STRING_AGG(CASE WHEN ty.name IN ('decimal','numeric','money','smallmoney') THEN 'CONVERT(nvarchar(100),'+QUOTENAME(c.name)+') AS '+QUOTENAME(c.name) ELSE QUOTENAME(c.name) END,',') WITHIN GROUP (ORDER BY c.column_id) FROM sys.columns c JOIN sys.types ty ON ty.user_type_id=c.user_type_id JOIN sys.tables t ON t.object_id=c.object_id JOIN sys.schemas s ON s.schema_id=t.schema_id WHERE s.name=N'"+schema.replace(/'/g,"''")+"' AND t.name=N'"+table.replace(/'/g,"''")+"' AND NOT (s.name='dbo' AND t.name='AspNetUsers' AND c.name='PasswordHash'); SELECT @cols;";
 const selectList=String(runDocker(["exec","-e","SQLCMDPASSWORD="+dbPassword,SQL_CONTAINER,sqlcmd,"-S","localhost","-U",dbUser,"-C","-b","-h","-1","-W","-w","65535","-d",DB_NAME,"-Q",selectListQuery])).replace(/\r/g,"").split("\n").map(x=>x.trim()).filter(Boolean).at(-1);
 if(!selectList)throw new Error("Could not build typed column list for "+fullName);
 const query="SET NOCOUNT ON; SELECT "+selectList+" FROM ["+esc(schema)+"].["+esc(table)+"] FOR JSON PATH, INCLUDE_NULL_VALUES;";
 const rows=jsonOutput(sql(query),"table "+fullName);
 genericTables.push({sourceTable:fullName,rows});
 console.log("SOURCE_TABLE_EXPORTED="+fullName+":"+rows.length);
}
const schemaDefinitions=genericTables.map(t=>({sourceTable:t.sourceTable,rowCount:t.rows.length}));
const data={users:special["users.json"],customers:special["customers.json"],smsPatterns:special["sms.json"],purchasePlans:special["plans.json"],loanRequestStatuses:special["statuses.json"],identityRoles:special["roles.json"],identityUserRoles:special["userroles.json"],identityClaims:special["claims.json"],genericTables,schemaDefinitions,columnDefinitions,primaryKeys,foreignKeys};
const inputFile=path.join(temp,"input.json");fs.writeFileSync(inputFile,JSON.stringify(data),{mode:0o600});
const appId=String(runDocker(["compose","ps","-q","app"])).trim();
if(!appId)throw new Error("Current Digibail app container is missing.");
runDocker(["cp",inputFile,appId+":/tmp/legacy-migration.json"]);
runDocker(["exec","-u","0",appId,"chown","node:node","/tmp/legacy-migration.json"]);
const imported=String(runDocker(["exec",appId,"node","/app/scripts/migrate-legacy-digibail.js","/tmp/legacy-migration.json"],{maxBuffer:20*1024*1024}));
console.log(imported);
const verify=String(runDocker(["compose","exec","-T","db","sh","-lc",'export PGPASSWORD="$POSTGRES_PASSWORD"; psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Atc "SELECT COUNT(*) FROM legacy_digibail._import_manifest; SELECT COALESCE(SUM(imported_rows),0) FROM legacy_digibail._import_manifest; SELECT COUNT(*) FROM pg_constraint c JOIN pg_namespace n ON n.oid=c.connamespace WHERE n.nspname='legacy_digibail' AND c.contype='f'; SELECT COUNT(*) FROM users WHERE legacy_source='aspnetusers'; SELECT COUNT(*) FROM legacy_customers; SELECT COUNT(*) FROM sms_templates WHERE legacy_id IS NOT NULL;"']));
const numbers=verify.trim().split(/\r?\n/).map(Number);
if(numbers[0]!==59||numbers[1]!==203||numbers[2]!==85||numbers[3]!==2||numbers[4]!==1||numbers[5]!==4)throw new Error("Post-import verification mismatch: "+verify);
console.log("DIGIBAIL_PRODUCTION_IMPORT_VERIFIED=1");
console.log("TARGET_TABLES="+numbers[0]+" TARGET_ROWS="+numbers[1]+" TARGET_FKS="+numbers[2]);
console.log("CANONICAL_USERS="+numbers[3]+" CANONICAL_CUSTOMERS="+numbers[4]+" CANONICAL_SMS_TEMPLATES="+numbers[5]);
console.log("PASSWORDS_IMPORTED=0");
fs.rmSync(temp,{recursive:true,force:true});
