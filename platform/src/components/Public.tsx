"use client";
import Link from "next/link";
import { useState } from "react";
import { pages } from "../content";
export default function Public({ page = "" }: { page?: string }) {
  const [error, setError] = useState(""),
    [result, setResult] = useState<any>(null),
    [busy, setBusy] = useState(false);
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const f = new FormData(e.currentTarget);
    const data = Object.fromEntries(f);
    try {
      const res = await fetch("/api/intake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          services: f.getAll("services"),
          privacy: f.get("privacy") === "on",
          contact_consent: f.get("contact_consent") === "on",
          marketing: f.get("marketing") === "on",
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.stored)
        throw new Error(json.error || "접수를 확인하지 못했습니다.");
      setResult(json);
    } catch (e) {
      setError(e instanceof Error ? e.message : "접수 오류");
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <header className="top">
        <Link href="/" className="brand">
          <i>한</i> 한칸 운영실
        </Link>
        <nav>
          <Link href="/services">서비스</Link>
          <Link href="/pricing">요금</Link>
          <Link href="/how-it-works">진행 방식</Link>
          <Link href="/faq">FAQ</Link>
        </nav>
        <Link className="btn small" href="/free-audit">
          무료 진단 신청 ↗
        </Link>
      </header>
      <main>
        {!page ? (
          <>
            <section className="hero">
              <div>
                <span className="eyebrow">SMALL BUSINESS, WELL MANAGED</span>
                <h1>
                  가게 운영에 집중하세요.
                  <br />
                  <em>온라인 관리는</em>
                  <br />
                  한칸씩 정리합니다.
                </h1>
                <p>
                  네이버 플레이스, 구글 지도, 홈페이지까지.
                  <br />
                  사장님이 신경 쓰기 번거로운 온라인 관리 업무를 대신
                  처리합니다.
                </p>
                <Link className="btn" href="/free-audit">
                  무료 온라인 정보 진단 신청 ↗
                </Link>
                <Link className="quiet" href="/how-it-works">
                  어떻게 진행되나요?
                </Link>
                <small>고객 승인 없이 사업장 정보를 변경하지 않습니다.</small>
              </div>
              <div className="hero-board">
                <div className="board-title">
                  내 가게 온라인 정보 점검{" "}
                  <span className="tag">절차 예시</span>
                </div>
                {[
                  ["01", "사업장 기본 정보", "주소·연락처·운영시간"],
                  ["02", "플랫폼별 정보 비교", "네이버 · 구글 · 홈페이지"],
                  ["03", "변경안 확인과 승인", "사장님이 최종 결정"],
                  ["04", "작업 내역과 보고서", "증빙과 남은 조치까지"],
                ].map(([n, t, s]) => (
                  <div className="board-row" key={n}>
                    <b>{n}</b>
                    <div>
                      <strong>{t}</strong>
                      <small>{s}</small>
                    </div>
                    <span>↗</span>
                  </div>
                ))}
                <p>실제 고객 실적이 아닌 서비스 진행 절차입니다.</p>
              </div>
            </section>
            <div className="strip">
              <span>네이버 플레이스</span>
              <span>Google 비즈니스 프로필</span>
              <span>홈페이지 정보</span>
              <span>정기 온라인 점검</span>
            </div>
            <section className="section">
              <span className="eyebrow">CLEAR SCOPE. VISIBLE WORK.</span>
              <h2>
                작업 범위와 결과가
                <br />
                분명한 온라인 운영.
              </h2>
              <div className="cards">
                {[
                  [
                    "정보가 서로 달라요",
                    "운영시간·주소·서비스 정보를 비교하고 확인이 필요한 항목을 정리합니다.",
                  ],
                  [
                    "무엇을 바꿨는지 궁금해요",
                    "변경 전후 정보와 고객 승인, 작업 증빙을 한 흐름으로 남깁니다.",
                  ],
                  [
                    "다음 달에도 관리하고 싶어요",
                    "합의한 계약에 맞춰 정기 점검과 남은 조치를 관리합니다.",
                  ],
                ].map(([t, b]) => (
                  <article className="card" key={t}>
                    <h3>{t}</h3>
                    <p>{b}</p>
                  </article>
                ))}
              </div>
            </section>
          </>
        ) : (
          <section className="section page-section">
            <span className="eyebrow">HANKAN OPERATIONS</span>
            <h1>{pages[page] || "페이지를 찾을 수 없습니다"}</h1>
            {page === "free-audit" ? (
              result ? (
                <div className="card success" role="status">
                  <h2>신청이 저장되었습니다.</h2>
                  <p>
                    접수번호: <code>{result.id}</code>
                  </p>
                  <p>
                    {result.duplicate
                      ? "이미 접수된 동일 신청입니다. 중복으로 생성하지 않았습니다."
                      : "담당자가 요청 범위를 확인하고 회신합니다."}{" "}
                    메일 전송 여부는 이 화면에서 확인되지 않았습니다. 계약이나
                    프로필 변경 승인이 아닙니다.
                  </p>
                </div>
              ) : (
                <form className="card audit-form" onSubmit={submit}>
                  <p>
                    현재 온라인 정보와 관리가 필요한 부분을 알려주세요.
                    비밀번호·인증코드·신분증은 제출하지 마세요.
                  </p>
                  <div className="form-grid">
                    {[
                      ["business", "상호명", "text", true],
                      ["industry", "업종", "text", true],
                      ["contact", "담당자 이름", "text", true],
                      ["email", "회신 이메일", "email", true],
                      ["phone", "연락처 (선택)", "tel", false],
                      [
                        "naver_url",
                        "네이버 플레이스 주소 (선택)",
                        "url",
                        false,
                      ],
                      [
                        "google_url",
                        "구글 지도·프로필 주소 (선택)",
                        "url",
                        false,
                      ],
                      ["website", "홈페이지 주소 (선택)", "url", false],
                    ].map(([name, label, type, required]) => (
                      <label key={String(name)}>
                        {label}
                        <input
                          name={String(name)}
                          type={String(type)}
                          required={Boolean(required)}
                          maxLength={name === "notes" ? 4000 : 2000}
                        />
                      </label>
                    ))}
                  </div>
                  <fieldset>
                    <legend>필요한 서비스 (하나 이상)</legend>
                    {[
                      ["naver", "네이버 플레이스"],
                      ["google", "구글 비즈니스 프로필"],
                      ["website", "홈페이지 정보"],
                      ["routine", "정기 관리"],
                    ].map(([v, l]) => (
                      <label className="check" key={v}>
                        <input type="checkbox" name="services" value={v} />
                        {l}
                      </label>
                    ))}
                  </fieldset>
                  <label>
                    추가 내용
                    <textarea name="notes" maxLength={4000} rows={4} />
                  </label>
                  <label className="trap" aria-hidden="true">
                    비워두세요
                    <input
                      name="website_trap"
                      tabIndex={-1}
                      autoComplete="off"
                    />
                  </label>
                  <label className="check">
                    <input name="privacy" type="checkbox" required />
                    [필수] 상담을 위한 상호·담당자·이메일·선택 연락처·입력 내용
                    수집에 동의합니다. <Link href="/privacy">보관 안내</Link>
                  </label>
                  <label className="check">
                    <input name="contact_consent" type="checkbox" required />
                    [필수] 신청 확인·진단·제안 등 서비스 회신을 받는 데
                    동의합니다.
                  </label>
                  <label className="check">
                    <input name="marketing" type="checkbox" />
                    [선택] 별도의 상품 안내를 받는 데 동의합니다.
                  </label>
                  {error && (
                    <p className="error" role="alert">
                      {error}
                    </p>
                  )}
                  <button className="btn" disabled={busy}>
                    {busy ? "저장 확인 중…" : "무료 진단 신청하기"}
                  </button>
                </form>
              )
            ) : page === "services" ? (
              <div className="cards">
                {[
                  [
                    "플랫폼 기본 정보 점검",
                    "주소·전화·운영시간·분류·소개·메뉴를 고객 제공 정보와 대조합니다.",
                  ],
                  [
                    "승인 기반 정보 정리",
                    "제안 내용과 근거를 설명하고 사업장 권한과 승인을 확인한 뒤 작업합니다.",
                  ],
                  [
                    "홈페이지·정기 운영",
                    "홈페이지 정보와 정기 점검, 작업 보고를 합의된 범위로 관리합니다.",
                  ],
                ].map(([t, b]) => (
                  <article className="card" key={t}>
                    <h2>{t}</h2>
                    <p>{b}</p>
                  </article>
                ))}
              </div>
            ) : page === "pricing" ? (
              <div className="cards">
                {[
                  [
                    "무료 진단",
                    "0원",
                    "제공한 공개 주소와 고객 정보를 기준으로 관리 필요 항목을 정리합니다.",
                  ],
                  [
                    "일회성 정리",
                    "개별 견적",
                    "변경 항목·사업장·플랫폼·고객 권한을 확인해 총액과 납기를 합의합니다.",
                  ],
                  [
                    "월간 운영",
                    "계약별 견적",
                    "점검 주기·작업 건수·보고 범위를 합의합니다. 자동결제는 제공하지 않습니다.",
                  ],
                ].map(([t, p, b]) => (
                  <article className="card" key={t}>
                    <h3>{t}</h3>
                    <h2>{p}</h2>
                    <p>{b}</p>
                    <Link href="/free-audit">범위 상담 ↗</Link>
                  </article>
                ))}
              </div>
            ) : page === "how-it-works" ? (
              <div className="cards">
                {[
                  "신청과 사업장 확인",
                  "공개정보 수동 진단",
                  "변경안과 견적 제시",
                  "권한 확인·고객 승인",
                  "허용된 공식 경로에서 작업",
                  "결과 확인·보고서 전달",
                ].map((t, i) => (
                  <article className="card" key={t}>
                    <span className="eyebrow">0{i + 1}</span>
                    <h3>{t}</h3>
                    <p>
                      판단 근거와 담당자, 진행 상태를 기록합니다. 접근할 수 없는
                      정보는 미확인으로 표시합니다.
                    </p>
                  </article>
                ))}
              </div>
            ) : page === "cases" ? (
              <article className="card">
                <span className="tag">설명용 가상 사례 · 실적 아님</span>
                <h2>운영시간이 서로 다른 사업장</h2>
                <p>
                  네이버·구글·홈페이지의 운영시간이 다르게 보이는 상황을
                  가정합니다. 담당자가 원문과 고객 확인으로 올바른 시간을
                  파악하고, 변경 승인 후 허용된 관리 화면에서 작업해 결과 증빙을
                  남기는 흐름입니다.
                </p>
                <p>실제 고객 후기·성과 통계는 아직 게시하지 않았습니다.</p>
              </article>
            ) : page === "faq" ? (
              <div className="faq">
                {[
                  [
                    "승인 없이 정보를 바꾸나요?",
                    "아니요. 사업장 관리 권한과 변경안 승인을 확인해야 합니다.",
                  ],
                  [
                    "네이버·구글 API가 자동으로 수정하나요?",
                    "현재 기본 운영은 수동 확인·공식 관리 화면 작업입니다. API 연결을 했다고 표시하지 않습니다.",
                  ],
                  [
                    "검색 순위나 매출을 보장하나요?",
                    "보장하지 않습니다. 정확한 정보 관리와 작업 증빙을 제공합니다.",
                  ],
                  [
                    "신청하면 결제되나요?",
                    "무료 진단 신청은 계약·결제가 아닙니다. 유료 범위와 총액은 별도로 합의합니다.",
                  ],
                ].map(([q, a]) => (
                  <details className="card" key={q}>
                    <summary>{q}</summary>
                    <p>{a}</p>
                  </details>
                ))}
              </div>
            ) : page === "contact" ? (
              <article className="card">
                <h2>한칸 운영실 · 유성균</h2>
                <a href="mailto:sjdjeksbjs112e4@gmail.com">
                  sjdjeksbjs112e4@gmail.com
                </a>
                <p>
                  상호·업종·필요한 작업·희망 일정을 알려주세요. 비밀번호와 개인
                  인증정보는 보내지 마세요.
                </p>
                <Link className="btn" href="/free-audit">
                  무료 진단 신청
                </Link>
              </article>
            ) : page === "privacy" ? (
              <article className="card prose">
                <h2>상담과 업무 수행에 필요한 정보만 사용합니다.</h2>
                <p>관리책임자: 유성균 / sjdjeksbjs112e4@gmail.com</p>
                <p>
                  수집 항목: 상호·업종·공개 프로필 주소·담당자·이메일·선택
                  연락처·요청 내용. 목적: 신청 확인·진단·견적·고객 승인과 업무
                  수행. 마케팅 동의는 선택이며 상담 동의와 구분합니다.
                </p>
                <p>
                  미거래 신청은 마지막 상담 후 30일을 기준으로 검토·삭제합니다.
                  계약·승인 증빙·거래기록의 보관은 별도 안내와 관련 의무를
                  확인합니다. 관리자 명령을 통한 정리 절차를 사용하며
                  이메일·백업 보관도 별도로 관리합니다.
                </p>
                <p>
                  외부 AI에 고객 자료를 전달하기 전 범위·처리방식을 확인합니다.
                  현재 자격증명 없는 환경에서는 로컬 템플릿만 사용합니다. 정보
                  열람·정정·삭제·연락 중단은 공개 문의처로 요청할 수 있습니다.
                </p>
              </article>
            ) : page === "terms" ? (
              <article className="card prose">
                <h2>작업 범위를 먼저 합의합니다.</h2>
                <p>
                  무료 진단은 제공한 주소·자료에 대한 확인이며, 계약·결제·외부
                  프로필 변경 승인이 아닙니다. 유료 작업은 총액·작업
                  항목·납기·수정 범위·취소 조건을 별도 합의합니다.
                </p>
                <p>
                  고객은 사업장 정보와 자료에 대한 적법한 사용·관리 권한을
                  확인해야 합니다. 서비스는 로그인·인증·플랫폼 제한을 우회하지
                  않으며 검색 순위·매출·심사 결과를 보장하지 않습니다.
                </p>
                <p>
                  이 안내는 사업자 등록·플랫폼 대리인 승인·결제대행 연동을
                  완료했다는 의미가 아닙니다.
                </p>
              </article>
            ) : (
              <Link href="/">첫 화면으로 돌아가기</Link>
            )}
          </section>
        )}
      </main>
      <footer>
        <div className="brand">한칸 운영실</div>
        <p>사업장 온라인 정보를 정확하고 투명하게.</p>
        <div>
          {Object.entries(pages).map(([p, t]) => (
            <Link href={"/" + p} key={p}>
              {t}
            </Link>
          ))}
          <Link href="/admin/dashboard">운영자 로그인</Link>
        </div>
        <small>운영 유성균 · sjdjeksbjs112e4@gmail.com</small>
      </footer>
    </>
  );
}
