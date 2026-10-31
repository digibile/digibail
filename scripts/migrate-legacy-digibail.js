import { readFile } from "node:fs/promises";
import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import { Pool } from "pg";

const input = JSON.parse(await readFile(process.argv[2] || "/tmp/legacy-migration.json", "utf8"));
const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 3, connectionTimeoutMillis: 10000 });
const TARGET_SCHEMA = "legacy_digibail";
const qid = s => '"' + String(s).replace(/"/g, '""') + '"';
const qtable = (s,t) => qid(TARGET_SCHEMA) + "." + qid(String(s) + "__" + String(t));
const sourceKey = (s,t) => String(s) + "." + String(t);
const safeName = s => String(s).replace(/[^a-zA-Z0-9_]/g, "_").slice(0,55);
const types = {bigint:"BIGINT",int:"INTEGER",smallint:"SMALLINT",tinyint:"SMALLINT",bit:"BOOLEAN",uniqueidentifier:"UUID",decimal:"NUMERIC",numeric:"NUMERIC",money:"NUMERIC(19,4)",smallmoney:"NUMERIC(10,4)",float:"DOUBLE PRECISION",real:"REAL",date:"DATE",datetime:"TIMESTAMP",datetime2:"TIMESTAMP",smalldatetime:"TIMESTAMP",datetimeoffset:"TIMESTAMPTZ",time:"TIME",binary:"BYTEA",varbinary:"BYTEA",image:"BYTEA",timestamp:"BYTEA",rowversion:"BYTEA",xml:"XML",text:"TEXT",ntext:"TEXT",varchar:"TEXT",nvarchar:"TEXT",char:"TEXT",nchar:"TEXT"};
function pgType(c){const t=String(c.dataType||"").toLowerCase();if(t==="decimal"||t==="numeric")return "NUMERIC("+Math.max(1,Number(c.precision)||38)+","+Math.max(0,Number(c.scale)||0)+")";return types[t]||"TEXT";}
function convert(c,v){if(v===null||v===undefined)return null;const t=String(c.dataType||"").toLowerCase();if(["binary","varbinary","image","timestamp","rowversion"].includes(t))return Buffer.isBuffer(v)?v:Buffer.from(String(v),"base64");if(t==="bit")return v===true||v===1||String(v).toLowerCase()==="true"||String(v)==="1";if(["decimal","numeric","money","smallmoney","bigint","int","smallint","tinyint"].includes(t))return String(v);if(["float","real"].includes(t))return Number(v);if(t==="uniqueidentifier")return String(v).toLowerCase();if(t==="sql_variant")return String(v);return v;}
function roleCode(value){const s=String(value||"").trim().toLowerCase().replace(/[^a-z]/g,"");return ({superadmin:"superadmin",admin:"admin",agent:"agent",marketer:"marketer",customermarketer:"customermarketer",member:"member",customer:"customer"})[s]||"customer";}
function primaryRole(value){const list=String(value||"").split(",").map(roleCode);for(const r of ["superadmin","admin","agent","marketer","customermarketer","member","customer"])if(list.includes(r))return r;return "customer";}
function dateOrNull(v){if(!v)return null;const d=new Date(v);return Number.isNaN(d.getTime())?null:d.toISOString();}
function sqlAction(v){const x=String(v||"").toUpperCase();if(x.includes("CASCADE"))return "CASCADE";if(x.includes("SET_NULL"))return "SET NULL";if(x.includes("SET_DEFAULT"))return "SET DEFAULT";return "NO ACTION";}
const columns=(input.columnDefinitions||[]).filter(c=>!(String(c.schemaName).toLowerCase()==="dbo"&&String(c.tableName).toLowerCase()==="aspnetusers"&&String(c.columnName).toLowerCase()==="passwordhash"));
const tables=input.genericTables||[], primaryKeys=input.primaryKeys||[], foreignKeys=input.foreignKeys||[];
if(!tables.length||!columns.length||!input.schemaDefinitions?.length)throw new Error("Incomplete relational export: table rows and full schema metadata are required.");
const expected=new Set(input.schemaDefinitions.map(x=>x.sourceTable));
for(const t of tables)if(!expected.has(t.sourceTable))throw new Error("Unrecognized source table: "+t.sourceTable);
const colGroups=new Map();for(const c of columns){const k=sourceKey(c.schemaName,c.tableName);if(!colGroups.has(k))colGroups.set(k,[]);colGroups.get(k).push(c);}
const pkGroups=new Map();for(const p of primaryKeys){const k=sourceKey(p.schemaName,p.tableName);if(!pkGroups.has(k))pkGroups.set(k,[]);pkGroups.get(k).push(p);}
for(const p of pkGroups.values())p.sort((a,b)=>Number(a.keyOrdinal)-Number(b.keyOrdinal));
const fkGroups=new Map();for(const f of foreignKeys){const k=sourceKey(f.schemaName,f.tableName)+"|"+String(f.constraintName);if(!fkGroups.has(k))fkGroups.set(k,{...f,parts:[]});fkGroups.get(k).parts.push(f);}
for(const f of fkGroups.values())f.parts.sort((a,b)=>Number(a.keyOrdinal)-Number(b.keyOrdinal));
let mirrorRows=0,mirrorTables=0,mirrorColumns=0,mirrorFks=0;
const manifest=[];
try{
 await pool.query("BEGIN");
 await pool.query("CREATE SCHEMA IF NOT EXISTS "+qid(TARGET_SCHEMA));
 await pool.query("CREATE TABLE IF NOT EXISTS "+qid(TARGET_SCHEMA)+".\"_import_manifest\" (source_schema TEXT NOT NULL,source_table TEXT NOT NULL,source_rows BIGINT NOT NULL,imported_rows BIGINT NOT NULL,imported_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),PRIMARY KEY(source_schema,source_table))");
 await pool.query("CREATE TABLE IF NOT EXISTS "+qid(TARGET_SCHEMA)+".\"_column_manifest\" (source_schema TEXT NOT NULL,source_table TEXT NOT NULL,column_name TEXT NOT NULL,source_type TEXT NOT NULL,nullable BOOLEAN NOT NULL,identity_column BOOLEAN NOT NULL,PRIMARY KEY(source_schema,source_table,column_name))");
 for(const def of input.schemaDefinitions){
  const [s,t]=String(def.sourceTable).split(".");if(!s||!t)throw new Error("Invalid source table: "+def.sourceTable);
  const key=sourceKey(s,t),cols=colGroups.get(key)||[];if(!cols.length)throw new Error("Missing columns for "+key);
  const table=qtable(s,t),pk=(pkGroups.get(key)||[]).map(x=>x.columnName);
  const defs=cols.map(c=>qid(c.columnName)+" "+pgType(c));if(!pk.length)defs.push(qid("__legacy_row_number")+" BIGINT");
  await pool.query("CREATE TABLE IF NOT EXISTS "+table+" ("+defs.join(",")+")");
  for(const c of cols){
   await pool.query("ALTER TABLE "+table+" ADD COLUMN IF NOT EXISTS "+qid(c.columnName)+" "+pgType(c));
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
 for(const [key,f] of fkGroups){
  const targetPk=(pkGroups.get(sourceKey(f.referencedSchemaName,f.referencedTableName))||[]).map(x=>x.columnName);
  const refCols=f.parts.map(x=>x.referencedColumnName);
  if(targetPk.length===refCols.length&&targetPk.every((x,i)=>x===refCols[i]))continue;
  const idx=safeName("uq_"+f.referencedSchemaName+"_"+f.referencedTableName+"_"+refCols.join("_"));
  const exists=await pool.query("SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname=$1 AND c.relname=$2",[TARGET_SCHEMA,idx]);
  if(!exists.rowCount)await pool.query("CREATE UNIQUE INDEX "+qid(idx)+" ON "+qtable(f.referencedSchemaName,f.referencedTableName)+" ("+refCols.map(qid).join(",")+")");
 }
 for(const item of tables){
  const [s,t]=String(item.sourceTable).split("."),key=sourceKey(s,t),cols=colGroups.get(key)||[],pk=(pkGroups.get(key)||[]).map(x=>x.columnName),table=qtable(s,t),rows=Array.isArray(item.rows)?item.rows:[];
  if(!pk.length)await pool.query("TRUNCATE TABLE "+table);
  for(let offset=0;offset<rows.length;offset+=100){
   const batch=rows.slice(offset,offset+100);
   for(let j=0;j<batch.length;j++){
    const row=batch[j]||{},names=cols.map(c=>c.columnName),vals=cols.map(c=>convert(c,row[c.columnName]));
    if(!pk.length){names.push("__legacy_row_number");vals.push(offset+j+1);}
    const conflict=pk.length?(" ON CONFLICT ("+pk.map(qid).join(",")+") "+(names.some(n=>!pk.includes(n))?"DO UPDATE SET "+names.filter(n=>!pk.includes(n)).map(n=>qid(n)+"=EXCLUDED."+qid(n)).join(","):"DO NOTHING")):"";
    await pool.query("INSERT INTO "+table+" ("+names.map(qid).join(",")+") VALUES ("+vals.map((_,i)=>"$"+(i+1)).join(",")+")"+conflict,vals);
   }
  }
  for(const c of cols)if(!Boolean(c.isNullable))await pool.query("ALTER TABLE "+table+" ALTER COLUMN "+qid(c.columnName)+" SET NOT NULL");
  if(!pk.length)await pool.query("ALTER TABLE "+table+" ALTER COLUMN "+qid("__legacy_row_number")+" SET NOT NULL");
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
 await pool.query("CREATE TABLE IF NOT EXISTS access_roles(code VARCHAR(40) PRIMARY KEY,display_name VARCHAR(120) NOT NULL,legacy_source TEXT,legacy_id TEXT,UNIQUE(legacy_source,legacy_id))");
 await pool.query("CREATE TABLE IF NOT EXISTS user_role_assignments(user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,role_code VARCHAR(40) NOT NULL REFERENCES access_roles(code) ON DELETE RESTRICT,legacy_source TEXT NOT NULL,legacy_user_id TEXT NOT NULL,legacy_role_id TEXT NOT NULL,PRIMARY KEY(user_id,role_code),UNIQUE(legacy_source,legacy_user_id,legacy_role_id))");
 const roleRows=input.identityRoles||[];
 for(const r of roleRows){const name=String(r.Name||r.name||"").trim();if(!name)continue;await pool.query("INSERT INTO access_roles(code,display_name,legacy_source,legacy_id) VALUES($1,$2,'AspNetRoles',$3) ON CONFLICT(code) DO UPDATE SET display_name=EXCLUDED.display_name,legacy_source=EXCLUDED.legacy_source,legacy_id=EXCLUDED.legacy_id",[roleCode(name),name,String(r.Id??r.id??"")]);}
 let usersImported=0,customersImported=0,smsImported=0;
 for(const u of input.users||[]){
  if(!u.legacyId)continue;
  const username=String(u.username||u.email||("legacy_"+u.legacyId)).trim().slice(0,80),fullName=String(u.fullName||"").trim().replace(/\s+/g," ").slice(0,160)||username;
  const randomHash=await bcrypt.hash(crypto.randomBytes(48).toString("hex"),12);
  const r=await pool.query("INSERT INTO users(username,phone,full_name,email,password_hash,role,is_active,created_at,legacy_source,legacy_id,password_reset_required) VALUES($1,$2,$3,$4,$5,$6,$7,COALESCE($8::timestamptz,NOW()),'aspnetusers',$9,TRUE) ON CONFLICT(legacy_source,legacy_id) WHERE legacy_source IS NOT NULL AND legacy_id IS NOT NULL DO UPDATE SET full_name=EXCLUDED.full_name,email=EXCLUDED.email,role=EXCLUDED.role,is_active=EXCLUDED.is_active,password_reset_required=TRUE,updated_at=NOW() RETURNING id",[username,u.phone||null,fullName,u.email||null,randomHash,primaryRole(u.roles),u.isActive!==false&&u.isActive!==0,dateOrNull(u.createdAt),String(u.legacyId)]);
  usersImported+=r.rowCount;
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
 for(const m of manifest)await pool.query("INSERT INTO "+qid(TARGET_SCHEMA)+".\"_import_manifest\"(source_schema,source_table,source_rows,imported_rows) VALUES($1,$2,$3,$4) ON CONFLICT(source_schema,source_table) DO UPDATE SET source_rows=EXCLUDED.source_rows,imported_rows=EXCLUDED.imported_rows,imported_at=NOW()",[m.schemaName,m.tableName,m.sourceRows,m.importedRows]);
 for(const m of manifest){const r=await pool.query("SELECT COUNT(*)::bigint AS n FROM "+qtable(m.schemaName,m.tableName));if(Number(r.rows[0].n)!==m.sourceRows)throw new Error("Row count mismatch "+m.schemaName+"."+m.tableName);}
 const fkCount=await pool.query("SELECT COUNT(*)::int AS n FROM pg_constraint c JOIN pg_namespace n ON n.oid=c.connamespace WHERE n.nspname=$1 AND c.contype='f'",[TARGET_SCHEMA]);
 if(Number(fkCount.rows[0].n)!==fkGroups.size)throw new Error("Foreign key count mismatch: expected "+fkGroups.size+" got "+fkCount.rows[0].n);
 await pool.query("COMMIT");
 console.log("DIGIBAIL_RELATIONAL_IMPORT="+JSON.stringify({status:"ok",schema:TARGET_SCHEMA,sourceTables:mirrorTables,sourceColumns:mirrorColumns,sourceForeignKeyConstraints:fkGroups.size,sourceForeignKeyColumns:foreignKeys.length,importedRows:mirrorRows,usersImported,customersImported,smsTemplatesImported:smsImported,passwordsImported:false,tableCounts:manifest}));
}catch(error){await pool.query("ROLLBACK").catch(()=>{});console.error("DIGIBAIL_RELATIONAL_IMPORT_FAILED="+String(error.code||"unknown")+":"+String(error.message||"").slice(0,500));process.exitCode=1;}finally{await pool.end();}
