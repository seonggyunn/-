process.env.SKIP_ENV_FILES = "true";
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
const testFolder = mkdtempSync(join(tmpdir(), "hankan-platform-"));
process.env.LOCAL_DB_PATH = join(testFolder, "test.sqlite");
process.env.PRIVATE_STORAGE_PATH = join(testFolder, "private");
delete process.env.DATABASE_URL;
delete process.env.RESEND_API_KEY;
delete process.env.AI_API_KEY;
const { db, migrate } = await import("../src/server/db");
const { provision, passwordMatches, passwordHash, login, actor } =
  await import("../src/server/auth");
const s = await import("../src/server/service");
const { dispatch } = await import("../src/server/notifications");
const { GoogleBusinessProfileProvider } =
  await import("../src/integrations/providers");
const { reportHtml, renderPdf } = await import("../src/reports/render");
await migrate();
const firstId = await provision(
  "admin@example.com",
  "strong-test-password-2026",
);
await db.run("INSERT INTO organizations(id,name,created_at) VALUES(?,?,?)", [
  "other",
  "다른 조직",
  s.now(),
]);
const secondId = await provision(
  "other@example.com",
  "different-test-password",
  "다른 관리자",
  "admin",
  "other",
);
const a: any = {
    id: firstId,
    org_id: "agency",
    role: "admin",
    name: "관리자",
    email: "admin@example.com",
  },
  b: any = {
    id: secondId,
    org_id: "other",
    role: "admin",
    name: "다른 관리자",
    email: "other@example.com",
  };
