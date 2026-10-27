import http from "node:http";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number.parseInt(process.env.PORT || "1631", 10);
const HOST = process.env.HOST || "0.0.0.0";
const ROUTES = new Map([
  ["/", "web/template-v3.html"],
  ["/index.html", "web/template-v3.html"],
  ["/login.html", "frontend/login.html"],
  ["/register.html", "frontend/register.html"],
  ["/documents.html", "web/documents.html"],
  ["/contracts.html", "web/contracts.html"],
  ["/panel.html", "backend/core/panel.html"],
  ["/healthz", null]
]);
const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".txt": "text/plain; charset=utf-8"
};

export function resolveRoute(urlPath) {
  if (urlPath === "/healthz") return null;
  return ROUTES.get(urlPath) ?? null;
}

const server = http.createServer(async (req, res) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "SAMEORIGIN");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Cache-Control", "no-store");

  const url = new URL(req.url || "/", "http://localhost");
  if (req.method !== "GET" && req.method !== "HEAD") {
    res.writeHead(405, { "Content-Type": "application/json; charset=utf-8", Allow: "GET, HEAD" });
    return res.end(JSON.stringify({ error: "method_not_allowed" }));
  }

  if (url.pathname === "/healthz") {
    res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
    return res.end(req.method === "HEAD" ? undefined : JSON.stringify({ status: "ok", port: PORT }));
  }

  // The GitHub preview deliberately does not pretend to implement the application's API.
  if (url.pathname === "/api" || url.pathname.startsWith("/api/")) {
    res.writeHead(501, { "Content-Type": "application/json; charset=utf-8" });
    return res.end(req.method === "HEAD" ? undefined : JSON.stringify({
      error: "backend_not_included",
      message: "The preview server serves frontend files only; the application backend is not bundled in this repository setup."
    }));
  }

  const relative = resolveRoute(url.pathname);
  if (!relative) {
    res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    return res.end(req.method === "HEAD" ? undefined : "Not found");
  }

  const target = path.resolve(ROOT, relative);
  if (!target.startsWith(ROOT + path.sep)) {
    res.writeHead(400);
    return res.end(req.method === "HEAD" ? undefined : "Bad request");
  }

  try {
    await stat(target);
    const body = await readFile(target);
    res.writeHead(200, { "Content-Type": MIME[path.extname(target)] || "application/octet-stream" });
    return res.end(req.method === "HEAD" ? undefined : body);
  } catch {
    res.writeHead(503, { "Content-Type": "text/plain; charset=utf-8" });
    return res.end(req.method === "HEAD" ? undefined : "Configured page is missing");
  }
});

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  server.listen(PORT, HOST, () => console.log(`Digibail preview listening on http://${HOST}:${PORT}`));
}
