import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  actor,
  AppError,
  checkOrigin,
  cookie,
  hash,
  login,
  rateLimit,
  passwordHash,
} from "../../../server/auth";
import { db, migrate, transaction } from "../../../server/db";
import * as service from "../../../server/service";
import { dispatch } from "../../../server/notifications";
import { reportHtml } from "../../../reports/render";
import {
  saveEvidence,
  evidence,
  pdf,
  processJobs,
} from "../../../server/storage";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
async function handle(req: NextRequest) {
  try {
    await migrate();
    const parts = new URL(req.url).pathname.slice(5).split("/"),
      [area, entity, operation] = parts;
    const method = req.method;
    let data: any = {};
    if (!["GET", "HEAD"].includes(method)) {
      checkOrigin(req);
      const maximum = area === "files" ? 1500000 : 50000;
      const length = Number(req.headers.get("content-length") || 0);
      if (length > maximum)
        throw new AppError(413, "입력 용량을 초과했습니다.");
      const text = await req.text();
      if (text.length > maximum)
        throw new AppError(413, "입력 용량을 초과했습니다.");
      try {
        data = JSON.parse(text || "{}");
      } catch {
        throw new AppError(400, "올바른 JSON 요청이 필요합니다.");
      }
    }
    if (area === "health") return NextResponse.json({ status: "ok" });
    if (area === "auth" && entity === "login" && method === "POST") {
      const d = z
        .object({ email: z.email(), password: z.string().max(256) })
        .parse(data);
      await rateLimit(
        "login-ip:" +
          hash(
            process.env.TRUST_PROXY_HEADERS === "true"
              ? req.headers.get("x-forwarded-for")?.split(",")[0] || "unknown"
              : "shared-origin",
          ),
        30,
        900,
      );
      const token = await login(d.email, d.password);
      return NextResponse.json(
        { ok: true },
        { headers: { "Set-Cookie": cookie(token) } },
      );
    }
    if (area === "intake" && method === "POST") {
      await rateLimit(
        "intake:" +
          hash(
            process.env.TRUST_PROXY_HEADERS === "true"
              ? req.headers.get("x-forwarded-for")?.split(",")[0] || "unknown"
              : "shared-origin",
          ),
        20,
      );
      if (data.email)
        await rateLimit("intake-email:" + String(data.email).toLowerCase(), 5);
      return NextResponse.json(await service.createLead(data), { status: 201 });
    }
    const a = await actor(req);
    if (area === "auth" && entity === "me") return NextResponse.json(a);
    if (area === "auth" && entity === "logout" && method === "POST") {
      const token = req.cookies.get("hankan_session")?.value;
      if (token) await db.run("DELETE FROM sessions WHERE id=?", [hash(token)]);
      return NextResponse.json(
        { ok: true },
        { headers: { "Set-Cookie": cookie("", 0) } },
      );
    }
    if (area === "auth" && entity === "password" && method === "POST") {
      const d = z.object({ password: z.string().min(12).max(256) }).parse(data);
      await transaction(async (q) => {
        await q.run(
          "UPDATE users SET password_hash=? WHERE id=? AND org_id=?",
          [passwordHash(d.password), a.id, a.org_id],
        );
        await q.run("DELETE FROM sessions WHERE user_id=?", [a.id]);
        await service.log(q, a, a.id, "PASSWORD_CHANGED", {});
      });
      return NextResponse.json(
        { ok: true },
        { headers: { "Set-Cookie": cookie("", 0) } },
      );
    }
    if (area === "files" && method === "POST")
      return NextResponse.json(await saveEvidence(a, data), { status: 201 });
    if (area === "files" && entity && method === "GET") {
      const f = await evidence(a, entity);
      return new NextResponse(new Uint8Array(f.content), {
        headers: {
          "Content-Type": f.file.content_type,
          "Content-Disposition":
            "attachment; filename*=UTF-8''" +
            encodeURIComponent(f.file.filename),
          "X-Content-Type-Options": "nosniff",
          "Cache-Control": "private, no-store",
        },
      });
    }
    if (area === "dashboard" && method === "GET")
      return NextResponse.json(await service.dashboard(a));
    if (area === "export" && method === "GET") {
      const d = await service.dashboard(a);
      const cell = (s: any) =>
        '"' +
        String(s ?? "")
          .replace(/^[=+@\-]/, "'$&")
          .replaceAll('"', '""') +
        '"';
      const csv =
        "\ufeff" +
        [
          ["신청ID", "상호", "담당자", "이메일", "상태", "접수일"],
          ...d.leads.map((l) => [
            l.id,
            l.business,
            l.contact,
            l.email,
            l.status,
            l.created_at,
          ]),
        ]
          .map((row) => row.map(cell).join(","))
          .join("\r\n");
      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": 'attachment; filename="leads.csv"',
        },
      });
    }
    if (area === "leads" && entity && method === "GET")
      return NextResponse.json(await service.detail(a, entity));
    if (area === "leads" && entity && method === "PATCH")
      return NextResponse.json(await service.updateLead(a, entity, data));
    if (
      area === "leads" &&
      entity &&
      operation === "transition" &&
      method === "POST"
    )
      return NextResponse.json(
        await service.transition(
          a,
          entity,
          "leads",
          z.enum(service.STATES as [string, ...string[]]).parse(data.status),
        ),
      );
    if (
      area === "tasks" &&
      entity &&
      operation === "transition" &&
      method === "POST"
    )
      return NextResponse.json(
        await service.transition(
          a,
          entity,
          "tasks",
          z.string().parse(data.status),
        ),
      );
    if (
      area === "leads" &&
      entity &&
      operation === "audit" &&
      method === "POST"
    )
      return NextResponse.json(await service.audit(a, entity, data));
    if (
      area === "leads" &&
      entity &&
      operation === "changes" &&
      method === "POST"
    )
      return NextResponse.json(await service.propose(a, entity, data));
    if (
      area === "leads" &&
      entity &&
      operation === "report" &&
      method === "POST"
    )
      return NextResponse.json(await service.report(a, entity));
    if (
      area === "leads" &&
      entity &&
      operation === "convert" &&
      method === "POST"
    )
      return NextResponse.json(await service.convert(a, entity));
    if (
      area === "leads" &&
      entity &&
      operation === "draft" &&
      method === "POST"
    )
      return NextResponse.json(await service.draft(a, entity, data));
    if (
      area === "changes" &&
      entity &&
      operation === "approve" &&
      method === "POST"
    )
      return NextResponse.json(await service.approve(a, entity, data));
    if (
      area === "changes" &&
      entity &&
      operation === "verify" &&
      method === "POST"
    )
      return NextResponse.json(
        await service.verifyChange(
          a,
          entity,
          z.string().min(10).max(4000).parse(data.evidence),
        ),
      );
    if (
      area === "changes" &&
      entity &&
      operation === "execute" &&
      method === "POST"
    )
      return NextResponse.json(
        await service.execute(
          a,
          entity,
          z.string().min(10).max(4000).parse(data.evidence),
        ),
      );
    if (
      area === "changes" &&
      entity &&
      operation === "request-approval" &&
      method === "POST"
    ) {
      const c = await service.owned(db, "proposed_changes", entity, a),
        l = await service.owned(db, "leads", c.lead_id, a);
      await transaction(async (q) => {
        await service.enqueue(
          q,
          a.org_id,
          l.id,
          "APPROVAL_REQUEST",
          l.email,
          "온라인 정보 변경 제안 확인 요청",
          `${c.platform}의 ${c.field} 변경을 제안합니다. 기존: ${c.old_value}\n제안: ${c.proposed_value}\n권한 있는 담당자의 확인과 별도 증빙 검증 후에만 작업합니다.`,
          "approval:" + c.id,
        );
        await service.log(q, a, l.id, "APPROVAL_REQUEST_PREPARED", {
          change: c.id,
        });
      });
      return NextResponse.json({ queued: true, sent: false });
    }
    if (
      area === "changes" &&
      entity &&
      operation === "revoke" &&
      method === "POST"
    ) {
      const c = await service.owned(db, "proposed_changes", entity, a);
      await transaction(async (q) => {
        await q.run(
          "UPDATE approvals SET revoked_at=? WHERE change_id=? AND org_id=? AND revoked_at IS NULL",
          [service.now(), entity, a.org_id],
        );
        await q.run(
          "UPDATE proposed_changes SET status='REVISION_REQUIRED' WHERE id=? AND org_id=?",
          [entity, a.org_id],
        );
        await service.log(q, a, c.lead_id, "APPROVAL_REVOKED", {
          change: entity,
        });
      });
      return NextResponse.json({ revoked: true });
    }
    if (
      area === "leads" &&
      entity &&
      operation === "withdraw-contact" &&
      method === "POST"
    )
      return NextResponse.json(await service.withdrawContact(a, entity));
    if (
      area === "notifications" &&
      entity &&
      operation === "activate" &&
      method === "POST"
    ) {
      if (a.role !== "admin")
        throw new AppError(403, "관리자 권한이 필요합니다.");
      if (!process.env.RESEND_API_KEY || !process.env.EMAIL_FROM)
        throw new AppError(
          503,
          "메일 제공자와 검증된 발신주소를 먼저 설정하세요.",
        );
      await service.owned(db, "notifications", entity, a);
      await db.run(
        "UPDATE notifications SET state='PENDING',updated_at=? WHERE id=? AND org_id=? AND state='PREVIEW'",
        [service.now(), entity, a.org_id],
      );
      return NextResponse.json({ queued: true, sent: false });
    }
    if (area === "contracts" && method === "POST")
      return NextResponse.json(await service.billing(a, data));
    if (area === "worker" && method === "POST") {
      if (a.role !== "admin")
        throw new AppError(403, "관리자만 실행할 수 있습니다.");
      return NextResponse.json({
        maintenance: await service.maintenance(a),
        jobs: await processJobs(a),
        notifications: await dispatch(a),
      });
    }
    if (
      area === "notifications" &&
      entity &&
      operation === "retry" &&
      method === "POST"
    ) {
      if (a.role !== "admin")
        throw new AppError(403, "관리자만 재시도할 수 있습니다.");
      await service.owned(db, "notifications", entity, a);
      await db.run(
        "UPDATE notifications SET state='PENDING',error='',updated_at=? WHERE id=? AND org_id=? AND state='FAILED' AND attempts<3",
        [service.now(), entity, a.org_id],
      );
      return NextResponse.json({ requested: true });
    }
    if (area === "reports" && entity && method === "GET") {
      const r = await service.owned(db, "reports", entity, a);
      const html = reportHtml(JSON.parse(r.content), r.version);
      if (operation === "pdf") {
        const buffer = await pdf(a, entity);
        return new NextResponse(new Uint8Array(buffer), {
          headers: {
            "Content-Type": "application/pdf",
            "Content-Disposition": 'attachment; filename="audit-report.pdf"',
            "Cache-Control": "private, no-store",
          },
        });
      }
      return new NextResponse(html, {
        headers: {
          "Content-Type": "text/html; charset=utf-8",
          "Cache-Control": "private, no-store",
          "Content-Security-Policy":
            "default-src 'none'; style-src 'unsafe-inline'; font-src 'self'; base-uri 'none'; frame-ancestors 'self'",
        },
      });
    }
    throw new AppError(404, "요청한 기능을 찾을 수 없습니다.");
  } catch (e) {
    if (e instanceof z.ZodError)
      return NextResponse.json(
        {
          error: "입력값을 확인하세요.",
          fields: e.issues.map((i) => i.path.join(".")),
        },
        { status: 400 },
      );
    if (e instanceof AppError)
      return NextResponse.json({ error: e.message }, { status: e.status });
    console.error(
      "요청 처리 실패:",
      e instanceof Error ? e.name : "UnknownError",
    );
    return NextResponse.json(
      { error: "처리 중 문제가 발생했습니다. 잠시 후 다시 시도하세요." },
      { status: 500 },
    );
  }
}
export const GET = handle;
export const POST = handle;
export const PATCH = handle;