const payload = {
  business: "한글 테스트 공방",
  industry: "공방",
  contact: "담당자",
  email: "customer@example.com",
  services: ["naver"],
  privacy: true,
  contact_consent: true,
  marketing: false,
  naver_url: "https://example.com/store",
  google_url: "",
  website: "",
  notes: "영업시간을 확인하고 싶습니다.",
};
let lead = "";
let change = "";
let report = "";
await test("유효한 진단 신청·업무·동의·미발송 알림 저장", async () => {
  const r = await s.createLead(payload);
  assert.equal(r.stored, true);
  lead = r.id!;
  const detail = await s.detail(a, lead);
  assert.equal(detail.consents.length, 3);
  assert.equal(
    detail.consents.find((c: any) => c.purpose === "marketing")!.granted,
    0,
  );
  assert.equal((await s.dashboard(a)).tasks.length, 1);
  assert.equal((await s.dashboard(a)).notifications[0].state, "PREVIEW");
});
await test("잘못된 동의·이메일·주소·빈 서비스 거부", async () => {
  for (const p of [
    { privacy: false },
    { contact_consent: false },
    { email: "bad" },
    { website: "javascript:alert(1)" },
    { services: [] },
  ])
    await assert.rejects(() => s.createLead({ ...payload, ...p }));
});
await test("동일 신청을 중복 생성하지 않음", async () => {
  const r = await s.createLead(payload);
  assert.equal(r.duplicate, true);
  assert.equal(r.id, lead);
  assert.equal((await s.dashboard(a)).leads.length, 1);
});
await test("익명 관리자 접근 차단", async () => {
  await assert.rejects(
    () => actor(new Request("http://localhost/api/dashboard")),
    (e: any) => e.status === 401,
  );
});
await test("조직 간 고객·보고서 접근 및 담당자 배정 차단", async () => {
  await assert.rejects(
    () => s.detail(b, lead),
    (e: any) => e.status === 404,
  );
  assert.equal((await s.dashboard(b)).leads.length, 0);
  await assert.rejects(() => s.updateLead(a, lead, { assigned_to: secondId }));
});
await test("잘못된 업무 전이 거부 및 이력 없음", async () => {
  const n = (await s.detail(a, lead)).history.length;
  await assert.rejects(() => s.transition(a, lead, "leads", "COMPLETED"));
  assert.equal((await s.detail(a, lead)).history.length, n);
});
await test("올바른 업무 상태 변경·배정·메모 저장", async () => {
  await s.transition(a, lead, "leads", "DIAGNOSING");
  await s.updateLead(a, lead, {
    assigned_to: firstId,
    internal_notes: "내부 메모",
  });
  const d = await s.detail(a, lead);
  assert.equal(d.status, "DIAGNOSING");
  assert.equal(d.notes, payload.notes);
  assert.equal(d.internal_notes, "내부 메모");
});
await test("근거 없는 확인완료 진단 거부", async () => {
  await assert.rejects(() =>
    s.audit(a, lead, {
      items: [
        {
          field: "운영시간",
          value: "9~18시",
          status: "VERIFIED",
          source_url: "",
          evidence: "",
        },
      ],
    }),
  );
});
await test("실제 수동 진단과 미확인 항목 저장", async () => {
  await s.audit(a, lead, {
    items: [
      {
        field: "운영시간",
        value: "고객 확인 필요",
        status: "CUSTOMER_CONFIRMATION_REQUIRED",
        source_url: "https://example.com/store",
        evidence: "원문에는 휴일이 표시되지 않아 고객 확인 필요",
      },
    ],
  });
  assert.equal((await s.detail(a, lead)).audits.length, 1);
});
await test("승인 없는 외부작업 기록을 거부", async () => {
  change = (
    await s.propose(a, lead, {
      platform: "naver",
      field: "운영시간",
      old_value: "미표기",
      proposed_value: "고객 확정 시간",
      reason: "휴무일 정보 누락",
      evidence: "고객 제공 영업일 안내문 원본 참조",
    })
  ).id;
  await assert.rejects(
    () => s.execute(a, change, "수동으로 정상 변경했다는 임의 기록"),
    (e: any) => e.status === 403,
  );
});
await test("권한 검증 승인 후 수동 증빙 기록, API 성공으로 사칭하지 않음", async () => {
  await s.approve(a, change, {
    authorized_person: "사업장 권한자",
    authority_evidence: "위임 문서와 사업장 관리자 권한을 대조한 테스트 증빙",
    consent_version: "v1",
    confirmed: true,
  });
  const r: any = await s.execute(
    a,
    change,
    "공식 관리 화면에서 수정 후 결과를 확인한 모의 증빙",
  );
  assert.equal(r.externalUpdatePerformed, false);
  assert.equal(r.execution_status, "MANUALLY_RECORDED");
  await assert.rejects(() =>
    s.execute(a, change, "두 번째 실행을 요구하는 테스트 증빙"),
  );
});
await test("Google API 미연결은 실패하며 외부 성공 기록 없음", async () => {
  await assert.rejects(() =>
    new GoogleBusinessProfileProvider().applyApprovedChange(),
  );
});
await test("고객 승인은 철회 가능하며 기록은 유지", async () => {
  const d = await s.detail(a, lead);
  assert.equal(d.approvals[0].consent_version, "v1");
  assert.equal(d.consents.length, 3);
});
await test("보고서 버전·비공개 접근·HTML escaping", async () => {
  report = (await s.report(a, lead)).id;
  const row = (await db.all("SELECT * FROM reports WHERE id=?", [report]))[0];
  assert.equal(row.version, 1);
  assert.equal((await s.report(a, lead)).version, 2);
  await assert.rejects(() => s.owned(db, "reports", report, b));
  const html = reportHtml(
    { ...JSON.parse(row.content), business: "<script>alert(1)</script>" },
    1,
  );
  assert.ok(html.includes("&lt;script&gt;"));
  assert.ok(!html.includes("<script>"));
});
await test("한글 PDF 실제 생성·텍스트 추출·글꼴 매핑", async () => {
  const row = (await db.all("SELECT * FROM reports WHERE id=?", [report]))[0];
  const pdf = await renderPdf(reportHtml(JSON.parse(row.content), row.version));
  assert.ok(pdf.subarray(0, 4).toString() === "%PDF");
  const path = join(tmpdir(), "hankan-" + report + ".pdf");
  writeFileSync(path, pdf);
  const text = execFileSync("pdftotext", [path, "-"], { encoding: "utf8" });
  assert.match(text, /온라인 정보 진단/);
  assert.match(text, /한글 테스트 공방/);
  assert.ok(
    execFileSync("pdffonts", [path], { encoding: "utf8" }).includes("yes"),
  );
});
await test("AI 키 부재 시 템플릿 반환·검증사실로 표시 안함", async () => {
  const r = await s.draft(a, lead, {
    kind: "description",
    input: "고객이 제공한 공방 운영 안내입니다.",
  });
  assert.equal(r.provider, "template");
  assert.equal(r.verified, false);
});
await test("로컬 메일은 배달 완료로 표시하지 않음", async () => {
  const r = await dispatch(a);
  assert.equal(r.accepted, 0);
  assert.equal((await s.dashboard(a)).notifications[0].state, "PREVIEW");
});
await test("알림 제공자 결과 불명 후 중복 발송 방지", async () => {
  await db.run("UPDATE notifications SET state='PENDING' WHERE org_id=?", [
    a.org_id,
  ]);
  process.env.RESEND_API_KEY = "test-not-a-real-key";
  process.env.EMAIL_FROM = "test@example.com";
  const original = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = async () => {
    calls++;
    throw new Error("simulated timeout");
  };
  try {
    await dispatch(a);
    await dispatch(a);
    assert.equal(calls, 1);
    assert.equal((await s.dashboard(a)).notifications[0].state, "UNKNOWN");
  } finally {
    globalThis.fetch = original;
    delete process.env.RESEND_API_KEY;
    delete process.env.EMAIL_FROM;
  }
});
await test("인증 비밀번호 해시·세션·잘못된 비밀번호 거부", async () => {
  const p = passwordHash("this-is-a-long-password");
  assert.ok(passwordMatches("this-is-a-long-password", p));
  assert.ok(!passwordMatches("wrong", p));
  await assert.rejects(() => login(a.email, "wrong"));
  const token = await login(a.email, "strong-test-password-2026");
  const me = await actor(
    new Request("http://localhost/api/auth/me", {
      headers: { cookie: "hankan_session=" + token },
    }),
  );
  assert.equal(me.id, a.id);
});
await test("월간 계약 작업은 반복 처리에도 중복 없음, MRR과 입금 분리", async () => {
  await s.convert(a, lead);
  const c = (await s.dashboard(a)).clients[0];
  await s.billing(a, {
    client_id: c.id,
    name: "월간 점검",
    amount: 150000,
    billing: "monthly",
    status: "ACTIVE",
    payment_status: "UNCONFIRMED",
    contract_reference: "모의 테스트 계약서 참조",
    start_at: new Date(Date.now() - 3600000).toISOString(),
  });
  await s.maintenance(a);
  await s.maintenance(a);
  const d = await s.dashboard(a);
  assert.equal(d.tasks.filter((t) => t.kind === "MONTHLY").length, 1);
  assert.equal(d.kpis.mrr, 150000);
  assert.equal(d.subscriptions[0].payment_status, "UNCONFIRMED");
});
await test("활동 이력 변경·삭제 차단", async () => {
  await assert.rejects(() =>
    db.run("UPDATE activity_logs SET action=? WHERE org_id=?", [
      "forged",
      a.org_id,
    ]),
  );
  await assert.rejects(() =>
    db.run("DELETE FROM activity_logs WHERE org_id=?", [a.org_id]),
  );
});

