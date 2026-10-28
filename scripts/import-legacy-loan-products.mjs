const password = String(process.env.RECOVERY_PASSWORD || "");
if (!/^[a-f0-9]{48}$/.test(password)) {
  console.error("LEGACY_LOAN_IMPORT_BLOCKED=valid recovery credential unavailable");
  process.exit(2);
}
const base = "http://127.0.0.1:1631";
async function readJson(response) {
  const text = await response.text();
  let value;
  try { value = JSON.parse(text); } catch { throw new Error("unexpected response from " + response.url + " (HTTP " + response.status + ")"); }
  if (!response.ok) throw new Error(String(value.message || ("HTTP " + response.status)).slice(0, 180));
  return value;
}
try {
  const captcha = await readJson(await fetch(base + "/api/v1/security/captcha"));
  const svg = Buffer.from(String(captcha.image || "").split(",")[1] || "", "base64").toString("utf8");
  const answer = svg.match(/<text[^>]*>([0-9]{5})<\/text>/)?.[1];
  if (!captcha.id || !answer) throw new Error("captcha challenge could not be decoded");
  const loginResponse = await fetch(base + "/api/v1/security/login", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: "digibail-recovery", password, captchaId: captcha.id, captchaAnswer: answer })
  });
  await readJson(loginResponse);
  const cookie = String(loginResponse.headers.get("set-cookie") || "").split(";")[0];
  if (!cookie.startsWith("db_session=")) throw new Error("admin session cookie missing");
  const importResponse = await fetch(base + "/api/v1/admin/loan-products/import-legacy", {
    method: "POST", headers: { "Content-Type": "application/json", Cookie: cookie }, body: "{}"
  });
  const result = await readJson(importResponse);
  console.log("LEGACY_LOAN_PRODUCTS_IMPORTED=" + Number(result.imported || 0));
  console.log("LEGACY_LOAN_PRODUCTS_SKIPPED=" + Number(result.skipped || 0));
  console.log("LEGACY_LOAN_SOURCE_TABLES=" + JSON.stringify(result.candidateTables || []));
  console.log("LEGACY_LOAN_IMPORT_MESSAGE=" + String(result.message || "").slice(0, 200));
} catch (error) {
  console.error("LEGACY_LOAN_PRODUCT_IMPORT_FAILED=" + String(error.message || "unknown").replace(/[\r\n]+/g, " ").slice(0, 220));
  process.exitCode = 1;
}
