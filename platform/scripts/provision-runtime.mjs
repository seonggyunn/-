import { DatabaseSync } from "node:sqlite";
import { Pool } from "pg";
import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { randomUUID, randomBytes, scryptSync } from "node:crypto";
const email = process.env.ADMIN_EMAIL;
if (!email || !/^\S+@\S+\.\S+$/.test(email))
  throw new Error("ADMIN_EMAIL을 지정하세요.");
const password =
  process.env.ADMIN_PASSWORD || randomBytes(24).toString("base64url");
if (password.length < 12 || password.length > 256)
  throw new Error("비밀번호12자이상필요");
const salt = randomBytes(16).toString("hex"),
  digest = salt + ":" + scryptSync(password, salt, 64).toString("hex"),
  now = new Date().toISOString();
const schema = readFileSync(
  new URL("./migrations/202610290001_operations.sql", import.meta.url),
  "utf8",
);
let sql, pool;
if (process.env.DATABASE_URL) {
  pool = new Pool({ connectionString: process.env.DATABASE_URL });
  await pool.query(schema);
  await pool.query(
    readFileSync(
      new URL("./migrations/202610290002_private_access.sql", import.meta.url),
      "utf8",
    ),
  );
  sql = async (s, p) => {
    let n = 0;
    return pool.query(
      s.replace(/\?/g, () => "$" + ++n),
      p,
    );
  };
} else {
  const path = process.env.LOCAL_DB_PATH || "/app/data/operations.sqlite";
  mkdirSync(dirname(path), { recursive: true, mode: 0o700 });
  const db = new DatabaseSync(path);
  db.exec("PRAGMA foreign_keys=ON;");
  db.exec(schema);
  sql = async (s, p) => db.prepare(s).run(...p);
}
await sql(
  "INSERT INTO organizations(id,name,created_at) VALUES(?,?,?) ON CONFLICT(id) DO NOTHING",
  ["agency", "한칸 운영실", now],
);
await sql(
  "INSERT INTO users(id,org_id,email,name,password_hash,role,created_at) VALUES(?,?,?,?,?,?,?) ON CONFLICT(email) DO NOTHING",
  [
    randomUUID(),
    "agency",
    email.toLowerCase(),
    "운영 관리자",
    digest,
    "admin",
    now,
  ],
);
if (!process.env.ADMIN_PASSWORD) {
  mkdirSync("/app/data", { recursive: true, mode: 0o700 });
  writeFileSync(
    "/app/data/initial-admin.json",
    JSON.stringify({ email, password }),
    { mode: 0o600 },
  );
  console.log(
    "생성 완료. 초기 자격증명: /app/data/initial-admin.json (공개 금지)",
  );
} else
  console.log(
    "관리자 초기 설정 완료. 기존 계정의 비밀번호·권한은 변경하지 않았습니다.",
  );
if (pool) await pool.end();
