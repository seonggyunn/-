"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { faqs } from "../content";

export function LineIcon({
  name,
  className = "",
}: {
  name: string;
  className?: string;
}) {
  const paths: Record<string, React.ReactNode> = {
    search: (
      <>
        <circle cx="10.5" cy="10.5" r="6.5" />
        <path d="m16 16 5 5M8 10.5h5m-2.5-2.5v5" />
      </>
    ),
    menu: (
      <>
        <rect x="5" y="3" width="14" height="18" rx="3" />
        <path d="M9 8h6M9 12h6M9 16h3" />
      </>
    ),
    photo: (
      <>
        <rect x="3" y="4" width="18" height="16" rx="3" />
        <circle cx="8" cy="9" r="1.5" />
        <path d="m4 17 5-5 4 4 3-3 5 5" />
      </>
    ),
    pin: (
      <>
        <path d="M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 1 1 14 0Z" />
        <circle cx="12" cy="10" r="2.5" />
      </>
    ),
    chat: (
      <>
        <path d="M5 18 3 21V6a3 3 0 0 1 3-3h12a3 3 0 0 1 3 3v9a3 3 0 0 1-3 3Z" />
        <path d="M8 8h8M8 12h5" />
      </>
    ),
    arrow: <path d="M5 12h14m-6-6 6 6-6 6" />,
    chevron: <path d="m8 4 8 8-8 8" />,
  };
  return (
    <svg
      className={className}
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name] || paths.menu}
    </svg>
  );
}

const navigation = [
  {
    title: "서비스 안내",
    links: [
      ["/services", "어떤 도움을 받을 수 있나요?", "소개·메뉴·사진·방문 안내"],
      ["/pricing", "범위와 요금", "무료 진단부터 필요한 만큼"],
      ["/how-it-works", "진행 과정", "신청부터 적용 확인까지"],
    ],
  },
  {
    title: "개선 예시",
    links: [
      ["/cases", "매장 개선 샘플", "원고와 변경 기록의 가상 예시"],
      ["/services", "받게 되는 결과물", "초기 개선의 작업 범위"],
    ],
  },
  {
    title: "이용 안내",
    links: [
      ["/faq", "자주 묻는 질문", "신청 전에 궁금한 점"],
      ["/contact", "한칸데이터 소개", "함께하는 운영자와 문의처"],
    ],
  },
];

export function PublicHeader() {
  const [open, setOpen] = useState<number | null>(null);
  const [mobile, setMobile] = useState(false);
  const header = useRef<HTMLElement>(null);
  useEffect(() => {
    const close = (e: PointerEvent) => {
      if (!header.current?.contains(e.target as Node)) {
        setOpen(null);
        setMobile(false);
      }
    };
    const escape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(null);
        setMobile(false);
      }
    };
    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("pointerdown", close);
      document.removeEventListener("keydown", escape);
    };
  }, []);
  return (
    <header
      ref={header}
      className="top interactive-header"
      onKeyDown={(e) => {
        if (e.key === "Escape") {
          if (!mobile && open !== null)
            header.current
              ?.querySelector<HTMLButtonElement>(`#nav-trigger-${open}`)
              ?.focus();
          else
            header.current
              ?.querySelector<HTMLButtonElement>(".mobile-menu-toggle")
              ?.focus();
          setOpen(null);
          setMobile(false);
        }
      }}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) {
          setOpen(null);
          setMobile(false);
        }
      }}
    >
      <Link href="/" className="brand" aria-label="한칸데이터 홈">
        <i>한</i> 한칸데이터<span className="brand-dot">.</span>
      </Link>
      <nav
        id="public-navigation"
        aria-label="주요 메뉴"
        className={mobile ? "is-mobile-open" : ""}
      >
        {navigation.map((item, i) => (
          <div
            key={item.title}
            className="nav-group"
            onMouseEnter={() => {
              if (
                window.matchMedia("(hover: hover) and (min-width: 851px)")
                  .matches
              )
                setOpen(i);
            }}
            onMouseLeave={() => {
              if (window.matchMedia("(min-width: 851px)").matches)
                setOpen(null);
            }}
          >
            <button
              id={`nav-trigger-${i}`}
              aria-expanded={open === i}
              aria-controls={`nav-panel-${i}`}
              onClick={() => setOpen(open === i ? null : i)}
            >
              {item.title}
              <span className="nav-caret" aria-hidden="true">
                ⌄
              </span>
            </button>
            <div
              id={`nav-panel-${i}`}
              className={`nav-dropdown ${open === i ? "is-open" : ""}`}
              inert={open !== i}
            >
              {item.links.map(([href, title, description]) => (
                <Link
                  href={href}
                  key={title}
                  onClick={() => {
                    setOpen(null);
                    setMobile(false);
                  }}
                >
                  <strong>
                    {title}
                    <span aria-hidden="true">↗</span>
                  </strong>
                  <small>{description}</small>
                </Link>
              ))}
            </div>
          </div>
        ))}
        <Link className="nav-direct" href="/contact">
          문의하기
        </Link>
      </nav>
      <div className="header-actions">
        <Link className="btn small" href="/free-audit">
          무료 진단 <span aria-hidden="true">↗</span>
        </Link>
        <button
          className="mobile-menu-toggle"
          aria-label={mobile ? "메뉴 닫기" : "메뉴 열기"}
          aria-expanded={mobile}
          aria-controls="public-navigation"
          onClick={() => {
            setMobile(!mobile);
            setOpen(null);
          }}
        >
          <span />
          <span />
        </button>
      </div>
    </header>
  );
}

