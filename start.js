import { migrate, closePool } from "./backend/api.js";
import { spawn } from "node:child_process";
const startedAt=Date.now();
console.log("LEGACY_API_BOOT=starting_database_migrations");
try {
  await migrate();
  console.log("LEGACY_API_BOOT=migrations_complete elapsed_ms="+(Date.now()-startedAt));
} catch (error) {
  console.error("LEGACY_API_BOOT=migration_failed elapsed_ms="+(Date.now()-startedAt),error?.stack||error?.message||error);
  await closePool();
  process.exit(1);
}
// Start the API listener after the schema is ready. Keep the migration pool alive
// until the API child has bound its listener; the parent remains responsible for shutdown.
const child = spawn(process.execPath, ["server.js"], { stdio: "inherit", env: process.env });
child.on("spawn",()=>console.log("LEGACY_API_BOOT=server_process_spawned"));
child.on("error",error=>console.error("LEGACY_API_BOOT=server_spawn_error",error?.stack||error));
child.on("exit", async code => {
  console.log("LEGACY_API_BOOT=server_process_exit code="+String(code));
  try { await closePool(); } catch (error) { console.error("Migration pool close failed:", error.message); }
  process.exitCode = code ?? 1;
});
