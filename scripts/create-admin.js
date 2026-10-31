import bcrypt from "bcryptjs";
import { createPool } from "mysql2/promise";

const required = ["ADMIN_USERNAME", "ADMIN_PHONE", "ADMIN_FULL_NAME", "ADMIN_NATIONAL_CODE", "ADMIN_PASSWORD"];
for (const key of required) if (!process.env[key]) {
  console.error("Missing required environment variable:", key);
  process.exit(2);
}
if (!/^09\d{9}$/.test(process.env.ADMIN_PHONE)) {
  console.error("ADMIN_PHONE must be an Iranian mobile number beginning with 09.");
  process.exit(2);
}
function validNationalCode(n) {
  if (!/^\d{10}$/.test(n) || /^(\d)\1{9}$/.test(n)) return false;
  const sum = n.slice(0, 9).split("").reduce((s, d, i) => s + Number(d) * (10 - i), 0) % 11;
  return sum < 2 ? Number(n[9]) === sum : Number(n[9]) === 11 - sum;
}
if (!validNationalCode(process.env.ADMIN_NATIONAL_CODE)) {
  console.error("ADMIN_NATIONAL_CODE is invalid.");
  process.exit(2);
}
if (process.env.ADMIN_PASSWORD.length < 16) {
  console.error("ADMIN_PASSWORD must be at least 16 characters.");
  process.exit(2);
}

const pool = createPool({
  ...(process.env.MARIADB_HOST
    ? { host: process.env.MARIADB_HOST, port: Number(process.env.MARIADB_PORT || 3306) }
    : { socketPath: process.env.MARIADB_SOCKET || "/tmp/mysql.sock" }),
  user: process.env.MARIADB_USER,
  password: process.env.MARIADB_PASSWORD,
  database: process.env.MARIADB_DATABASE || "digibail_vamcitydigibilepay",
  waitForConnections: true,
  connectionLimit: 1,
  connectTimeout: 10000,
  charset: "utf8mb4"
});
try {
  const [existing] = await pool.query(
    "SELECT id FROM users WHERE lower(username)=lower(?) OR phone=? OR national_code=? LIMIT 1",
    [process.env.ADMIN_USERNAME, process.env.ADMIN_PHONE, process.env.ADMIN_NATIONAL_CODE]
  );
  if (existing.length) throw new Error("User, phone, or national code already exists.");
  const passwordHash = await bcrypt.hash(process.env.ADMIN_PASSWORD, 12);
  const [result] = await pool.query(
    "INSERT INTO users(username,phone,full_name,national_code,password_hash,role,is_active) VALUES(?,?,?,?,?,'superadmin',1)",
    [process.env.ADMIN_USERNAME, process.env.ADMIN_PHONE, process.env.ADMIN_FULL_NAME, process.env.ADMIN_NATIONAL_CODE, passwordHash]
  );
  console.log("SUPERADMIN_CREATED=1 id=" + result.insertId + ". The password is not printed.");
} catch (error) {
  console.error(error.code === "ER_DUP_ENTRY" ? "User, phone, or national code already exists." : "Superadmin creation failed: " + String(error.message || error).slice(0, 180));
  process.exitCode = 1;
} finally {
  await pool.end();
}
