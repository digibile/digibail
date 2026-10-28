import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { Pool } from "pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 10, connectionTimeoutMillis: 5000 });
const JWT_SECRET = process.env.JWT_SECRET || "";
const OTP_PEPPER = process.env.OTP_PEPPER || "";
const CAPTCHA_PEPPER = process.env.CAPTCHA_PEPPER || "";
const BRAND_NAME = process.env.BRAND_NAME || "دیجی‌بایل پی";
const KAVENEGAR_API_KEY = process.env.KAVENEGAR_API_KEY || "";
const KAVENEGAR_TEMPLATE = process.env.KAVENEGAR_TEMPLATE || "";

export async function migrate() {
  const { readFile } = await import("node:fs/promises");
  const { fileURLToPath } = await import("node:url");
  const path = await import("node:path");
  const root = path.dirname(fileURLToPath(import.meta.url));
  await pool.query(await readFile(path.join(root, "db", "001_init.sql"), "utf8"));
  // Provision a password-only initial superadmin without relying on SMS delivery.
  // The password itself is never stored in source; only a salted scrypt verifier is.
  await pool.query(
    "INSERT INTO users(username,full_name,password_hash,role,is_active) VALUES($1,$2,$3,'superadmin',TRUE) ON CONFLICT(username) DO UPDATE SET password_hash=EXCLUDED.password_hash,role='superadmin',is_active=TRUE,updated_at=NOW() WHERE users.password_hash='scrypt$16384$8$1$ae0n_OnykLU21Q2-sXeXsA$c2gmp32g3QG-xokwTmTSQhirE-ZjBLOVx2e1OgS8oGOAC7uW0fIQcJrN6QnkNdqn'",
    ["digibail-admin", "مدیر ارشد دیجی‌بایل", "scrypt$16384$8$1$ZGC9mkowEkz4tWjuufSPZA$jNjHElydJ79QieOQkOW23cy-niXHxJNaV9aJfhSfJYg"]
  );
  // Keep the explicitly named legacy administrator's authorization after identity import.
  // This changes only the role of the known legacy username; it never changes the password.
  await pool.query(
    "UPDATE users SET role='superadmin',is_active=TRUE,updated_at=NOW() WHERE lower(username)='admin'"
  );
  // Reconcile a legacy administrator whose modern username was normalized during import.
  // Only promote an identity whose preserved legacy role explicitly includes admin.
  await pool.query(
    "UPDATE users u SET role='superadmin',is_active=TRUE,updated_at=NOW() WHERE u.legacy_source='aspnetusers' AND EXISTS (SELECT 1 FROM legacy_source_data l WHERE l.source_table LIKE '%AspNetUsers' AND lower(COALESCE(l.payload->>'UserName',l.payload->>'username',''))=lower(u.username) AND lower(COALESCE(l.payload->>'roles',l.payload->>'Roles','')) LIKE '%admin%')"
  );
}
export async function dbHealth() { await pool.query("SELECT 1"); return true; }
function hash(value, pepper) { return crypto.createHmac("sha256", pepper).update(String(value)).digest("hex"); }
function json(res, status, value) {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" });
  res.end(JSON.stringify(value));
}
function authJson(res, status, token, value) {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  res.setHeader("Set-Cookie", "db_session=" + token + "; HttpOnly; SameSite=Lax; Path=/; Max-Age=28800" + secure);
  return json(res, status, value);
}
export function verifySession(token) {
  if (!token || JWT_SECRET.length < 32) return null;
  try { return jwt.verify(token, JWT_SECRET, { issuer: "digibail" }); } catch { return null; }
}
async function body(req) {
  let raw = "";
  for await (const chunk of req) { raw += chunk; if (raw.length > 32768) throw Object.assign(new Error("درخواست بیش از حد بزرگ است."), { status: 413 }); }
  try { return raw ? JSON.parse(raw) : {}; } catch { throw Object.assign(new Error("ساختار JSON معتبر نیست."), { status: 400 }); }
}
async function multipartBody(req, limit = 6_200_000) {
  const type = String(req.headers["content-type"] || "");
  const match = type.match(/boundary=(?:"([^"]+)"|([^;]+))/i);
  if (!match) throw Object.assign(new Error("فرمت بارگذاری فایل معتبر نیست."), { status: 400 });
  const boundary = Buffer.from("--" + (match[1] || match[2]).trim());
  const chunks = []; let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > limit) throw Object.assign(new Error("حجم فایل بیشتر از حد مجاز است."), { status: 413 });
    chunks.push(chunk);
  }
  const raw = Buffer.concat(chunks); const fields = {}; let file = null; let pos = 0;
  while (true) {
    const start = raw.indexOf(boundary, pos);
    if (start < 0) break;
    let partStart = start + boundary.length;
    if (raw.subarray(partStart, partStart + 2).toString() === "--") break;
    if (raw.subarray(partStart, partStart + 2).toString() === "\r\n") partStart += 2;
    const next = raw.indexOf(boundary, partStart);
    if (next < 0) break;
    let partEnd = next;
    if (raw.subarray(partEnd - 2, partEnd).toString() === "\r\n") partEnd -= 2;
    const part = raw.subarray(partStart, partEnd);
    const headerEnd = part.indexOf(Buffer.from("\r\n\r\n"));
    if (headerEnd < 0) { pos = next; continue; }
    const headers = part.subarray(0, headerEnd).toString("utf8");
    const disposition = headers.match(/content-disposition:\s*form-data;[^\r\n]*name="([^"]+)"(?:;\s*filename="([^"]*)")?/i);
    if (!disposition) { pos = next; continue; }
    const name = disposition[1]; const filename = disposition[2];
    const data = part.subarray(headerEnd + 4);
    if (filename !== undefined) {
      const mime = headers.match(/content-type:\s*([^\r\n]+)/i)?.[1]?.trim().toLowerCase() || "application/octet-stream";
      file = { name: filename, mime, data };
    } else fields[name] = data.toString("utf8");
    pos = next;
  }
  return { fields, file };
}
function authenticatedUserId(req) {
  const session = sessionFor(req);
  const id = Number(session?.sub);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}
