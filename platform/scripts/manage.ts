import { randomBytes } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import { migrate, db } from "../src/server/db";
import { provision, Actor } from "../src/server/auth";
import { maintenance, now, log } from "../src/server/service";
import { processJobs } from "../src/server/storage";
import { dispatch } from "../src/server/notifications";
await migrate();
const command = process.argv[2];
if (command === "admin") {
  const email = process.env.ADMIN_EMAIL;
  if (!email) throw new Error("ADMIN_EMAIL을 지정하세요.");
  const password =
    process.env.ADMIN_PASSWORD || randomBytes(24).toString("base64url");
  await provision(
    email,
    password,
    process.env.ADMIN_NAME || "운영 관리자",
    process.env.ADMIN_ROLE || "admin",
    process.env.ADMIN_ORG_ID || "agency",
  );
  if (!process.env.ADMIN_PASSWORD) {
    mkdirSync(".data", { recursive: true, mode: 0o700 });
    writeFileSync(
      ".data/initial-admin.json",
      JSON.stringify({ email, password }),
      { mode: 0o600 },
    );
    console.log(
      "관리자 생성 완료. 초기 비밀번호: .data/initial-admin.json (공개·커밋 금지).",
    );
  } else console.log("관리자 생성 완료.");
} else if (command === "worker") {
  const rows = await db.all(
    "SELECT id,org_id,email,name,role FROM users WHERE role='admin'",
  );
  for (const a of rows as Actor[]) {
    console.log(
      JSON.stringify({
        org: a.org_id,
        maintenance: await maintenance(a),
        jobs: await processJobs(a),
        notifications: await dispatch(a),
      }),
    );
  }
} else if (command === "retention") {
  const cutoff = new Date(Date.now() - 30 * 86400000).toISOString();
  const rows = await db.all(
    "SELECT id,org_id FROM leads l WHERE l.updated_at<? AND l.status IN ('NEW','REJECTED','CANCELLED') AND NOT EXISTS(SELECT 1 FROM clients c WHERE c.lead_id=l.id) AND NOT EXISTS(SELECT 1 FROM activity_logs a WHERE a.entity_id=l.id AND a.org_id=l.org_id AND a.created_at>=?)",
    [cutoff, cutoff],
  );
  for (const l of rows) {
    await db.run(
      "UPDATE leads SET contact='삭제된 문의',email=?,phone='',notes='',internal_notes='',status='CANCELLED',updated_at=? WHERE id=? AND org_id=?",
      ["deleted-" + l.id + "@example.invalid", now(), l.id, l.org_id],
    );
    await db.run(
      "UPDATE notifications SET recipient='',body='',state=CASE WHEN state IN ('PREVIEW','PENDING') THEN 'FAILED' ELSE state END,error=CASE WHEN state IN ('PREVIEW','PENDING') THEN '보관기간 종료' ELSE error END,updated_at=? WHERE lead_id=? AND org_id=?",
      [now(), l.id, l.org_id],
    );
    await log(
      db,
      { id: "retention", org_id: l.org_id },
      l.id,
      "RETENTION_ANONYMIZED",
      {},
    );
  }
  console.log(
    "일반 문의 익명화:",
    rows.length,
    "건. 계약·승인 자료·백업은 별도 보관정책을 확인하세요.",
  );
} else console.log("스키마 마이그레이션 완료");
process.exit(0);