const slides = [
  {
    label: "우리 가게의 첫인상",
    question: (
      <>
        혹시, 우리 가게의 매력이
        <br />
        온라인에서는
        <br />
        <em>잘 안 보이나요?</em>
      </>
    ),
    description:
      "소개는 막막하고, 메뉴와 사진은 오래됐다면.\n손님의 눈으로 보고 바꿀 방향을 짚어드릴게요.",
    tag: "가게의 강점",
    title: "무엇이 특별한 가게인지",
    detail: "소개에 우리 가게만의 특징이 담겨 있나요?",
    icon: "search",
  },
  {
    label: "메뉴와 사진 점검",
    question: (
      <>
        맛있는 메뉴인데,
        <br />
        사진과 설명만으로
        <br />
        <em>충분히 전해지나요?</em>
      </>
    ),
    description:
      "메뉴 이름만으로 알기 어려운 구성과 특징.\n손님이 고르기 쉬운 정보인지 함께 살펴봅니다.",
    tag: "메뉴·사진",
    title: "고르기 쉬운 메뉴 안내",
    detail: "구성·가격·사진이 함께 전달되고 있나요?",
    icon: "photo",
  },
  {
    label: "방문 전 궁금한 정보",
    question: (
      <>
        주차는요? 포장되나요?
        <br />
        같은 질문을
        <br />
        <em>계속 받고 있나요?</em>
      </>
    ),
    description:
      "방문 전에 궁금한 영업시간·주차·포장 안내.\n손님이 찾기 쉬운 곳에 있는지 확인해보세요.",
    tag: "방문 안내",
    title: "오시기 전에 알아두세요",
    detail: "영업시간·주차·포장 안내가 잘 보이나요?",
    icon: "pin",
  },
];

