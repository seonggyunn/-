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
delete process.env.AUTO_EMAIL_DISPATCH;
delete process.env.STORAGE_PROVIDER;
delete process.env.SUPABASE_SERVICE_ROLE_KEY;
delete process.env.APP_URL;
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
  // Verify disclosures with a pointer and keyboard, and actual slide content changes.
  const serviceMenu = page.getByRole("button", {
    name: "서비스 안내",
    exact: false,
  });
  await serviceMenu.hover();
  await page
    .getByRole("link", { name: /어떤 도움을 받을 수 있나요/ })
    .waitFor();
  assert.equal(await serviceMenu.getAttribute("aria-expanded"), "true");
  await page.keyboard.press("Escape");
  assert.equal(await serviceMenu.getAttribute("aria-expanded"), "false");
  await serviceMenu.focus();
  await page.keyboard.press("Enter");
  await page.keyboard.press("Tab");
  assert.ok(
    (await page.locator(":focus").textContent())?.includes("어떤 도움"),
  );
  await page.keyboard.press("Escape");
  assert.equal(
    await serviceMenu.evaluate((el) => el === document.activeElement),
    true,
  );
  await page.getByRole("button", { name: "다음 고민 보기" }).click();
  assert.ok((await page.locator("h1").textContent())?.includes("맛있는 메뉴"));
  await page.getByRole("button", { name: "다음 고민 보기" }).click();
  assert.ok((await page.locator("h1").textContent())?.includes("주차는요"));
  await page.getByRole("button", { name: "다음 고민 보기" }).click();
  assert.ok(
    (await page.locator("h1").textContent())?.includes("우리 가게의 매력"),
  );
  await page.getByRole("button", { name: "비용과 운영", exact: true }).click();
  await page
    .locator("summary", { hasText: "가격과 일정은 어떻게 정하나요?" })
    .click();
  assert.ok(
    (await page.locator("details[open]").textContent())?.includes(
      "견적으로 안내",
    ),
  );
  await page.getByRole("button", { name: /빠른 안내/ }).hover();
  await page
    .locator("#quick-help-panel")
    .getByRole("link", { name: /무료 진단 신청/ })
    .waitFor();
  await page.keyboard.press("Escape");
  await page.mouse.move(0, 0);
  await page.goto(base);
  await page.emulateMedia({ reducedMotion: "reduce" });
  assert.equal(
    await page
      .locator(".landing-copy")
      .evaluate((el) => getComputedStyle(el).animationName),
    "none",
  );
  await page.emulateMedia({ reducedMotion: "no-preference" });
  console.log(
    "PASS 펼침 메뉴 호버·키보드·Escape, 슬라이드 순환, FAQ 분류·답변, 빠른 안내, 모션 감소",
  );
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
  await page.getByRole("button", { name: "메뉴 열기", exact: true }).click();
  await page.getByRole("button", { name: "서비스 안내", exact: false }).click();
  await page.getByRole("link", { name: /어떤 도움을 받을 수 있나요/ }).click();
  await page.waitForURL(base + "/services");
  assert.equal(
    await page
      .getByRole("button", { name: "메뉴 열기", exact: true })
      .getAttribute("aria-expanded"),
    "false",
  );
  console.log("PASS 모바일 메뉴 터치 열기·하위 페이지 이동·닫기");
  await page.goto(base + "/free-audit");
  assert.equal(
    await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth,
    ),
    false,
  );
  console.log("PASS 모바일 홈페이지·신청 폼 가로 넘침 없음");
  // Check every public layout at a narrow mobile width; tables may scroll inside their region.
  await page.setViewportSize({ width: 360, height: 800 });
  for (const route of [
    "/",
    "/services",
    "/pricing",
    "/cases",
    "/faq",
    "/free-audit",
  ]) {
    await page.goto(base + route);
    assert.equal(
      await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth,
      ),
      false,
      route,
    );
  }
  assert.equal(
    await page
      .getByRole("checkbox", { name: "네이버 플레이스", exact: true })
      .count(),
    0,
  );
  await page.getByLabel("상호명", { exact: true }).fill("브라우저 검증 식당");
  await page
    .getByLabel("매장 지역·주소 또는 지도 링크", { exact: true })
    .fill("서울 광진구 가상의 테스트 주소 10");
  // Leave contact and every optional field empty, and keep '잘 모르겠음'.
  await page
    .getByLabel("회신 이메일", { exact: true })
    .fill("browser-customer@example.invalid");
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
  console.log("PASS 새 신청 필수 항목만·잘 모르겠음·담당자 생략·실제 저장");
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
  await page.getByText("담당자 미입력", { exact: false }).waitFor();
  assert.ok(
    (await page.locator(".intake-notes").textContent())?.includes(
      "서울 광진구 가상의 테스트 주소 10",
    ),
  );
  assert.ok(
    (await page.locator(".intake-notes").textContent())?.includes(
      "전체적으로 확인 요청",
    ),
  );
  await page.setViewportSize({ width: 1440, height: 1000 });
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
