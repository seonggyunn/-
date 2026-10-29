process.env.SKIP_ENV_FILES = "true";
import { test, after } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { randomBytes } from "node:crypto";
import { Pool } from "pg";
if (process.env.RUN_POSTGRES_TEST !== "1") {
  test(
    "PostgreSQL 별도 실행: RUN_POSTGRES_TEST=1 필요",
    { skip: true },
    () => {},
  );
} else {
  process.env.DATABASE_URL = readFileSync(
    ".data/postgres-test-url",
    "utf8",
  ).trim();
  const fixtureUrl = new URL(process.env.DATABASE_URL!);
  if (
    !["127.0.0.1", "localhost"].includes(fixtureUrl.hostname) ||
    fixtureUrl.port !== "55439"
  )
    throw new Error("격리된 로컬 PostgreSQL만 테스트에 사용합니다.");
  const adminPool = new Pool({ connectionString: process.env.DATABASE_URL });
  const databaseName = "hankan_test_" + randomBytes(6).toString("hex");
  await adminPool.query("CREATE DATABASE " + databaseName);
  fixtureUrl.pathname = "/" + databaseName;
  process.env.DATABASE_URL = fixtureUrl.toString();
  const roleName = "read_" + databaseName;
  delete process.env.RESEND_API_KEY;
  delete process.env.AI_API_KEY;
  const { migrate, db, closeDb } = await import("../src/server/db");
  const { provision } = await import("../src/server/auth");
  const s = await import("../src/server/service");
  await migrate();
  const admin = await provision(
    "pg-admin@example.invalid",
    "postgres-test-password-2026",
    "PG 관리자",
  );
  await db.run("INSERT INTO organizations(id,name,created_at) VALUES(?,?,?)", [
    "pg-other",
    "다른 조직",
    s.now(),
  ]);
  const other = await provision(
    "pg-other@example.invalid",
    "postgres-other-password-2026",
    "타 조직",
    "operator",
    "pg-other",
  );
  const a: any = { id: admin, org_id: "agency", role: "admin" },
    b: any = { id: other, org_id: "pg-other", role: "operator" };
  let lead = "";
  await test("실제 PostgreSQL에서 신청·동의·업무 트랜잭션", async () => {
    const r = await s.createLead({
      business: "PG 검증 가게",
      industry: "공방",
      contact: "검증",
      email: "pg-customer@example.invalid",
      services: ["google"],
      privacy: true,
      contact_consent: true,
      marketing: false,
    });
    lead = r.id!;
    assert.equal((await s.detail(a, lead)).consents.length, 3);
    assert.equal((await s.dashboard(a)).tasks.length, 1);
  });
  await test("PostgreSQL 조직 간 접근 차단", async () => {
    await assert.rejects(() => s.detail(b, lead));
    assert.equal((await s.dashboard(b)).leads.length, 0);
  });
  await test("PostgreSQL 업무 전이·진단·보고서 버전", async () => {
    await s.transition(a, lead, "leads", "DIAGNOSING");
    await s.audit(a, lead, {
      items: [
        {
          field: "주소",
          value: "고객 확인 필요",
          status: "CUSTOMER_CONFIRMATION_REQUIRED",
          source_url: "",
          evidence: "",
        },
      ],
    });
    const r = await s.report(a, lead);
    assert.equal(r.version, 1);
    assert.equal((await s.report(a, lead)).version, 2);
  });
  await test("PostgreSQL 승인 없는 변경은 실패·가짜 성공 없음", async () => {
    const c = await s.propose(a, lead, {
      platform: "google",
      field: "주소",
      old_value: "미표기",
      proposed_value: "고객 제안 주소",
      reason: "주소가 누락됨",
      evidence: "고객이 제공한 주소 안내 문서",
    });
    await assert.rejects(() =>
      s.execute(a, c.id, "임의의 성공을 주장하는 테스트 기록"),
    );
    assert.equal(
      (await s.detail(a, lead)).changes[0].execution_status,
      "NOT_EXECUTED",
    );
  });
  await test("PostgreSQL RLS 마이그레이션 적용 및 직접 익명 접근 차단", async () => {
    await db.run(
      readFileSync(
        "supabase/migrations/202610290002_private_access.sql",
        "utf8",
      ),
    );
    const rows = await db.all(
      "SELECT tablename,rowsecurity FROM pg_tables WHERE schemaname='public'",
    );
    assert.ok(rows.length >= 20);
    assert.ok(rows.every((r) => r.rowsecurity));
    await db.run("CREATE ROLE " + roleName + " NOLOGIN");
    await db.run("GRANT USAGE ON SCHEMA public TO " + roleName);
    await db.run("SET ROLE " + roleName);
    try {
      await assert.rejects(() => db.all("SELECT * FROM leads"));
    } finally {
      await db.run("RESET ROLE");
    }
    await assert.rejects(() =>
      db.run("UPDATE activity_logs SET action='forged'"),
    );
  });
  after(async () => {
    await closeDb();
    await adminPool.query("DROP DATABASE " + databaseName);
    await adminPool.query("DROP ROLE IF EXISTS " + roleName);
    await adminPool.end();
  });
}
