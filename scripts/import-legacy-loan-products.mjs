// IMPORT_LEGACY_LOAN_PRODUCTS_V2: idempotent retry after memory-safe batched import
import jwt from "jsonwebtoken";
import pg from "pg";

const base = "http://127.0.0.1:1631";
const secret = String(process.env.JWT_SECRET || "");
const connectionString = String(process.env.DATABASE_URL || "");
if (secret.length < 32 || !connectionString) {
  console.error("LEGACY_LOAN_IMPORT_BLOCKED=database or signing configuration unavailable");
  process.exit(2);
}
const pool = new pg.Pool({ connectionString, max: 2, connectionTimeoutMillis: 5000 });
async function readJson(response) {
  const text = await response.text();
  let value;
  try { value = JSON.parse(text); } catch { throw new Error("unexpected API response (HTTP " + response.status + ")"); }
  if (!response.ok) throw new Error(String(value.message || ("HTTP " + response.status)).slice(0, 180));
  return value;
}
try {
  const source = await pool.query(
    "SELECT source_table,COUNT(*)::int AS row_count FROM legacy_source_data WHERE source_table ~* '^vamcityc_vamcity_import_[0-9]{8}[.]dbo[.]Loans$' GROUP BY source_table ORDER BY source_table DESC LIMIT 1"
  );
  if (!source.rowCount || source.rows[0].row_count < 1) throw new Error("verified VamCity loan-definition source table is not available");
  const admins = await pool.query(
    "SELECT id,role FROM users WHERE is_active=TRUE AND lower(role) IN ('admin','superadmin') ORDER BY CASE lower(role) WHEN 'superadmin' THEN 0 ELSE 1 END,id LIMIT 1"
  );
  if (!admins.rowCount) throw new Error("active administrator account is unavailable");
  const admin = admins.rows[0];
  const token = jwt.sign({ sub: String(admin.id), role: admin.role }, secret, { issuer: "digibail", expiresIn: "2m" });
  const response = await fetch(base + "/api/v1/admin/loan-products/import-legacy", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
    body: "{}"
  });
  const result = await readJson(response);
  console.log("LEGACY_LOAN_SOURCE_TABLE=" + String(source.rows[0].source_table));
  console.log("LEGACY_LOAN_SOURCE_ROWS=" + Number(source.rows[0].row_count));
  console.log("LEGACY_LOAN_PRODUCTS_IMPORTED=" + Number(result.imported || 0));
  console.log("LEGACY_LOAN_PRODUCTS_SKIPPED=" + Number(result.skipped || 0));
  console.log("LEGACY_LOAN_IMPORT_MESSAGE=" + String(result.message || "").slice(0, 200));
} catch (error) {
  console.error("LEGACY_LOAN_PRODUCT_IMPORT_FAILED=" + String(error.message || "unknown").replace(/[\r\n]+/g, " ").slice(0, 220));
  process.exitCode = 1;
} finally {
  await pool.end();
}
