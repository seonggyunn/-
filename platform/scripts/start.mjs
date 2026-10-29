import { loadEnvFile } from "node:process";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { spawn } from "node:child_process";
if (existsSync(".env.local")) loadEnvFile(".env.local");
const env = {
  ...process.env,
  HOSTNAME: process.env.APP_HOST || "127.0.0.1",
  LOCAL_DB_PATH: resolve(
    process.env.LOCAL_DB_PATH || ".data/operations.sqlite",
  ),
  PRIVATE_STORAGE_PATH: resolve(
    process.env.PRIVATE_STORAGE_PATH || ".data/private",
  ),
};
const child = spawn(process.execPath, [resolve(".next/standalone/server.js")], {
  env,
  stdio: "inherit",
});
for (const signal of ["SIGTERM", "SIGINT"])
  process.on(signal, () => child.kill(signal));
child.on("exit", (code) => process.exit(code ?? 1));
