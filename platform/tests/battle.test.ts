import test from "node:test";
import assert from "node:assert/strict";
import {
  createBattle,
  advance,
  STEP,
  WIDTH,
  HEIGHT,
  RADIUS,
} from "../src/game/battle";
function finish(seed: number) {
  const b = createBattle(seed);
  for (let i = 0; i < 120 * 90 && b.winner === null; i++) advance(b);
  return b;
}
test("학과 공싸움: 고정 시드 재현·종료 후 상태 보존", () => {
  const a = finish(42),
    b = finish(42);
  assert.notEqual(a.winner, null);
  assert.deepEqual(a, b);
  const snapshot = structuredClone(a);
  advance(a);
  assert.deepEqual(a, snapshot);
  assert.equal(a.balls[1 - a.winner!].hp, 0);
});
test("학과 공싸움: 여러 시드에서 충돌·승패·유한한 좌표", () => {
  const winners = new Set();
  let longest = 0;
  for (let seed = 1; seed <= 100; seed++) {
    const b = finish(seed);
    assert.notEqual(b.winner, null, `seed ${seed} time ${b.time}`);
    winners.add(b.winner);
    longest = Math.max(longest, b.time);
    assert.ok(b.hits > 0);
    for (const ball of b.balls) {
      assert.ok(Number.isFinite(ball.x) && Number.isFinite(ball.y));
      assert.ok(ball.hp >= 0 && ball.hp <= 100);
    }
  }
  assert.equal(winners.size, 2);
  console.log("최장 시뮬레이션:", longest.toFixed(1), "초");
});
test("학과 공싸움: 벽 튕김", () => {
  const b = createBattle(1);
  b.balls[0].x = RADIUS;
  b.balls[0].vx = -260;
  b.balls[0].vy = 0;
  advance(b, STEP);
  assert.ok(b.balls[0].vx > 0);
  for (const ball of b.balls) {
    assert.ok(ball.x >= RADIUS && ball.x <= WIDTH - RADIUS);
    assert.ok(ball.y >= RADIUS && ball.y <= HEIGHT - RADIUS);
  }
});