function clientIp(req) { return (req.socket.remoteAddress || "").replace(/^::ffff:/, "").slice(0, 64) || null; }
async function audit(req, event, userId = null, details = {}) {
  await pool.query("INSERT INTO audit_logs(user_id,event_type,ip_address,details) VALUES($1,$2,$3,$4)", [userId, event, clientIp(req), JSON.stringify(details)]);
}
function tokenFor(user) {
  if (JWT_SECRET.length < 32) throw new Error("JWT_SECRET تنظیم نشده است.");
  return jwt.sign({ sub: String(user.id), role: user.role, phone: user.phone }, JWT_SECRET, { expiresIn: "8h", issuer: "digibail" });
}
async function consumeCaptcha(id, answer) {
  if (!id || !answer || CAPTCHA_PEPPER.length < 32) return false;
  const result = await pool.query("UPDATE captcha_challenges SET consumed_at=NOW() WHERE id=$1 AND consumed_at IS NULL AND expires_at>NOW() AND answer_hash=$2 RETURNING id", [id, hash(String(answer).trim(), CAPTCHA_PEPPER)]);
  return result.rowCount === 1;
}
function phoneOk(phone) { return /^09\d{9}$/.test(String(phone || "")); }
function nationalCodeOk(value) {
  const n = String(value || "");
  if (!/^\d{10}$/.test(n) || /^([0-9])\1{9}$/.test(n)) return false;
  const check = Number(n[9]);
  const sum = n.slice(0, 9).split("").reduce((s, digit, i) => s + Number(digit) * (10 - i), 0) % 11;
  return sum < 2 ? check === sum : check === 11 - sum;
}
function sessionFor(req) {
  const auth = String(req.headers.authorization || "");
  const bearer = auth.match(/^Bearer\s+(.+)$/i)?.[1];
  const cookie = String(req.headers.cookie || "").split(";").map(v => v.trim()).find(v => v.startsWith("db_session="));
  return verifySession(bearer || (cookie ? cookie.slice("db_session=".length) : ""));
}
async function adminFor(req) {
  const session = sessionFor(req);
  if (!session) return null;
  // Read the current role from PostgreSQL so role corrections take effect without waiting for an old JWT to expire.
  const current = await pool.query("SELECT id,role,is_active,phone,full_name,username FROM users WHERE id=$1 LIMIT 1", [Number(session.sub)]);
  const role = String(current.rows[0]?.role || "").trim().toLowerCase();
  if (!current.rowCount || !current.rows[0].is_active || !["admin", "superadmin"].includes(role)) return null;
  return { ...session, role, fullName: current.rows[0].full_name, phone: current.rows[0].phone, username: current.rows[0].username };
}
export async function verifyAdminSession(req) { return Boolean(await adminFor(req)); }
function verifyAspNetIdentityPassword(password, storedHash) {
  let data;
  try { data = Buffer.from(String(storedHash || ""), "base64"); } catch { return false; }
  if (data.length < 2) return false;
  let salt, subkey, iterations, digest;
  if (data[0] === 0x00 && data.length >= 49) {
    salt = data.subarray(1, 17); subkey = data.subarray(17); iterations = 1000; digest = "sha1";
  } else if (data[0] === 0x01 && data.length >= 14) {
    const prf = data.readUInt32BE(1); iterations = data.readUInt32BE(5);
    const saltLength = data.readUInt32BE(9);
    if (iterations < 1 || iterations > 2000000 || saltLength < 8 || saltLength > 1024 || data.length <= 13 + saltLength) return false;
    digest = ({ 0: "sha1", 1: "sha256", 2: "sha512" })[prf];
    if (!digest) return false;
    salt = data.subarray(13, 13 + saltLength); subkey = data.subarray(13 + saltLength);
  } else return false;
  const actual = crypto.pbkdf2Sync(String(password), salt, iterations, subkey.length, digest);
  return actual.length === subkey.length && crypto.timingSafeEqual(actual, subkey);
}
async function verifyPassword(password, storedHash) {
  const stored = String(storedHash || "");
  if (stored.startsWith("aspnet:")) return verifyAspNetIdentityPassword(password, stored.slice(7));
  if (stored.startsWith("scrypt$")) {
    try {
      const [, n, r, p, salt, expected] = stored.split("$");
      const N = Number(n), R = Number(r), P = Number(p);
      if (N !== 16384 || R !== 8 || P !== 1 || !salt || !expected) return false;
      const expectedBytes = Buffer.from(expected, "base64url");
      const actual = crypto.scryptSync(String(password || ""), Buffer.from(salt, "base64url"), expectedBytes.length, { N, r: R, p: P, maxmem: 64 * 1024 * 1024 });
      return actual.length === expectedBytes.length && crypto.timingSafeEqual(actual, expectedBytes);
    } catch { return false; }
  }
  return bcrypt.compare(String(password || ""), stored);
}
function maskPhone(phone) {
  const p = String(phone || "");
  return p.length >= 7 ? p.slice(0, 4) + "****" + p.slice(-3) : "***";
}
function settingsCipherKey() {
  if (JWT_SECRET.length < 32) throw Object.assign(new Error("تنظیم کلید رمزنگاری امن سرور ناقص است."), { status: 503, code: "sms_settings_key_missing" });
  return crypto.createHash("sha256").update(JWT_SECRET).digest();
}
function encryptSetting(value) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", settingsCipherKey(), iv);
  const encrypted = Buffer.concat([cipher.update(String(value), "utf8"), cipher.final()]);
  return [iv.toString("base64"), cipher.getAuthTag().toString("base64"), encrypted.toString("base64")].join(".");
}
function decryptSetting(value) {
  if (!value) return "";
  const parts = String(value).split(".");
  const decipher = crypto.createDecipheriv("aes-256-gcm", settingsCipherKey(), Buffer.from(parts[0], "base64"));
  decipher.setAuthTag(Buffer.from(parts[1], "base64"));
  return Buffer.concat([decipher.update(Buffer.from(parts[2], "base64")), decipher.final()]).toString("utf8");
}
async function getKavenegarSettings() {
  const q = await pool.query("SELECT api_key_encrypted,sender FROM sms_provider_settings WHERE provider=$1 LIMIT 1", ["kavenegar"]);
  const row = q.rows[0]; let apiKey = "";
  try { apiKey = row?.api_key_encrypted ? decryptSetting(row.api_key_encrypted) : ""; } catch {}
  return { apiKey: apiKey || KAVENEGAR_API_KEY, sender: row?.sender || process.env.KAVENEGAR_SENDER || "" };
}
async function sendSmsText(phone, message) {
  const settings = await getKavenegarSettings();
  if (!settings.apiKey) throw Object.assign(new Error("کلید کاوه‌نگار در تنظیمات پیامک ثبت نشده است."), { status: 503, code: "sms_provider_not_configured" });
  const form = new URLSearchParams({ receptor: phone, message });
  if (settings.sender) form.set("sender", settings.sender);
  const endpoint = "https://api.kavenegar.com/v1/" + encodeURIComponent(settings.apiKey) + "/sms/send.json";
  const response = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: form, signal: AbortSignal.timeout(10000) });
  const result = await response.json().catch(() => ({}));
  if (!response.ok || result?.return?.status !== 200) throw Object.assign(new Error("کاوه‌نگار ارسال را تأیید نکرد. کد پاسخ: " + String(result?.return?.status || response.status)), { status: 502, code: "sms_delivery_failed" });
  return String(result?.entries?.[0]?.messageid || "");
}
function captchaSvg(value) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="170" height="56" viewBox="0 0 170 56"><rect width="170" height="56" rx="12" fill="#241047"/><path d="M0 12L170 42M10 50L150 5" stroke="#ffb629" stroke-opacity=".35" stroke-width="2"/><text x="85" y="38" text-anchor="middle" font-family="monospace" font-size="30" font-weight="700" letter-spacing="5" fill="#fff">${value}</text></svg>`;
}
async function sendOtp(phone, code) {
  const settings = await getKavenegarSettings();
  if (!settings.apiKey) throw Object.assign(new Error("کلید کاوه‌نگار در تنظیمات پیامک ثبت نشده است."), { status: 503, code: "sms_provider_not_configured" });
  if (!KAVENEGAR_TEMPLATE) {
    await sendSmsText(phone, BRAND_NAME + ": کد تأیید شما " + code + " است. این کد را در اختیار دیگران قرار ندهید.");
    return;
  }
  const endpoint = "https://api.kavenegar.com/v1/" + encodeURIComponent(settings.apiKey) + "/verify/lookup.json";
  const form = new URLSearchParams({ receptor: phone, token: code, template: KAVENEGAR_TEMPLATE });
  const response = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: form, signal: AbortSignal.timeout(10000) });
  const result = await response.json().catch(() => ({}));
  if (!response.ok || result?.return?.status !== 200) throw Object.assign(new Error("ارسال پیامک توسط کاوه‌نگار تأیید نشد."), { status: 502, code: "sms_delivery_failed" });
}
const recentFailures = new Map();
function limited(key) {
  const now = Date.now(); const entry = recentFailures.get(key) || { count: 0, since: now };
  if (now - entry.since > 15 * 60_000) { entry.count = 0; entry.since = now; }
  entry.count += 1; recentFailures.set(key, entry); return entry.count > 12;
}
function resetLimit(key) { recentFailures.delete(key); }

export async function handleApi(req, res, url) {
  const route = url.pathname;
  try {
    if (req.method === "GET" && route === "/api/v1/security/me") {
      const session = sessionFor(req);
      if (!session) return json(res, 401, { message: "وارد حساب خود شوید." });
      const current = await pool.query("SELECT id,phone,full_name,username,role,is_active FROM users WHERE id=$1 LIMIT 1", [Number(session.sub)]);
      if (!current.rowCount || !current.rows[0].is_active) return json(res, 401, { message: "حساب کاربری فعال نیست." });
      const u = current.rows[0];
      return json(res, 200, { data: { id: u.id, phone: u.phone, fullName: u.full_name, username: u.username, role: u.role, roles: [u.role] } });
    }
    if (req.method === "GET" && route === "/api/v1/tenant/config") {
      return json(res, 200, { data: { name: BRAND_NAME, brand: { logoText: BRAND_NAME.slice(0, 1), primary: "#4a2a86", accent: "#ffb629" } } });
    }
    if (req.method === "GET" && (route === "/api/v1/loan-products" || /^\/api\/v1\/loan-products\/[^/]+$/.test(route))) {
      const slug = route === "/api/v1/loan-products" ? null : decodeURIComponent(route.slice("/api/v1/loan-products/".length));
      const q = slug
        ? await pool.query("SELECT * FROM loan_products WHERE slug=$1 AND is_active=TRUE AND show_in_list=TRUE LIMIT 1", [slug])
        : await pool.query("SELECT * FROM loan_products WHERE is_active=TRUE AND show_in_list=TRUE ORDER BY sort_order,created_at DESC");
      const shape = (p) => ({ id:p.slug,name:p.name,description:p.description,badge:p.badge,isActive:p.is_active,minAmount:Number(p.min_amount),maxAmount:Number(p.max_amount),intervalDays:p.interval_days,tiers:p.tiers,conditions:p.conditions,documents:p.documents,title:p.title||p.name,imageUrl:p.image_url,fullDescriptionHtml:p.full_description_html,labels:p.labels,operationalCosts:p.operational_costs,interestMethod:p.interest_method,interestPercent:Number(p.interest_percent),lateDailyCoef:Number(p.late_daily_coef),earlyDailyCoef:Number(p.early_daily_coef),showInList:p.show_in_list,sendReminders:p.send_reminders });
      if (slug) return q.rowCount ? json(res,200,shape(q.rows[0])) : json(res,404,{message:"طرح وام پیدا نشد."});
      return json(res,200,q.rows.map(shape));
    }
    if (route.startsWith("/api/v1/admin/")) {
      const admin = await adminFor(req);
      if (!admin) return json(res, 403, { message: "دسترسی مدیر لازم است." });
      const loanShape = (p) => ({ id:p.slug,name:p.name,description:p.description,badge:p.badge,isActive:p.is_active,minAmount:Number(p.min_amount),maxAmount:Number(p.max_amount),intervalDays:p.interval_days,tiers:p.tiers,conditions:p.conditions,documents:p.documents,title:p.title||p.name,imageUrl:p.image_url,fullDescriptionHtml:p.full_description_html,labels:p.labels,operationalCosts:p.operational_costs,interestMethod:p.interest_method,interestPercent:Number(p.interest_percent),lateDailyCoef:Number(p.late_daily_coef),earlyDailyCoef:Number(p.early_daily_coef),showInList:p.show_in_list,sendReminders:p.send_reminders });
      const loanRow = (p) => ({ id:p.id,shape:loanShape(p),isActive:p.is_active,sortOrder:p.sort_order,showInList:p.show_in_list,sendReminders:p.send_reminders,legacySourceTable:p.legacy_source_table,legacyId:p.legacy_id,needsReview:Boolean(p.needs_review) });
      const cleanLoanInput = (b) => {
        const name=String(b.name||"").trim(), slug=String(b.slug||"").trim();
        const num=(v)=>{if(v===null||v===undefined||v==="")return null;const n=Number(String(v).replace(/[۰-۹]/g,d=>"۰۱۲۳۴۵۶۷۸۹".indexOf(d)).replace(/[٠-٩]/g,d=>"٠١٢٣٤٥٦٧٨٩".indexOf(d)).replace(/[٬,\s]/g,"").replace(/٫/g,"."));return Number.isFinite(n)?n:null};
        const minAmount=num(b.minAmount),maxAmount=num(b.maxAmount),intervalDays=num(b.intervalDays),interestPercent=num(b.interestPercent??0),lateDailyCoef=num(b.lateDailyCoef??0),earlyDailyCoef=num(b.earlyDailyCoef??0);
        const interestMethod=String(b.interestMethod||"Monthly");
        const tiers=Array.isArray(b.tiers)?b.tiers:[],conditions=b.conditions&&typeof b.conditions==="object"&&!Array.isArray(b.conditions)?b.conditions:{},documents=Array.isArray(b.documents)?b.documents:[],labels=Array.isArray(b.labels)?b.labels:[],operationalCosts=Array.isArray(b.operationalCosts)?b.operationalCosts:[];
        if(!name||name.length>120||!/^[a-z0-9-]{2,40}$/.test(slug))throw Object.assign(new Error("نام و شناسه انگلیسی معتبر لازم است."),{status:400});
        if(!Number.isFinite(minAmount)||!Number.isFinite(maxAmount)||minAmount<=0||maxAmount<minAmount)throw Object.assign(new Error("بازه مبلغ وام نامعتبر است."),{status:400});
        if(!Number.isInteger(intervalDays)||intervalDays<1||intervalDays>365)throw Object.assign(new Error("فاصله اقساط باید بین ۱ تا ۳۶۵ روز باشد."),{status:400});
        if(!["Monthly","Annual","Flat"].includes(interestMethod)||!Number.isFinite(interestPercent)||interestPercent<0||interestPercent>100)throw Object.assign(new Error("نوع یا نرخ بهره نامعتبر است."),{status:400});
        if(!Number.isFinite(lateDailyCoef)||!Number.isFinite(earlyDailyCoef)||lateDailyCoef<0||lateDailyCoef>1||earlyDailyCoef<0||earlyDailyCoef>1)throw Object.assign(new Error("ضریب روزانه باید بین صفر و یک باشد."),{status:400});
        if(!tiers.length||tiers.some(t=>!Number.isInteger(Number(t.months))||Number(t.months)<1||!Number.isFinite(Number(t.feePercent??0))||Number(t.feePercent??0)<0||Number(t.feePercent??0)>100||Number(t.downPaymentPercent??0)<0||Number(t.downPaymentPercent??0)>100))throw Object.assign(new Error("حداقل یک گزینه اقساط معتبر لازم است."),{status:400});
        if(labels.length>10||labels.some(x=>typeof x!=="string"||!x.trim()||x.length>30))throw Object.assign(new Error("حداکثر ۱۰ برچسب، هرکدام تا ۳۰ نویسه."),{status:400});
        if(operationalCosts.length>10||operationalCosts.some(x=>!String(x.title||"").trim()||Number(x.percent)<0||Number(x.percent)>100))throw Object.assign(new Error("هزینه عملیاتی نامعتبر است."),{status:400});
        const cleanHtml=String(b.fullDescriptionHtml||"").replace(/<\s*(script|style|iframe|object|embed|form|meta|link)[^>]*>[\s\S]*?<\/\s*\1\s*>/gi,"").replace(/\s+on[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi,"").replace(/(href|src)\s*=\s*(['"])\s*javascript:[\s\S]*?\2/gi,"$1=\"#\"");
        return {name,slug,description:String(b.description||"").slice(0,500),badge:String(b.badge||"").slice(0,40),minAmount,maxAmount,intervalDays,tiers,conditions,documents,isActive:b.isActive!==false,sortOrder:Number.isFinite(num(b.sortOrder))?Math.trunc(num(b.sortOrder)):0,title:String(b.title||name).slice(0,160),interestMethod,interestPercent,lateDailyCoef,earlyDailyCoef,showInList:b.showInList!==false,sendReminders:b.sendReminders!==false,fullDescriptionHtml:cleanHtml,labels,operationalCosts};
      };
      if (req.method === "GET" && route === "/api/v1/admin/loan-products/legacy-candidates") {
        const q=await pool.query("SELECT source_table,COUNT(*)::int AS row_count FROM legacy_source_data WHERE source_table<>'__legacy_schema__' AND source_table ~* '(loan.?product|loan.?type|loan.?plan|loan.?definition|loan.?configuration|(^|[.])loans?$|وام)' GROUP BY source_table ORDER BY source_table");
        return json(res,200,{data:q.rows});
      }
      // IMPORT_LATEST_VAMCITY_LOAN_DEFINITIONS_V2
      if (req.method === "POST" && route === "/api/v1/admin/loan-products/import-legacy") {
        // Import only the latest VamCity loan-definition table, never mix in the separate BluVam database.
        const source=await pool.query("SELECT source_table FROM legacy_source_data WHERE source_table ~* '^vamcityc_vamcity_import_[0-9]{8}[.]dbo[.]Loans$' GROUP BY source_table ORDER BY source_table DESC LIMIT 1");
        const sourceTable=source.rows[0]?.source_table;
        if(!sourceTable)return json(res,200,{imported:0,skipped:0,candidateTables:[],message:"جدول واقعی تعریف وام در داده‌های منتقل‌شده پیدا نشد."});
        const q=await pool.query("SELECT source_table,legacy_id,payload FROM legacy_source_data WHERE source_table=$1 ORDER BY legacy_id LIMIT 10000",[sourceTable]);
        const norm=(x)=>String(x||"").toLowerCase().replace(/[^a-z0-9\u0600-\u06ff]/g,"");
        const pick=(p,keys)=>{const entries=Object.keys(p||{});for(const key of keys){const wanted=norm(key),k=entries.find(x=>norm(x)===wanted);if(k&&p[k]!==null&&p[k]!==undefined&&p[k]!=="")return p[k]}return null};
        const num=(v)=>{if(v===null||v===undefined||v==="")return null;const n=Number(String(v).replace(/[۰-۹]/g,d=>"۰۱۲۳۴۵۶۷۸۹".indexOf(d)).replace(/[٠-٩]/g,d=>"٠١٢٣٤٥٦٧٨٩".indexOf(d)).replace(/[٬,\\s]/g,"").replace(/٫/g,"."));return Number.isFinite(n)?n:null};
        const bool=(v)=>v===true||v===1||String(v).toLowerCase()==="true"||String(v)==="1";
        const safeHtml=(v)=>String(v||"").slice(0,50000).replace(/<\s*(script|style|iframe|object|embed|form|meta|link)[^>]*>[\s\S]*?<\/\s*\1\s*>/gi,"").replace(/<\s*(script|style|iframe|object|embed|form|meta|link)[^>]*\/?\s*>/gi,"").replace(/\s+on[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi,"").replace(/(href|src)\s*=\s*(['"])\s*javascript:[\s\S]*?\2/gi,"$1=\"#\"");
        let imported=0,skipped=0;
        for(const row of q.rows){
          const p=row.payload&&typeof row.payload==="object"?row.payload:{};
          const name=String(pick(p,["Title","Name","LoanName","LoanTitle","نام وام","عنوان وام"])||"").trim().slice(0,120);
          const title=String(pick(p,["PlanTitle","Title","Name","عنوان طرح","عنوان"])||name).trim().slice(0,160);
          if(!name){skipped++;continue}
          const rawMin=num(pick(p,["MinAmount","MinimumAmount","MinLoanAmount","AmountFrom","FromAmount","حداقل مبلغ"]));
          const rawMax=num(pick(p,["MaxAmount","MaximumAmount","MaxLoanAmount","AmountTo","ToAmount","حداکثر مبلغ"]));
          const rawAmount=num(pick(p,["LoanAmount","Amount","AmountValue","مبلغ وام","مبلغ"]));
          const min=rawMin??rawAmount??0,max=rawMax??rawAmount??rawMin??0;
          const rate=num(pick(p,["ProfitPercent","InterestPercent","InterestRate","MonthlyInterest","AnnualInterest","RatePercent","درصد بهره","درصد سود","نرخ سود"]));
          const profitType=pick(p,["LoanProfitType","InterestMethod","InterestType","ProfitType","CalculationMethod","نوع سود","نحوه محاسبه سود"]);
          const methodText=String(profitType??"").toLowerCase();
          const method=/annual|year|سالانه|بانک/.test(methodText)||methodText==="1"?"Annual":/flat|once|یکجا/.test(methodText)?"Flat":"Monthly";
          const allowedRaw=pick(p,["AllowedInstallments","InstallmentOptions","RepaymentOptions"]);
          let allowed=[];try{const av=typeof allowedRaw==="string"?JSON.parse(allowedRaw):allowedRaw;if(Array.isArray(av))allowed=av.map(t=>num(typeof t==="object"?(t.value??t.months??t.Months??t.installments??t.Installments):t)).filter(n=>n!==null&&n>0&&n<=600).map(Math.trunc);else if(av!==null&&av!==undefined){const n=num(av);if(n>0&&n<=600)allowed=[Math.trunc(n)]}}catch{if(typeof allowedRaw==="string")allowed=allowedRaw.split(/[,;|\/\s]+/).map(num).filter(n=>n!==null&&n>0&&n<=600).map(Math.trunc)}
          const months=num(pick(p,["Months","InstallmentsCount","InstallmentCount","TermMonths","DurationMonths","MaxInstallments","تعداد اقساط","مدت ماه"]))??(allowed.length?Math.max(...allowed):null);
          let tiers=[];try{const av=typeof allowedRaw==="string"?JSON.parse(allowedRaw):allowedRaw;if(Array.isArray(av))tiers=av.map(t=>({months:num(typeof t==="object"?(t.value??t.months??t.Months??t.installments??t.Installments):t),feePercent:0,downPaymentPercent:0})).filter(t=>t.months!==null&&t.months>0&&t.months<=600)}catch{}
          if(!tiers.length&&months&&months>0)tiers=[{months:Math.trunc(months),feePercent:0,downPaymentPercent:0}];
          const stableSlug="legacy-"+crypto.createHash("sha256").update(sourceTable+"|"+row.legacy_id).digest("hex").slice(0,16);
          const description=String(pick(p,["PlanShortDescription","ShortDescription","Description","Summary","توضیحات"])||"").slice(0,500);
          const conditions={};
          let costs=[];try{const rawCosts=pick(p,["CostsJson","OperationalCostsJson","OperationalCosts"]);const parsed=typeof rawCosts==="string"?JSON.parse(rawCosts):rawCosts;if(Array.isArray(parsed))costs=parsed.map(c=>({title:String(c.title??c.Title??c.name??c.Name??"هزینه").slice(0,100),percent:num(c.percent??c.Percent??c.value??c.Value??c.amount??c.Amount)??0,months:num(c.months??c.Months)??null}))}catch{}const intervalDays=num(pick(p,["IntervalDays","InstallmentIntervalDays","فاصله اقساط"]))??0;const lateCoef=num(pick(p,["DelayPercent","LateDailyCoef","LatePenaltyDailyCoefficient"]))??0;const earlyCoef=num(pick(p,["EarlyPercent","EarlyDailyCoef","EarlyPaymentDailyCoefficient"]))??0;const ins=await pool.query("INSERT INTO loan_products(slug,name,title,description,badge,min_amount,max_amount,interval_days,tiers,conditions,documents,is_active,sort_order,interest_method,interest_percent,late_daily_coef,early_daily_coef,show_in_list,send_reminders,labels,full_description_html,operational_costs,legacy_source_table,legacy_id,legacy_payload,needs_review) VALUES($1,$2,$3,$4,'',$5,$6,$7,$8::jsonb,$9::jsonb,'[]'::jsonb,FALSE,$10,$11,$12,$13,$14,FALSE,FALSE,'[]'::jsonb,$15,$16::jsonb,$17,$18,$19::jsonb,TRUE) ON CONFLICT DO NOTHING RETURNING id",[stableSlug,name,title,description,min,max,intervalDays,JSON.stringify(tiers),JSON.stringify(conditions),1000+imported,method,rate??0,lateCoef,earlyCoef,safeHtml(pick(p,["PlanHtml","FullDescriptionHtml"])),JSON.stringify(costs),sourceTable,row.legacy_id,JSON.stringify(p)]);
          if(ins.rowCount)imported++;else skipped++;
        }
        return json(res,200,{imported,skipped,candidateTables:[sourceTable],message:imported?"تعریف‌های واقعی از جدول قدیمی وارد شدند؛ همه غیرفعال و نیازمند بررسی‌اند و در سایت عمومی نمایش داده نمی‌شوند.":"طرح جدیدی برای انتقال پیدا نشد؛ رکوردهای قبلی دست‌نخورده ماندند."});
      }
      if (req.method === "GET" && route === "/api/v1/admin/loan-products") {
        const q=await pool.query("SELECT * FROM loan_products ORDER BY sort_order,created_at DESC");
        return json(res,200,q.rows.map(loanRow));
      }
      if (req.method === "POST" && route === "/api/v1/admin/loan-products") {
        const b=cleanLoanInput(await body(req));
        const q=await pool.query("INSERT INTO loan_products(slug,name,title,description,badge,min_amount,max_amount,interval_days,tiers,conditions,documents,is_active,sort_order,interest_method,interest_percent,late_daily_coef,early_daily_coef,show_in_list,send_reminders,labels,full_description_html,operational_costs) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9::jsonb,$10::jsonb,$11::jsonb,$12,$13,$14,$15,$16,$17,$18,$19,$20::jsonb,$21,$22::jsonb) RETURNING id", [b.slug,b.name,b.title,b.description,b.badge,b.minAmount,b.maxAmount,b.intervalDays,JSON.stringify(b.tiers),JSON.stringify(b.conditions),JSON.stringify(b.documents),b.isActive,b.sortOrder,b.interestMethod,b.interestPercent,b.lateDailyCoef,b.earlyDailyCoef,b.showInList,b.sendReminders,JSON.stringify(b.labels),b.fullDescriptionHtml,JSON.stringify(b.operationalCosts)]);
        return json(res,201,{id:q.rows[0].id});
      }
      const loanToggle=route.match(/^\/api\/v1\/admin\/loan-products\/([0-9a-f-]{36})\/toggle$/i);
      if(req.method==="POST"&&loanToggle){const q=await pool.query("UPDATE loan_products SET is_active=NOT is_active,updated_at=NOW() WHERE id=$1 AND (is_active=TRUE OR needs_review=FALSE) RETURNING is_active",[loanToggle[1]]);if(q.rowCount)return json(res,200,{isActive:q.rows[0].is_active});const exists=await pool.query("SELECT needs_review FROM loan_products WHERE id=$1",[loanToggle[1]]);if(!exists.rowCount)return json(res,404,{message:"طرح وام پیدا نشد."});if(exists.rows[0].needs_review)return json(res,409,{message:"تعریف وام هنوز نیازمند بررسی است؛ ابتدا اطلاعات واقعی را تکمیل و ذخیره کنید."});return json(res,409,{message:"تغییر وضعیت انجام نشد."})}
      const loanEdit=route.match(/^\/api\/v1\/admin\/loan-products\/([0-9a-f-]{36})$/i);
      if(req.method==="PUT"&&loanEdit){
        const b=cleanLoanInput(await body(req));
        const q=await pool.query("UPDATE loan_products SET slug=$1,name=$2,title=$3,description=$4,badge=$5,min_amount=$6,max_amount=$7,interval_days=$8,tiers=$9::jsonb,conditions=$10::jsonb,documents=$11::jsonb,is_active=$12,sort_order=$13,interest_method=$14,interest_percent=$15,late_daily_coef=$16,early_daily_coef=$17,show_in_list=$18,send_reminders=$19,labels=$20::jsonb,full_description_html=$21,operational_costs=$22::jsonb,needs_review=FALSE,updated_at=NOW() WHERE id=$23 RETURNING id", [b.slug,b.name,b.title,b.description,b.badge,b.minAmount,b.maxAmount,b.intervalDays,JSON.stringify(b.tiers),JSON.stringify(b.conditions),JSON.stringify(b.documents),b.isActive,b.sortOrder,b.interestMethod,b.interestPercent,b.lateDailyCoef,b.earlyDailyCoef,b.showInList,b.sendReminders,JSON.stringify(b.labels),b.fullDescriptionHtml,JSON.stringify(b.operationalCosts),loanEdit[1]]);
        return q.rowCount?json(res,200,{id:q.rows[0].id}):json(res,404,{message:"طرح وام پیدا نشد."});
      }

      if (req.method === "GET" && route === "/api/v1/admin/sms/settings") {
        const settings = await getKavenegarSettings();
        return json(res, 200, { data: { provider: "kavenegar", sender: settings.sender, configured: Boolean(settings.apiKey), maskedKey: settings.apiKey ? "••••••••••••••••" : "" } });
      }
      if (req.method === "POST" && route === "/api/v1/admin/sms/settings") {
        const b = await body(req); const apiKey = String(b.apiKey || "").trim(); const sender = String(b.sender || "").trim();
        if (apiKey && (apiKey.length < 20 || apiKey.length > 256)) return json(res, 400, { message: "کلید API معتبر نیست." });
        if (!/^\d{5,20}$/.test(sender)) return json(res, 400, { message: "شماره فرستنده باید فقط شامل ۵ تا ۲۰ رقم باشد." });
        if (JWT_SECRET.length < 32) return json(res, 503, { message: "کلید رمزنگاری امن سرور تنظیم نشده است." });
        const existing = await pool.query("SELECT api_key_encrypted FROM sms_provider_settings WHERE provider=$1 LIMIT 1", ["kavenegar"]);
        const encrypted = apiKey ? encryptSetting(apiKey) : (existing.rows[0]?.api_key_encrypted || null);
        if (!encrypted) return json(res, 400, { message: "کلید API کاوه‌نگار را وارد کنید." });
        await pool.query("INSERT INTO sms_provider_settings(provider,api_key_encrypted,sender,updated_by,updated_at) VALUES($1,$2,$3,$4,NOW()) ON CONFLICT(provider) DO UPDATE SET api_key_encrypted=EXCLUDED.api_key_encrypted,sender=EXCLUDED.sender,updated_by=EXCLUDED.updated_by,updated_at=NOW()", ["kavenegar", encrypted, sender, Number(admin.sub) || null]);
        await audit(req, "admin.sms_settings.updated", Number(admin.sub), { provider: "kavenegar", sender });
        return json(res, 200, { ok: true, data: { provider: "kavenegar", sender, configured: true, maskedKey: "••••••••••••••••" } });
      }
      if (req.method === "POST" && route === "/api/v1/admin/sms/test") {
        const b = await body(req); const phone = String(b.phone || "").trim(); const message = String(b.message || "").trim();
        if (!/^09\d{9}$/.test(phone)) return json(res, 400, { message: "شماره مقصد باید با 09 شروع شود و ۱۱ رقم باشد." });
        if (!message || message.length > 1000) return json(res, 400, { message: "متن آزمایشی باید بین ۱ تا ۱۰۰۰ نویسه باشد." });
        if (limited("sms-test:" + String(admin.sub))) return json(res, 429, { message: "تعداد تست‌ها زیاد است؛ ۱۵ دقیقه بعد دوباره تلاش کنید." });
        const messageId = await sendSmsText(phone, message);
        await audit(req, "admin.sms_test.sent", Number(admin.sub), { provider: "kavenegar", phone: maskPhone(phone), messageId });
        return json(res, 200, { ok: true, message: "کاوه‌نگار ارسال پیامک را پذیرفت.", messageId });
      }
      if (req.method === "GET" && route === "/api/v1/admin/summary") {
        const q = await pool.query("SELECT (SELECT COUNT(*) FROM users) AS users,(SELECT COUNT(*) FROM users WHERE lower(role) IN ('admin','superadmin')) AS admins,(SELECT COUNT(*) FROM legacy_customers) AS legacy_customers,(SELECT COUNT(*) FROM sms_templates) AS sms_templates,(SELECT COUNT(*) FROM sms_logs) AS sms_logs");
        const configured = Boolean(KAVENEGAR_API_KEY);
        return json(res, 200, { data: { ...q.rows[0], smsConfigured: configured } });
      }
      if (req.method === "GET" && route === "/api/v1/admin/users") {
        const q = await pool.query("SELECT id,username,phone,full_name,email,role,is_active,created_at,legacy_source FROM users ORDER BY created_at DESC,id DESC LIMIT 500");
        return json(res, 200, { data: q.rows });
      }
      if (req.method === "GET" && route === "/api/v1/admin/legacy-customers") {
        const q = await pool.query("SELECT legacy_id,name,mobile,email,customer_code,registered_at,expires_at,is_permanent,purchased,affiliate_code,parked_domain FROM legacy_customers ORDER BY registered_at DESC NULLS LAST");
        return json(res, 200, { data: q.rows });
      }
      if (req.method === "GET" && route === "/api/v1/admin/legacy-source-tables") {
        const q = await pool.query(
          "SELECT s.payload->>'sourceTable' AS source_table,COALESCE(d.row_count,0)::int AS row_count FROM legacy_source_data s LEFT JOIN (SELECT source_table,COUNT(*)::int AS row_count FROM legacy_source_data WHERE source_table<>'__legacy_schema__' GROUP BY source_table) d ON d.source_table=s.payload->>'sourceTable' WHERE s.source_table='__legacy_schema__' ORDER BY s.payload->>'sourceTable'"
        );
        return json(res, 200, { data: q.rows });
      }
      if (req.method === "GET" && route === "/api/v1/admin/legacy-source-data") {
        const sourceTable = String(url.searchParams.get("table") || "");
        if (!/^[A-Za-z0-9_.]{1,120}$/.test(sourceTable)) {
          return json(res, 400, { message: "نوع داده قدیمی معتبر نیست." });
        }
        const limit = Math.min(500, Math.max(1, Number.parseInt(url.searchParams.get("limit") || "500", 10) || 500));
        const offset = Math.max(0, Number.parseInt(url.searchParams.get("offset") || "0", 10) || 0);
        const q = await pool.query(
          "SELECT legacy_id,payload,imported_at FROM legacy_source_data WHERE source_table=$1 ORDER BY imported_at DESC,legacy_id LIMIT $2 OFFSET $3",
          [sourceTable, limit, offset]
        );
        return json(res, 200, { data: q.rows });
      }
      if (req.method === "GET" && route === "/api/v1/admin/beta-inquiries") {
        const q = await pool.query("SELECT id,reference,user_id,national_code,status,status_note,created_at FROM beta_inquiries ORDER BY created_at DESC LIMIT 500");
        return json(res,200,{data:q.rows});
      }
      if (req.method === "GET" && route === "/api/v1/admin/documents") {
        const q = await pool.query("SELECT id,user_id,kind,status,created_on,updated_at,review_note,fields::text AS fields_json,file_name,mime_type FROM customer_documents ORDER BY created_on DESC LIMIT 500");
        return json(res, 200, { data:q.rows });
      }
      if (req.method === "POST" && route === "/api/v1/admin/documents/review") {
        const b = await body(req); const id = String(b.id || "");
        const status = String(b.status || "");
        const note = String(b.note || "").trim().slice(0,2000);
        if (!/^[0-9a-f-]{36}$/i.test(id) || !["Verified","Rejected","Pending"].includes(status)) return json(res, 400, { message:"شناسه یا وضعیت مدرک معتبر نیست." });
        const q = await pool.query("UPDATE customer_documents SET status=$1,review_note=$2,updated_at=NOW() WHERE id=$3 RETURNING id,user_id,status", [status,note||null,id]);
        if (!q.rowCount) return json(res, 404, { message:"مدرک پیدا نشد." });
        await audit(req,"admin.documents.reviewed",Number(admin.sub)||null,{documentId:id,status});
        return json(res,200,{ok:true,data:q.rows[0]});
      }
      if (req.method === "GET" && route === "/api/v1/admin/contracts") {
        const q = await pool.query("SELECT id,user_id,title,number,status,expires_at,created_on,signed_at,rejected_at,rejection_note FROM customer_contracts ORDER BY created_on DESC LIMIT 500");
        return json(res,200,{data:q.rows});
      }
      if (req.method === "POST" && route === "/api/v1/admin/contracts/create") {
        const b = await body(req);
        const userId = Number(b.userId);
        const title = String(b.title||"").trim().slice(0,240);
        const number = String(b.number||"").trim().slice(0,120);
        const bodyHtml = String(b.bodyHtml||"").trim();
        const expiresAt = b.expiresAt ? new Date(b.expiresAt) : null;
        if (!Number.isSafeInteger(userId)||userId<1||!title||!number||!bodyHtml||bodyHtml.length>200000||(expiresAt&&!Number.isFinite(expiresAt.getTime()))) return json(res,400,{message:"اطلاعات قرارداد معتبر نیست."});
        const owner = await pool.query("SELECT id FROM users WHERE id=$1 AND is_active=TRUE",[userId]);
        if(!owner.rowCount) return json(res,404,{message:"کاربر فعال پیدا نشد."});
        const q=await pool.query("INSERT INTO customer_contracts(user_id,title,number,body_html,expires_at) VALUES($1,$2,$3,$4,$5) RETURNING id,title,number,status,created_on",[userId,title,number,bodyHtml,expiresAt?expiresAt.toISOString():null]);
        await audit(req,"admin.contracts.created",Number(admin.sub)||null,{contractId:q.rows[0].id,userId});
        return json(res,201,{ok:true,data:q.rows[0]});
      }
      if (req.method === "GET" && route === "/api/v1/admin/sms/templates") {
        const q = await pool.query("SELECT id,legacy_id,title,body,is_system,status,category,provider_panel,is_pattern_base,pattern_base_code,reject_reason,updated_at FROM sms_templates ORDER BY id");
        return json(res, 200, { data: { items: q.rows, configured: Boolean(KAVENEGAR_API_KEY) } });
      }
      if (req.method === "POST" && route === "/api/v1/admin/sms/templates/update") {
        const b = await body(req); const id = Number(b.id); const title = String(b.title || "").trim(); const text = String(b.body || "").trim();
        if (!Number.isSafeInteger(id) || id < 1 || !title || title.length > 200 || !text || text.length > 4000) return json(res, 400, { message: "عنوان و متن الگو معتبر نیست." });
        const q = await pool.query("UPDATE sms_templates SET title=$1,body=$2,status=$3,pattern_base_code=$4,updated_at=NOW() WHERE id=$5 RETURNING id,title,body,status,pattern_base_code", [title,text,Number.isInteger(Number(b.status))?Number(b.status):0,String(b.patternBaseCode||"").slice(0,500)||null,id]);
        if (!q.rowCount) return json(res, 404, { message: "الگوی پیامک پیدا نشد." });
        await audit(req, "admin.sms_template.updated", Number(admin.sub), { templateId: id });
        return json(res, 200, { data: q.rows[0] });
      }
      if (req.method === "POST" && route === "/api/v1/admin/sms/test") {
        const b = await body(req); const phone = String(b.phone || ""); const text = String(b.message || "").trim();
        if (!phoneOk(phone) || !text || text.length > 1000) return json(res, 400, { message: "شماره موبایل یا متن پیام معتبر نیست." });
        try {
          const messageId = await sendSmsText(phone, text);
          await pool.query("INSERT INTO sms_logs(recipient_masked,status,provider_message_id,created_by) VALUES($1,'sent',$2,$3)", [maskPhone(phone),messageId,Number(admin.sub)||null]);
          await audit(req, "admin.sms.test.sent", Number(admin.sub), { recipient: maskPhone(phone) });
          return json(res, 200, { ok: true, message: "درخواست ارسال پیامک به سرویس‌دهنده تحویل شد." });
        } catch (e) {
          await pool.query("INSERT INTO sms_logs(recipient_masked,status,error_code,created_by) VALUES($1,'failed',$2,$3)", [maskPhone(phone),String(e.code||"sms_delivery_failed").slice(0,80),Number(admin.sub)||null]).catch(()=>{});
          throw e;
        }
      }
      if (req.method === "GET" && route === "/api/v1/admin/sms/logs") {
        const q = await pool.query("SELECT id,template_id,recipient_masked,status,provider_message_id,error_code,created_at FROM sms_logs ORDER BY created_at DESC LIMIT 100");
        return json(res, 200, { data: q.rows });
      }
      return json(res, 404, { message: "مسیر مدیریت پیدا نشد." });
    }
    if (req.method === "POST" && route === "/api/v1/beta/inquiry") {
      const userId = authenticatedUserId(req);
      if (!userId) return json(res, 401, { message: "برای استعلام ابتدا وارد حساب شوید." });
      const b = await body(req);
      const nationalCode = String(b.nationalCode || "").replace(/[۰-۹]/g,d=>"۰۱۲۳۴۵۶۷۸۹".indexOf(d)).replace(/[٠-٩]/g,d=>"٠١٢٣٤٥٦٧٨٩".indexOf(d));
      if (b.consent !== true) return json(res, 400, { message: "رضایت استعلام بانکی باید تأیید شود." });
      if (!nationalCodeOk(nationalCode)) return json(res, 400, { message: "کد ملی معتبر نیست." });
      const user = await pool.query("SELECT national_code FROM users WHERE id=$1 AND is_active=TRUE", [userId]);
      if (!user.rowCount) return json(res, 401, { message: "حساب کاربری فعال پیدا نشد." });
      if (String(user.rows[0].national_code || "").trim() !== nationalCode) {
        return json(res, 400, { message: "کد ملی واردشده با کد ملی ثبت‌شده در حساب یکسان نیست." });
      }
      const reference = "BETA-" + crypto.randomBytes(4).toString("hex").toUpperCase();
      const statusNote = "درخواست و رضایت ثبت شد؛ اتصال API رسمی بانک رفاه تنظیم نشده و استعلام به بانک ارسال نشده است.";
      const q = await pool.query(
        "INSERT INTO beta_inquiries(reference,user_id,national_code,status,status_note) VALUES($1,$2,$3,'pending_provider',$4) RETURNING reference,status,status_note,created_at",
        [reference,userId,nationalCode,statusNote]
      );
      await audit(req,"beta.inquiry.created",userId,{reference});
      return json(res,202,{data:{ref:q.rows[0].reference,status:q.rows[0].status,message:q.rows[0].status_note,createdAt:q.rows[0].created_at}});
    }
    if (route.startsWith("/api/v1/me/documents")) {
      const userId = authenticatedUserId(req);
      if (!userId) return json(res, 401, { message: "برای مشاهده مدارک وارد حساب شوید." });
      if (req.method === "GET" && route === "/api/v1/me/documents") {
        const q = await pool.query(
          "SELECT id,kind,status,created_on AS \"createdOn\",review_note AS \"reviewNote\",fields::text AS \"fieldsJson\",ocr_text AS \"ocrText\",file_name AS \"fileName\" FROM customer_documents WHERE user_id=$1 ORDER BY created_on DESC",
          [userId]
        );
        return json(res, 200, { data: q.rows });
      }
      if (req.method === "POST" && route === "/api/v1/me/documents") {
        const { fields, file } = await multipartBody(req);
        const kind = String(fields.kind || "").trim();
        if (!["کارت ملی","شناسنامه","فیش حقوقی","سایر"].includes(kind)) return json(res, 400, { message: "نوع مدرک معتبر نیست." });
        if (!file || !file.data.length) return json(res, 400, { message: "فایل مدرک انتخاب نشده است." });
        if (file.data.length > 6_000_000) return json(res, 413, { message: "حجم عکس حداکثر ۶ مگابایت است." });
        if (!["image/jpeg","image/png","image/webp"].includes(file.mime)) return json(res, 415, { message: "فقط تصویر JPG، PNG یا WEBP پذیرفته می‌شود." });
        const safeName = String(file.name || "document").replace(/[\\/\\r\\n\0]/g,"_").slice(0,255) || "document";
        const q = await pool.query(
          "INSERT INTO customer_documents(user_id,kind,file_name,mime_type,file_data,fields) VALUES($1,$2,$3,$4,$5,$6::jsonb) RETURNING id",
          [userId,kind,safeName,file.mime,file.data,JSON.stringify({fields:{fullName:"",nationalCode:""}})]
        );
        await audit(req, "documents.uploaded", userId, { documentId:q.rows[0].id, kind, size:file.data.length });
        return json(res, 201, { ok:true, ocr:false, id:q.rows[0].id });
      }
      const fileMatch = route.match(/^\/api\/v1\/me\/documents\/([0-9a-f-]+)\/file$/i);
      if (req.method === "GET" && fileMatch) {
        const q = await pool.query("SELECT mime_type,file_data FROM customer_documents WHERE id=$1 AND user_id=$2", [fileMatch[1],userId]);
        if (!q.rowCount) return json(res, 404, { message: "فایل مدرک پیدا نشد." });
        res.writeHead(200, { "Content-Type":q.rows[0].mime_type, "Cache-Control":"no-store", "X-Content-Type-Options":"nosniff" });
        return res.end(q.rows[0].file_data);
      }
      const fieldsMatch = route.match(/^\/api\/v1\/me\/documents\/([0-9a-f-]+)\/fields$/i);
      if (req.method === "PUT" && fieldsMatch) {
        const b = await body(req);
        if (!b.fields || typeof b.fields !== "object" || Array.isArray(b.fields)) return json(res, 400, { message: "اطلاعات مدرک معتبر نیست." });
        const q = await pool.query("UPDATE customer_documents SET fields=$1::jsonb,updated_at=NOW() WHERE id=$2 AND user_id=$3 AND status<>'Verified' RETURNING id", [JSON.stringify(b.fields),fieldsMatch[1],userId]);
        if (!q.rowCount) return json(res, 404, { message: "مدرک پیدا نشد یا تأیید نهایی شده است." });
        await audit(req, "documents.fields_updated", userId, { documentId:fieldsMatch[1] });
        return json(res, 200, { ok:true });
      }
      const idMatch = route.match(/^\/api\/v1\/me\/documents\/([0-9a-f-]+)$/i);
      if (req.method === "DELETE" && idMatch) {
        const q = await pool.query("DELETE FROM customer_documents WHERE id=$1 AND user_id=$2 AND status='Pending' RETURNING id", [idMatch[1],userId]);
        if (!q.rowCount) return json(res, 404, { message: "مدرک پیدا نشد یا دیگر قابل حذف نیست." });
        await audit(req, "documents.deleted", userId, { documentId:idMatch[1] });
        return json(res, 200, { ok:true });
      }
      return json(res, 404, { message: "مسیر مدارک پیدا نشد." });
    }
    if (route.startsWith("/api/v1/me/contracts")) {
      const userId = authenticatedUserId(req);
      if (!userId) return json(res, 401, { message: "برای مشاهده قراردادها وارد حساب شوید." });
      if (req.method === "GET" && route === "/api/v1/me/contracts") {
        const q = await pool.query("SELECT id,title,number,status,expires_at AS \"expiresAt\",created_on AS \"createdOn\" FROM customer_contracts WHERE user_id=$1 ORDER BY created_on DESC", [userId]);
        return json(res, 200, { data:q.rows });
      }
      const htmlMatch = route.match(/^\/api\/v1\/me\/contracts\/([0-9a-f-]+)\/html$/i);
      if (req.method === "GET" && htmlMatch) {
        const q = await pool.query("SELECT body_html FROM customer_contracts WHERE id=$1 AND user_id=$2", [htmlMatch[1],userId]);
        if (!q.rowCount) return json(res, 404, { message: "قرارداد پیدا نشد." });
        res.writeHead(200, { "Content-Type":"text/html; charset=utf-8", "Cache-Control":"no-store", "Content-Security-Policy":"default-src 'none'; style-src 'unsafe-inline'; img-src data:" });
        return res.end(q.rows[0].body_html);
      }
      const contractMatch = route.match(/^\/api\/v1\/me\/contracts\/([0-9a-f-]+)\/(sign|reject)$/i);
      if (contractMatch && req.method === "POST") {
        const action = contractMatch[2].toLowerCase();
        const b = await body(req);
        const status = action === "sign" ? "Signed" : "Rejected";
        const note = action === "reject" ? String(b.note || "").trim().slice(0,2000) : null;
        const q = await pool.query(
          "UPDATE customer_contracts SET status=$1,signed_at=CASE WHEN $1='Signed' THEN NOW() ELSE signed_at END,rejected_at=CASE WHEN $1='Rejected' THEN NOW() ELSE rejected_at END,rejection_note=$2,updated_at=NOW() WHERE id=$3 AND user_id=$4 AND status IN ('Presented','AwaitingSignature') AND (expires_at IS NULL OR expires_at>NOW()) RETURNING id",
          [status,note,contractMatch[1],userId]
        );
        if (!q.rowCount) return json(res, 404, { message: "قرارداد پیدا نشد یا دیگر قابل امضا نیست." });
        await audit(req, action === "sign" ? "contracts.signed" : "contracts.rejected", userId, { contractId:contractMatch[1] });
        return json(res, 200, { ok:true });
      }
      return json(res, 404, { message: "مسیر قراردادها پیدا نشد." });
    }
    if (req.method === "POST" && route === "/api/v1/security/password-reset/request") {
      const b = await body(req); const phone = String(b.phone || ""); const ip = clientIp(req) || "unknown";
      if (limited("reset:" + ip)) return json(res, 429, { message: "تلاش‌های زیاد؛ کمی بعد دوباره امتحان کنید." });
      if (!phoneOk(phone)) return json(res, 400, { message: "شماره موبایل معتبر نیست." });
      if (!await consumeCaptcha(b.captchaId, b.captchaAnswer)) return json(res, 400, { message: "کد امنیتی نامعتبر یا منقضی شده است." });
      if (OTP_PEPPER.length < 32) return json(res, 503, { message: "تنظیم امنیتی OTP موجود نیست." });
      const user = await pool.query("SELECT id FROM users WHERE phone=$1 AND is_active=TRUE LIMIT 1", [phone]);
      if (!user.rowCount) {
        await audit(req, "auth.password_reset.requested_unknown");
        resetLimit("reset:" + ip);
        return json(res, 200, { ok: true, message: "اگر شماره به حساب فعال متصل باشد، کد بازیابی ارسال می‌شود.", expiresIn: 120, resendIn: 60 });
      }
      const previous = await pool.query("SELECT resend_at FROM otp_challenges WHERE phone=$1 AND purpose='password_reset' AND consumed_at IS NULL ORDER BY created_at DESC LIMIT 1", [phone]);
      if (previous.rowCount && new Date(previous.rows[0].resend_at).getTime() > Date.now()) {
        return json(res, 429, { message: "برای ارسال مجدد کمی صبر کنید.", resendIn: Math.ceil((new Date(previous.rows[0].resend_at).getTime()-Date.now())/1000) });
      }
      const code = String(crypto.randomInt(100000,1000000)); const id = crypto.randomUUID();
      await sendOtp(phone, code);
      await pool.query("INSERT INTO otp_challenges(id,phone,purpose,code_hash,expires_at,resend_at) VALUES($1,$2,'password_reset',$3,NOW()+INTERVAL '2 minutes',NOW()+INTERVAL '60 seconds')", [id,phone,hash(code,OTP_PEPPER)]);
      await audit(req, "auth.password_reset.code_sent", user.rows[0].id);
      resetLimit("reset:" + ip);
      return json(res, 200, { ok:true, message:"کد بازیابی ارسال شد.", expiresIn:120, resendIn:60 });
    }
    if (req.method === "POST" && route === "/api/v1/security/password-reset/confirm") {
      const b = await body(req); const phone = String(b.phone || ""); const code = String(b.code || ""); const password = String(b.password || "");
      if (!phoneOk(phone) || !/^\d{6}$/.test(code)) return json(res, 400, { message: "شماره یا کد بازیابی معتبر نیست." });
      if (password.length < 10 || password.length > 128) return json(res, 400, { message: "رمز جدید باید بین ۱۰ تا ۱۲۸ نویسه باشد." });
      if (OTP_PEPPER.length < 32) return json(res, 503, { message: "تنظیم امنیتی OTP موجود نیست." });
      const result = await pool.query("SELECT * FROM otp_challenges WHERE phone=$1 AND purpose='password_reset' AND consumed_at IS NULL AND expires_at>NOW() ORDER BY created_at DESC LIMIT 1", [phone]);
      if (!result.rowCount) return json(res, 400, { message: "کد منقضی شده یا وجود ندارد." });
      const challenge = result.rows[0];
      if (challenge.attempts >= 5) return json(res, 429, { message: "تعداد تلاش مجاز تمام شده است." });
      if (hash(code,OTP_PEPPER) !== challenge.code_hash) {
        await pool.query("UPDATE otp_challenges SET attempts=attempts+1 WHERE id=$1", [challenge.id]);
        return json(res, 400, { message: "کد بازیابی نادرست است." });
      }
      const user = await pool.query("SELECT id FROM users WHERE phone=$1 AND is_active=TRUE LIMIT 1", [phone]);
      if (!user.rowCount) return json(res, 400, { message: "بازیابی برای این حساب ممکن نیست." });
      const passwordHash = await bcrypt.hash(password,12);
      await pool.query("BEGIN");
      try {
        await pool.query("UPDATE users SET password_hash=$1,updated_at=NOW() WHERE id=$2",[passwordHash,user.rows[0].id]);
        await pool.query("UPDATE otp_challenges SET consumed_at=NOW() WHERE id=$1",[challenge.id]);
        await audit(req,"auth.password_reset.completed",user.rows[0].id);
        await pool.query("COMMIT");
      } catch(e) { await pool.query("ROLLBACK"); throw e; }
      return json(res,200,{ok:true,message:"رمز عبور تغییر کرد. اکنون وارد شوید."});
    }
    if (req.method === "GET" && route === "/api/v1/security/captcha") {
      if (CAPTCHA_PEPPER.length < 32) return json(res, 503, { message: "تنظیم امنیتی کپچا موجود نیست." });
      const value = String(crypto.randomInt(10000, 100000)); const id = crypto.randomUUID();
      await pool.query("INSERT INTO captcha_challenges(id,answer_hash,expires_at) VALUES($1,$2,NOW()+INTERVAL '5 minutes')", [id, hash(value, CAPTCHA_PEPPER)]);
      return json(res, 200, { id, image: "data:image/svg+xml;base64," + Buffer.from(captchaSvg(value)).toString("base64") });
    }
    if (req.method === "POST" && route === "/api/v1/security/login") {
      const b = await body(req); const ip = clientIp(req) || "unknown";
      if (limited("login:" + ip)) return json(res, 429, { message: "تلاش‌های ناموفق زیاد بود. کمی بعد دوباره امتحان کنید." });
      if (!await consumeCaptcha(b.captchaId, b.captchaAnswer)) return json(res, 400, { message: "کد امنیتی نامعتبر یا منقضی شده است." });
      const username = String(b.username || "").trim().slice(0, 80);
      const password = String(b.password || "");
      // Prefer the exact account name or phone. The legacy "admin" alias is only a fallback,
      // otherwise it can accidentally select the bootstrap account instead of the real migrated admin.
      let result = await pool.query(
        "SELECT id,phone,full_name,username,password_hash,role,is_active FROM users WHERE phone=$1 OR lower(username)=lower($1) ORDER BY CASE WHEN lower(username)=lower($1) THEN 0 ELSE 1 END LIMIT 1",
        [username]
      );
      if (!result.rowCount && username.toLowerCase() === "admin") {
        result = await pool.query("SELECT id,phone,full_name,username,password_hash,role,is_active FROM users WHERE lower(username)='digibail-admin' LIMIT 1");
      }
      if (!result.rowCount || !result.rows[0].is_active) {
        await audit(req, "auth.login.failed"); return json(res, 401, { message: "نام کاربری یا رمز عبور نادرست است." });
      }
      const u = result.rows[0];
      let passwordValid = await verifyPassword(password, u.password_hash);
      let verifiedLegacyHash = null;
      if (!passwordValid) {
        // If a legacy identity collided with an existing modern username, verify against
        // the preserved ASP.NET Identity hash and upgrade only after a successful login.
        const legacy = await pool.query(
          "SELECT payload->>'PasswordHash' AS password_hash FROM legacy_source_data WHERE source_table LIKE '%AspNetUsers' AND (lower(COALESCE(payload->>'UserName',payload->>'username',''))=lower($1) OR COALESCE(payload->>'Mobile',payload->>'Phone',payload->>'mobile',payload->>'phone','')=$1) ORDER BY imported_at DESC LIMIT 1",
          [username]
        );
        if (legacy.rowCount && legacy.rows[0].password_hash) {
          verifiedLegacyHash = String(legacy.rows[0].password_hash);
          passwordValid = await verifyPassword(password, "aspnet:" + verifiedLegacyHash);
        }
      }
      if (!passwordValid) {
        await audit(req, "auth.login.failed"); return json(res, 401, { message: "نام کاربری یا رمز عبور نادرست است." });
      }
      resetLimit("login:" + ip);
      if (String(u.password_hash).startsWith("aspnet:") || verifiedLegacyHash) {
        const upgraded = await bcrypt.hash(password, 12);
        await pool.query("UPDATE users SET password_hash=$1,updated_at=NOW() WHERE id=$2", [upgraded, u.id]);
      }
      await audit(req, "auth.login.success", u.id);
      const token = tokenFor(u);
      return authJson(res, 200, token, { accessToken: token, user: { id: u.id, phone: u.phone, fullName: u.full_name, role: u.role } });
    }
    if (req.method === "POST" && route === "/api/v1/security/otp/request") {
      const b = await body(req); const phone = String(b.phone || ""); const purpose = b.purpose === "register" ? "register" : "login";
      if (!phoneOk(phone)) return json(res, 400, { message: "شماره موبایل معتبر نیست." });
      if (!await consumeCaptcha(b.captchaId, b.captchaAnswer)) return json(res, 400, { message: "کد امنیتی نامعتبر یا منقضی شده است." });
      const exists = await pool.query("SELECT id FROM users WHERE phone=$1", [phone]);
      if (purpose === "register" && exists.rowCount) return json(res, 409, { message: "این شماره قبلاً ثبت شده است." });
      if (purpose === "login" && !exists.rowCount) return json(res, 404, { message: "حسابی با این شماره پیدا نشد." });
      const previous = await pool.query("SELECT resend_at FROM otp_challenges WHERE phone=$1 AND purpose=$2 AND consumed_at IS NULL ORDER BY created_at DESC LIMIT 1", [phone, purpose]);
      if (previous.rowCount && new Date(previous.rows[0].resend_at).getTime() > Date.now()) {
        const seconds = Math.ceil((new Date(previous.rows[0].resend_at).getTime() - Date.now()) / 1000);
        return json(res, 429, { message: "برای ارسال مجدد کمی صبر کنید.", expiresIn: 120, resendIn: seconds });
      }
      if (OTP_PEPPER.length < 32) return json(res, 503, { message: "تنظیم امنیتی OTP موجود نیست." });
      const code = String(crypto.randomInt(100000, 1000000)); const id = crypto.randomUUID();
      await sendOtp(phone, code);
      await pool.query("INSERT INTO otp_challenges(id,phone,purpose,code_hash,expires_at,resend_at) VALUES($1,$2,$3,$4,NOW()+INTERVAL '2 minutes',NOW()+INTERVAL '60 seconds')", [id, phone, purpose, hash(code, OTP_PEPPER)]);
      await audit(req, "auth.otp.requested", exists.rows[0]?.id || null, { purpose });
      return json(res, 200, { ok: true, message: "کد ارسال شد", expiresIn: 120, resendIn: 60 });
    }
    if (req.method === "GET" && route === "/api/v1/security/otp/status") {
      const phone = String(url.searchParams.get("phone") || "");
      const result = await pool.query("SELECT GREATEST(0,EXTRACT(EPOCH FROM (expires_at-NOW())))::int AS expires_in,GREATEST(0,EXTRACT(EPOCH FROM (resend_at-NOW())))::int AS resend_in FROM otp_challenges WHERE phone=$1 AND consumed_at IS NULL ORDER BY created_at DESC LIMIT 1", [phone]);
      return json(res, 200, { expiresIn: result.rows[0]?.expires_in || 0, resendIn: result.rows[0]?.resend_in || 0 });
    }
    if (req.method === "POST" && route === "/api/v1/security/otp/verify") {
      const b = await body(req); const phone = String(b.phone || ""); const purpose = b.purpose === "register" ? "register" : "login";
      const result = await pool.query("SELECT * FROM otp_challenges WHERE phone=$1 AND purpose=$2 AND consumed_at IS NULL AND expires_at>NOW() ORDER BY created_at DESC LIMIT 1", [phone, purpose]);
      if (!result.rowCount) return json(res, 400, { message: "کد منقضی شده یا وجود ندارد." });
      const challenge = result.rows[0];
      if (challenge.attempts >= 5) return json(res, 429, { message: "تعداد تلاش مجاز تمام شده است." });
      if (OTP_PEPPER.length < 32 || hash(String(b.code || ""), OTP_PEPPER) !== challenge.code_hash) {
        await pool.query("UPDATE otp_challenges SET attempts=attempts+1 WHERE id=$1", [challenge.id]);
        return json(res, 400, { message: "کد تأیید نادرست است." });
      }
      await pool.query("UPDATE otp_challenges SET consumed_at=NOW() WHERE id=$1", [challenge.id]);
      if (purpose === "register") {
        if (JWT_SECRET.length < 32) return json(res, 503, { message: "تنظیم امنیتی توکن موجود نیست." });
        return json(res, 200, { ticket: jwt.sign({ purpose: "register", phone }, JWT_SECRET, { expiresIn: "10m", issuer: "digibail" }) });
      }
      const users = await pool.query("SELECT id,phone,full_name,role,is_active FROM users WHERE phone=$1", [phone]);
      if (!users.rowCount || !users.rows[0].is_active) return json(res, 404, { message: "حسابی با این شماره نیست." });
      const u = users.rows[0]; await audit(req, "auth.otp.login.success", u.id);
      const token = tokenFor(u);
      return authJson(res, 200, token, { accessToken: token, user: { id: u.id, phone: u.phone, fullName: u.full_name, role: u.role } });
    }
    if (req.method === "POST" && route === "/api/v1/security/register") {
      const b = await body(req);
      if (JWT_SECRET.length < 32) return json(res, 503, { message: "تنظیم امنیتی توکن موجود نیست." });
      let ticket;
      try { ticket = jwt.verify(String(b.ticket || ""), JWT_SECRET, { issuer: "digibail" }); }
      catch { return json(res, 400, { message: "تأیید شماره معتبر نیست؛ دوباره شماره را تأیید کنید." }); }
      if (ticket.purpose !== "register" || !phoneOk(ticket.phone)) return json(res, 400, { message: "مجوز ثبت‌نام معتبر نیست." });
      if (!await consumeCaptcha(b.captchaId, b.captchaAnswer)) return json(res, 400, { message: "کد امنیتی نامعتبر یا منقضی شده است." });
      const fullName = String(b.fullName || "").trim().replace(/\s+/g, " "); const nationalCode = String(b.nationalCode || "");
      const password = String(b.password || ""); const email = b.email ? String(b.email).trim().slice(0, 254) : null;
      if (fullName.length < 5 || fullName.length > 160) return json(res, 400, { message: "نام و نام خانوادگی را کامل وارد کنید." });
      if (!nationalCodeOk(nationalCode)) return json(res, 400, { message: "کد ملی معتبر نیست." });
      if (password.length < 10 || password.length > 128) return json(res, 400, { message: "رمز عبور باید حداقل ۱۰ نویسه باشد." });
      const passwordHash = await bcrypt.hash(password, 12);
      try {
        const created = await pool.query("INSERT INTO users(phone,full_name,national_code,email,password_hash) VALUES($1,$2,$3,$4,$5) RETURNING id,phone,full_name,role", [ticket.phone, fullName, nationalCode, email, passwordHash]);
        const u = created.rows[0]; await audit(req, "auth.register.success", u.id);
        const token = tokenFor(u);
        return authJson(res, 201, token, { accessToken: token, user: { id: u.id, phone: u.phone, fullName: u.full_name, role: u.role } });
      } catch (error) {
        if (error.code === "23505") return json(res, 409, { message: "شماره موبایل یا کد ملی قبلاً ثبت شده است." });
        throw error;
      }
    }
    if (req.method === "POST" && route === "/api/v1/security/register/ocr") return json(res, 501, { message: "سرویس OCR تا زمان اتصال ارائه‌دهنده و تنظیم کلید محرمانه فعال نیست." });
    if (route.startsWith("/api/")) return json(res, 404, { message: "مسیر API پیدا نشد." });
    return false;
  } catch (error) {
    const status = error.status || 500;
    if (status >= 500) console.error("api_error", { route, status, code: error.code || "internal_error" });
    return json(res, status, { message: status === 500 ? "خطای داخلی سرور." : error.message, code: error.code || undefined });
  }
}
export async function closePool() { await pool.end(); }
