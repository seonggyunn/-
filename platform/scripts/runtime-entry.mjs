import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

if (process.env.BOOTSTRAP_ADMIN === "true") {
  if (
    !process.env.DATABASE_URL ||
    !process.env.ADMIN_EMAIL ||
    !process.env.ADMIN_PASSWORD
  )
    throw new Error(
      "관리자 초기 설정에는 DATABASE_URL, ADMIN_EMAIL, ADMIN_PASSWORD가 필요합니다.",
    );
  const code = await new Promise((resolve) => {
    const setup = spawn(
      process.execPath,
      [fileURLToPath(new URL("./provision-runtime.mjs", import.meta.url))],
      {
        env: process.env,
        stdio: ["ignore", "inherit", "ignore"],
      },
    );
    setup.on("error", () => resolve(1));
    setup.on("exit", (value) => resolve(value ?? 1));
  });
  if (code !== 0)
    throw new Error(
      "관리자 초기 설정 실패. 환경변수를 확인하세요. 비밀값은 출력하지 않습니다.",
    );
}
const env = { ...process.env };
delete env.ADMIN_PASSWORD;
delete env.BOOTSTRAP_ADMIN;
const app = spawn(process.execPath, ["server.js"], { env, stdio: "inherit" });
for (const signal of ["SIGTERM", "SIGINT"])
  process.on(signal, () => app.kill(signal));
app.on("error", () => process.exit(1));
app.on("exit", (code) => process.exit(code ?? 1));
