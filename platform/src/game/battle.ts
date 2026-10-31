export type Ball = { x: number; y: number; vx: number; vy: number; hp: number };
export type Hit = {
  x: number;
  y: number;
  at: number;
  damage: [number, number];
};
export type Battle = {
  balls: [Ball, Ball];
  time: number;
  cooldown: number;
  seed: number;
  winner: 0 | 1 | null;
  hits: number;
  lastHit: Hit | null;
};
export const WIDTH = 720,
  HEIGHT = 440,
  RADIUS = 34,
  STEP = 1 / 120;
function random(b: Battle) {
  b.seed = (b.seed + 0x6d2b79f5) | 0;
  let t = b.seed;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
export function createBattle(seed: number): Battle {
  const b: Battle = {
    balls: [
      { x: 180, y: 220, vx: 180, vy: 130, hp: 100 },
      { x: 540, y: 220, vx: -180, vy: -130, hp: 100 },
    ],
    time: 0,
    cooldown: 0,
    seed: seed | 0,
    winner: null,
    hits: 0,
    lastHit: null,
  };
  b.balls.forEach((ball) => {
    ball.vy = (random(b) > 0.5 ? 1 : -1) * (90 + random(b) * 100);
    ball.y = 130 + random(b) * 180;
  });
  return b;
}
export function advance(b: Battle, dt = STEP) {
  if (b.winner !== null) return;
  b.time += dt;
  b.cooldown = Math.max(0, b.cooldown - dt);
  const [a, c] = b.balls,
    dx = c.x - a.x,
    dy = c.y - a.y,
    distance = Math.hypot(dx, dy) || 1;
  const force = b.time > 18 ? 1800 : 95,
    speed = b.time > 18 ? 340 : 260;
  // Periodic mirrored charges prevent endless orbits while preserving equal rules.
  if (Math.floor(b.time / 2) !== Math.floor((b.time - dt) / 2)) {
    a.vx = (dx / distance) * speed;
    a.vy = (dy / distance) * speed;
    c.vx = (-dx / distance) * speed;
    c.vy = (-dy / distance) * speed;
  }
  b.balls.forEach((ball, i) => {
    const direction = i === 0 ? 1 : -1;
    ball.vx += ((direction * dx) / distance) * force * dt;
    ball.vy += ((direction * dy) / distance) * force * dt;
    const length = Math.hypot(ball.vx, ball.vy) || 1;
    ball.vx = (ball.vx / length) * speed;
    ball.vy = (ball.vy / length) * speed;
    ball.x += ball.vx * dt;
    ball.y += ball.vy * dt;
    if (ball.x < RADIUS) {
      ball.x = RADIUS;
      ball.vx = Math.abs(ball.vx);
    }
    if (ball.x > WIDTH - RADIUS) {
      ball.x = WIDTH - RADIUS;
      ball.vx = -Math.abs(ball.vx);
    }
    if (ball.y < RADIUS) {
      ball.y = RADIUS;
      ball.vy = Math.abs(ball.vy);
    }
    if (ball.y > HEIGHT - RADIUS) {
      ball.y = HEIGHT - RADIUS;
      ball.vy = -Math.abs(ball.vy);
    }
  });
  const cx = c.x - a.x,
    cy = c.y - a.y,
    length = Math.hypot(cx, cy) || 1;
  if (length <= RADIUS * 2) {
    const nx = cx / length,
      ny = cy / length,
      overlap = RADIUS * 2 - length + 1;
    a.x -= (nx * overlap) / 2;
    a.y -= (ny * overlap) / 2;
    c.x += (nx * overlap) / 2;
    c.y += (ny * overlap) / 2;
    a.vx = -nx * speed;
    a.vy = -ny * speed;
    c.vx = nx * speed;
    c.vy = ny * speed;
    // Both sides have identical rules. Names never enter the simulation.
    if (b.cooldown === 0) {
      const attacker = random(b) < 0.5 ? 0 : 1,
        critical = random(b) < 0.2,
        damage = Math.floor(10 + random(b) * 10) * (critical ? 2 : 1);
      const hurt = (1 - attacker) as 0 | 1;
      const inflicted: [number, number] = [0, 0];
      inflicted[hurt] = damage;
      b.balls[hurt].hp = Math.max(0, b.balls[hurt].hp - damage);
      b.lastHit = {
        x: (a.x + c.x) / 2,
        y: (a.y + c.y) / 2,
        at: b.time,
        damage: inflicted,
      };
      b.hits++;
      b.cooldown = 0.45;
      if (b.balls[hurt].hp === 0) b.winner = attacker as 0 | 1;
      // Break perfectly aligned trajectories after each contact.
      const twist = (random(b) - 0.5) * 1.2;
      b.balls.forEach((ball, i) => {
        const angle = Math.atan2(ball.vy, ball.vx) + twist * (i === 0 ? 1 : -1);
        ball.vx = Math.cos(angle) * speed;
        ball.vy = Math.sin(angle) * speed;
      });
    }
  }
}
