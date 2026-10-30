import Link from "next/link";
import { pages, packages, steps, sampleRows } from "../content";
import IntakeForm from "./IntakeForm";
import {
  PublicHeader,
  InteractiveHero,
  InteractiveFaq,
  PublicEffects,
} from "./PublicInteractive";

function CallToAction() {
  return (
    <div className="audit-cta">
      <h2>어디부터 바꿀지, 먼저 확인해보세요.</h2>
      <p>동네 개인 식당 1곳 · 네이버 공개 페이지 · 개선 방향 최대 3개</p>
      <Link className="btn" href="/free-audit">
        무료 간단 진단 신청 ↗
      </Link>
      <small>신청만으로 유료 계약이나 정보 수정이 진행되지 않습니다.</small>
    </div>
  );
}
function PackageCards() {
  return (
    <div className="cards">
      {packages.map((p) => (
        <article className="card offer-card" key={p.name}>
          <span className="eyebrow">{p.audience}</span>
          <h2>{p.name}</h2>
          <strong className="offer-price">{p.price}</strong>
          <ul>
            {p.items.map((i) => (
              <li key={i}>{i}</li>
            ))}
          </ul>
          <p>{p.boundary}</p>
          <Link href="/free-audit" className="offer-link">
            {p.name === "무료 간단 진단"
              ? "무료 진단 신청"
              : "진단 후 범위 상담"}{" "}
            ↗
          </Link>
        </article>
      ))}
    </div>
  );
}
function Sample({ detailed = false }: { detailed?: boolean }) {
  return (
    <article className="card sample-card">
      <span className="tag">가상 자료 · 형식 예시 · 고객 실적 아님</span>
      <h2>손님이 메뉴와 이용 방법을 판단할 수 있도록</h2>
      <p>
        가상의 ‘한칸식당’을 예로 든 납품 형식입니다. 실제 매장 조사·고객
        인터뷰·적용 결과가 아닙니다.
      </p>
      <div className="sample-grid">
        <div>
          <h3>관찰한 정보</h3>
          <p>메뉴명과 가격만 있고 구성·포장 안내가 없는 상황을 가정합니다.</p>
        </div>
        <div>
          <h3>개선 원고 예시</h3>
          <p>
            “점심 정식은 밥·국·반찬으로 구성됩니다. 포장이 필요하면 주문할 때
            말씀해주세요.”
          </p>
          <small>
            구성과 포장 가능 여부는 고객 확인이 있어야 사용할 수 있는
            예시입니다.
          </small>
        </div>
      </div>
      {detailed ? (
        <>
          <div
            className="sample-table-wrap"
            role="region"
            aria-label="가상 분석과 적용 기록표"
            tabIndex={0}
          >
            <table>
              <caption>사실·확인·가설·적용·미확인을 구분하는 기록 예시</caption>
              <thead>
                <tr>
                  <th>구분</th>
                  <th>근거·관찰</th>
                  <th>개선·다음 행동</th>
                  <th>상태</th>
                </tr>
              </thead>
              <tbody>
                {sampleRows.map((row) => (
                  <tr key={row[0]}>
                    {row.map((cell, i) => (
                      <td key={i}>{cell}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p>
            비교 예시 A·B·C는 동일 상권·유사업종·유사 가격대라는 조건을
            가정합니다. 실제 비교 매장 선정 시에는 출처 URL·확인 날짜·선정
            이유를 기록하고 문구·사진을 복제하지 않습니다.
          </p>
          <p>
            납품은 원고·메뉴 정리·사진 활용 목록·변경 기록으로 확인합니다.
            조회·통화·예약 변화는 확인 가능한 경우 별도 관찰하고, 실제
            방문·매출·수익은 미확인으로 남깁니다. 광고·행사·휴무·계절 등 외부
            변수도 따로 기록합니다.
          </p>
        </>
      ) : (
        <Link className="offer-link" href="/cases">
          분석표·개선안·적용 기록 전체 보기 ↗
        </Link>
      )}
    </article>
  );
}
function Suitability() {
  return (
    <div className="cards two-cards">
      <article className="card">
        <h2>이런 사장님께 맞습니다</h2>
        <ul>
          <li>영업 중인 동네 개인 식당을 운영합니다.</li>
          <li>소개·메뉴·사진에 실제 강점이 잘 보이지 않습니다.</li>
          <li>20~30분 인터뷰와 메뉴·사진 자료 제공이 가능합니다.</li>
          <li>제안을 확인하고 적용에 필요한 권한을 협의할 수 있습니다.</li>
        </ul>
      </article>
      <article className="card">
        <h2>이 요청은 다루지 않습니다</h2>
        <ul>
          <li>검색 상위 노출·예약·매출 보장</li>
          <li>허위 리뷰·다른 매장의 사진과 문구 복제</li>
          <li>전문 촬영·영상 제작·광고 집행</li>
          <li>계정 인증 우회·비밀번호나 인증코드 공유</li>
          <li>여러 채널의 무제한 작업·상시 응대</li>
        </ul>
      </article>
    </div>
  );
}
function Operator() {
  return (
    <article className="card prose">
      <span className="eyebrow">누가 함께하나요</span>
      <h2>한칸데이터 운영자 유성균입니다.</h2>
      <p>
        동네 개인 식당의 온라인 모습을 함께 정리하는 1인 서비스입니다.
        인터뷰·제안·작업 확인을 운영자가 직접 맡고, 감당할 수 있는 범위와 일정을
        먼저 합의합니다.
      </p>
      <p>
        지금은 초기 고객과 상품 범위를 검증하는 단계입니다. 가상의 분석 샘플은
        작업 형식을 보여주기 위한 것이며, 실제 고객 후기·매출 성과로 소개하지
        않습니다.
      </p>
      <p>
        공개 화면에서 본 사실, 고객이 확인한 내용, 개선 가설, 실제 적용 상태를
        나누어 기록합니다. 네이버 중심의 승인 기반 수동 작업이며, 권한상 적용할
        수 없으면 고객 직접 수정 지원으로 안내합니다.
      </p>
      <a className="offer-link" href="mailto:sjdjeksbjs112e4@gmail.com">
        sjdjeksbjs112e4@gmail.com
      </a>
    </article>
  );
}
function Home() {
  return (
    <>
      <InteractiveHero />
      <section className="section home-section">
        <div className="section-heading">
          <div>
            <span className="eyebrow">무엇을 도와드리나요</span>
            <h2>
              사장님의 가게를,
              <br />
              손님이 이해하기 쉽게.
            </h2>
          </div>
          <p>
            막연한 홍보 제안 대신,
            <br />
            확인한 사실로 바꿀 내용을 정합니다.
          </p>
        </div>
        <div className="cards value-cards">
          {[
            [
              "01",
              "빠진 정보를 찾고",
              "유사 매장 3곳의 정보 구성을 참고해, 손님이 방문 전에 궁금해할 항목을 찾습니다.",
            ],
            [
              "02",
              "가게답게 정리하고",
              "인터뷰와 고객 자료를 바탕으로 소개문·메뉴·사진·이용 안내를 정리합니다.",
            ],
            [
              "03",
              "적용까지 함께합니다",
              "승인받은 내용을 적용하거나 직접 수정을 돕고, 반영 여부를 한 번 더 확인합니다.",
            ],
          ].map(([n, t, b]) => (
            <article className="card" key={n}>
              <span className="step-token">{n}</span>
              <h3>{t}</h3>
              <p>{b}</p>
            </article>
          ))}
        </div>
      </section>
      <section className="section home-section sample-section">
        <Sample />
      </section>
      <section className="section home-section">
        <div className="section-heading">
          <div>
            <span className="eyebrow">필요한 만큼만 시작하세요</span>
            <h2>
              가볍게 확인하고,
              <br />
              개선은 범위를 정한 뒤.
            </h2>
          </div>
          <Link className="offer-link" href="/pricing">
            범위·견적 자세히 보기 →
          </Link>
        </div>
        <div className="cards compact-packages">
          {[
            {
              n: "01",
              title: "무료 간단 진단",
              price: "0원",
              desc: "어디부터 바꿀지 궁금하다면",
              items: [
                "네이버 공개 페이지 확인",
                "개선 방향 최대 3개",
                "완성 원고·수정 작업 제외",
              ],
              label: "무료 진단 신청",
              href: "/free-audit",
            },
            {
              n: "02",
              title: "초기 개선",
              price: "자료 확인 후 별도 견적",
              desc: "실제 자료로 가게의 모습을 정리",
              items: [
                "인터뷰·유사 매장 3곳 비교",
                "소개문·메뉴·제공 사진 정리",
                "피드백 1회·적용 지원·재확인",
              ],
              label: "초기 개선 범위 보기",
              href: "/services",
            },
            {
              n: "03",
              title: "월간 운영",
              price: "반복 수요 확인 후 별도 견적",
              desc: "꾸준히 바뀌는 정보가 있다면",
              items: [
                "월 1회 계획·소식 2건",
                "변경 요청 월 1회 취합",
                "확인 가능한 지표·다음 제안",
              ],
              label: "월간 운영 범위 보기",
              href: "/services",
            },
          ].map((p) => (
            <article className="card compact-package" key={p.n}>
              <span className="package-number">{p.n}</span>
              <p className="package-audience">{p.desc}</p>
              <h3>{p.title}</h3>
              <strong className="package-price">{p.price}</strong>
              <ul>
                {p.items.map((i) => (
                  <li key={i}>{i}</li>
                ))}
              </ul>
              <Link className="offer-link" href={p.href}>
                {p.label} <span aria-hidden="true">↗</span>
              </Link>
            </article>
          ))}
        </div>
        <p className="scope-note">
          무료 진단 후 유료 전환 의무는 없습니다. 추가 채널·촬영·광고는 기본
          범위에 포함되지 않습니다.
        </p>
      </section>
      <section className="section home-section fit-section">
        <div>
          <span className="eyebrow">함께할 매장</span>
          <h2>
            이런 사장님께
            <br />잘 맞습니다.
          </h2>
        </div>
        <div>
          <ul className="fit-list">
            <li>영업 중인 동네 개인 식당을 운영하고 있어요.</li>
            <li>가게의 특징과 이용 정보를 더 잘 보여주고 싶어요.</li>
            <li>인터뷰와 메뉴·사진 자료 제공이 가능해요.</li>
          </ul>
          <details className="scope-details">
            <summary>제공하지 않는 작업도 확인해주세요</summary>
            <p>
              검색 순위·매출 보장, 허위 리뷰, 전문 촬영·영상·광고, 무제한
              작업·상시 응대는 제공하지 않습니다. 권한상 직접 적용이 어려우면
              고객의 직접 수정을 지원합니다.
            </p>
          </details>
        </div>
      </section>
      <section className="section home-section">
        <div className="section-heading">
          <div>
            <span className="eyebrow">한 사람이 책임 있게</span>
            <h2>
              인터뷰부터 결과 확인까지,
              <br />
              유성균 운영자가 함께합니다.
            </h2>
          </div>
          <Link className="offer-link" href="/contact">
            운영자·책임 범위 보기 →
          </Link>
        </div>
        <div className="operator-note">
          <span className="operator-avatar" aria-hidden="true">
            한
          </span>
          <p>
            한칸데이터는 초기 고객과 제공 범위를 검증하는 1인 서비스입니다.
            <br />
            검증되지 않은 성공 사례 대신, 확인한 사실과 합의한 작업을
            기록합니다.
          </p>
        </div>
      </section>
      <section className="section home-section home-faq">
        <div>
          <span className="eyebrow">신청 전 확인하세요</span>
          <h2>
            궁금한 점을
            <br />
            먼저 풀어드릴게요.
          </h2>
          <Link className="offer-link" href="/faq">
            질문 전체 보기 →
          </Link>
        </div>
        <InteractiveFaq compact />
      </section>
      <section className="section home-section">
        <CallToAction />
      </section>
    </>
  );
}
export default function Public({ page = "" }: { page?: string }) {
  return (
    <div className="public-site">
      <a className="skip-link" href="#public-content">
        본문으로 바로가기
      </a>
      <PublicHeader />
      <PublicEffects showShortcut={page !== "free-audit"} />
      <main id="public-content">
        {!page ? (
          <Home />
        ) : (
          <section className="section page-section">
            <span className="eyebrow">한칸데이터 · 매장 온라인 개선·운영</span>
            <h1>{pages[page] || "페이지를 찾을 수 없습니다"}</h1>
            {page === "free-audit" ? (
              <>
                <p>
                  네이버 공개 페이지에서 핵심 개선 방향 최대 3개를 짚어드립니다.
                  무료 진단은 상세 비교 조사·완성 원고·사진 작업·실제 수정을
                  포함하지 않습니다.
                </p>
                <IntakeForm />
              </>
            ) : page === "services" ? (
              <>
                <p>
                  우선 네이버 플레이스를 중심으로, 가게의 실제 강점과 방문에
                  필요한 정보를 정리합니다. 기본정보 정확성도 함께 확인합니다.
                </p>
                <PackageCards />
                <section className="public-block">
                  <h2>초기 개선의 기본 범위</h2>
                  <p>
                    매장 1곳 · 인터뷰 20~30분 · 유사 매장 3곳 · 개선 과제 3~5개
                    · 소개문 1안 · 메뉴 최대 5개 · 고객 사진 최대 10장 · 고객
                    피드백 1회 · 적용 지원 · 이후 1회 재확인.
                  </p>
                  <p>
                    이용 안내는 해당 항목만 정리합니다. 메뉴 정리는
                    이름·가격·구성·특징을 대상으로 하며 번역·디자인 제작은
                    포함하지 않습니다. 사진은 촬영 없이 선정·기본 밝기/크롭·활용
                    제안을 제공합니다.
                  </p>
                  <p>
                    적용 가능한 항목은 견적에서 지정합니다. 플랫폼 심사·권한
                    문제로 직접 적용할 수 없으면 고객 직접 수정 지원 또는 미적용
                    항목으로 구분합니다. 게시 완료를 미리 보장하지 않습니다.
                  </p>
                  <p>
                    정보 구성이 명확한 참고 매장 2곳 추가 조사, 다른 채널, 추가
                    원고와 자료는 기본 범위 밖이며 필요한 경우 별도 합의합니다.
                  </p>
                </section>
                <Suitability />
                <section className="public-block">
                  <h2>추가 채널은 검증한 뒤 넓힙니다</h2>
                  <p>
                    구글·인스타 운영·한 페이지 사이트는 현재 기본 상품으로
                    판매하지 않습니다. 초기 개선의 반복 수요와 제공 가능한
                    권한·자료를 확인한 뒤 확장 여부를 검토합니다.
                  </p>
                </section>
                <CallToAction />
              </>
            ) : page === "pricing" ? (
              <>
                <p>
                  무료 간단 진단은 0원입니다. 유료 작업의 표준 판매가는 아직
                  확정하지 않았으며 자료·권한·요청 항목을 확인한 뒤 총액을
                  견적으로 안내합니다.
                </p>
                <PackageCards />
                <section className="public-block">
                  <h2>계약 전에 확인하는 내용</h2>
                  <ol>
                    <li>작업 항목과 결과물, 제외 범위</li>
                    <li>세금·추가 비용을 포함한 총 결제금액과 지급 조건</li>
                    <li>자료 전달일, 납기, 피드백 1회와 재확인 시점</li>
                    <li>
                      권한 부족·심사 지연·미적용 항목 처리, 취소·환불 조건
                    </li>
                  </ol>
                  <p>
                    무료 신청은 계약·결제가 아닙니다. 자동결제나 월간 계약
                    의무가 없습니다. 현재 전체 초기 개선 무료 시범 모집은 공개
                    접수하지 않으며, 별도 제안이 있으면 기간·범위·선정·종료
                    조건을 사전에 안내합니다. 긍정 후기나 유료 전환을 조건으로
                    삼지 않습니다.
                  </p>
                </section>
                <CallToAction />
              </>
            ) : page === "how-it-works" ? (
              <>
                <div className="cards">
                  {steps.map(([t, b], i) => (
                    <article className="card" key={t}>
                      <span className="eyebrow">{i + 1}단계</span>
                      <h2>{t}</h2>
                      <p>{b}</p>
                    </article>
                  ))}
                </div>
                <section className="public-block">
                  <h2>‘완료’와 ‘성과’를 구분합니다</h2>
                  <p>
                    납품한 원고·메뉴·사진 목록과 실제 적용한 항목은 작업
                    기록으로 확인합니다. 조회·통화·예약은 권한으로 확인한
                    경우에만 관찰 지표로 기록하며, 실제 방문·매출·수익이나 개선
                    작업의 인과 효과로 단정하지 않습니다.
                  </p>
                </section>
                <CallToAction />
              </>
            ) : page === "cases" ? (
              <>
                <Sample detailed />
                <section className="public-block">
                  <h2>초기 개선의 납품 묶음</h2>
                  <ul>
                    <li>비교 기준과 출처를 적은 개선 과제 3~5개</li>
                    <li>고객 확인 사실을 반영한 소개문 1안·메뉴 최대 5개</li>
                    <li>고객 제공 사진 최대 10장의 선정·기본 보정·활용 목록</li>
                    <li>해당 이용 안내와 적용·미적용·대기 항목 기록</li>
                    <li>합의한 시점의 재확인 1회와 남은 과제</li>
                  </ul>
                  <p>
                    위 샘플에 실제 고객 후기, 시장조사나 성과 수치는 없습니다.
                  </p>
                </section>
                <CallToAction />
              </>
            ) : page === "faq" ? (
              <>
                <InteractiveFaq />
                <CallToAction />
              </>
            ) : page === "contact" ? (
              <>
                <Operator />
                <section className="public-block">
                  <h2>매장과 고민부터 알려주세요</h2>
                  <p>
                    상호, 지역 또는 지도 링크와 현재 가장 고민되는 부분을
                    적어주세요. 다른 채널이나 특별한 요청은 기본 상품과 별도로
                    가능 여부를 확인합니다. 민감한 원본·비밀번호·인증코드는
                    보내지 마세요.
                  </p>
                </section>
                <CallToAction />
              </>
            ) : page === "privacy" ? (
              <article className="card prose">
                <h2>상담과 업무 수행에 필요한 정보만 사용합니다.</h2>
                <p>관리책임자: 유성균 / sjdjeksbjs112e4@gmail.com</p>
                <p>
                  필수 항목: 상호, 매장 지역·주소 또는 지도 링크 등 식별 정보,
                  회신 이메일, 선택한 고민. 선택 항목: 추가 요청 내용, 담당자
                  이름·연락처, 다른 온라인 채널 주소, 메뉴·사진 자료 제공 가능
                  여부, 신청 경로. 음식점 진단 신청으로 분류하며 문의·동의
                  이력도 기록합니다.
                </p>
                <p>
                  이용 목적: 매장 식별, 신청 확인, 공개 페이지 진단, 범위
                  상담·견적, 고객 승인과 합의한 업무 수행. 선택 정보와 마케팅
                  동의는 거부해도 무료 진단을 신청할 수 있습니다. 필수 정보
                  수집·서비스 회신 동의를 거부하면 접수·회신이 어렵습니다.
                </p>
                <p>
                  미거래 신청은 마지막 상담 후 30일을 기준으로 검토·삭제합니다.
                  계약·승인 증빙·거래기록은 별도 안내와 관련 의무를 확인합니다.
                  자동으로 모든 자료가 삭제되는 것으로 안내하지 않으며 관리자
                  정리 절차와 이메일·백업 보관도 별도로 관리합니다.
                </p>
                <p>
                  서비스 운영에는 Render(서버), Supabase(DB·비공개 파일),
                  Resend(메일)를 사용합니다. 실제 처리 지역·위탁 및 국외 처리에
                  필요한 고지는 운영 설정과 적용 요건을 확인해 보완해야 합니다.
                  이 안내가 법률 검토 완료를 의미하지 않습니다.
                </p>
                <p>
                  고객 자료를 외부 AI에 전달하는 경우에는 제공 범위와 처리방식을
                  먼저 확인합니다. 공개정보 비교와 원고 제안도 사람이 사실과
                  적용 여부를 확인합니다. 열람·정정·삭제·연락 중단은 위 문의처로
                  요청할 수 있습니다.
                </p>
              </article>
            ) : page === "terms" ? (
              <article className="card prose">
                <h2>무엇을 맡기는지 먼저 합의합니다.</h2>
                <p>
                  무료 진단은 네이버 공개 페이지의 핵심 개선 방향 최대 3개
                  안내입니다. 초기 개선의 인터뷰·상세 비교·완성 원고·사진
                  작업·수정은 별도 범위입니다. 무료 신청은 계약·결제·정보 수정
                  승인이나 유료 전환 의무가 아닙니다.
                </p>
                <p>
                  유료 작업 전 항목·결과물·제외 범위·총
                  결제금액·납기·피드백·재확인·취소 및 환불 조건을 합의합니다.
                  메뉴 최대 5개, 사진 최대 10장 등 기본 범위를 넘는 작업은 별도
                  견적입니다. 심사 지연·권한 부족·자료 지연의 처리도 계약에서
                  정합니다.
                </p>
                <p>
                  고객은 제공 자료의 사용권과 매장 관리 권한을 확인해야 합니다.
                  네이버·구글의 권한 구조를 각각 확인하며 비밀번호·인증코드
                  공유나 소유권 이전을 기본 절차로 삼지 않습니다. 대행 적용이
                  불가하면 고객 직접 수정 지원과 미적용 범위를 구분합니다.
                </p>
                <p>
                  비교 매장의 문구·사진을 복제하지 않으며 검색
                  순위·조회·예약·매출·심사 결과를 보장하지 않습니다. 플랫폼
                  제한을 우회하거나 허위 리뷰를 작성하지 않습니다. 온라인
                  자동결제·정기결제는 제공하지 않습니다.
                </p>
                <p>
                  판매자 고지·사업자등록·세무·결제 수단·법정 취소 권리 등 실제
                  판매에 필요한 사항은 운영 상황에 맞춰 별도 확인해야 합니다. 본
                  문구는 해당 준비나 법률 검토를 완료했다는 뜻이 아닙니다.
                </p>
              </article>
            ) : (
              <Link href="/">첫 화면으로 돌아가기</Link>
            )}
          </section>
        )}
      </main>
      <footer>
        <div className="brand">한칸데이터</div>
        <p>동네 개인 식당의 강점을, 방문을 고민하는 손님에게.</p>
        <div>
          {Object.entries(pages).map(([p, t]) => (
            <Link href={"/" + p} key={p}>
              {t}
            </Link>
          ))}
          <Link href="/admin/dashboard">운영자 로그인</Link>
        </div>
        <small>
          운영 유성균 ·{" "}
          <a href="mailto:sjdjeksbjs112e4@gmail.com">
            sjdjeksbjs112e4@gmail.com
          </a>
        </small>
      </footer>
    </div>
  );
}
