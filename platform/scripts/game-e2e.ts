import { spawn } from "node:child_process";
import { mkdtempSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import assert from "node:assert/strict";
import { chromium } from "playwright-core";
const local = mkdtempSync(join(tmpdir(), "campus-game-"));
const base = "http://127.0.0.1:3158";
const server = spawn(process.execPath, [".next/standalone/server.js"], {
  env: {
    PATH: process.env.PATH,
    NODE_ENV: "production",
    SKIP_ENV_FILES: "true",
    LOCAL_DB_PATH: join(local, "local.sqlite"),
    HOSTNAME: "127.0.0.1",
    PORT: "3158",
  },
  stdio: "ignore",
});
let browser;
try {
  for (let i = 0; i < 60; i++) {
    try {
      await fetch(base);
      break;
    } catch {
      await new Promise((r) => setTimeout(r, 250));
    }
  }
  browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
    args: ["--no-sandbox", "--disable-dev-shm-usage"],
  });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1100 },
    permissions: ["clipboard-read", "clipboard-write"],
  });
  const page = await context.newPage();
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  const route =
    "/campus-battle?a=" +
    encodeURIComponent("컴퓨터공학과") +
    "&b=" +
    encodeURIComponent("경영학과") +
    "&seed=42";
  await page.goto(base + route);
  await page.getByText("친구가 보낸 대결입니다.", { exact: false }).waitFor();
  mkdirSync(".data/test-artifacts", { recursive: true });
  await page.screenshot({
    path: ".data/test-artifacts/campus-desktop.png",
    fullPage: true,
  });
  await page
    .getByRole("button", { name: "대결 시작하기", exact: false })
    .click();
  await page.getByRole("button", { name: "잠깐 멈추기", exact: false }).click();
  await page.getByText("잠깐 쉬어가는 중", { exact: true }).waitFor();
  await page
    .getByRole("button", { name: "이어서 대결하기", exact: false })
    .click();
  await page.getByRole("button", { name: "재생 속도 변경" }).click();
  await page.locator(".result-overlay").waitFor({ timeout: 35000 });
  const result = await page.locator(".result-overlay h2").textContent();
  assert.ok(
    (
      await Promise.all(
        (await page.getByRole("progressbar").all()).map((bar) =>
          bar.getAttribute("aria-valuenow"),
        ),
      )
    ).includes("0"),
  );
  await page.getByRole("button", { name: "링크 복사", exact: false }).click();
  const shared = await page.evaluate(() => navigator.clipboard.readText());
  assert.equal(new URL(shared).searchParams.get("seed"), "42");
  await page.goto(shared);
  await page.getByText("친구가 보낸 대결입니다.", { exact: false }).waitFor();
  await page
    .getByRole("button", { name: "대결 시작하기", exact: false })
    .click();
  // Speed persisted in this component across query reload only when mounted; select 2x explicitly.
  await page.getByRole("button", { name: "재생 속도 변경" }).click();
  await page.locator(".result-overlay").waitFor({ timeout: 35000 });
  assert.equal(await page.locator(".result-overlay h2").textContent(), result);
  await page.screenshot({
    path: ".data/test-artifacts/campus-result.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: "다른 학과 고르기" }).click();
  await page.getByLabel("우리 과 이름", { exact: true }).fill("");
  await page
    .getByRole("button", { name: "대결 시작하기", exact: false })
    .click();
  await page.getByText("두 학과 이름을 입력해주세요.").waitFor();
  await page.getByLabel("우리 과 이름", { exact: true }).fill("우리만의학과");
  await page.getByLabel("상대 과 이름", { exact: true }).fill("친구의학과");
  await page.setViewportSize({ width: 360, height: 800 });
  assert.equal(
    await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth,
    ),
    false,
  );
  await page.screenshot({
    path: ".data/test-artifacts/campus-mobile.png",
    fullPage: true,
  });
  assert.equal(errors.length, 0, errors.join("\n"));
  console.log(
    "PASS 게임 실제 종료·일시정지·2배속·링크 복사·공유 결과 재현·직접 입력 검증·360px·JS 오류0",
  );
} finally {
  await browser?.close();
  server.kill();
}
