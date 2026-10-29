import { loadEnvFile } from "node:process";
import { existsSync } from "node:fs";
// CLI commands share Next's local configuration; test fixtures explicitly disable it.
if (process.env.SKIP_ENV_FILES !== "true" && existsSync(".env.local"))
  loadEnvFile(".env.local");
