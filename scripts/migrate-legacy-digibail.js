import { readFile } from "node:fs/promises";
import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import { Pool } from "pg";

// DIGIBAIL_RELATIONAL_EXPORT_V3_WITH_SCHEMA

const input = JSON.parse(await readFile(process.argv[2] || "/tmp/legacy-migration.json", "utf8"));
const auditedSchema = JSON.parse(await readFile(new URL("./digibail-legacy-schema.json", import.meta.url), "utf8"));
input.columnDefinitions = input.columnDefinitions?.length ? input.columnDefinitions : auditedSchema.columnDefinitions;
input.primaryKeys = input.primaryKeys?.length ? input.primaryKeys : auditedSchema.primaryKeys;
input.foreignKeys = input.foreignKeys?.length ? input.foreignKeys : auditedSchema.foreignKeys;
const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 1, connectionTimeoutMillis: 10000 });
const TARGET_SCHEMA = "legacy_digibail";
const qid = s => '"' + String(s).replace(/"/g, '""') + '"';
const qtable = (s,t) => qid(TARGET_SCHEMA) + "." + qid(String(s) + "__" + String(t));
const sourceKey = (s,t) => String(s) + "." + String(t);
const safeName = s => { const raw=String(s).replace(/[^a-zA-Z0-9_]/g,"_"); return raw.length<=55?raw:raw.slice(0,44)+"_"+crypto.createHash("sha1").update(raw).digest("hex").slice(0,10); };
const types = {bigint:"BIGINT",int:"INTEGER",smallint:"SMALLINT",tinyint:"SMALLINT",bit:"BOOLEAN",uniqueidentifier:"UUID",decimal:"NUMERIC",numeric:"NUMERIC",money:"NUMERIC(19,4)",smallmoney:"NUMERIC(10,4)",float:"DOUBLE PRECISION",real:"REAL",date:"DATE",datetime:"TIMESTAMP",datetime2:"TIMESTAMP",smalldatetime:"TIMESTAMP",datetimeoffset:"TIMESTAMPTZ",time:"TIME",binary:"BYTEA",varbinary:"BYTEA",image:"BYTEA",timestamp:"BYTEA",rowversion:"BYTEA",xml:"XML",text:"TEXT",ntext:"TEXT",varchar:"TEXT",nvarchar:"TEXT",char:"TEXT",nchar:"TEXT"};
function pgType(c){const t=String(c.dataType||"").toLowerCase();if(t==="decimal"||t==="numeric")return "NUMERIC("+Math.max(1,Number(c.precision)||38)+","+Math.max(0,Number(c.scale)||0)+")";return types[t]||"TEXT";}
function convert(c,v){if(v===null||v===undefined)return null;const t=String(c.dataType||"").toLowerCase();if(["binary","varbinary","image","timestamp","rowversion"].includes(t))return Buffer.isBuffer(v)?v:Buffer.from(String(v),"base64");if(t==="bit")return v===true||v===1||String(v).toLowerCase()==="true"||String(v)==="1";if(["decimal","numeric","money","smallmoney","bigint","int","smallint","tinyint"].includes(t))return String(v);if(["float","real"].includes(t))return Number(v);if(t==="uniqueidentifier")return String(v).toLowerCase();if(t==="sql_variant")return String(v);return v;}
function roleCode(value){const raw=String(value||"").trim(),s=raw.toLowerCase().replace(/[^a-z0-9]/g,"");const known=({superadmin:"superadmin",admin:"admin",agent:"agent",marketer:"marketer",customermarketer:"customermarketer",member:"member",customer:"customer"})[s];return known||("legacy_"+crypto.createHash("sha1").update(raw).digest("hex").slice(0,16));}
function primaryRole(value){const list=String(value||"").split(",").map(roleCode);for(const r of ["superadmin","admin","agent","marketer","customermarketer","member","customer"])if(list.includes(r))return r;return "customer";}
function digits(v){return String(v||"").replace(/[۰-۹]/g,d=>"۰۱۲۳۴۵۶۷۸۹".indexOf(d)).replace(/[٠-٩]/g,d=>"٠١٢٣٤٥٦٧٨٩".indexOf(d)).replace(/\D/g,"");}
function normalizedPhone(v){let n=digits(v);if(n.startsWith("0098"))n="0"+n.slice(4);else if(n.startsWith("98")&&n.length===12)n="0"+n.slice(2);else if(n.length===10&&n.startsWith("9"))n="0"+n;return /^09\d{9}$/.test(n)?n:null;}
function normalizedNationalCode(v){const n=digits(v);if(!/^\d{10}$/.test(n)||/^(\d)\1{9}$/.test(n))return null;const sum=n.slice(0,9).split("").reduce((a,d,i)=>a+Number(d)*(10-i),0)%11;return (sum<2?Number(n[9])===sum:Number(n[9])===11-sum)?n:null;}
function dateOrNull(v){if(!v)return null;const d=new Date(v);return Number.isNaN(d.getTime())?null:d.toISOString();}
function sqlAction(v){const x=String(v||"").toUpperCase();if(x.includes("CASCADE"))return "CASCADE";if(x.includes("SET_NULL"))return "SET NULL";if(x.includes("SET_DEFAULT"))return "SET DEFAULT";return "NO ACTION";}
const columns=(input.columnDefinitions||[]).filter(c=>!((String(c.tableName).toLowerCase()==="aspnetusers"&&["passwordhash","securitystamp","concurrencystamp","otp"].includes(String(c.columnName).toLowerCase()))||(String(c.tableName).toLowerCase()==="customers"&&String(c.columnName).toLowerCase()==="initpassword")));
const tables=input.genericTables||[], primaryKeys=input.primaryKeys||[], foreignKeys=input.foreignKeys||[];
if((tables.length||columns.length||input.schemaDefinitions?.length)&&(!tables.length||!columns.length||!input.schemaDefinitions?.length))throw new Error("Incomplete relational export: table rows and full schema metadata are required.");
const expected=new Set(input.schemaDefinitions.map(x=>x.sourceTable));
for(const t of tables)if(!expected.has(t.sourceTable))throw new Error("Unrecognized source table: "+t.sourceTable);
const colGroups=new Map();for(const c of columns){const k=sourceKey(c.schemaName,c.tableName);if(!colGroups.has(k))colGroups.set(k,[]);colGroups.get(k).push(c);}
const pkGroups=new Map();for(const p of primaryKeys){const k=sourceKey(p.schemaName,p.tableName);if(!pkGroups.has(k))pkGroups.set(k,[]);pkGroups.get(k).push(p);}
for(const p of pkGroups.values())p.sort((a,b)=>Number(a.keyOrdinal)-Number(b.keyOrdinal));
const fkGroups=new Map();for(const f of foreignKeys){const k=sourceKey(f.schemaName,f.tableName)+"|"+String(f.constraintName);if(!fkGroups.has(k))fkGroups.set(k,{...f,parts:[]});fkGroups.get(k).parts.push(f);}
for(const f of fkGroups.values())f.parts.sort((a,b)=>Number(a.keyOrdinal)-Number(b.keyOrdinal));
// run legacy import with source-null preservation and no destructive table truncation.
let mirrorRows=0,mirrorTables=0,mirrorColumns=0,mirrorFks=0;
const manifest=[];
try{
 await pool.query("BEGIN");
 await pool.query("SELECT pg_advisory_xact_lock(hashtext('digibail_legacy_relational_import'))");
 await pool.query("CREATE SCHEMA IF NOT EXISTS "+qid(TARGET_SCHEMA));
 await pool.query("CREATE TABLE IF NOT EXISTS "+qid(TARGET_SCHEMA)+".\"_import_manifest\" (source_schema TEXT NOT NULL,source_table TEXT NOT NULL,source_rows BIGINT NOT NULL,imported_rows BIGINT NOT NULL,imported_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),PRIMARY KEY(source_schema,source_table))");
 await pool.query("CREATE TABLE IF NOT EXISTS "+qid(TARGET_SCHEMA)+".\"_column_manifest\" (source_schema TEXT NOT NULL,source_table TEXT NOT NULL,column_name TEXT NOT NULL,source_type TEXT NOT NULL,nullable BOOLEAN NOT NULL,identity_column BOOLEAN NOT NULL,PRIMARY KEY(source_schema,source_table,column_name))");
 for(const def of input.schemaDefinitions){
  const [s,t]=String(def.sourceTable).split(".");if(!s||!t)throw new Error("Invalid source table: "+def.sourceTable);
  const key=sourceKey(s,t),cols=colGroups.get(key)||[];if(!cols.length)throw new Error("Missing columns for "+key);
  const table=qtable(s,t),pk=(pkGroups.get(key)||[]).map(x=>x.columnName);
  // Credential columns are excluded at export time; do not ALTER a table before it exists.
  const defs=cols.map(c=>qid(c.columnName)+" "+pgType(c)+(Boolean(c.isIdentity)?" GENERATED BY DEFAULT AS IDENTITY":""));if(!pk.length)defs.push(qid("__legacy_row_number")+" BIGINT");
  await pool.query("CREATE TABLE IF NOT EXISTS "+table+" ("+defs.join(",")+")");
  for(const c of cols){
   await pool.query("ALTER TABLE "+table+" ADD COLUMN IF NOT EXISTS "+qid(c.columnName)+" "+pgType(c)+(Boolean(c.isIdentity)?" GENERATED BY DEFAULT AS IDENTITY":""));
   await pool.query("INSERT INTO "+qid(TARGET_SCHEMA)+".\"_column_manifest\"(source_schema,source_table,column_name,source_type,nullable,identity_column) VALUES($1,$2,$3,$4,$5,$6) ON CONFLICT(source_schema,source_table,column_name) DO UPDATE SET source_type=EXCLUDED.source_type,nullable=EXCLUDED.nullable,identity_column=EXCLUDED.identity_column",[s,t,c.columnName,c.dataType,Boolean(c.isNullable),Boolean(c.isIdentity)]);
  }
  if(!pk.length)await pool.query("ALTER TABLE "+table+" ADD COLUMN IF NOT EXISTS "+qid("__legacy_row_number")+" BIGINT");
  mirrorColumns+=cols.length;
 }
 for(const [key,parts] of pkGroups){
  const [s,t]=key.split("."),table=qtable(s,t),constraint=safeName("pk_"+s+"_"+t);
  const exists=await pool.query("SELECT 1 FROM pg_constraint WHERE conname=$1 AND connamespace=$2::regnamespace LIMIT 1",[constraint,TARGET_SCHEMA]);
  if(!exists.rowCount)await pool.query("ALTER TABLE "+table+" ADD CONSTRAINT "+qid(constraint)+" PRIMARY KEY ("+parts.map(p=>qid(p.columnName)).join(",")+")");
 }
 for(const def of input.schemaDefinitions){const [s,t]=String(def.sourceTable).split(".");const key=sourceKey(s,t);if((pkGroups.get(key)||[]).length)continue;const table=qtable(s,t),constraint=safeName("pk_"+s+"_"+t);const exists=await pool.query("SELECT 1 FROM pg_constraint WHERE conname=$1 AND connamespace=$2::regnamespace LIMIT 1",[constraint,TARGET_SCHEMA]);if(!exists.rowCount)await pool.query("ALTER TABLE "+table+" ADD CONSTRAINT "+qid(constraint)+" PRIMARY KEY ("+qid("__legacy_row_number")+")");}
 for(const [key,f] of fkGroups){
  const targetPk=(pkGroups.get(sourceKey(f.referencedSchemaName,f.referencedTableName))||[]).map(x=>x.columnName);
  const refCols=f.parts.map(x=>x.referencedColumnName);
  if(targetPk.length===refCols.length&&targetPk.every((x,i)=>x===refCols[i]))continue;
  const idx=safeName("uq_"+f.referencedSchemaName+"_"+f.referencedTableName+"_"+refCols.join("_"));
  const exists=await pool.query("SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname=$1 AND c.relname=$2",[TARGET_SCHEMA,idx]);
  if(!exists.rowCount)await pool.query("CREATE UNIQUE INDEX "+qid(idx)+" ON "+qtable(f.referencedSchemaName,f.referencedTableName)+" ("+refCols.map(qid).join(",")+")");
 }
 // Apply source nullability before inserting rows. PostgreSQL rejects ALTER TABLE while
 // FK trigger events from earlier INSERT statements are still pending in this transaction.
 for(const def of input.schemaDefinitions){
  const [s,t]=String(def.sourceTable).split("."),cols=colGroups.get(sourceKey(s,t))||[],pk=(pkGroups.get(sourceKey(s,t))||[]).map(x=>x.columnName),table=qtable(s,t);
  for(const col of cols){if(pk.includes(col.columnName))continue;await pool.query("ALTER TABLE "+table+" ALTER COLUMN "+qid(col.columnName)+" DROP NOT NULL");}
  if(!pk.length)await pool.query("ALTER TABLE "+table+" ALTER COLUMN "+qid("__legacy_row_number")+" SET NOT NULL");
 }
 for(const item of tables){
  const [s,t]=String(item.sourceTable).split("."),key=sourceKey(s,t),cols=colGroups.get(key)||[],pk=(pkGroups.get(key)||[]).map(x=>x.columnName),table=qtable(s,t),rows=Array.isArray(item.rows)?item.rows:[];
  if(!pk.length){const existing=await pool.query("SELECT COUNT(*)::bigint AS n FROM "+table);if(Number(existing.rows[0]?.n)>rows.length)throw new Error("Refusing to remove existing rows from non-key source table "+s+"."+t);}
  for(let offset=0;offset<rows.length;offset+=100){
   const batch=rows.slice(offset,offset+100);
   for(let j=0;j<batch.length;j++){
    const row=batch[j]||{},names=cols.map(c=>c.columnName),vals=cols.map(c=>convert(c,row[c.columnName]));
    if(!pk.length){names.push("__legacy_row_number");vals.push(offset+j+1);}
    const conflict=pk.length?(" ON CONFLICT ("+pk.map(qid).join(",")+") "+(names.some(n=>!pk.includes(n))?"DO UPDATE SET "+names.filter(n=>!pk.includes(n)).map(n=>qid(n)+"=EXCLUDED."+qid(n)).join(","):"DO NOTHING")):(" ON CONFLICT ("+qid("__legacy_row_number")+") DO UPDATE SET "+cols.map(c=>qid(c.columnName)+"=EXCLUDED."+qid(c.columnName)).join(","));
    await pool.query("INSERT INTO "+table+" ("+names.map(qid).join(",")+") VALUES ("+vals.map((_,i)=>"$"+(i+1)).join(",")+")"+conflict,vals);
   }
  }
  for(const c of cols)if(Boolean(c.isIdentity)){const rel=qid(TARGET_SCHEMA)+"."+qid(s+"__"+t);await pool.query("SELECT setval(pg_get_serial_sequence($1,$2),COALESCE(MAX("+qid(c.columnName)+"),1),MAX("+qid(c.columnName)+") IS NOT NULL) FROM "+table,[rel,c.columnName]);}
  manifest.push({schemaName:s,tableName:t,sourceRows:rows.length,importedRows:rows.length});mirrorRows+=rows.length;mirrorTables++;
 }
 for(const f of fkGroups.values()){
  const name=safeName("fk_"+f.schemaName+"_"+f.tableName+"_"+f.constraintName);
  const exists=await pool.query("SELECT 1 FROM pg_constraint WHERE conname=$1 AND connamespace=$2::regnamespace",[name,TARGET_SCHEMA]);if(exists.rowCount)continue;
  await pool.query("ALTER TABLE "+qtable(f.schemaName,f.tableName)+" ADD CONSTRAINT "+qid(name)+" FOREIGN KEY ("+f.parts.map(x=>qid(x.columnName)).join(",")+") REFERENCES "+qtable(f.referencedSchemaName,f.referencedTableName)+" ("+f.parts.map(x=>qid(x.referencedColumnName)).join(",")+") ON DELETE "+sqlAction(f.deleteAction)+" ON UPDATE "+sqlAction(f.updateAction)+" DEFERRABLE INITIALLY DEFERRED");
  mirrorFks++;
 }
 // The new application identity model retains every source role. Legacy password hashes are never imported.
 await pool.query("ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check");
 await pool.query("ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('customer','admin','superadmin','agent','marketer','customermarketer','member'))");
 await pool.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS password_reset_required BOOLEAN NOT NULL DEFAULT FALSE");
 await pool.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS legacy_username TEXT");
 await pool.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS legacy_customer_id UUID");
 await pool.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS legacy_agent_id BIGINT");
 await pool.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS legacy_customer_marketer_id BIGINT");
 await pool.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS legacy_agent_metadata_id UUID");
 await pool.query("CREATE TABLE IF NOT EXISTS access_roles(code VARCHAR(40) PRIMARY KEY,display_name VARCHAR(120) NOT NULL,legacy_source TEXT,legacy_id TEXT,UNIQUE(legacy_source,legacy_id))");
 await pool.query("CREATE TABLE IF NOT EXISTS user_role_assignments(user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,role_code VARCHAR(40) NOT NULL REFERENCES access_roles(code) ON DELETE RESTRICT,legacy_source TEXT NOT NULL,legacy_user_id TEXT NOT NULL,legacy_role_id TEXT NOT NULL,PRIMARY KEY(user_id,role_code),UNIQUE(legacy_source,legacy_user_id,legacy_role_id))");
 const roleRows=input.identityRoles||[];
 for(const r of roleRows){const name=String(r.Name||r.name||"").trim();if(!name)continue;await pool.query("INSERT INTO access_roles(code,display_name,legacy_source,legacy_id) VALUES($1,$2,'AspNetRoles',$3) ON CONFLICT(code) DO UPDATE SET display_name=EXCLUDED.display_name,legacy_source=EXCLUDED.legacy_source,legacy_id=EXCLUDED.legacy_id",[roleCode(name),name,String(r.Id??r.id??"")]);}
 let usersImported=0,customersImported=0,smsImported=0;
 const inaccessibleLegacyPasswordHash=(input.users||[]).length?await bcrypt.hash(crypto.randomBytes(48).toString("hex"),12):null;
 for(const u of input.users||[]){
  if(!u.legacyId)continue;
  const legacyId=String(u.legacyId),sourceUsername=String(u.username||u.email||("legacy_"+legacyId)).trim().slice(0,80),fullName=String(u.fullName||"").trim().replace(/\s+/g," ").slice(0,160)||sourceUsername;
  const legacyCustomerId=u.customerId?String(u.customerId).toLowerCase():null,legacyAgentId=u.agentId?String(u.agentId):null,legacyCustomerMarketerId=u.customerMarketerId?String(u.customerMarketerId):null,legacyAgentMetaDataId=u.agentMetaDataId?String(u.agentMetaDataId).toLowerCase():null;
  const randomHash=inaccessibleLegacyPasswordHash;
  let phone=normalizedPhone(u.phone),national=normalizedNationalCode(u.nationalCode);
  const existing=await pool.query("SELECT id FROM users WHERE legacy_source='aspnetusers' AND legacy_id=$1 LIMIT 1",[legacyId]);
  if(existing.rowCount){
   const uid=existing.rows[0].id;
   let email=u.email?String(u.email).trim().slice(0,254):null;
   if(email){const clash=await pool.query("SELECT 1 FROM users WHERE lower(email)=lower($1) AND id<>$2 LIMIT 1",[email,uid]);if(clash.rowCount)email=null;}
   if(phone){const clash=await pool.query("SELECT 1 FROM users WHERE phone=$1 AND id<>$2 LIMIT 1",[phone,uid]);if(clash.rowCount)phone=null;}
   if(national){const clash=await pool.query("SELECT 1 FROM users WHERE national_code=$1 AND id<>$2 LIMIT 1",[national,uid]);if(clash.rowCount)national=null;}
   await pool.query("UPDATE users SET phone=COALESCE($1,phone),full_name=$2,legacy_username=$3,national_code=COALESCE($4,national_code),email=COALESCE($5,email),password_hash=$6,role=$7,is_active=$8,password_reset_required=TRUE,legacy_customer_id=COALESCE($10,legacy_customer_id),legacy_agent_id=COALESCE($11,legacy_agent_id),legacy_customer_marketer_id=COALESCE($12,legacy_customer_marketer_id),legacy_agent_metadata_id=COALESCE($13,legacy_agent_metadata_id),updated_at=NOW() WHERE id=$9",[phone,fullName,sourceUsername,national,email,randomHash,primaryRole(u.roles),u.isActive!==false&&u.isActive!==0,uid,legacyCustomerId,legacyAgentId,legacyCustomerMarketerId,legacyAgentMetaDataId]);
  }else{
   const usernameClash=await pool.query("SELECT 1 FROM users WHERE lower(username)=lower($1) LIMIT 1",[sourceUsername]);
   const finalUsername=usernameClash.rowCount?("legacy_"+legacyId).slice(0,80):sourceUsername;
   if(phone){const clash=await pool.query("SELECT 1 FROM users WHERE phone=$1 LIMIT 1",[phone]);if(clash.rowCount)phone=null;}
   if(national){const clash=await pool.query("SELECT 1 FROM users WHERE national_code=$1 LIMIT 1",[national]);if(clash.rowCount)national=null;}
   let email=u.email?String(u.email).trim().slice(0,254):null;
   if(email){const clash=await pool.query("SELECT 1 FROM users WHERE lower(email)=lower($1) LIMIT 1",[email]);if(clash.rowCount)email=null;}
   const r=await pool.query("INSERT INTO users(username,phone,full_name,national_code,email,password_hash,role,is_active,created_at,legacy_source,legacy_id,password_reset_required,legacy_username,legacy_customer_id,legacy_agent_id,legacy_customer_marketer_id,legacy_agent_metadata_id) VALUES($1,$2,$3,$4,$5,$6,$7,$8,COALESCE($9::timestamptz,NOW()),'aspnetusers',$10,TRUE,$11,$12,$13,$14,$15) RETURNING id",[finalUsername,phone,fullName,national,email,randomHash,primaryRole(u.roles),u.isActive!==false&&u.isActive!==0,dateOrNull(u.createdAt),legacyId,sourceUsername,legacyCustomerId,legacyAgentId,legacyCustomerMarketerId,legacyAgentMetaDataId]);
   if(!r.rowCount)throw new Error("Could not create legacy user "+legacyId);
  }
  usersImported++;
 }
 for(const p of input.identityUserRoles||[]){
  const userId=String(p.UserId??p.userId??""),roleId=String(p.RoleId??p.roleId??"");if(!userId||!roleId)continue;
  const user=await pool.query("SELECT id FROM users WHERE legacy_source='aspnetusers' AND legacy_id=$1",[userId]),role=roleRows.find(x=>String(x.Id??x.id)===roleId);if(!user.rowCount||!role)continue;
  const code=roleCode(role.Name??role.name);
  await pool.query("INSERT INTO user_role_assignments(user_id,role_code,legacy_source,legacy_user_id,legacy_role_id) VALUES($1,$2,'aspnetuserroles',$3,$4) ON CONFLICT DO NOTHING",[user.rows[0].id,code,userId,roleId]);
 }
 for(const x of input.customers||[]){
  if(!x.legacyId)continue;
  const r=await pool.query("INSERT INTO legacy_customers(legacy_id,name,mobile,email,customer_code,registered_at,expires_at,is_permanent,purchased,affiliate_code,parked_domain) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) ON CONFLICT(legacy_id) DO UPDATE SET name=EXCLUDED.name,mobile=EXCLUDED.mobile,email=EXCLUDED.email,customer_code=EXCLUDED.customer_code,registered_at=EXCLUDED.registered_at,expires_at=EXCLUDED.expires_at,is_permanent=EXCLUDED.is_permanent,purchased=EXCLUDED.purchased,affiliate_code=EXCLUDED.affiliate_code,parked_domain=EXCLUDED.parked_domain",[x.legacyId,x.name||null,x.mobile||null,x.email||null,Number.isInteger(Number(x.code))?Number(x.code):null,dateOrNull(x.createdAt),dateOrNull(x.expiresAt),x.permanent??null,x.purchased??null,x.affiliateCode||null,x.parkedDomain||null]);customersImported+=r.rowCount;
 }
 for(const x of input.smsPatterns||[]){
  if(!x.legacyId||!String(x.title||"").trim()||typeof x.pattern!=="string")continue;
  const r=await pool.query("INSERT INTO sms_templates(legacy_id,title,body,is_system,status,category,provider_panel,is_pattern_base,pattern_base_code,reject_reason,legacy_customer_id) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) ON CONFLICT(legacy_id) DO UPDATE SET title=EXCLUDED.title,body=EXCLUDED.body,is_system=EXCLUDED.is_system,status=EXCLUDED.status,category=EXCLUDED.category,provider_panel=EXCLUDED.provider_panel,is_pattern_base=EXCLUDED.is_pattern_base,pattern_base_code=EXCLUDED.pattern_base_code,reject_reason=EXCLUDED.reject_reason,legacy_customer_id=EXCLUDED.legacy_customer_id,updated_at=NOW()",[x.legacyId,String(x.title).slice(0,200),x.pattern,Boolean(x.isSystem),Number(x.status)||0,Number(x.category)||0,Number(x.providerPanel)||0,Boolean(x.isPatternBase),x.patternBaseCode||null,x.rejectReason||null,x.legacyCustomerId||null]);smsImported+=r.rowCount;
 }
 await pool.query("UPDATE legacy_source_data SET payload=payload-'PasswordHash'-'passwordHash' WHERE source_table='dbo.AspNetUsers'");
 for(const m of manifest)await pool.query("INSERT INTO "+qid(TARGET_SCHEMA)+".\"_import_manifest\"(source_schema,source_table,source_rows,imported_rows) VALUES($1,$2,$3,$4) ON CONFLICT(source_schema,source_table) DO UPDATE SET source_rows=EXCLUDED.source_rows,imported_rows=EXCLUDED.imported_rows,imported_at=NOW()",[m.schemaName,m.tableName,m.sourceRows,m.importedRows]);
 for(const m of manifest){const r=await pool.query("SELECT COUNT(*)::bigint AS n FROM "+qtable(m.schemaName,m.tableName));if(Number(r.rows[0].n)!==m.sourceRows)throw new Error("Row count mismatch "+m.schemaName+"."+m.tableName);}
 const fkCount=await pool.query("SELECT COUNT(*)::int AS n FROM pg_constraint c JOIN pg_namespace n ON n.oid=c.connamespace WHERE n.nspname=$1 AND c.contype='f'",[TARGET_SCHEMA]);
 if(Number(fkCount.rows[0].n)!==fkGroups.size)throw new Error("Foreign key count mismatch: expected "+fkGroups.size+" got "+fkCount.rows[0].n);
 await pool.query("COMMIT");
 console.log("DIGIBAIL_RELATIONAL_IMPORT="+JSON.stringify({status:"ok",schema:TARGET_SCHEMA,sourceTables:mirrorTables,sourceColumns:mirrorColumns,sourceForeignKeyConstraints:fkGroups.size,sourceForeignKeyColumns:foreignKeys.length,importedRows:mirrorRows,usersImported,customersImported,smsTemplatesImported:smsImported,passwordsImported:false,tableCounts:manifest}));
}catch(error){await pool.query("ROLLBACK").catch(()=>{});console.error("DIGIBAIL_RELATIONAL_IMPORT_FAILED="+String(error.code||"unknown")+":"+String(error.message||"").slice(0,500));process.exitCode=1;}finally{await pool.end();}
