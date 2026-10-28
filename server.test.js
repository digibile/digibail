import test from "node:test";
import assert from "node:assert/strict";
import { resolveRoute } from "./server.js";

test("root maps to existing Persian storefront", () => {
  assert.equal(resolveRoute("/"), "web/template-v3.html");
});

test("supported pages map to repository files", () => {
  assert.equal(resolveRoute("/login.html"), "frontend/login.html");
  assert.equal(resolveRoute("/register.html"), "frontend/register.html");
  assert.equal(resolveRoute("/documents.html"), "web/documents.html");
  assert.equal(resolveRoute("/contracts.html"), "web/contracts.html");
  assert.equal(resolveRoute("/panel.html"), "backend/core/panel.html");
});

test("unknown and traversal paths do not map to files", () => {
  assert.equal(resolveRoute("/../../etc/passwd"), null);
  assert.equal(resolveRoute("/missing"), null);
  assert.equal(resolveRoute("/api/v1/security/login"), null);
});

test("health endpoint is handled separately from static pages", () => {
  assert.equal(resolveRoute("/healthz"), null);
});
