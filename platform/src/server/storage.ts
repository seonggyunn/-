import { putObject, getObject } from "./object-store";
import { randomUUID, createHash } from "node:crypto";
import { Actor, AppError } from "./auth";
import { db, transaction } from "./db";
import { owned, now, enqueue, log } from "./service";
import { reportHtml, renderPdf } from "../reports/render";
export async function saveEvidence(a: Actor, raw: any) {
  await owned(db, "leads", String(raw.lead_id), a);
  const filename = String(raw.filename || "")
    .replace(/[\x00-\x1f\x7f/\\]/g, "")
    .slice(0, 180);
  if (
    !filename ||
    !["application/pdf", "image/png", "image/jpeg", "text/plain"].includes(
      raw.content_type,
    ) ||
    typeof raw.base64 !== "string" ||
    raw.base64.length > 1400000 ||
    !/^[A-Za-z0-9+/]*={0,2}$/.test(raw.base64)
  )
    throw new AppError(
      400,
      "PDF·PNG·JPEG·텍스트 1MB 이내 파일만 저장할 수 있습니다.",
    );
  const content = Buffer.from(raw.base64, "base64");
  if (content.length > 1048576 || !content.length)
    throw new AppError(413, "1MB 이내 파일을 선택하세요.");
  if (
    raw.content_type === "application/pdf" &&
    content.subarray(0, 4).toString() !== "%PDF"
  )
    throw new AppError(400, "PDF 형식을 확인하세요.");
  if (
    raw.content_type === "image/png" &&
    !content
      .subarray(0, 8)
      .equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
  )
    throw new AppError(400, "PNG 형식을 확인하세요.");
  if (
    raw.content_type === "image/jpeg" &&
    (content[0] !== 255 || content[1] !== 216)
  )
    throw new AppError(400, "JPEG 형식을 확인하세요.");
  const id = randomUUID();
  await putObject(a.org_id, id, content, raw.content_type);
  await transaction(async (q) => {
    await q.run(
      "INSERT INTO private_files(id,org_id,lead_id,filename,content_type,size,created_at) VALUES(?,?,?,?,?,?,?)",
      [
        id,
        a.org_id,
        raw.lead_id,
        filename,
        raw.content_type,
        content.length,
        now(),
      ],
    );
    await log(q, a, raw.lead_id, "PRIVATE_EVIDENCE_STORED", {
      fileId: id,
      size: content.length,
    });
  });
  return { id };
}
export async function evidence(a: Actor, id: string) {
  const file = await owned(db, "private_files", id, a);
  return {
    file,
    content: await getObject(a.org_id, file.id),
  };
}
export async function pdf(a: Actor, id: string) {
  const report = await owned(db, "reports", id, a);

  const [existing] = await db.all(
    "SELECT * FROM report_files WHERE report_id=? AND org_id=?",
    [id, a.org_id],
  );
  if (existing) return getObject(a.org_id, report.id + ".pdf");
  const content = await renderPdf(
    reportHtml(JSON.parse(report.content), report.version),
  );
  await putObject(
    a.org_id,
    report.id + ".pdf",
    content,
    "application/pdf",
    true,
  );
  await db.run(
    "INSERT INTO report_files(id,org_id,report_id,filename,sha256,created_at) VALUES(?,?,?,?,?,?) ON CONFLICT(report_id) DO NOTHING",
    [
      randomUUID(),
      a.org_id,
      id,
      report.id + ".pdf",
      createHash("sha256").update(content).digest("hex"),
      now(),
    ],
  );
  return content;
}
export async function processJobs(a: Actor) {
  if (a.role !== "admin") throw new AppError(403, "관리자 권한이 필요합니다.");
  const candidates = await db.all(
    "SELECT id FROM jobs WHERE org_id=? AND state IN ('PENDING','FAILED') AND attempts<3 ORDER BY created_at LIMIT 5",
    [a.org_id],
  );
  let completed = 0;
  for (const j of candidates) {
    const claim = await transaction(
      async (q) =>
        (
          await q.run(
            "UPDATE jobs SET state='PROCESSING',attempts=attempts+1 WHERE id=? AND org_id=? AND state IN ('PENDING','FAILED') RETURNING *",
            [j.id, a.org_id],
          )
        )[0],
    );
    if (!claim) continue;
    try {
      if (claim.kind !== "REPORT_PDF") throw new Error("unsupported job");
      await pdf(a, claim.entity_id);
      const report = await owned(db, "reports", claim.entity_id, a),
        lead = await owned(db, "leads", report.lead_id, a);
      await transaction(async (q) => {
        await q.run(
          "UPDATE jobs SET state='DONE',error='' WHERE id=? AND org_id=?",
          [j.id, a.org_id],
        );
        await enqueue(
          q,
          a.org_id,
          lead.id,
          "REPORT_READY",
          lead.email,
          "온라인 정보 진단 보고서가 준비되었습니다",
          "담당자가 작업 보고서를 준비했습니다. 비공개 보고서는 합의한 안전한 전달 경로로 안내합니다.",
          "report-ready:" + report.id,
        );
        await log(q, a, lead.id, "REPORT_PDF_STORED", { report: report.id });
      });
      completed++;
    } catch {
      await db.run(
        "UPDATE jobs SET state='FAILED',error=? WHERE id=? AND org_id=?",
        [
          "PDF 생성 실패. Chromium·한글 글꼴·저장소를 확인하세요.",
          j.id,
          a.org_id,
        ],
      );
    }
  }
  return { completed };
}
