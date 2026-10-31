import { createPool } from "mysql2/promise";

const db=createPool({
  ...(process.env.MARIADB_HOST
    ?{host:process.env.MARIADB_HOST,port:Number(process.env.MARIADB_PORT||3306)}
    :{socketPath:process.env.MARIADB_SOCKET||"/tmp/mysql.sock"}),
  user:process.env.MARIADB_USER||"",
  password:process.env.MARIADB_PASSWORD||"",
  database:process.env.MARIADB_DATABASE||"digibail_vamcitydigibilepay",
  waitForConnections:true,
  connectionLimit:2,
  connectTimeout:10000,
  charset:"utf8mb4",
  timezone:"Z",
  supportBigNumbers:true,
  bigNumberStrings:true
});

function canonicalRole(name) {
  const key=String(name||"unknown").toLowerCase().replace(/[ _-]/g,"");
  const known={
    superadmin:"superadmin",admin:"admin",administrator:"admin",
    agent:"agent",representative:"agent",marketer:"marketer",
    customermarketer:"customermarketer",member:"member",
    customer:"customer",user:"customer"
  };
  return known[key]||("legacy_"+key.slice(0,32));
}
async function count(sql,params=[]){
  const [rows]=await db.query(sql,params);
  return Number(rows[0]?.n||0);
}
async function main(){
  if(!process.env.MARIADB_USER||!process.env.MARIADB_PASSWORD)throw new Error("MariaDB credentials are missing.");
  const [marker]=await db.query(
    "SELECT status,details,completed_at FROM digibail_migration_control WHERE migration_key='single-mariadb-cutover' LIMIT 1"
  );
  if(!marker.length||marker[0].status!=="verified")throw new Error("The verified single-MariaDB cutover marker is missing.");
  const manifest=await count("SELECT COUNT(*) AS n FROM digibail_legacy_manifest WHERE source_schema='legacy_digibail'");
  if(manifest!==59)throw new Error("Expected 59 legacy table manifests; found "+manifest);
  const sources=[
    {source:"mariadb.AspNetUsers",table:"AspNetUsers",idKind:"numeric"},
    {source:"mariadb.bluvamdb__AspNetUsers",table:"bluvamdb__AspNetUsers",idKind:"numeric"},
    {source:"mariadb.OnlineMoneyTransfer__AspNetUsers",table:"OnlineMoneyTransfer__AspNetUsers",idKind:"guid"}
  ];
  for(const item of sources){
    const {source,table,idKind}=item;
    const [exists]=await db.query(
      "SELECT 1 FROM information_schema.tables WHERE table_schema=DATABASE() AND table_name=?",
      [table]
    );
    if(!exists.length)throw new Error("Legacy account source table is missing: "+table);
    const sourceCount=await count("SELECT COUNT(*) AS n FROM \`"+table+"\`");
    const mapped=await count("SELECT COUNT(*) AS n FROM DigibailAppUserIdentity WHERE LegacySource=?",[source]);
    if(sourceCount!==mapped)throw new Error("Identity mapping count mismatch for "+table+": source="+sourceCount+" mapped="+mapped);
    const idJoin=idKind==="guid"
      ?"map.MariaDbUserKey=CAST(legacy.Id AS CHAR) AND map.MariaDbUserId IS NULL"
      :"map.MariaDbUserId=CAST(legacy.Id AS UNSIGNED)";
    const broken=await count(
      "SELECT COUNT(*) AS n FROM DigibailAppUserIdentity map "+
      "LEFT JOIN users app ON app.id=map.AppUserId "+
      "LEFT JOIN \`"+table+"\` legacy ON "+idJoin+" "+
      "WHERE map.LegacySource=? AND (app.id IS NULL OR legacy.Id IS NULL)",
      [source]
    );
    if(broken!==0)throw new Error("Identity map contains missing app/source IDs for "+table+": "+broken);
    const roleLinksTable=table.replace(/AspNetUsers$/,"AspNetUserRoles");
    const rolesTable=table.replace(/AspNetUsers$/,"AspNetRoles");
    const sourceRoleLinks=await count("SELECT COUNT(*) AS n FROM \`"+roleLinksTable+"\`");
    const targetRoleLinks=await count("SELECT COUNT(*) AS n FROM user_role_assignments WHERE legacy_source=?",[source+".AspNetUserRoles"]);
    if(sourceRoleLinks!==targetRoleLinks)throw new Error("Role-link mapping mismatch for "+table+": source="+sourceRoleLinks+" target="+targetRoleLinks);
    const [sourceRoles]=await db.query("SELECT Name FROM \`"+rolesTable+"\`");
    const expectedRoleCodes=[...new Set(sourceRoles.map(row=>canonicalRole(row.Name)))];
    for(const code of expectedRoleCodes) {
      const exists=await count("SELECT COUNT(*) AS n FROM access_roles WHERE code=?",[code]);
      if(exists!==1)throw new Error("Canonical role code is missing for "+table+": "+code);
    }
    console.log("IDENTITY_MAPPING_VERIFIED="+table+" users="+mapped+" role_links="+targetRoleLinks+" distinct_roles="+expectedRoleCodes.length);
  }
  const [manifestRows]=await db.query(
    "SELECT source_table,source_rows,imported_rows FROM digibail_legacy_manifest WHERE source_schema='legacy_digibail' ORDER BY source_table"
  );
  for(const row of manifestRows){
    if(Number(row.source_rows)!==Number(row.imported_rows)) {
      throw new Error("Original import manifest is incomplete for "+row.source_table+": source="+row.source_rows+" imported="+row.imported_rows);
    }
    const stored=await count(
      "SELECT COUNT(*) AS n FROM digibail_legacy_relational_rows WHERE source_schema='legacy_digibail' AND source_table=?",
      [row.source_table]
    );
    if(stored!==Number(row.imported_rows))throw new Error("Relational data mismatch for "+row.source_table+": manifest="+row.imported_rows+" stored="+stored);
  }
  const details=typeof marker[0].details==="string"?JSON.parse(marker[0].details):marker[0].details;
  console.log("DIGIBAIL_SINGLE_DATABASE_READY=PASS");
  console.log("LEGACY_TABLE_MANIFESTS="+manifest);
  console.log("IDENTITY_SOURCE_TABLES="+sources.length);
  console.log("CUTOVER_COMPLETED_AT="+String(marker[0].completed_at||""));
  console.log("CUTOVER_DETAILS="+JSON.stringify(details||{}));
}
main().catch(error=>{
  console.error("DIGIBAIL_SINGLE_DATABASE_READY=FAIL "+String(error.message||error).slice(0,500));
  process.exitCode=1;
}).finally(()=>db.end().catch(()=>{}));
