import { createPool } from "mysql2/promise";
import { migrate } from "../backend/api.js";

const pool=createPool({
  socketPath:process.env.MARIADB_SOCKET||"/tmp/mysql.sock",
  user:process.env.MARIADB_USER||"",
  password:process.env.MARIADB_PASSWORD||"",
  database:process.env.MARIADB_DATABASE||"digibail_vamcitydigibilepay",
  waitForConnections:true,
  connectionLimit:3,
  queueLimit:10,
  connectTimeout:12000,
  charset:"utf8mb4",
  timezone:"Z"
});

const sets=[
  {
    key:"mariadb.AspNetUsers",
    users:"AspNetUsers",
    roles:"AspNetRoles",
    links:"AspNetUserRoles",
    phone:"COALESCE(NULLIF(u.Mobile,''),NULLIF(u.Phone,''),NULLIF(u.PhoneNumber,''))",
    customerId:"CAST(u.CustomerId AS CHAR)",
    agentId:"u.AgentId",
    created:"u.RegDate"
  },
  {
    key:"mariadb.bluvamdb__AspNetUsers",
    users:"bluvamdb__AspNetUsers",
    roles:"bluvamdb__AspNetRoles",
    links:"bluvamdb__AspNetUserRoles",
    phone:"COALESCE(NULLIF(u.Mobile,''),NULLIF(u.Phone,''),NULLIF(u.PhoneNumber,''))",
    customerId:"CAST(u.CustomerId AS CHAR)",
    agentId:"u.AgentId",
    created:"u.RegDate"
  },
  {
    key:"mariadb.OnlineMoneyTransfer__AspNetUsers",
    users:"OnlineMoneyTransfer__AspNetUsers",
    roles:"OnlineMoneyTransfer__AspNetRoles",
    links:"OnlineMoneyTransfer__AspNetUserRoles",
    phone:"u.PhoneNumber",
    customerId:"NULL",
    agentId:"NULL",
    created:"NULL"
  }
];

