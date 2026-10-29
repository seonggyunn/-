import { chromium } from "playwright-core";
const stateLabels: Record<string, string> = {
  VERIFIED: "원문·증빙 확인 완료",
  POSSIBLE_ISSUE: "문제 가능성",
  MISSING: "정보 누락",
  CUSTOMER_CONFIRMATION_REQUIRED: "고객 확인 필요",
  UNAVAILABLE: "확인 불가",
  AWAITING_APPROVAL: "승인 대기",
  APPROVED: "승인 확인",
  VERIFYING: "결과 확인 중",
  COMPLETED: "완료",
  REVISION_REQUIRED: "보완 필요",
  NOT_EXECUTED: "미실행",
  MANUALLY_RECORDED: "수동 작업 기록",
  VERIFIED_MANUAL: "수동 결과 확인",
};
const displayDate = (value: unknown) => {
  if (!value) return "미확인";
  const date = new Date(String(value));
  return Number.isNaN(date.getTime())
    ? String(value)
    : date.toLocaleString("ko-KR", { timeZone: "Asia/Seoul" });
};
export const escape = (v: unknown) =>
  String(v ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ]!,
  );
export function reportHtml(content: any, version: number) {
  return `<!doctype html><html lang="ko"><head><meta charset="utf-8"><title>온라인 정보 진단 보고서</title><style>body{font-family:'Noto Sans CJK KR','Noto Sans KR',sans-serif;color:#16243b;line-height:1.7;font-size:12px;margin:36px}h1{font-size:26px}h2{margin-top:28px;font-size:18px}table{border-collapse:collapse;width:100%;table-layout:fixed}td,th{border:1px solid #dce3ed;padding:9px;text-align:left;overflow-wrap:anywhere}th{background:#f0f4f9}tr{break-inside:avoid}small{color:#59667a}a{color:#2459a8}</style></head><body><small>한칸 운영실 · 보고서 버전 ${version}</small><h1>${escape(content.business)} 온라인 정보 진단</h1><p>담당 연락자: ${escape(content.contact)}<br>진단 기록일: ${escape(displayDate(content.date))}<br>완료일: ${escape(content.completion_date ? displayDate(content.completion_date) : "진행 중")}</p><h2>플랫폼 확인 방법</h2><p>네이버: 수동 확인 / 구글: 수동 확인 · 공식 API 미연결</p><h2>확인한 항목과 근거</h2><table><thead><tr><th>항목 / 상태</th><th>확인값·증빙</th></tr></thead><tbody>${content.items.map((i: any) => `<tr><td>${escape(i.field)}<br>${escape(stateLabels[i.status] || i.status)}</td><td>${escape(i.value)}<br>${escape(i.evidence)}<br>${escape(i.source_url)}<br>마지막 확인: ${escape(i.verified_at || "미확인")}</td></tr>`).join("")}</tbody></table><h2>변경 제안 · 승인 · 작업 기록</h2>${content.changes.length ? content.changes.map((c: any) => `<p><b>${escape(c.platform === "naver" ? "네이버" : "구글")} · ${escape(c.field)}</b><br>변경 전: ${escape(c.old_value)}<br>제안: ${escape(c.proposed_value)}<br>근거: ${escape(c.evidence)}<br>승인 상태: ${escape(stateLabels[c.status] || c.status)} / 실행: ${escape(stateLabels[c.execution_status] || c.execution_status)}<br>완료 증빙: ${escape(c.execution_evidence)}</p>`).join("") : "<p>변경 제안이 기록되지 않았습니다.</p>"}<h2>승인 증빙</h2>${(content.approvals || []).map((a: any) => `<p>승인권자: ${escape(a.authorized_person)} / 문안: ${escape(a.consent_version)} / 기록: ${escape(displayDate(a.approved_at))} / 철회: ${escape(a.revoked_at || "없음")}<br>${escape(a.authority_evidence)}</p>`).join("")}<h2>남은 확인·권장 조치</h2><p>${content.remaining.map(escape).join(", ") || "기록된 항목 기준 추가 확인 없음"}</p><p>수동 실행 기록은 운영자 제출 내용이며 플랫폼 API가 직접 확인한 결과가 아닙니다. 변경은 유효한 고객 권한과 승인을 확인한 뒤 수행합니다.</p></body></html>`;
}
export async function renderPdf(html: string) {
  const browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
    headless: true,
    args: ["--no-sandbox", "--disable-dev-shm-usage"],
  });
  try {
    const page = await browser.newPage();
    await page.route("**/*", (route) => route.abort());
    await page.setContent(html, { waitUntil: "load" });
    await page.evaluate(() => document.fonts.ready);
    return await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "16mm", bottom: "16mm", left: "12mm", right: "12mm" },
    });
  } finally {
    await browser.close();
  }
}
