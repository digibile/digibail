import bcrypt from "bcryptjs";
import { createPool } from "mysql2/promise";

const username = "digibail-recovery";
const password = String(process.env.RECOVERY_PASSWORD || "");
if (password.length < 40 || !/^[a-f0-9]{48}$/.test(password)) {
  console.error("RECOVERY_PASSWORD must be a 48-character hex secret.");
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
  const passwordHash = await bcrypt.hash(password, 12);
  const [existing] = await pool.query("SELECT id FROM users WHERE username=? LIMIT 1", [username]);
  if (existing.length) {
    await pool.query(
      "UPDATE users SET full_name=?,password_hash=?,role='superadmin',is_active=1,updated_at=NOW() WHERE id=?",
      ["مدیر بازیابی دیجی‌بایل", passwordHash, existing[0].id]
    );
  } else {
    await pool.query(
      "INSERT INTO users(username,full_name,password_hash,role,is_active) VALUES(?,?,?,'superadmin',1)",
      [username, "مدیر بازیابی دیجی‌بایل", passwordHash]
    );
  }
  console.log("RECOVERY_ADMIN_PROVISIONED=1");
} catch (error) {
  console.error("RECOVERY_ADMIN_PROVISION_FAILED=" + String(error.code || error.message || "unknown").slice(0, 100));
  process.exitCode = 1;
} finally {
  await pool.end();
}
