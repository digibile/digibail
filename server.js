import http from "node:http";
import path from "node:path";
import { readFile, stat } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dbHealth, handleApi, verifySession } from "./backend/api.js";

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number.parseInt(process.env.PORT || "1631", 10);
const HOST = process.env.HOST || "0.0.0.0";
const ROUTES = new Map([
  ["/", "web/template-v3.html"], ["/index.html", "web/template-v3.html"],
  ["/login.html", "backend/security/login-v2.html"], ["/register.html", "backend/security/register-v2.html"],
  ["/documents.html", "web/documents.html"], ["/contracts.html", "web/contracts.html"],
  ["/panel.html", "backend/core/panel.html"], ["/profile.html", "backend/core/panel.html"]
]);
const MIME = { ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".json": "application/json; charset=utf-8", ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg", ".webp": "image/webp", ".ico": "image/x-icon", ".txt": "text/plain; charset=utf-8" };

export function resolveRoute(urlPath) { return ROUTES.get(urlPath) ?? null; }
function send(res, status, type, value) {
  res.writeHead(status, { "Content-Type": type, "Cache-Control": "no-store" });
  res.end(value);
}

const server = http.createServer(async (req, res) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "SAMEORIGIN");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Cache-Control", "no-store");
  const url = new URL(req.url || "/", "http://localhost");

  if (url.pathname === "/healthz") {
    try {
      await dbHealth();
      return send(res, 200, "application/json; charset=utf-8", JSON.stringify({ status: "ok", database: "ok", port: PORT }));
    } catch {
      return send(res, 503, "application/json; charset=utf-8", JSON.stringify({ status: "degraded", database: "unavailable" }));
    }
  }
  if (url.pathname === "/api" || url.pathname.startsWith("/api/")) {
    if (req.method !== "GET" && req.method !== "POST") {
      res.setHeader("Allow", "GET, POST");
      return send(res, 405, "application/json; charset=utf-8", JSON.stringify({ message: "روش درخواست مجاز نیست." }));
    }
    const handled = await handleApi(req, res, url);
    if (handled !== false) return;
    return send(res, 404, "application/json; charset=utf-8", JSON.stringify({ message: "مسیر API پیدا نشد." }));
  }
  if (req.method !== "GET" && req.method !== "HEAD") {
    res.setHeader("Allow", "GET, HEAD");
    return send(res, 405, "application/json; charset=utf-8", JSON.stringify({ error: "method_not_allowed" }));
  }
  const relative = resolveRoute(url.pathname);
  if (url.pathname === "/panel.html" || url.pathname === "/profile.html") {
    const cookie = String(req.headers.cookie || "").split(";").map(v => v.trim()).find(v => v.startsWith("db_session="));
    const session = cookie ? verifySession(cookie.slice("db_session=".length)) : null;
    if (!session || !["admin", "superadmin"].includes(session.role)) {
      res.writeHead(302, { Location: "/login.html?next=%2Fpanel.html", "Cache-Control": "no-store" });
      return res.end();
    }
  }
  if (!relative) return send(res, 404, "text/plain; charset=utf-8", req.method === "HEAD" ? "" : "Not found");
  const target = path.resolve(ROOT, relative);
  if (!target.startsWith(ROOT + path.sep)) return send(res, 400, "text/plain; charset=utf-8", "Bad request");
  try {
    await stat(target);
    const content = await readFile(target);
    res.writeHead(200, { "Content-Type": MIME[path.extname(target)] || "application/octet-stream" });
    return res.end(req.method === "HEAD" ? undefined : content);
  } catch {
    return send(res, 503, "text/plain; charset=utf-8", "Configured page is missing");
  }
});

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  server.listen(PORT, HOST, () => console.log(`Digibail app listening on http://${HOST}:${PORT}`));
}
