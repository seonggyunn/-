"use client";
import { useEffect, useRef, useState } from "react";
import {
  advance,
  createBattle,
  HEIGHT,
  RADIUS,
  STEP,
  WIDTH,
  type Battle,
} from "../../game/battle";
import { departments, departmentGroups } from "../../game/departments";
const colors = ["#6ce4cc", "#ff997f"];
type Phase = "ready" | "playing" | "paused" | "finished";
const freshSeed = () => crypto.getRandomValues(new Uint32Array(1))[0];
function clean(value: string) {
  return value
    .replace(/[\u0000-\u001f]/g, "")
    .trim()
    .slice(0, 30);
}
export default function CampusBattle() {
  const [names, setNames] = useState<[string, string]>([
    "컴퓨터공학과",
    "경영학과",
  ]);
  const [phase, setPhase] = useState<Phase>("ready"),
    [hp, setHp] = useState([100, 100]),
    [winner, setWinner] = useState<number | null>(null),
    [time, setTime] = useState(0),
    [hits, setHits] = useState(0),
    [speed, setSpeed] = useState(1),
    [message, setMessage] = useState(""),
    [group, setGroup] = useState("공학·IT"),
    [side, setSide] = useState<0 | 1>(0),
    [history, setHistory] = useState<string[]>([]);
  const canvas = useRef<HTMLCanvasElement>(null),
    battle = useRef<Battle | null>(null),
    seed = useRef(0),
    namesRef = useRef(names),
    phaseRef = useRef<Phase>("ready"),
    speedRef = useRef(1),
    reduced = useRef(false);
  useEffect(() => {
    namesRef.current = names;
  }, [names]);
  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);
  useEffect(() => {
    speedRef.current = speed;
  }, [speed]);
  useEffect(() => {
    const query = new URLSearchParams(window.location.search),
      a = clean(query.get("a") || ""),
      b = clean(query.get("b") || ""),
      s = query.get("seed");
    if (a && b && s && /^\d{1,10}$/.test(s)) {
      setNames([a, b]);
      seed.current = Number(s) >>> 0;
      setMessage("친구가 보낸 대결입니다. 시작하면 같은 결과를 재생합니다.");
    }
    reduced.current = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
  }, []);
  useEffect(() => {
    let frame = 0,
      last = 0,
      accumulator = 0,
      lastUi = 0;
    const ctx = canvas.current?.getContext("2d");
    if (!ctx) return;
    const draw = (stamp: number) => {
      const dt = last ? Math.min((stamp - last) / 1000, 0.05) : 0;
      last = stamp;
      const b = battle.current;
      if (b && phaseRef.current === "playing" && !document.hidden) {
        accumulator += dt * speedRef.current;
        while (accumulator >= STEP && b.winner === null) {
          advance(b);
          accumulator -= STEP;
        }
        if (stamp - lastUi > 65 || b.winner !== null) {
          setHp(b.balls.map((ball) => ball.hp));
          setTime(b.time);
          setHits(b.hits);
          lastUi = stamp;
        }
        if (b.winner !== null) {
          phaseRef.current = "finished";
          setPhase("finished");
          setWinner(b.winner);
          setHistory((h) =>
            [
              `${namesRef.current[b.winner!]} 승리 · ${Math.ceil(b.time)}초 · ${b.hits}회 충돌`,
              ...h,
            ].slice(0, 4),
          );
          accumulator = 0;
        }
      } else accumulator = 0;
      const el = canvas.current!;
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      if (el.width !== WIDTH * ratio) {
        el.width = WIDTH * ratio;
        el.height = HEIGHT * ratio;
      }
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      ctx.fillStyle = "#151b30";
      ctx.fillRect(0, 0, WIDTH, HEIGHT);
      ctx.strokeStyle = "#ffffff07";
      ctx.lineWidth = 1;
      for (let x = 0; x < WIDTH; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, HEIGHT);
        ctx.stroke();
      }
      for (let y = 0; y < HEIGHT; y += 40) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(WIDTH, y);
        ctx.stroke();
      }
      ctx.strokeStyle = "#8c98c433";
      ctx.setLineDash([5, 9]);
      ctx.beginPath();
      ctx.moveTo(WIDTH / 2, 0);
      ctx.lineTo(WIDTH / 2, HEIGHT);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.arc(WIDTH / 2, HEIGHT / 2, 65, 0, Math.PI * 2);
      ctx.stroke();
      const balls = b?.balls || [
        { x: 180, y: 220, vx: 0, vy: 0, hp: 100 },
        { x: 540, y: 220, vx: 0, vy: 0, hp: 100 },
      ];
      balls.forEach((ball, i) => {
        if (!reduced.current) {
          const trail = ctx.createLinearGradient(
            ball.x - ball.vx * 0.16,
            ball.y - ball.vy * 0.16,
            ball.x,
            ball.y,
          );
          trail.addColorStop(0, colors[i] + "00");
          trail.addColorStop(1, colors[i] + "55");
          ctx.strokeStyle = trail;
          ctx.lineWidth = RADIUS * 1.3;
          ctx.lineCap = "round";
          ctx.beginPath();
          ctx.moveTo(ball.x - ball.vx * 0.16, ball.y - ball.vy * 0.16);
          ctx.lineTo(ball.x, ball.y);
          ctx.stroke();
        }
        ctx.shadowColor = colors[i];
        ctx.shadowBlur = reduced.current ? 0 : 22;
        ctx.fillStyle = colors[i];
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, RADIUS, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.fillStyle = "#12263a";
        ctx.font = "bold 22px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(i === 0 ? "A" : "B", ball.x, ball.y + 8);
        ctx.fillStyle = "#fff";
        ctx.font = "bold 15px sans-serif";
        const title = namesRef.current[i];
        ctx.fillText(
          title.length > 12 ? title.slice(0, 11) + "…" : title,
          Math.max(90, Math.min(WIDTH - 90, ball.x)),
          ball.y > HEIGHT - 65 ? ball.y - 48 : ball.y + 60,
        );
      });
      if (b?.lastHit) {
        const age = b.time - b.lastHit.at;
        if (age < 0.65) {
          ctx.globalAlpha = 1 - age / 0.65;
          ctx.strokeStyle = "#fff4b0";
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(b.lastHit.x, b.lastHit.y, 20 + age * 75, 0, Math.PI * 2);
          ctx.stroke();
          ctx.font = "bold 24px sans-serif";
          ctx.fillStyle = "#ffe2a0";
          ctx.textAlign = "center";
          ctx.fillText(
            `−${Math.max(...b.lastHit.damage)}`,
            b.lastHit.x,
            Math.max(28, b.lastHit.y - 30 - age * 35),
          );
          ctx.globalAlpha = 1;
        }
      }
      frame = requestAnimationFrame(draw);
    };
    frame = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(frame);
  }, []);
  function start(replay = false) {
    const selected: [string, string] = [clean(names[0]), clean(names[1])];
    if (!selected[0] || !selected[1]) {
      setMessage("두 학과 이름을 입력해주세요.");
      return;
    }
    if (selected[0] === selected[1]) {
      setMessage(
        "서로 다른 이름을 골라주세요. 같은 학과라면 ‘경영학과 1반’처럼 구분해도 좋아요.",
      );
      return;
    }
    setNames(selected);
    namesRef.current = selected;
    if (!replay || !seed.current) seed.current = freshSeed() || 1;
    battle.current = createBattle(seed.current);
    phaseRef.current = "playing";
    setPhase("playing");
    setWinner(null);
    setHp([100, 100]);
    setTime(0);
    setHits(0);
    setMessage("");
  }
  function firstStart() {
    start(seed.current !== 0);
  }
  function updateName(i: 0 | 1, value: string) {
    setNames((prev) => {
      const next: [string, string] = [...prev];
      next[i] = value;
      return next;
    });
    seed.current = 0;
    setMessage("");
  }
  async function share() {
    if (!seed.current) {
      setMessage("대결을 한 번 시작한 뒤 결과 링크를 공유해주세요.");
      return;
    }
    const url = new URL("/campus-battle", window.location.origin);
    url.search = new URLSearchParams({
      a: namesRef.current[0],
      b: namesRef.current[1],
      seed: String(seed.current),
    }).toString();
    try {
      await navigator.clipboard.writeText(url.toString());
      setMessage("대결 링크를 복사했어요. 친구도 같은 대결을 볼 수 있습니다.");
    } catch {
      setMessage("아래 대결 링크를 복사해주세요.");
      setShareUrl(url.toString());
    }
  }
  const [shareUrl, setShareUrl] = useState("");
  const locked = phase === "playing" || phase === "paused";
  return (
    <main className="battle-site">
      <div className="battle-shell">
        <header className="battle-header">
          <a href="/campus-battle" className="battle-logo">
            <span>●</span> CAMPUS CLASH<small>학과 공싸움</small>
          </a>
          <span className="battle-beta">JUST FOR FUN</span>
        </header>
        <section className="battle-intro">
          <span className="battle-eyebrow">오늘의 과 대항전</span>
          <h1>
            우리 과 vs 너희 과.
            <br />
            <em>일단, 붙어보자.</em>
          </h1>
          <p>
            학과 두 개, 공 두 개. 마지막까지 살아남는 건 누구?
            <br />
            실력도 성적도 상관없이, 운으로 끝장내는 한 판.
          </p>
        </section>
        <div className="battle-layout">
          <section className="battle-setup" aria-label="대결 설정">
            <div className="battle-section-title">
              <span>01</span>
              <h2>출전 학과 고르기</h2>
            </div>
            <p className="battle-hint">
              목록에서 찾거나, 우리 과 이름을 직접 적어주세요.
            </p>
            {[0, 1].map((i) => (
              <label className={`fighter-input fighter-${i}`} key={i}>
                <span>
                  <b>{i === 0 ? "A" : "B"}</b>
                  {i === 0 ? "우리 과" : "상대 과"}
                </span>
                <input
                  disabled={locked || phase === "finished"}
                  list="department-list"
                  maxLength={30}
                  value={names[i]}
                  onChange={(e) => updateName(i as 0 | 1, e.target.value)}
                  aria-label={i === 0 ? "우리 과 이름" : "상대 과 이름"}
                />
              </label>
            ))}
            <datalist id="department-list">
              {departments.map((n) => (
                <option key={n} value={n} />
              ))}
            </datalist>
            <button
              disabled={locked || phase === "finished"}
              className="random-pair"
              onClick={() => {
                const a = Math.floor(Math.random() * departments.length);
                let b = Math.floor(Math.random() * (departments.length - 1));
                if (b >= a) b++;
                setNames([departments[a], departments[b]]);
                seed.current = 0;
              }}
            >
              ↻ 랜덤으로 두 학과 뽑기
            </button>
            <details className="department-picker">
              <summary>
                학과 목록에서 고르기 <span>{departments.length}개</span>
              </summary>
              <div className="pick-side">
                <button
                  disabled={locked || phase === "finished"}
                  aria-pressed={side === 0}
                  onClick={() => setSide(0)}
                >
                  A 우리 과
                </button>
                <button
                  disabled={locked || phase === "finished"}
                  aria-pressed={side === 1}
                  onClick={() => setSide(1)}
                >
                  B 상대 과
                </button>
              </div>
              <label className="group-label">
                계열
                <select
                  value={group}
                  onChange={(e) => setGroup(e.target.value)}
                >
                  {Object.keys(departmentGroups).map((g) => (
                    <option key={g}>{g}</option>
                  ))}
                </select>
              </label>
              <div className="department-chips">
                {departmentGroups[group].map((n) => (
                  <button
                    disabled={locked || phase === "finished"}
                    key={n}
                    onClick={() => updateName(side, n)}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </details>
            <div className="battle-rule">
              <span>✦</span>
              <p>
                <strong>모든 학과는 같은 조건!</strong>충돌할 때 무작위 공격과
                치명타가 발생해요. 실제 학과의 우열과는 무관한 놀이입니다.
              </p>
            </div>
          </section>
          <section className="battle-match" aria-label="대결 경기장">
            <div className="battle-scoreboard">
              {names.map((name, i) => (
                <div className={`fighter-score score-${i}`} key={i}>
                  <div>
                    <span>{i === 0 ? "A" : "B"}</span>
                    <strong>{name || "학과를 골라주세요"}</strong>
                    <b>
                      {hp[i]}
                      <small> HP</small>
                    </b>
                  </div>
                  <div
                    className="health-track"
                    role="progressbar"
                    aria-label={`${i === 0 ? "우리 과" : "상대 과"} 체력`}
                    aria-valuenow={hp[i]}
                    aria-valuemin={0}
                    aria-valuemax={100}
                  >
                    <span style={{ width: `${hp[i]}%` }} />
                  </div>
                </div>
              ))}
            </div>
            <div className="arena-wrap">
              <div className="arena-top">
                <span className={phase === "playing" ? "status-live" : ""}>
                  {phase === "ready"
                    ? "READY TO CLASH"
                    : phase === "paused"
                      ? "PAUSED"
                      : phase === "finished"
                        ? "MATCH FINISHED"
                        : "LIVE MATCH"}
                </span>
                <span>
                  {Math.floor(time).toString().padStart(2, "0")}s · 충돌 {hits}
                  회
                </span>
              </div>
              <canvas
                ref={canvas}
                aria-label="두 학과 공이 벽에 튕기고 서로 충돌하는 경기 애니메이션"
              />
              {phase === "ready" && (
                <div className="arena-overlay">
                  <span className="vs-mark">VS</span>
                  <strong>학과 자존심을 건 가벼운 한 판</strong>
                  <p>준비됐다면 아래 버튼을 눌러주세요.</p>
                </div>
              )}
              {phase === "paused" && (
                <div className="arena-overlay">
                  <strong>잠깐 쉬어가는 중</strong>
                  <button
                    className="battle-primary"
                    onClick={() => setPhase("playing")}
                  >
                    이어서 대결하기 ▶
                  </button>
                </div>
              )}
              {phase === "finished" && winner !== null && (
                <div className="arena-overlay result-overlay">
                  <span className="winner-star">✦</span>
                  <span className="battle-eyebrow">
                    WINNER · 오늘은 이 과가 주인공
                  </span>
                  <h2>{names[winner]}</h2>
                  <p>
                    {Math.ceil(time)}초 만에 승리! 남은 체력 {hp[winner]} HP
                  </p>
                  <button className="result-share" onClick={share}>
                    친구에게 이 대결 보내기 ↗
                  </button>
                </div>
              )}
            </div>
            <div className="battle-controls">
              {phase === "ready" ? (
                <button className="battle-primary" onClick={firstStart}>
                  대결 시작하기 <span>▶</span>
                </button>
              ) : locked ? (
                <button
                  className="battle-primary"
                  onClick={() =>
                    setPhase(phase === "paused" ? "playing" : "paused")
                  }
                >
                  {phase === "paused" ? "이어서 보기 ▶" : "잠깐 멈추기 Ⅱ"}
                </button>
              ) : (
                <button className="battle-primary" onClick={() => start(false)}>
                  운명 다시 뽑기 ↻
                </button>
              )}
              <button
                className="battle-secondary"
                onClick={() => setSpeed(speed === 1 ? 2 : 1)}
                aria-label="재생 속도 변경"
              >
                {speed}× 속도
              </button>
              <button className="battle-secondary" onClick={share}>
                링크 복사 ↗
              </button>
            </div>
            {phase === "finished" && (
              <div className="rematch-actions">
                <button onClick={() => start(true)}>같은 대결 다시 보기</button>
                <button
                  onClick={() => {
                    setPhase("ready");
                    phaseRef.current = "ready";
                    battle.current = null;
                    setHp([100, 100]);
                    setTime(0);
                    setHits(0);
                    seed.current = 0;
                  }}
                >
                  다른 학과 고르기
                </button>
              </div>
            )}
            <p className="battle-message" role="status">
              {message}
            </p>
            {shareUrl && (
              <input
                readOnly
                value={shareUrl}
                aria-label="공유할 대결 링크"
                onFocus={(e) => e.target.select()}
              />
            )}
            <div className="battle-how">
              <span>벽에 튕기고</span>
              <i>→</i>
              <span>부딪히면 공격</span>
              <i>→</i>
              <span>체력 0이면 끝!</span>
            </div>
          </section>
        </div>
        {history.length > 0 && (
          <section className="battle-history">
            <h2>이번 방문의 전적</h2>
            {history.map((entry, i) => (
              <p key={i}>
                <span>0{history.length - i}</span>
                {entry}
              </p>
            ))}
          </section>
        )}
        <footer className="battle-footer">
          <p>
            학과 이름은 주요 학과명 예시이며, 공식 전체 목록이 아닙니다. 없는
            이름은 직접 입력할 수 있어요.
          </p>
          <p>
            승패는 게임 속 무작위 공격으로 결정됩니다. 공유 링크는 동일한 대결을
            재생하며, 다시 뽑으면 새로운 결과가 나옵니다.
          </p>
          <span>CAMPUS CLASH · 친구랑 웃고 끝내는 한 판</span>
        </footer>
      </div>
    </main>
  );
}