function quote(value){return "\`"+String(value).replace(/\`/g,"\`\`")+"\`";}
function roleCodeSql(nameExpression){
  const norm="LOWER(REPLACE(REPLACE(REPLACE("+nameExpression+",' ',''),'-',''),'_',''))";
  return "CASE "+norm+
    " WHEN 'superadmin' THEN 'superadmin'"+
    " WHEN 'admin' THEN 'admin'"+
    " WHEN 'administrator' THEN 'admin'"+
    " WHEN 'agent' THEN 'agent'"+
    " WHEN 'representative' THEN 'agent'"+
    " WHEN 'marketer' THEN 'marketer'"+
    " WHEN 'customermarketer' THEN 'customermarketer'"+
    " WHEN 'member' THEN 'member'"+
    " WHEN 'customer' THEN 'customer'"+
    " WHEN 'user' THEN 'customer'"+
    " ELSE CONCAT('legacy_',LEFT("+norm+",32)) END";
}
function userRoleAggregate(set){
  const code=roleCodeSql("r.Name");
  return "SELECT ur.UserId,"+
    " COALESCE("+
    " MAX(CASE WHEN "+code+"='superadmin' THEN 'superadmin' END),"+
    " MAX(CASE WHEN "+code+"='admin' THEN 'admin' END),"+
    " MAX(CASE WHEN "+code+"='agent' THEN 'agent' END),"+
    " MAX(CASE WHEN "+code+"='customermarketer' THEN 'customermarketer' END),"+
    " MAX(CASE WHEN "+code+"='marketer' THEN 'marketer' END),"+
    " MAX(CASE WHEN "+code+"='member' THEN 'member' END),"+
    " MAX(CASE WHEN "+code+"='customer' THEN 'customer' END),"+
    " MAX("+code+"),'customer') AS role_code"+
    " FROM "+quote(set.links)+" ur JOIN "+quote(set.roles)+" r ON r.Id=ur.RoleId GROUP BY ur.UserId";
}
async function scalar(sql,params=[]){
  const [rows]=await pool.query(sql,params);
  return Number(rows[0]?.n||0);
}
async function importSet(set){
  const userCount=await scalar("SELECT COUNT(*) AS n FROM "+quote(set.users));
  const roleCode=roleCodeSql("r.Name");
  const aggregate=userRoleAggregate(set);
  const sql="INSERT INTO users "+
    "(username,phone,full_name,national_code,email,password_hash,role,is_active,password_reset_required,legacy_source,legacy_id,legacy_username,legacy_customer_id,legacy_agent_id,created_at) "+
    "SELECT NULLIF(u.UserName,''),"+set.phone+","+
    " COALESCE(NULLIF(TRIM(CONCAT_WS(' ',u.FirstName,u.LastName)),''),NULLIF(u.UserName,''),"+set.phone+",'کاربر بدون نام'),"+
    " NULLIF(u.NationalCode,''),NULLIF(u.Email,''),"+
    " CASE WHEN COALESCE(u.PasswordHash,'')<>'' THEN CONCAT('aspnet:',u.PasswordHash) ELSE '' END,"+
    " COALESCE(rr.role_code,'customer'),COALESCE(u.IsActive,1),"+
    " CASE WHEN COALESCE(u.PasswordHash,'')='' THEN 1 ELSE 0 END,?,CAST(u.Id AS CHAR),NULLIF(u.UserName,''),"+
    set.customerId+","+set.agentId+",COALESCE("+set.created+",CURRENT_TIMESTAMP(6)) "+
    "FROM "+quote(set.users)+" u LEFT JOIN ("+aggregate+") rr ON rr.UserId=u.Id "+
    "WHERE NOT EXISTS(SELECT 1 FROM users target WHERE target.legacy_source=? AND target.legacy_id=CAST(u.Id AS CHAR)) "+
    "AND NOT EXISTS(SELECT 1 FROM DigibailAppUserIdentity linked WHERE linked.LegacySource=? AND linked.MariaDbUserId=CAST(u.Id AS UNSIGNED))";
  const [result]=await pool.query(sql,[set.key,set.key,set.key]);
  const linkedUsers=await scalar("SELECT COUNT(*) AS n FROM users WHERE legacy_source=?",[set.key]);
  const preMappedUsers=await scalar("SELECT COUNT(*) AS n FROM DigibailAppUserIdentity WHERE LegacySource=?",[set.key]);
  if(linkedUsers+preMappedUsers!==userCount) throw new Error("User import mismatch "+set.key+" source="+userCount+" imported="+linkedUsers+" preMapped="+preMappedUsers);
  console.log("LEGACY_USERS_VERIFIED="+set.key+" count="+userCount+" inserted="+Number(result.affectedRows||0));

  const rolesCount=await scalar("SELECT COUNT(*) AS n FROM "+quote(set.roles));
  const rolesSql="INSERT INTO access_roles(code,display_name,legacy_source,legacy_id) "+
    "SELECT "+roleCode+",r.Name,?,CAST(r.Id AS CHAR) FROM "+quote(set.roles)+" r "+
    "ON DUPLICATE KEY UPDATE display_name=VALUES(display_name)";
  await pool.query(rolesSql,[set.key+".AspNetRoles"]);

  const mappingSql="INSERT INTO DigibailAppUserIdentity(AppUserId,LegacySource,MariaDbUserId,RoleCode) "+
    "SELECT app.id,?,CAST(u.Id AS UNSIGNED),app.role FROM "+quote(set.users)+" u "+
    "JOIN users app ON app.legacy_source=? AND app.legacy_id=CAST(u.Id AS CHAR) "+
    "ON DUPLICATE KEY UPDATE RoleCode=VALUES(RoleCode)";
  await pool.query(mappingSql,[set.key,set.key]);
  const targetMappings=await scalar("SELECT COUNT(*) AS n FROM DigibailAppUserIdentity WHERE LegacySource=?",[set.key]);
  if(targetMappings!==userCount)throw new Error("Identity-map mismatch "+set.key+" source="+userCount+" target="+targetMappings);

  const assignmentSql="INSERT INTO user_role_assignments(user_id,role_code,legacy_source,legacy_user_id,legacy_role_id) "+
    "SELECT app.id,"+roleCode+",?,CAST(u.Id AS CHAR),CAST(r.Id AS CHAR) "+
    "FROM "+quote(set.users)+" u "+
    "JOIN "+quote(set.links)+" ur ON ur.UserId=u.Id "+
    "JOIN "+quote(set.roles)+" r ON r.Id=ur.RoleId "+
    "JOIN DigibailAppUserIdentity map ON map.LegacySource=? AND map.MariaDbUserId=CAST(u.Id AS UNSIGNED) "+
    "JOIN users app ON app.id=map.AppUserId "+
    "ON DUPLICATE KEY UPDATE role_code=VALUES(role_code)";
  await pool.query(assignmentSql,[set.key+".AspNetUserRoles",set.key]);
  const sourceLinks=await scalar("SELECT COUNT(*) AS n FROM "+quote(set.links));
  const targetLinks=await scalar("SELECT COUNT(*) AS n FROM user_role_assignments WHERE legacy_source=?",[set.key+".AspNetUserRoles"]);
  if(targetLinks!==sourceLinks)throw new Error("Role-link import mismatch "+set.key+" source="+sourceLinks+" target="+targetLinks);
  console.log("LEGACY_ROLES_VERIFIED="+set.key+" role_tables="+rolesCount+" role_links="+sourceLinks+" mappings="+targetMappings);
}

async function main(){
  if(!process.env.MARIADB_USER||!process.env.MARIADB_PASSWORD)throw new Error("MariaDB credentials not configured");
  if(process.argv.includes("--apply")&&process.env.DIGIBAIL_LEGACY_USERS_BACKUP_VERIFIED!=="YES") {
    throw new Error("Run a MariaDB backup first and set DIGIBAIL_LEGACY_USERS_BACKUP_VERIFIED=YES.");
  }
  try{
    await pool.query("SELECT 1");
    if(process.argv.includes("--apply"))await migrate();
    for(const set of sets){
      const [exists]=await pool.query(
        "SELECT 1 FROM information_schema.tables WHERE table_schema=DATABASE() AND table_name=?",
        [set.users]
      );
      if(!exists.length)throw new Error("Required legacy account table missing: "+set.users);
      const n=await scalar("SELECT COUNT(*) AS n FROM "+quote(set.users));
      console.log("LEGACY_USER_SOURCE_PLAN="+set.key+" count="+n);
      if(process.argv.includes("--apply"))await importSet(set);
    }
    if(!process.argv.includes("--apply"))console.log("DRY_RUN_ONLY=1 no account rows were changed.");
    else console.log("DIGIBAIL_LEGACY_ACCOUNT_IMPORT=PASS all account sources are mapped into MariaDB users.");
  }finally{await pool.end();}
}
main().catch(error=>{
  console.error("DIGIBAIL_LEGACY_ACCOUNT_IMPORT_FAILED="+String(error.code||error.name||"unknown")+":"+String(error.message||"").slice(0,600));
  process.exitCode=1;
});
