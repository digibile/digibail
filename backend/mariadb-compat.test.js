import test from "node:test";
import assert from "node:assert/strict";
import { bindMariaParams, createMariaCompatPool, translateMariaSql } from "./mariadb-compat.js";

test("binds numbered placeholders in SQL occurrence order", () => {
  const bound = bindMariaParams("SELECT $2 AS second, $1 AS first, $2 AS again", ["a", "b"]);
  assert.equal(bound.sql, "SELECT ? AS second, ? AS first, ? AS again");
  assert.deepEqual(bound.values, ["b", "a", "b"]);
});

test("rejects missing numbered SQL parameters", () => {
  assert.throws(() => bindMariaParams("SELECT $3", ["a"]), /Invalid SQL parameter/);
});

test("translates nested JSON type and length functions", () => {
  const sql = translateMariaSql(
    "SELECT jsonb_typeof(CASE WHEN jsonb_typeof(lp.tiers)='array' THEN lp.tiers ELSE '[]'::jsonb END), jsonb_array_length(lp.tiers) FROM loan_products lp"
  );
  assert.match(sql, /LOWER\(JSON_TYPE\(CASE WHEN LOWER\(JSON_TYPE\(lp\.tiers\)\)='array' THEN lp\.tiers ELSE '\[\]' END\)\)/);
  assert.match(sql, /JSON_LENGTH\(lp\.tiers\)/);
  assert.doesNotMatch(sql, /jsonb_typeof|::jsonb|jsonb_array_length/i);
});

test("translates filtered aggregate and strips its PostgreSQL cast", () => {
  const sql = translateMariaSql(
    "SELECT COUNT(*) FILTER (WHERE is_active)::int AS active, COUNT(*) FILTER (WHERE needs_review)::int AS review FROM loan_products"
  );
  assert.match(sql, /SUM\(CASE WHEN is_active THEN 1 ELSE 0 END\) AS active/);
  assert.match(sql, /SUM\(CASE WHEN needs_review THEN 1 ELSE 0 END\) AS review/);
  assert.doesNotMatch(sql, /FILTER|::int/i);
});

test("translates upsert, JSON extraction, intervals, case-insensitive search and regular expressions", () => {
  const sql = translateMariaSql(
    "INSERT INTO sms_provider_settings(provider,api_key_encrypted) VALUES($1,$2) ON CONFLICT(provider) DO UPDATE SET api_key_encrypted=EXCLUDED.api_key_encrypted"
  );
  assert.match(sql, /ON DUPLICATE KEY UPDATE api_key_encrypted=VALUES\(api_key_encrypted\)/);
  const mixed = translateMariaSql(
    "SELECT payload->>'Mobile' FROM legacy_source_data WHERE name ILIKE $1 AND source_table ~* '^legacy' AND created_at>NOW()-INTERVAL '5 minutes'"
  );
  assert.match(mixed, /JSON_UNQUOTE\(JSON_EXTRACT\(payload, '\$\.Mobile'\)\)/);
  assert.match(mixed, /name LIKE \?/);
  assert.match(mixed, /source_table REGEXP/);
  assert.match(mixed, /INTERVAL 5 MINUTE/);
});

test("compat pool provides PostgreSQL-shaped rows for SELECT and INSERT RETURNING", async () => {
  const calls = [];
  const raw = {
    async query(sql, values) {
      calls.push({ sql, values });
      if (sql.startsWith("INSERT INTO users")) return [{ affectedRows: 1, insertId: 17 }, []];
      if (sql.startsWith("SELECT id FROM")) return [[{ id: 17 }], []];
      if (sql.startsWith("SELECT")) return [[{ id: 17, name: "test" }], []];
      return [{ affectedRows: 1, insertId: 0 }, []];
    },
    async getConnection() { throw new Error("connection not expected in this test"); },
    async end() {}
  };
  const db = createMariaCompatPool(raw);
  const selected = await db.query("SELECT id,name FROM users WHERE id=$1", [17]);
  assert.deepEqual(selected.rows, [{ id: 17, name: "test" }]);
  assert.equal(selected.rowCount, 1);

  const inserted = await db.query(
    "INSERT INTO users(username) VALUES($1) RETURNING id",
    ["sample"]
  );
  assert.deepEqual(inserted.rows, [{ id: 17 }]);
  assert.equal(inserted.rowCount, 1);
  assert.equal(calls.length, 3);
  assert.deepEqual(calls[0].values, [17]);
  assert.deepEqual(calls[1].values, ["sample"]);
  assert.deepEqual(calls[2].values, [17]);
});
