import { createPool } from "mysql2/promise";

/**
 * Create the shared MariaDB connection pool.
 * Production credentials are read only from environment variables; this
 * module never falls back to a local or PostgreSQL database.
 */
export function createMariaDbPool(env = process.env, overrides = {}) {
  const database = env.MARIADB_DATABASE || "digibail_vamcitydigibilepay";
  const user = env.MARIADB_USER || "";
  const password = env.MARIADB_PASSWORD || "";

  if (!user || !password) {
    throw Object.assign(new Error("اتصال پایگاه داده اصلی تنظیم نشده است."), {
      status: 503,
      code: "mariadb_not_configured"
    });
  }

  const socketPath = env.MARIADB_SOCKET || "";
  const host = env.MARIADB_HOST || "127.0.0.1";
  const port = Number(env.MARIADB_PORT || 3306);

  return createPool({
    database,
    user,
    password,
    ...(socketPath ? { socketPath } : { host, port }),
    waitForConnections: true,
    connectionLimit: Number(env.MARIADB_CONNECTION_LIMIT || 5),
    queueLimit: 30,
    charset: "utf8mb4",
    supportBigNumbers: true,
    bigNumberStrings: true,
    connectTimeout: 8000,
    ...overrides
  });
}
