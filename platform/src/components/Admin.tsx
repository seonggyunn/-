"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
const labels: Record<string, string> = {
  NEW: "신규",
  DIAGNOSING: "진단 중",
  PROPOSAL_READY: "제안 준비",
  AWAITING_APPROVAL: "승인 대기",
  APPROVED: "승인 확인",
  IN_PROGRESS: "작업 중",
  VERIFYING: "결과 확인",
  COMPLETED: "완료",
  ON_HOLD: "보류",
  REJECTED: "거절",
  CANCELLED: "취소",
  REVISION_REQUIRED: "보완 필요",
};
const auditLabels: Record<string, string> = {
  UNAVAILABLE: "확인 불가",
  MISSING: "정보 누락",
  POSSIBLE_ISSUE: "문제 가능성",
  CUSTOMER_CONFIRMATION_REQUIRED: "고객 확인 필요",
  VERIFIED: "원문·증빙 확인 완료",
};
const kindLabels: Record<string, string> = {
  description: "사업장 소개",
  improvement: "개선 제안",
  email: "고객 메일",
  review: "실제 리뷰 답변",
  promotion: "홍보 문안",
  monthly: "월간 활동",
  audit: "진단 보고",
};
const codeLabels: Record<string, string> = {
  PREVIEW: "미발송 미리보기",
  PENDING: "처리 대기",
  SENDING: "전송 중",
  ACCEPTED: "제공자 접수 · 도착 미확인",
  FAILED: "명확한 실패",
  UNKNOWN: "결과 불명 · 재전송 중지",
  PROPOSED: "제안",
  ACTIVE: "활성 계약",
  CANCELLED: "취소",
  UNCONFIRMED: "입금 미확인",
  CONFIRMED: "운영자 입금 확인",
  NOT_EXECUTED: "미실행",
  MANUALLY_RECORDED: "수동 실행 기록",
  VERIFIED_MANUAL: "수동 결과 확인",
  AWAITING_APPROVAL: "고객 승인 대기",
  APPROVED: "승인 확인",
  VERIFYING: "결과 확인 중",
  COMPLETED: "완료",
  DONE: "처리 완료",
  PROCESSING: "처리 중",
};
const capabilityLabels: Record<string, string> = {
  database: "데이터베이스",
  email: "이메일",
  ai: "초안 작성",
  google: "구글 API",
  naver: "네이버 작업",
  payment: "결제",
  sqlite: "로컬 SQLite",
  postgres: "PostgreSQL",
  local_preview: "로컬 미리보기 · 미발송",
  configured_not_delivery_verified: "제공자 설정됨 · 실제 전달 미검증",
  template: "로컬 템플릿",
  configured: "연결 설정됨",
  disabled: "비활성",
  manual: "승인 기반 수동 작업",
  manual_records_only: "수동 확인 기록 · PG 미연결",
};
const historyLabels: Record<string, string> = {
  LEAD_CREATED: "신청 저장",
  STATUS_CHANGED: "업무 상태 변경",
  LEAD_UPDATED: "담당·메모 변경",
  AUDIT_RECORDED: "수동 진단 기록",
  CHANGE_PROPOSED: "변경안 등록",
  APPROVAL_VERIFIED: "권한 확인·승인 기록",
  APPROVAL_REVOKED: "승인 철회",
  MANUAL_EXECUTION_RECORDED: "수동 작업 증빙",
  MANUAL_RESULT_VERIFIED: "수동 결과 재확인",
  REPORT_CREATED: "보고서 버전 생성",
  REPORT_PDF_STORED: "비공개 PDF 저장",
  CLIENT_CONVERTED: "계약 고객 등록",
  CONTRACT_RECORDED: "계약·입금 상태 기록",
  MONTHLY_TASK_CREATED: "월간 점검 업무 생성",
  CONTACT_CONSENT_WITHDRAWN: "연락 동의 철회",
  PRIVATE_EVIDENCE_STORED: "비공개 증빙 저장",
  EMAIL_ACCEPTED: "메일 제공자 접수",
  APPROVAL_REQUEST_PREPARED: "승인 요청 알림 준비",
  RETENTION_ANONYMIZED: "보관기간 종료 처리",
  PASSWORD_CHANGED: "비밀번호 변경",
};
const stages = Object.keys(labels);
const tabs = [
  ["dashboard", "대시보드"],
  ["leads", "신청·고객"],
  ["clients", "계약 고객"],
  ["tasks", "업무 관리"],
  ["reports", "보고서"],
  ["settings", "설정·알림"],
];
export default function Admin({ path }: { path: string[] }) {
  const [user, setUser] = useState<any>(null),
    [data, setData] = useState<any>(null),
    [lead, setLead] = useState<any>(null),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [loading, setLoading] = useState(true),
    [query, setQuery] = useState(""),
    [filter, setFilter] = useState(""),
    [draft, setDraft] = useState<any>(null),
    [busy, setBusy] = useState(false);
  const tab = path[1] || "dashboard",
    leadId = tab === "leads" ? path[2] : undefined;
  async function api(url: string, body?: any, method = "POST") {
    const res = await fetch("/api/" + url, {
      method: body === undefined ? "GET" : method,
      headers: { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || "요청 실패");
    return json;
  }
  async function load() {
    try {
      setUser(await api("auth/me"));
      setData(await api("dashboard"));
      if (leadId) setLead(await api("leads/" + leadId));
    } catch (e) {
      setError(e instanceof Error ? e.message : "연결 오류");
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    load();
  }, [leadId]);
  async function action(fn: () => Promise<any>) {
    if (busy) return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const result = await fn();
      await load();
      setNotice(
        "저장했습니다. 실제 외부 변경·메일 전달 여부는 별도 기록을 확인하세요.",
      );
      return result;
    } catch (e) {
      setError(e instanceof Error ? e.message : "처리 실패");
    } finally {
      setBusy(false);
    }
  }
  function form(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    return Object.fromEntries(new FormData(e.currentTarget));
  }
  const field = (
    name: string,
    title: string,
    type = "text",
    required = true,
  ) => (
    <label>
      {title}
      <input name={name} type={type} required={required} />
    </label>
  );
  if (loading)
    return (
      <main className="login">
        <p>로그인 상태 확인 중…</p>
      </main>
    );
  if (!user)
    return (
      <main className="login">
        <Link className="brand" href="/">
          한칸 운영실
        </Link>
        <form
          className="card"
          onSubmit={async (e) => {
            const f = form(e);
            await action(async () => api("auth/login", f));
          }}
        >
          <span className="eyebrow">OPERATOR WORKSPACE</span>
          <h1>운영자 로그인</h1>
          <p>
            최초 계정은 서버의 관리자 생성 명령으로 발급합니다. 공개 기본
            비밀번호는 없습니다.
          </p>
          {field("email", "이메일", "email")}
          {field("password", "비밀번호", "password")}
          <button className="btn" disabled={busy}>
            로그인
          </button>
          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}
        </form>
      </main>
    );
  return (
    <div className="workspace">
      <aside>
        <Link href="/" className="brand">
          <i>한</i> 한칸 운영실
        </Link>
        <small>운영 워크스페이스</small>
        <nav>
          {tabs.map(([p, t]) => (
            <Link
              className={tab === p ? "active" : ""}
              key={p}
              href={"/admin/" + p}
            >
              {t}
            </Link>
          ))}
        </nav>
        <div className="operator">
          <strong>{user.name}</strong>
          <small>
            {user.role === "admin" ? "관리자" : "운영자"} · {user.email}
          </small>
          <button
            onClick={async () => {
              await api("auth/logout", {});
              location.href = "/admin/login";
            }}
          >
            로그아웃
          </button>
        </div>
      </aside>
      <main className="admin-main">
        <div className="admin-heading">
          <div>
            <span className="eyebrow">HANKAN OPERATIONS</span>
            <h1>
              {lead
                ? lead.business.name
                : tabs.find((x) => x[0] === tab)?.[1] || "운영실"}
            </h1>
          </div>
          <Link className="btn small secondary" href="/free-audit">
            신청 화면 ↗
          </Link>
        </div>
        {error && (
          <p role="alert" className="alert error">
            {error}
          </p>
        )}
        {notice && (
          <p role="status" className="alert">
            {notice}
          </p>
        )}
        {!data ? (
          <p>데이터를 불러오지 못했습니다.</p>
        ) : leadId && lead ? (
          <>
            <section className="card">
              <div className="split">
                <div>
                  <h2>
                    {lead.contact} · {lead.email}
                  </h2>
                  <p>{lead.notes || "추가 요청 없음"}</p>
                  <span className="tag">{labels[lead.status]}</span>
                </div>
                <button
                  className="btn secondary"
                  disabled={busy}
                  onClick={() =>
                    action(() => api("leads/" + lead.id + "/convert", {}))
                  }
                >
                  계약 고객으로 등록
                </button>
              </div>
              <form
                className="inline"
                onSubmit={(e) => {
                  const f = form(e);
                  action(() => api("leads/" + lead.id + "/transition", f));
                }}
              >
                <select name="status" defaultValue="DIAGNOSING">
                  {stages.map((s) => (
                    <option key={s} value={s}>
                      {labels[s]}
                    </option>
                  ))}
                </select>
                <button disabled={busy}>상태 변경</button>
              </form>
              <form
                onSubmit={(e) => {
                  const f = form(e);
                  action(() =>
                    api(
                      "leads/" + lead.id,
                      {
                        ...f,
                        assigned_to: f.assigned_to || null,
                        due_at: f.due_at
                          ? new Date(String(f.due_at)).toISOString()
                          : null,
                      },
                      "PATCH",
                    ),
                  );
                }}
              >
                <div className="form-grid">
                  <label>
                    담당자
                    <select
                      name="assigned_to"
                      defaultValue={lead.assigned_to || ""}
                    >
                      <option value="">미배정</option>
                      {data.users
                        .filter((u: any) => u.role !== "customer")
                        .map((u: any) => (
                          <option key={u.id} value={u.id}>
                            {u.name}
                          </option>
                        ))}
                    </select>
                  </label>
                  <label>
                    기한
                    <input type="datetime-local" name="due_at" />
                  </label>
                </div>
                <label>
                  내부 메모
                  <textarea
                    name="internal_notes"
                    defaultValue={lead.internal_notes}
                  />
                </label>
                <button disabled={busy}>담당·메모 저장</button>
              </form>
            </section>
            <section className="card">
              <h2>수동 진단 기록</h2>
              <p>확인 완료는 원문과 실제 확인 증빙이 있을 때만 선택하세요.</p>
              <form
                onSubmit={(e) => {
                  const f = form(e);
                  action(() =>
                    api("leads/" + lead.id + "/audit", { items: [f] }),
                  );
                }}
              >
                <div className="form-grid">
                  {field("field", "항목 (예: 운영시간)")}
                  {field("value", "확인값", "text", false)}
                  <label>
                    확인 상태
                    <select name="status">
                      {[
                        "UNAVAILABLE",
                        "MISSING",
                        "POSSIBLE_ISSUE",
                        "CUSTOMER_CONFIRMATION_REQUIRED",
                        "VERIFIED",
                      ].map((s) => (
                        <option key={s} value={s}>
                          {auditLabels[s]}
                        </option>
                      ))}
                    </select>
                  </label>
                  {field("source_url", "원문 URL", "url", false)}
                </div>
                <label>
                  실제 확인 증빙
                  <textarea name="evidence" />
                </label>
                <button disabled={busy}>진단 항목 저장</button>
              </form>
              <div className="table-scroll">
                <table>
                  <thead>
                    <tr>
                      <th>항목</th>
                      <th>값</th>
                      <th>상태</th>
                      <th>근거</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lead.audits.map((i: any) => (
                      <tr key={i.id}>
                        <td>{i.field}</td>
                        <td>{i.value}</td>
                        <td>{auditLabels[i.status] || i.status}</td>
                        <td>
                          {i.evidence}
                          <small>{i.source_url}</small>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
            <section className="card">
              <h2>변경 제안과 고객 승인</h2>
              <form
                onSubmit={(e) => {
                  const f = form(e);
                  action(() => api("leads/" + lead.id + "/changes", f));
                }}
              >
                <div className="form-grid">
                  <label>
                    플랫폼
                    <select name="platform">
                      <option value="naver">네이버</option>
                      <option value="google">구글</option>
                    </select>
                  </label>
                  {field("field", "변경 항목")}
                  {field("old_value", "기존 값", "text", false)}
                  {field("proposed_value", "제안 값")}
                  {field("reason", "변경 이유 (5자 이상)")}
                  {field("evidence", "제안 근거 (5자 이상)")}
                </div>
                <button disabled={busy}>변경안 등록</button>
              </form>
              {lead.changes.map((c: any) => (
                <article className="change" key={c.id}>
                  <h3>
                    {c.platform} · {c.field}
                  </h3>
                  <p>
                    {c.old_value} → <b>{c.proposed_value}</b>
                  </p>
                  <small>
                    {c.reason} · {codeLabels[c.status] || c.status} ·{" "}
                    {codeLabels[c.execution_status] || c.execution_status}
                  </small>
                  <button
                    disabled={busy}
                    onClick={() =>
                      action(() =>
                        api("changes/" + c.id + "/request-approval", {}),
                      )
                    }
                  >
                    승인 요청 알림 준비
                  </button>
                  <details>
                    <summary>권한 확인 후 고객 승인 기록</summary>
                    <form
                      onSubmit={(e) => {
                        const f = form(e);
                        action(() =>
                          api("changes/" + c.id + "/approve", {
                            ...f,
                            confirmed: true,
                          }),
                        );
                      }}
                    >
                      {field("authorized_person", "승인한 사업장 권한자")}
                      {field(
                        "authority_evidence",
                        "권한·승인 확인 증빙 (10자 이상)",
                      )}
                      {field("consent_version", "승인 문안 버전")}
                      <label className="check">
                        <input type="checkbox" required />
                        이메일 소유와 별개로 사업장 관리권한 및 해당 변경 승인을
                        확인했습니다.
                      </label>
                      <button disabled={busy}>승인 증빙 저장</button>
                    </form>
                    <button
                      disabled={busy}
                      onClick={() =>
                        action(() => api("changes/" + c.id + "/revoke", {}))
                      }
                    >
                      승인 철회 기록
                    </button>
                  </details>
                  <details>
                    <summary>공식 화면에서 작업 후 결과 기록</summary>
                    <p>이 버튼은 네이버·구글을 직접 변경하지 않습니다.</p>
                    <form
                      onSubmit={(e) => {
                        const f = form(e);
                        action(() => api("changes/" + c.id + "/execute", f));
                      }}
                    >
                      {field(
                        "evidence",
                        "실제 작업·결과 확인 증빙 (10자 이상)",
                      )}
                      <button disabled={busy}>수동 실행 증빙 기록</button>
                    </form>
                    <form
                      onSubmit={(e) => {
                        const f = form(e);
                        action(() => api("changes/" + c.id + "/verify", f));
                      }}
                    >
                      {field("evidence", "결과 재확인 증빙 (10자 이상)")}
                      <button disabled={busy}>수동 결과 재확인 기록</button>
                    </form>
                  </details>
                </article>
              ))}
            </section>
            <section className="card">
              <h2>초안 도우미와 보고서</h2>
              <form
                onSubmit={(e) => {
                  const f = form(e);
                  action(async () =>
                    setDraft(await api("leads/" + lead.id + "/draft", f)),
                  );
                }}
              >
                <label>
                  초안 종류
                  <select name="kind">
                    {[
                      "description",
                      "improvement",
                      "email",
                      "review",
                      "promotion",
                      "monthly",
                      "audit",
                    ].map((s) => (
                      <option key={s} value={s}>
                        {kindLabels[s]}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  직접 확인한 입력 (불필요한 개인정보 제외)
                  <textarea name="input" required />
                </label>
                <button disabled={busy}>검토용 초안 작성</button>
              </form>
              {draft && (
                <>
                  <p className="tag">
                    {draft.provider === "template" ? "로컬 템플릿" : "AI 생성"}{" "}
                    · 미검증 초안
                  </p>
                  <textarea
                    defaultValue={draft.body}
                    rows={6}
                    aria-label="편집 가능한 초안"
                  />
                </>
              )}
              <button
                className="btn"
                disabled={busy}
                onClick={() =>
                  action(() => api("leads/" + lead.id + "/report", {}))
                }
              >
                현재 진단으로 보고서 버전 생성
              </button>
            </section>
            <section className="card">
              <h2>비공개 증빙 파일</h2>
              <p>
                고객 사용권을 확인한 PDF·PNG·JPEG·텍스트 1MB 이내만 저장합니다.
              </p>
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  const file = (
                    e.currentTarget.elements.namedItem(
                      "evidence_file",
                    ) as HTMLInputElement
                  ).files?.[0];
                  if (!file) return;
                  if (file.size > 1048576) {
                    setError("1MB 이내 파일을 선택하세요.");
                    return;
                  }
                  const reader = new FileReader();
                  reader.onload = () =>
                    action(() =>
                      api("files", {
                        lead_id: lead.id,
                        filename: file.name,
                        content_type: file.type || "text/plain",
                        base64: String(reader.result).split(",")[1],
                      }),
                    );
                  reader.readAsDataURL(file);
                }}
              >
                <label>
                  증빙 파일
                  <input
                    name="evidence_file"
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg,.txt"
                    required
                  />
                </label>
                <button disabled={busy}>비공개로 저장</button>
              </form>
              {lead.files?.map((f: any) => (
                <p key={f.id}>
                  <a href={"/api/files/" + f.id}>
                    {f.filename} · {f.size} bytes 내려받기
                  </a>
                </p>
              ))}
            </section>
            <section className="card">
              <h2>동의 · 업무 이력</h2>
              <button
                disabled={busy}
                onClick={() => {
                  if (
                    confirm(
                      "고객이 요청한 연락 동의 철회를 기록하고 대기 중 연락을 중단할까요?",
                    )
                  )
                    action(() =>
                      api("leads/" + lead.id + "/withdraw-contact", {}),
                    );
                }}
              >
                서비스 연락 동의 철회 기록
              </button>
              {lead.consents.map((c: any) => (
                <p key={c.id}>
                  {c.purpose}: {c.granted ? "동의" : "미동의"} · {c.version} ·{" "}
                  {c.created_at}
                </p>
              ))}
              {lead.history.map((h: any) => (
                <p key={h.id}>
                  <b>{historyLabels[h.action] || h.action}</b> ·{" "}
                  {new Date(h.created_at).toLocaleString("ko-KR", {
                    timeZone: "Asia/Seoul",
                  })}
                  <small>{h.details}</small>
                </p>
              ))}
            </section>
          </>
        ) : tab === "dashboard" ? (
          <>
            <div className="metrics">
              {[
                ["전체 신청", data.kpis.inquiries],
                ["신규 문의", data.kpis.new],
                ["진단 중", data.kpis.diagnosing],
                ["완료된 진단", data.kpis.completed],
                ["계약 고객 기록", data.kpis.clients],
                ["계약 기준 월매출", data.kpis.mrr.toLocaleString() + "원"],
                ["기한 초과 업무", data.kpis.overdue],
              ].map(([t, v]) => (
                <article className="card metric" key={String(t)}>
                  <small>{t}</small>
                  <strong>{v}</strong>
                </article>
              ))}
            </div>
            <section className="card">
              <h2>지금 확인할 신청</h2>
              <p>
                월매출은 활성 월계약의 기록 금액입니다. 실제 입금과 구분합니다.
              </p>
              {data.leads.slice(0, 6).map((l: any) => (
                <Link
                  className="list-row"
                  href={"/admin/leads/" + l.id}
                  key={l.id}
                >
                  <b>{l.business}</b>
                  <span>{labels[l.status]}</span>
                  <small>{l.contact}</small>
                </Link>
              ))}
              {!data.leads.length && (
                <p className="empty">
                  아직 접수된 신청이 없습니다. 무료 진단 신청이 저장되면 이곳에
                  표시됩니다.
                </p>
              )}
            </section>
          </>
        ) : tab === "leads" ? (
          <section className="card">
            <div className="split">
              <h2>신청 목록</h2>
              <a href="/api/export">CSV 내려받기</a>
            </div>
            <div className="inline">
              <input
                aria-label="신청 검색"
                placeholder="상호·담당자·이메일 검색"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <select
                aria-label="상태 필터"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              >
                <option value="">모든 상태</option>
                {stages.map((s) => (
                  <option key={s} value={s}>
                    {labels[s]}
                  </option>
                ))}
              </select>
            </div>
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>상호</th>
                    <th>담당자</th>
                    <th>상태</th>
                    <th>접수일</th>
                  </tr>
                </thead>
                <tbody>
                  {data.leads
                    .filter(
                      (l: any) =>
                        (!filter || l.status === filter) &&
                        [l.business, l.contact, l.email]
                          .join(" ")
                          .includes(query),
                    )
                    .map((l: any) => (
                      <tr key={l.id}>
                        <td>
                          <Link href={"/admin/leads/" + l.id}>
                            {l.business} ↗
                          </Link>
                        </td>
                        <td>
                          {l.contact}
                          <small>{l.email}</small>
                        </td>
                        <td>{labels[l.status]}</td>
                        <td>{l.created_at.slice(0, 10)}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
            {!data.leads.length && (
              <p className="empty">아직 신청이 없습니다.</p>
            )}
          </section>
        ) : tab === "tasks" ? (
          <section className="card">
            <h2>업무와 기한</h2>
            {data.tasks.map((t: any) => (
              <article className="change" key={t.id}>
                <h3>{t.title}</h3>
                <p>
                  {labels[t.status]} · {t.due_at || "기한 미지정"}
                </p>
                <form
                  className="inline"
                  onSubmit={(e) => {
                    const f = form(e);
                    action(() => api("tasks/" + t.id + "/transition", f));
                  }}
                >
                  <select name="status">
                    {stages.map((s) => (
                      <option key={s} value={s}>
                        {labels[s]}
                      </option>
                    ))}
                  </select>
                  <button disabled={busy}>상태 변경</button>
                  {t.lead_id && (
                    <Link href={"/admin/leads/" + t.lead_id}>
                      연결된 신청 ↗
                    </Link>
                  )}
                </form>
              </article>
            ))}
            {!data.tasks.length && (
              <p className="empty">등록된 업무가 없습니다.</p>
            )}
          </section>
        ) : tab === "reports" ? (
          <section className="card">
            <h2>진단 · 작업 보고서</h2>
            {data.reports.map((r: any) => (
              <div className="list-row" key={r.id}>
                <b>
                  {r.business} · v{r.version}
                </b>
                <a target="_blank" rel="noopener" href={"/api/reports/" + r.id}>
                  미리보기 ↗
                </a>
                <a href={"/api/reports/" + r.id + "/pdf"}>PDF 다운로드</a>
              </div>
            ))}
            {!data.reports.length && (
              <p className="empty">
                고객 상세에서 진단 항목을 기록한 뒤 보고서를 생성하세요.
              </p>
            )}
          </section>
        ) : tab === "clients" ? (
          <>
            <section className="card">
              <h2>고객과 계약</h2>
              {data.clients.map((c: any) => (
                <div className="list-row" key={c.id}>
                  <Link href={"/admin/leads/" + c.lead_id}>{c.business}</Link>
                  <small>{c.id}</small>
                </div>
              ))}
              {!data.clients.length && (
                <p className="empty">
                  신청 상세에서 고객으로 전환할 수 있습니다. 전환은 결제 확인과
                  다릅니다.
                </p>
              )}
            </section>
            {user.role === "admin" && (
              <section className="card">
                <h2>계약 · 제안 기록</h2>
                <form
                  onSubmit={(e) => {
                    const f = form(e);
                    action(() =>
                      api("contracts", {
                        ...f,
                        amount: Number(f.amount),
                        start_at: new Date(String(f.start_at)).toISOString(),
                      }),
                    );
                  }}
                >
                  <div className="form-grid">
                    <label>
                      고객
                      <select required name="client_id">
                        <option value="">선택</option>
                        {data.clients.map((c: any) => (
                          <option key={c.id} value={c.id}>
                            {c.business}
                          </option>
                        ))}
                      </select>
                    </label>
                    {field("name", "서비스명")}
                    {field("amount", "계약 금액 (원)", "number")}
                    <label>
                      주기
                      <select name="billing">
                        <option value="monthly">월간</option>
                        <option value="once">일회</option>
                      </select>
                    </label>
                    <label>
                      계약 상태
                      <select name="status">
                        <option value="PROPOSED">{codeLabels.PROPOSED}</option>
                        <option value="ACTIVE">{codeLabels.ACTIVE}</option>
                        <option value="CANCELLED">
                          {codeLabels.CANCELLED}
                        </option>
                      </select>
                    </label>
                    <label>
                      직접 확인한 입금 상태
                      <select name="payment_status">
                        <option value="UNCONFIRMED">
                          {codeLabels.UNCONFIRMED}
                        </option>
                        <option value="CONFIRMED">
                          {codeLabels.CONFIRMED}
                        </option>
                      </select>
                    </label>
                    {field(
                      "contract_reference",
                      "계약 근거·문서 참조 (5자 이상)",
                    )}
                    {field("start_at", "계약 시작", "datetime-local")}
                  </div>
                  <p>
                    계약과 입금 증빙을 직접 확인해 기록합니다. 카드정보는
                    수집하지 않습니다.
                  </p>
                  <button disabled={busy}>계약 기록 저장</button>
                </form>
                {data.subscriptions.map((s: any) => (
                  <p key={s.id}>
                    {s.billing} · {s.amount.toLocaleString()}원 ·{" "}
                    {codeLabels[s.status]} · {codeLabels[s.payment_status]}
                  </p>
                ))}
              </section>
            )}
          </>
        ) : (
          <>
            <section className="card">
              <h2>연결 상태</h2>
              {Object.entries(data.capabilities).map(([k, v]) => (
                <p className="list-row" key={k}>
                  <b>{capabilityLabels[k] || k}</b>
                  <span>{capabilityLabels[String(v)] || String(v)}</span>
                </p>
              ))}
              <p>
                수동 제공자는 외부 API를 호출하지 않습니다. 이메일 미리보기는
                미발송, 제공자 접수는 수신함 도착은 미확인입니다.
              </p>
              {user.role === "admin" && (
                <button
                  className="btn"
                  disabled={busy}
                  onClick={() => action(() => api("worker", {}))}
                >
                  월간·기한 업무와 알림 처리
                </button>
              )}
            </section>
            <section className="card">
              <h2>보고서 생성 작업</h2>
              {data.jobs?.map((j: any) => (
                <p key={j.id}>
                  PDF · {codeLabels[j.state] || j.state} · {j.attempts}회 시도
                  <small>{j.error}</small>
                </p>
              ))}
              <h2>알림 미리보기 · 상태</h2>
              {data.notifications.map((n: any) => (
                <details className="change" key={n.id}>
                  <summary>
                    {n.subject} · {codeLabels[n.state] || n.state}
                  </summary>
                  <p>{n.recipient}</p>
                  <pre>{n.body}</pre>
                  <p>{n.error}</p>
                  {n.state === "PREVIEW" && user.role === "admin" && (
                    <button
                      disabled={busy}
                      onClick={() =>
                        action(() =>
                          api("notifications/" + n.id + "/activate", {}),
                        )
                      }
                    >
                      제공자 연결 후 발송 대기 전환
                    </button>
                  )}
                  {n.state === "FAILED" && user.role === "admin" && (
                    <button
                      disabled={busy}
                      onClick={() =>
                        action(() =>
                          api("notifications/" + n.id + "/retry", {}),
                        )
                      }
                    >
                      명확한 실패 재시도 요청
                    </button>
                  )}
                </details>
              ))}
              {!data.notifications.length && <p>알림 기록이 없습니다.</p>}
            </section>
            <section className="card">
              <h2>내 비밀번호 변경</h2>
              <form
                onSubmit={async (e) => {
                  const f = form(e);
                  const ok = await action(() => api("auth/password", f));
                  if (ok) location.href = "/admin/login";
                }}
              >
                {field("password", "새 비밀번호 (12자 이상)", "password")}
                <button disabled={busy}>변경 후 모든 세션 종료</button>
              </form>
            </section>
          </>
        )}
      </main>
    </div>
  );
}