function StoreIllustration({ index }: { index: number }) {
  return (
    <div className={`store-stage stage-${index}`}>
      <div className="stage-orbit orbit-one" />
      <div className="stage-orbit orbit-two" />
      <div className="store-window">
        <div className="window-bar">
          <span />
          <span />
          <span />
          <small>우리 가게 온라인 페이지</small>
        </div>
        <div className="store-scene" aria-hidden="true">
          <svg viewBox="0 0 400 190" role="presentation">
            <defs>
              <linearGradient id="shop-gradient" x2="1" y2="1">
                <stop stopColor="#d5e9ef" />
                <stop offset="1" stopColor="#eff6f1" />
              </linearGradient>
            </defs>
            <rect width="400" height="190" fill="url(#shop-gradient)" />
            <circle cx="326" cy="42" r="25" fill="#fff2c7" />
            <rect
              x="75"
              y="60"
              width="250"
              height="140"
              rx="5"
              fill="#fffdf6"
            />
            <path d="M63 62h274l-20-30H83Z" fill="#419c83" />
            <path
              d="M65 63h270v19c-15 15-30 0-30 0s-15 15-30 0c-15 15-30 0-30 0s-15 15-30 0c-15 15-30 0-30 0s-15 15-30 0c-15 15-30 0-30 0s-15 15-30 0c-15 15-30 0-30 0Z"
              fill="#6ab99e"
            />
            <rect x="94" y="101" width="79" height="64" rx="5" fill="#c4e0e5" />
            <rect
              x="227"
              y="101"
              width="79"
              height="64"
              rx="5"
              fill="#c4e0e5"
            />
            <path d="M133 101v64m133-64v64" stroke="#fff" strokeWidth="5" />
            <rect x="182" y="99" width="35" height="91" rx="4" fill="#466b6a" />
            <circle cx="208" cy="148" r="2" fill="#e9c385" />
            <path d="M50 190v-38m300 38v-38" stroke="#73927a" strokeWidth="5" />
            <circle cx="50" cy="141" r="19" fill="#7aad8f" />
            <circle cx="350" cy="141" r="19" fill="#7aad8f" />
          </svg>
          <span>
            한칸식당 <small>가상 매장</small>
          </span>
        </div>
        <div className="store-body">
          <span className="store-category">동네의 맛있는 한 끼</span>
          <h2>
            처음 오는 손님도,
            <br />
            우리 가게를 알 수 있도록.
          </h2>
          <div className="store-tabs">
            <span className={index === 0 ? "active" : ""}>소개</span>
            <span className={index === 1 ? "active" : ""}>메뉴·사진</span>
            <span className={index === 2 ? "active" : ""}>이용 안내</span>
          </div>
          <div className="store-lines">
            <span />
            <span />
          </div>
        </div>
      </div>
      <div className="floating-insight" key={index}>
        <div className="insight-icon">
          <LineIcon name={slides[index].icon} />
        </div>
        <div>
          <small>CHECK POINT 0{index + 1}</small>
          <strong>{slides[index].title}</strong>
          <p>{slides[index].detail}</p>
        </div>
        <span className="insight-check" aria-hidden="true">
          ✓
        </span>
      </div>
      <span className="stage-badge">
        <span /> 손님의 시선으로 한 번 더
      </span>
      <small className="stage-disclaimer">
        설명을 위한 가상 화면 · 실제 고객 사례가 아닙니다
      </small>
    </div>
  );
}

export function InteractiveHero() {
  const [index, setIndex] = useState(0);
  const change = (delta: number) =>
    setIndex((i) => (i + delta + slides.length) % slides.length);
  return (
    <>
      <section
        className={`landing-hero theme-${index}`}
        aria-roledescription="캐러셀"
        aria-label="매장 고민별 안내"
      >
        <div className="landing-inner">
          <div className="landing-copy" key={index}>
            <span className="landing-kicker">
              동네 식당 사장님을 위한 한칸데이터
            </span>
            <h1>{slides[index].question}</h1>
            <p className="landing-description">{slides[index].description}</p>
            <strong className="free-promise">
              우리 가게, 무료로 진단해드립니다.
            </strong>
            <div className="landing-actions">
              <Link className="btn" href="/free-audit">
                무료 진단받기
                <LineIcon name="arrow" />
              </Link>
              <Link className="text-action" href="/cases">
                개선 예시 보기 <span aria-hidden="true">↗</span>
              </Link>
            </div>
            <small className="landing-scope">
              네이버 공개 페이지 1곳 · 개선 방향 최대 3개
              <br />
              완성 원고·사진 작업·실제 수정은 별도 범위입니다.
            </small>
          </div>
          <StoreIllustration index={index} />
          <div className="hero-controls">
            <div className="slide-dots">
              {slides.map((slide, i) => (
                <button
                  key={slide.label}
                  aria-label={`${i + 1}번: ${slide.label}`}
                  aria-pressed={index === i}
                  onClick={() => setIndex(i)}
                >
                  <span />
                </button>
              ))}
            </div>
            <span className="slide-counter" aria-live="polite">
              0{index + 1} / 03
            </span>
            <button
              className="circle-control previous"
              aria-label="이전 고민 보기"
              onClick={() => change(-1)}
            >
              <LineIcon name="chevron" />
            </button>
            <button
              className="circle-control"
              aria-label="다음 고민 보기"
              onClick={() => change(1)}
            >
              <LineIcon name="chevron" />
            </button>
          </div>
        </div>
      </section>
      <div className="quick-services section" aria-label="빠른 서비스 안내">
        {[
          ["search", "무료 진단", "우리 가게 먼저 확인", "/free-audit"],
          ["menu", "서비스 안내", "어떤 도움을 받나요", "/services"],
          ["photo", "개선 예시", "작업 형식 미리 보기", "/cases"],
          ["pin", "진행 과정", "신청부터 적용까지", "/how-it-works"],
          ["chat", "궁금한 점", "자주 묻는 질문", "/faq"],
        ].map(([icon, title, sub, href]) => (
          <Link key={href} href={href}>
            <span className="quick-icon">
              <LineIcon name={icon} />
            </span>
            <span>
              <strong>{title}</strong>
              <small>{sub}</small>
            </span>
            <span className="quick-arrow" aria-hidden="true">
              ↗
            </span>
          </Link>
        ))}
      </div>
      <div className="intro-banner section">
        <span className="banner-symbol" aria-hidden="true">
          한
        </span>
        <div>
          <strong>
            가게 운영은 바쁘니까,
            <br className="mobile-only" /> 온라인 정리는 한칸씩.
          </strong>
          <p>소개·메뉴·사진·이용 안내, 필요한 것부터 함께 정리해요.</p>
        </div>
        <Link href="/services">
          서비스 알아보기 <LineIcon name="arrow" />
        </Link>
      </div>
    </>
  );
}

