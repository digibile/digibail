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
function captchaSvg(value) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="170" height="56" viewBox="0 0 170 56"><rect width="170" height="56" rx="12" fill="#241047"/><path d="M0 12L170 42M10 50L150 5" stroke="#ffb629" stroke-opacity=".35" stroke-width="2"/><text x="85" y="38" text-anchor="middle" font-family="monospace" font-size="30" font-weight="700" letter-spacing="5" fill="#fff">${value}</text></svg>`;
}
async function sendOtp(phone, code) {
  if (!KAVENEGAR_API_KEY || !KAVENEGAR_TEMPLATE) throw Object.assign(new Error("ارسال پیامک پیکربندی نشده است؛ کلید و قالب کاوه‌نگار را در متغیرهای محرمانه تنظیم کنید."), { status: 503, code: "sms_provider_not_configured" });
  const url = `https://api.kavenegar.com/v1/${encodeURIComponent(KAVENEGAR_API_KEY)}/verify/lookup.json`;
  const form = new URLSearchParams({ receptor: phone, token: code, template: KAVENEGAR_TEMPLATE });
  const response = await fetch(url, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: form, signal: AbortSignal.timeout(10000) });
  const result = await response.json().catch(() => ({}));
  if (!response.ok || result?.return?.status !== 200) throw Object.assign(new Error("ارسال پیامک توسط سرویس‌دهنده تأیید نشد."), { status: 502, code: "sms_delivery_failed" });
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
    if (req.method === "GET" && route === "/api/v1/tenant/config") {
      return json(res, 200, { data: { name: BRAND_NAME, brand: { logoText: BRAND_NAME.slice(0, 1), primary: "#4a2a86", accent: "#ffb629" } } });
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
      const result = await pool.query("SELECT id,phone,full_name,password_hash,role,is_active FROM users WHERE (phone=$1 OR username=$1) LIMIT 1", [username]);
      if (!result.rowCount || !result.rows[0].is_active || !await bcrypt.compare(String(b.password || ""), result.rows[0].password_hash)) {
        await audit(req, "auth.login.failed"); return json(res, 401, { message: "نام کاربری یا رمز عبور نادرست است." });
      }
      resetLimit("login:" + ip); const u = result.rows[0]; await audit(req, "auth.login.success", u.id);
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
