import { test } from "node:test";
import assert from "node:assert/strict";
import {
  mkdtempSync,
  mkdirSync,
  copyFileSync,
  writeFileSync,
  rmSync,
} from "node:fs";
import { resolve, join } from "node:path";
import { spawnSync } from "node:child_process";
import { DatabaseSync } from "node:sqlite";

test("초기 관리자 재실행은 기존 비밀번호·권한을 변경하지 않음", () => {
  mkdirSync(".data", { recursive: true });
  const root = mkdtempSync(resolve(".data/bootstrap-test-"));
  try {
    mkdirSync(join(root, "migrations"));
    copyFileSync(
      "scripts/provision-runtime.mjs",
      join(root, "provision-runtime.mjs"),
    );
    copyFileSync(
      "supabase/migrations/202610290001_operations.sql",
      join(root, "migrations/202610290001_operations.sql"),
    );
    const env = {
      ...process.env,
      DATABASE_URL: "",
      LOCAL_DB_PATH: join(root, "db.sqlite"),
      ADMIN_EMAIL: "bootstrap@example.invalid",
      ADMIN_PASSWORD: "test-password-original-2026",
    };
    const run = () =>
      spawnSync(process.execPath, [join(root, "provision-runtime.mjs")], {
        env,
        encoding: "utf8",
      });
    assert.equal(run().status, 0);
    const db = new DatabaseSync(env.LOCAL_DB_PATH);
    const original = db.prepare("SELECT * FROM users").get()!;
    db.prepare("UPDATE users SET role='operator'").run();
    env.ADMIN_PASSWORD = "test-password-replacement-2026";
    const result = run();
    assert.equal(result.status, 0);
    assert.equal(result.stdout.includes(env.ADMIN_PASSWORD), false);
    const rows = db.prepare("SELECT * FROM users").all();
    assert.equal(rows.length, 1);
    assert.equal(rows[0].password_hash, original.password_hash);
    assert.equal(rows[0].role, "operator");
    db.close();
    copyFileSync("scripts/runtime-entry.mjs", join(root, "runtime-entry.mjs"));
    writeFileSync(
      join(root, "server.js"),
      "if (process.env.ADMIN_PASSWORD) process.exit(2);",
    );
    assert.equal(
      spawnSync(process.execPath, [join(root, "runtime-entry.mjs")], {
        cwd: root,
        env: { ...env, BOOTSTRAP_ADMIN: "false" },
      }).status,
      0,
    );
    assert.notEqual(
      spawnSync(process.execPath, [join(root, "runtime-entry.mjs")], {
        cwd: root,
        env: { ...env, BOOTSTRAP_ADMIN: "true" },
      }).status,
      0,
    );
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
