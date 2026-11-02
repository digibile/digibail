import test from "node:test";
import assert from "node:assert/strict";
import { createMariaDbPool } from "../backend/db/mariadb.js";

test("MariaDB pool refuses to start without credentials", () => {
  assert.throws(
    () => createMariaDbPool({ MARIADB_DATABASE: "digibail_test" }),
    error => error.code === "mariadb_not_configured" && error.status === 503
  );
});

test("MariaDB pool connects and executes an isolated temporary-table roundtrip", async () => {
  const pool = createMariaDbPool({
    MARIADB_DATABASE: process.env.MARIADB_DATABASE || "digibail_test",
    MARIADB_USER: process.env.MARIADB_USER || "digibail_test",
    MARIADB_PASSWORD: process.env.MARIADB_PASSWORD || "ci-only-password",
    MARIADB_HOST: process.env.MARIADB_HOST || "127.0.0.1",
    MARIADB_PORT: process.env.MARIADB_PORT || "3306"
  });
  const connection = await pool.getConnection();
  try {
    const [identity] = await connection.query("SELECT DATABASE() AS db, VERSION() AS version");
    assert.equal(identity[0].db, process.env.MARIADB_DATABASE || "digibail_test");
    assert.match(identity[0].version, /^\d+\.\d+/);

    await connection.query("CREATE TEMPORARY TABLE mariadb_pool_probe (id INT NOT NULL PRIMARY KEY, value_text VARCHAR(40) NOT NULL)");
    await connection.execute("INSERT INTO mariadb_pool_probe(id,value_text) VALUES(?,?)", [1, "connection-ok"]);
    const [rows] = await connection.execute("SELECT value_text FROM mariadb_pool_probe WHERE id=?", [1]);
    assert.equal(rows[0].value_text, "connection-ok");
  } finally {
    connection.release();
    await pool.end();
  }
});
