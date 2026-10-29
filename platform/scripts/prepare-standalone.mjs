import { cpSync, existsSync, mkdirSync } from "node:fs";
mkdirSync(".next/standalone/.next", { recursive: true });
cpSync(".next/static", ".next/standalone/.next/static", { recursive: true });
if (existsSync("public"))
  cpSync("public", ".next/standalone/public", { recursive: true });
console.log("Standalone 정적 자산 복사 완료");
// Playwright loads browsers.json and other assets dynamically; retain its complete package.
cpSync(
  "node_modules/playwright-core",
  ".next/standalone/node_modules/playwright-core",
  { recursive: true },
);
