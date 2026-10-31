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
    ["mariadb.AspNetUsers","AspNetUsers"],
    ["mariadb.bluvamdb__AspNetUsers","bluvamdb__AspNetUsers"],
    ["mariadb.OnlineMoneyTransfer__AspNetUsers","OnlineMoneyTransfer__AspNetUsers"]
  ];
  for(const [source,table] of sources){
    const [exists]=await db.query(
      "SELECT 1 FROM information_schema.tables WHERE table_schema=DATABASE() AND table_name=?",
      [table]
    );
    if(!exists.length)throw new Error("Legacy account source table is missing: "+table);
    const sourceCount=await count("SELECT COUNT(*) AS n FROM \`"+table+"\`");
    const mapped=await count("SELECT COUNT(*) AS n FROM DigibailAppUserIdentity WHERE LegacySource=?",[source]);
    if(sourceCount!==mapped)throw new Error("Identity mapping mismatch for "+table+": source="+sourceCount+" mapped="+mapped);
    console.log("IDENTITY_MAPPING_VERIFIED="+table+" count="+mapped);
  }
  const [manifestRows]=await db.query(
    "SELECT source_table,source_rows,imported_rows FROM digibail_legacy_manifest WHERE source_schema='legacy_digibail' ORDER BY source_table"
  );
  for(const row of manifestRows){
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
