process.env.SKIP_ENV_FILES = "true";
import { chromium } from "playwright-core";
import { spawn } from "node:child_process";
import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomBytes } from "node:crypto";
import assert from "node:assert/strict";
const folder = mkdtempSync(join(tmpdir(), "hankan-browser-"));
process.env.LOCAL_DB_PATH = join(folder, "e2e.sqlite");
process.env.PRIVATE_STORAGE_PATH = join(folder, "private");
delete process.env.DATABASE_URL;
delete process.env.RESEND_API_KEY;
delete process.env.AI_API_KEY;
const { migrate } = await import("../src/server/db");
const { provision } = await import("../src/server/auth");
await migrate();
const password = randomBytes(24).toString("base64url");
await provision("browser-admin@example.invalid", password, "검증 관리자");
const port = Number(process.env.E2E_PORT || 3128),
  base = "http://127.0.0.1:" + port;
const server = spawn(process.execPath, [".next/standalone/server.js"], {
  env: {
    ...process.env,
    NODE_ENV: "production",
    HOSTNAME: "127.0.0.1",
    PORT: String(port),
  },
  stdio: ["ignore", "pipe", "pipe"],
});
let serverErrors = "";
server.stderr.on(
  "data",
  (d) => (serverErrors = (serverErrors + String(d)).slice(-8000)),
);
let browser;
try {
  for (let i = 0; i < 90; i++) {
    try {
      const r = await fetch(base + "/api/health");
      if (r.ok) break;
    } catch {}
    if (i === 89) throw new Error("서버 기동 실패 " + serverErrors);
    await new Promise((r) => setTimeout(r, 500));
  }
  browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
    args: ["--no-sandbox", "--disable-dev-shm-usage"],
  });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
  });
  const page = await context.newPage();
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  for (const path of [
    "/",
    "/services",
    "/pricing",
    "/free-audit",
    "/how-it-works",
    "/cases",
    "/faq",
    "/contact",
    "/privacy",
    "/terms",
  ]) {
    const r = await page.goto(base + path);
    assert.equal(r?.status(), 200);
    await assert.doesNotReject(() => page.locator("h1").waitFor());
  }
  console.log("PASS 공개 경로10개 실제 응답·렌더링");
  await page.goto(base);
  mkdirSync(".data/test-artifacts", { recursive: true });
  await page.screenshot({
    path: ".data/test-artifacts/home-desktop.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  assert.equal(
    await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth,
    ),
    false,
  );
  await page.screenshot({
    path: ".data/test-artifacts/home-mobile.png",
    fullPage: true,
  });
  await page.goto(base + "/free-audit");
  assert.equal(
    await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth,
    ),
    false,
  );
  console.log("PASS 모바일 홈페이지·신청 폼 가로 넘침 없음");
  await page.getByLabel("상호명", { exact: true }).fill("브라우저 검증 공방");
  await page.getByLabel("업종", { exact: true }).fill("공방");
  await page.getByLabel("담당자 이름", { exact: true }).fill("검증 담당");
  await page
    .getByLabel("회신 이메일", { exact: true })
    .fill("browser-customer@example.invalid");
  await page
    .getByRole("checkbox", { name: "네이버 플레이스", exact: true })
    .check();
  await page.getByRole("checkbox", { name: /상담을 위한/ }).check();
  await page.getByRole("checkbox", { name: /신청 확인/ }).check();
  const intakeResponse = page.waitForResponse(
    (r) => r.url().endsWith("/api/intake") && r.request().method() === "POST",
  );
  await page
    .getByRole("button", { name: "무료 진단 신청하기", exact: true })
    .click();
  const intakeResult = await intakeResponse;
  const intakeBody = await intakeResult.json();
  assert.equal(intakeResult.status(), 201, JSON.stringify(intakeBody));
  assert.equal(intakeBody.stored, true);
  await page.getByRole("heading", { name: "신청이 저장되었습니다." }).waitFor();
  const leadId = await page.locator("code").textContent();
  assert.ok(leadId);
  console.log("PASS 실제 신청 저장·접수번호·미발송 안내");
  assert.equal(
    (await context.request.get(base + "/api/dashboard")).status(),
    401,
  );
  await page.goto(base + "/admin/login");
  await page
    .getByLabel("이메일", { exact: true })
    .fill("browser-admin@example.invalid");
  await page.getByLabel("비밀번호", { exact: true }).fill(password);
  await page.getByRole("button", { name: "로그인", exact: true }).click();
  await page.locator(".admin-main").waitFor();
  assert.equal(
    (await context.request.get(base + "/api/dashboard")).status(),
    200,
  );
  console.log("PASS 관리자 로그인·HttpOnly 세션·익명 차단");
  await page.goto(base + "/admin/leads/" + leadId);
  await page.getByRole("heading", { name: "수동 진단 기록" }).waitFor();
  await page
    .getByLabel("항목 (예: 운영시간)", { exact: true })
    .fill("운영시간");
  await page.getByLabel("확인값", { exact: true }).fill("미확인");
  await page
    .getByLabel("실제 확인 증빙", { exact: true })
    .fill("고객 확인을 기다리는 테스트 기록");
  await page
    .getByRole("button", { name: "진단 항목 저장", exact: true })
    .click();
  await page.locator("td", { hasText: "운영시간" }).waitFor();
  await page
    .getByRole("button", {
      name: "현재 진단으로 보고서 버전 생성",
      exact: true,
    })
    .click();
  await page.goto(base + "/admin/reports");
  const pdf = page.getByRole("link", { name: "PDF 다운로드", exact: true });
  await pdf.waitFor();
  const downloadPromise = page.waitForEvent("download");
  await pdf.click();
  const downloaded = await downloadPromise;
  await downloaded.saveAs(".data/test-artifacts/browser-report.pdf");
  console.log("PASS 관리자 진단 저장·보고서 생성·인증 PDF 다운로드");
  const foreign = await browser.newContext();
  assert.equal(
    (
      await foreign.request.get(
        base +
          "/api/reports/" +
          (
            await context.request
              .get(base + "/api/dashboard")
              .then((r) => r.json())
          ).reports[0].id,
      )
    ).status(),
    401,
  );
  assert.equal(errors.length, 0, errors.join("\n"));
  writeFileSync(
    ".data/test-artifacts/browser-summary.json",
    JSON.stringify(
      {
        publicPages: 10,
        mobile: true,
        intake: true,
        login: true,
        audit: true,
        privatePdf: true,
        javascriptErrors: errors,
        testRecordsIsolated: true,
      },
      null,
      2,
    ),
  );
  console.log("PASS 비공개 보고서 접근 차단·JavaScript 오류0");
  await foreign.close();
  await context.close();
} catch (e) {
  console.error("서버 진단:", serverErrors);
  throw e;
} finally {
  if (browser) await browser.close();
  server.kill("SIGTERM");
}
