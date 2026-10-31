import { Pool } from "pg";
import { createPool } from "mysql2/promise";
import { syncUserToMariaDB } from "../backend/mariadb-user-sync.js";

const pg=new Pool({connectionString:process.env.DATABASE_URL,max:2,connectionTimeoutMillis:10000});
const maria=createPool({
  socketPath:process.env.MARIADB_SOCKET||"/tmp/mysql.sock",
  user:process.env.MARIADB_USER,
  password:process.env.MARIADB_PASSWORD,
  database:process.env.MARIADB_DATABASE||"digibail_vamcitydigibilepay",
  waitForConnections:true,connectionLimit:2,queueLimit:10,charset:"utf8mb4",connectTimeout:10000
});
let mirrored=0,updated=0;
try{
  if(!process.env.MARIADB_USER||!process.env.MARIADB_PASSWORD)throw new Error("MariaDB credentials are not configured");
  const q=await pg.query("SELECT u.id,u.username,u.phone,u.full_name,u.national_code,u.email,u.role,u.is_active,COALESCE((SELECT role_code FROM user_role_overrides o WHERE o.user_id=u.id),u.role) AS effective_role,to_char(u.created_at AT TIME ZONE 'Asia/Tehran','YYYY-MM-DD HH24:MI:SS.US') AS created_at_tehran FROM users u WHERE u.legacy_source IS NULL ORDER BY u.id");
  for(const user of q.rows){
    const result=await syncUserToMariaDB(maria,user);
    if(result.status==="mirrored")mirrored++;else updated++;
  }
  const [counts]=await maria.query("SELECT COUNT(*) AS total FROM AspNetUsers");
  const [maps]=await maria.query("SELECT COUNT(*) AS total FROM DigibailUserIdentity");
  console.log("MARIADB_POSTGRES_IDENTITY_SYNC=PASS scanned="+q.rowCount+" mirrored="+mirrored+" updated="+updated+" mapped="+Number(maps[0]?.total||0)+" aspnetusers="+Number(counts[0]?.total||0)+" passwords_copied=0");
}catch(error){
  console.error("MARIADB_POSTGRES_IDENTITY_SYNC_FAILED="+String(error.code||error.name||"unknown")+":"+String(error.message||"").slice(0,400));
  process.exitCode=1;
}finally{
  await Promise.allSettled([pg.end(),maria.end()]);
}
