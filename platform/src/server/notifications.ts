import { randomUUID } from "node:crypto";
import { AppError, Actor } from "./auth";
import { db, transaction } from "./db";
import { now, log, koreaDate } from "./service";
export async function dispatch(a: Actor, intakeLeadId?: string) {
  if (a.role !== "admin")
    throw new AppError(403, "관리자만 알림을 처리할 수 있습니다.");
  if (!process.env.RESEND_API_KEY || !process.env.EMAIL_FROM)
    return {
      mode: "preview",
      accepted: 0,
      message: "로컬 미리보기만 저장되어 있습니다. 실제 발송은 없습니다.",
    };
  let accepted = 0;
  const rows = await db.all(
    "SELECT id FROM notifications WHERE org_id=? AND state='PENDING' AND attempts<3" +
      (intakeLeadId ? " AND lead_id=? AND kind IN ('ACK','NEW_LEAD')" : "") +
      " ORDER BY created_at LIMIT 10",
    intakeLeadId ? [a.org_id, intakeLeadId] : [a.org_id],
  );
  for (const candidate of rows) {
    const claimed = await transaction(async (q) => {
      await q.run("UPDATE organizations SET name=name WHERE id=?", [a.org_id]);
      const [total] = await q.all(
        "SELECT COUNT(*) AS attempts FROM activity_logs WHERE org_id=? AND action='EMAIL_ATTEMPT_RESERVED' AND created_at>=?",
        [a.org_id, new Date(koreaDate() + "T00:00:00+09:00").toISOString()],
      );
      if (total.attempts >= 10) return null;
      const message = (
        await q.run(
          "UPDATE notifications SET state='SENDING',attempts=attempts+1,updated_at=? WHERE id=? AND org_id=? AND state='PENDING' RETURNING *",
          [now(), candidate.id, a.org_id],
        )
      )[0];
      if (message)
        await log(
          q,
          a,
          message.lead_id || message.id,
          "EMAIL_ATTEMPT_RESERVED",
          { notification: message.id },
        );
      return message;
    });
    if (!claimed) continue;
    if (["ACK", "APPROVAL_REQUEST", "REPORT_READY"].includes(claimed.kind)) {
      const [consent] = await db.all(
        "SELECT granted FROM consent_records WHERE lead_id=? AND org_id=? AND purpose='service_contact' ORDER BY created_at DESC LIMIT 1",
        [claimed.lead_id, a.org_id],
      );
      if (!consent?.granted) {
        await db.run(
          "UPDATE notifications SET state='FAILED',error='서비스 연락 동의 없음',updated_at=? WHERE id=? AND org_id=?",
          [now(), claimed.id, a.org_id],
        );
        continue;
      }
    }

    try {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        redirect: "error",
        headers: {
          Authorization: "Bearer " + process.env.RESEND_API_KEY,
          "Content-Type": "application/json",
          "Idempotency-Key": claimed.id,
        },
        body: JSON.stringify({
          from: process.env.EMAIL_FROM,
          ...(process.env.EMAIL_REPLY_TO || process.env.ADMIN_NOTIFICATION_EMAIL
            ? {
                reply_to:
                  process.env.EMAIL_REPLY_TO ||
                  process.env.ADMIN_NOTIFICATION_EMAIL,
              }
            : {}),
          to: [claimed.recipient],
          subject: claimed.subject,
          text: claimed.body,
        }),
        signal: AbortSignal.timeout(15000),
      });
      if (!response.ok) {
        await db.run(
          "UPDATE notifications SET state=?,error=?,updated_at=? WHERE id=? AND org_id=?",
          [
            response.status === 429
              ? "PENDING"
              : response.status < 500
                ? "FAILED"
                : "UNKNOWN",
            "제공자 HTTP " + response.status,
            now(),
            claimed.id,
            a.org_id,
          ],
        );
        continue;
      }
      const result = await response.json();
      if (!result.id) throw new Error("missing receipt");
      await db.run(
        "UPDATE notifications SET state='ACCEPTED',provider_id=?,updated_at=? WHERE id=? AND org_id=?",
        [result.id, now(), claimed.id, a.org_id],
      );
      await log(db, a, claimed.lead_id || randomUUID(), "EMAIL_ACCEPTED", {
        notification: claimed.id,
        delivered: false,
      });
      accepted++;
    } catch {
      await db.run(
        "UPDATE notifications SET state='UNKNOWN',error=?,updated_at=? WHERE id=? AND org_id=?",
        ["결과 불명 · 자동 재발송하지 않습니다.", now(), claimed.id, a.org_id],
      );
    }
  }
  return { accepted, deliveredVerified: false };
}