const faqGroups = [
  { title: "전체", indexes: faqs.map((_, i) => i) },
  { title: "무료 진단", indexes: [0, 1] },
  { title: "작업과 자료", indexes: [2, 4, 5, 6, 7] },
  { title: "비용과 운영", indexes: [3, 8, 9] },
];
export function InteractiveFaq({ compact = false }: { compact?: boolean }) {
  const [group, setGroup] = useState(0);
  const selected = compact
    ? faqGroups[group].indexes.slice(0, 4)
    : faqGroups[group].indexes;
  return (
    <div className="interactive-faq">
      <div className="faq-filters" aria-label="질문 분류">
        {faqGroups.map((g, i) => (
          <button
            key={g.title}
            aria-pressed={group === i}
            onClick={() => setGroup(i)}
          >
            {g.title}
          </button>
        ))}
      </div>
      <div className="faq" key={group}>
        {selected.map((i) => (
          <details className="card" key={i}>
            <summary>
              <span className="question-symbol" aria-hidden="true">
                Q
              </span>
              {faqs[i][0]}
              <span className="faq-plus" aria-hidden="true">
                +
              </span>
            </summary>
            <div className="faq-answer">
              <p>{faqs[i][1]}</p>
            </div>
          </details>
        ))}
      </div>
    </div>
  );
}

export function PublicEffects({ showShortcut }: { showShortcut: boolean }) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (reduced.matches) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("section-revealed");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.08 },
    );
    document
      .querySelectorAll(".public-site .home-section")
      .forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    const close = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    const escape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("pointerdown", close);
      document.removeEventListener("keydown", escape);
    };
  }, []);
  if (!showShortcut) return null;
  return (
    <div
      ref={root}
      className="floating-help"
      onMouseEnter={() => {
        if (window.matchMedia("(hover: hover)").matches) setOpen(true);
      }}
      onMouseLeave={() => setOpen(false)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) setOpen(false);
      }}
      onKeyDown={(e) => {
        if (e.key === "Escape") {
          setOpen(false);
          root.current
            ?.querySelector<HTMLButtonElement>(".help-trigger")
            ?.focus();
        }
      }}
    >
      <div
        id="quick-help-panel"
        className={`help-panel ${open ? "is-open" : ""}`}
        inert={!open}
      >
        <span>어디부터 시작할까요?</span>
        <Link href="/free-audit">
          <LineIcon name="search" />
          무료 진단 신청 <span aria-hidden="true">↗</span>
        </Link>
        <Link href="/cases">
          <LineIcon name="photo" />
          개선 예시 보기
        </Link>
        <Link href="/faq">
          <LineIcon name="chat" />
          자주 묻는 질문
        </Link>
      </div>
      <button
        className="help-trigger"
        aria-expanded={open}
        aria-controls="quick-help-panel"
        onClick={() => setOpen(!open)}
      >
        <LineIcon name="chat" />
        빠른 안내 <span aria-hidden="true">{open ? "×" : "+"}</span>
      </button>
    </div>
  );
}
