import { migrate, closePool } from "./backend/api.js";
import { spawn } from "node:child_process";
try {
  await migrate();
  console.log("Database migrations applied.");
} catch (error) {
  console.error("Database migration failed:", error.message);
  await closePool();
  process.exit(1);
}
await closePool();
const child = spawn(process.execPath, ["server.js"], { stdio: "inherit", env: process.env });
child.on("exit", code => { process.exitCode = code ?? 1; });
