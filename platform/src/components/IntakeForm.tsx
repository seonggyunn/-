"use client";
import Link from "next/link";
import { useState } from "react";

export default function IntakeForm() {
  const [error, setError] = useState("");
  const [result, setResult] = useState<{
    id?: string;
    duplicate?: boolean;
  } | null>(null);
  const [busy, setBusy] = useState(false);
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const f = new FormData(e.currentTarget);
    try {
      const response = await fetch("/api/intake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...Object.fromEntries(f),
          request_version: "restaurant-v2",
          industry: "음식점",
          services: ["naver"],
          privacy: f.get("privacy") === "on",
          contact_consent: f.get("contact_consent") === "on",
          marketing: f.get("marketing") === "on",
        }),
      });
      const json = await response.json();
      if (!response.ok || !json.stored)
        throw new Error(json.error || "접수를 확인하지 못했습니다.");
      setResult(json);
    } catch (e) {
      setError(e instanceof Error ? e.message : "접수 오류");
    } finally {
      setBusy(false);
    }
  }
  if (result)
    return (
      <div className="card success" role="status">
        <h2>신청이 저장되었습니다.</h2>
        <p>
          접수번호: <code>{result.id}</code>
        </p>
        <p>
          {result.duplicate
            ? "이미 접수된 동일 신청입니다. 중복으로 생성하지 않았습니다."
            : "유성균 운영자가 매장 식별 정보와 요청 내용을 확인한 뒤 이메일로 회신합니다."}
        </p>
        <p>
          무료 진단은 공개 페이지의 핵심 개선 방향 최대 3개입니다. 완성
          문구·사진 작업·실제 수정은 포함하지 않습니다. 신청은 유료 계약이나
          수정 승인이 아닙니다.
        </p>
        <small>메일 전송·수신 여부는 이 화면에서 확인되지 않았습니다.</small>
      </div>
    );
  return (
    <form className="card audit-form" onSubmit={submit}>
      <h2>가게와 고민을 알려주세요</h2>
      <p>
        동네 개인 식당의 네이버 플레이스를 우선 확인합니다. 필요한 서비스 이름을
        몰라도 괜찮습니다.
      </p>
      <div className="form-grid">
        <label>
          상호명
          <input
            name="business"
            required
            maxLength={150}
            autoComplete="organization"
          />
        </label>
        <label>
          회신 이메일
          <input
            name="email"
            type="email"
            required
            maxLength={254}
            autoComplete="email"
          />
        </label>
      </div>
      <label>
        매장 지역·주소 또는 지도 링크
        <input
          name="place_identifier"
          required
          maxLength={500}
          placeholder="예: 서울 광진구 ○○로 10 / 네이버 지도 링크"
          aria-describedby="place-help"
        />
      </label>
      <small id="place-help">
        동명이인 매장을 구분할 수 있는 주소나 지도 링크를 적어주세요.
      </small>
      <label>
        현재 가장 고민되는 부분
        <select name="concern" required defaultValue="unsure">
          <option value="unsure">잘 모르겠음 · 전체적으로 봐주세요</option>
          <option value="strength">가게의 특징이 잘 드러나지 않아요</option>
          <option value="menu">메뉴·가격 설명이 부족해요</option>
          <option value="photos">어떤 사진을 보여줘야 할지 모르겠어요</option>
          <option value="visit">
            주차·예약 등 이용 안내를 정리하고 싶어요
          </option>
          <option value="accuracy">기본정보를 확인하고 싶어요</option>
        </select>
      </label>
      <label>
        추가로 알려주실 내용 (선택)
        <textarea
          name="notes"
          maxLength={3000}
          rows={3}
          placeholder="가게의 특징이나 지금 불편한 점을 적어주세요."
        />
      </label>
      <details className="optional-fields">
        <summary>선택 정보 더하기 — 담당자·다른 채널·자료 준비</summary>
        <div className="form-grid">
          <label>
            담당자 이름 (선택)
            <input name="contact" maxLength={100} autoComplete="name" />
          </label>
          <label>
            연락처 (선택)
            <input name="phone" type="tel" maxLength={40} autoComplete="tel" />
          </label>
          <label>
            네이버 플레이스 주소 (선택)
            <input name="naver_url" type="url" maxLength={2000} />
          </label>
          <label>
            구글 지도·프로필 주소 (선택)
            <input name="google_url" type="url" maxLength={2000} />
          </label>
          <label>
            홈페이지·인스타 주소 (선택)
            <input name="website" type="url" maxLength={2000} />
          </label>
          <label>
            메뉴·사진 자료 제공 가능 여부 (선택)
            <select name="materials" defaultValue="unsure">
              <option value="unsure">잘 모르겠음</option>
              <option value="ready">
                메뉴와 직접 사용할 수 있는 사진이 있어요
              </option>
              <option value="partial">일부만 있어요</option>
              <option value="none">준비된 자료가 없어요</option>
            </select>
          </label>
          <label>
            어떻게 알게 되셨나요? (선택)
            <input
              name="source"
              maxLength={150}
              placeholder="예: 지인 소개, 검색"
            />
          </label>
        </div>
      </details>
      <p>
        비밀번호·인증코드·신분증·고객 개인정보는 보내지 마세요. 메뉴·사진 원본은
        지금 첨부하지 않아도 됩니다.
      </p>
      <label className="trap" aria-hidden="true">
        비워두세요
        <input name="website_trap" tabIndex={-1} autoComplete="off" />
      </label>
      <label className="check">
        <input name="privacy" type="checkbox" required />
        <span>
          [필수] 상담을 위한 상호·매장 식별 정보·이메일·고민과 직접 입력한 선택
          정보를 수집·이용하는 데 동의합니다.{" "}
          <Link href="/privacy">수집 항목·보관 안내</Link>
        </span>
      </label>
      <label className="check">
        <input name="contact_consent" type="checkbox" required />
        <span>
          [필수] 신청 확인·진단·제안 등 서비스 회신을 받는 데 동의합니다.
        </span>
      </label>
      <label className="check">
        <input name="marketing" type="checkbox" />
        <span>
          [선택] 별도의 상품 안내를 받는 데 동의합니다. 동의하지 않아도 진단을
          신청할 수 있습니다.
        </span>
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
  );
}