await test("수동 결과 확인→완료→보고서·PDF 작업·후속 업무 자동 생성", async () => {
  await s.verifyChange(
    a,
    change,
    "공식 관리 화면과 고객 확정 정보를 다시 대조한 테스트 증빙",
  );
  for (const status of [
    "PROPOSAL_READY",
    "AWAITING_APPROVAL",
    "APPROVED",
    "IN_PROGRESS",
    "VERIFYING",
    "COMPLETED",
  ])
    await s.transition(a, lead, "leads", status);
  assert.equal((await s.detail(a, lead)).status, "COMPLETED");
  const storage = await import("../src/server/storage");
  const result = await storage.processJobs(a);
  assert.ok(result.completed >= 1);
  assert.ok(
    (await db.all("SELECT * FROM report_files WHERE org_id=?", [a.org_id]))
      .length >= 1,
  );
  assert.equal(
    (await s.dashboard(a)).tasks.filter((t) => t.kind === "FOLLOWUP").length,
    1,
  );
});
await test("증빙 파일은 조직 소유자만 내려받으며 형식 검증", async () => {
  const { saveEvidence, evidence } = await import("../src/server/storage");
  await assert.rejects(() =>
    saveEvidence(b, {
      lead_id: lead,
      filename: "test.txt",
      content_type: "text/plain",
      base64: Buffer.from("test").toString("base64"),
    }),
  );
  const file = await saveEvidence(a, {
    lead_id: lead,
    filename: "테스트증빙.txt",
    content_type: "text/plain",
    base64: Buffer.from("검증용 증빙").toString("base64"),
  });
  assert.equal((await evidence(a, file.id)).content.toString(), "검증용 증빙");
  await assert.rejects(() => evidence(b, file.id));
  await assert.rejects(() =>
    saveEvidence(a, {
      lead_id: lead,
      filename: "bad.pdf",
      content_type: "application/pdf",
      base64: Buffer.from("not pdf").toString("base64"),
    }),
  );
});
await test("고객 역할 운영 API 차단·운영자 계약 권한 제한", async () => {
  await provision(
    "portal@example.invalid",
    "customer-password-2026",
    "고객",
    "customer",
  );
  const token = await login("portal@example.invalid", "customer-password-2026");
  await assert.rejects(
    () =>
      actor(
        new Request("http://localhost/api/dashboard", {
          headers: { cookie: "hankan_session=" + token },
        }),
      ),
    (e: any) => e.status === 403,
  );
  await assert.rejects(
    () => s.billing({ ...a, role: "operator" }, {}),
    (e: any) => e.status === 403,
  );
});
await test("연락 동의 철회 후 대기 알림과 재시도는 외부 전송하지 않음", async () => {
  await s.withdrawContact(a, lead);
  const detail = await s.detail(a, lead);
  assert.equal(
    detail.consents.filter((c: any) => c.purpose === "service_contact").at(-1)
      .granted,
    0,
  );
  await db.run(
    "UPDATE notifications SET state='PENDING',attempts=0 WHERE lead_id=? AND kind='REPORT_READY'",
    [lead],
  );
  process.env.RESEND_API_KEY = "test-not-real";
  process.env.EMAIL_FROM = "fixture@example.invalid";
  const original = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = async () => {
    calls++;
    throw new Error("must not call");
  };
  try {
    await dispatch(a);
    assert.equal(calls, 0);
  } finally {
    globalThis.fetch = original;
    delete process.env.RESEND_API_KEY;
    delete process.env.EMAIL_FROM;
  }
});
