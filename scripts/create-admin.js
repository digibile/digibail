import bcrypt from "bcryptjs";
import { Pool } from "pg";

const required = ["ADMIN_USERNAME", "ADMIN_PHONE", "ADMIN_FULL_NAME", "ADMIN_NATIONAL_CODE", "ADMIN_PASSWORD"];
for (const key of required) if (!process.env[key]) {
  console.error("Missing required environment variable:", key);
  process.exit(2);
}
if (process.env.ADMIN_PASSWORD.length < 16) {
  console.error("ADMIN_PASSWORD must be at least 16 characters.");
  process.exit(2);
}
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
try {
  const passwordHash = await bcrypt.hash(process.env.ADMIN_PASSWORD, 12);
  await pool.query(
    "INSERT INTO users(username,phone,full_name,national_code,password_hash,role) VALUES($1,$2,$3,$4,$5,'superadmin')",
    [process.env.ADMIN_USERNAME, process.env.ADMIN_PHONE, process.env.ADMIN_FULL_NAME, process.env.ADMIN_NATIONAL_CODE, passwordHash]
  );
  console.log("Superadmin created. The password is not printed.");
} catch (error) {
  console.error(error.code === "23505" ? "User, phone, or national code already exists." : "Superadmin creation failed.");
  process.exitCode = 1;
} finally {
  await pool.end();
}
