import {
  randomBytes,
  scryptSync,
  timingSafeEqual,
  createHash,
  randomUUID,
} from "node:crypto";
import { db, migrate, transaction } from "./db";
export type Actor = {
  id: string;
  org_id: string;
  email: string;
  name: string;
  role: "admin" | "operator" | "customer";
};
export class AppError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
export const hash = (s: string) => createHash("sha256").update(s).digest("hex");
export function passwordHash(password: string) {
  if (password.length < 12 || password.length > 256)
    throw new AppError(400, "비밀번호는 12~256자로 입력하세요.");
  const salt = randomBytes(16).toString("hex");
  return salt + ":" + scryptSync(password, salt, 64).toString("hex");
}
export function passwordMatches(password: string, stored: string) {
  try {
    const [salt, key] = stored.split(":");
    const expected = Buffer.from(key, "hex");
    const actual = scryptSync(password, salt, 64);
    return (
      expected.length === actual.length && timingSafeEqual(expected, actual)
    );
  } catch {
    return false;
  }
}
export async function actor(request: Request): Promise<Actor> {
  await migrate();
  const token = request.headers
    .get("cookie")
    ?.split(";")
    .map((s) => s.trim())
    .find((s) => s.startsWith("hankan_session="))
    ?.slice(15);
  if (!token) throw new AppError(401, "로그인이 필요합니다.");
  const rows = await db.all(
    "SELECT u.id,u.org_id,u.email,u.name,u.role FROM users u JOIN sessions s ON s.user_id=u.id WHERE s.id=? AND s.expires_at>?",
    [hash(token), new Date().toISOString()],
  );
  if (!rows[0]) throw new AppError(401, "세션이 만료되었습니다.");
  if (rows[0].role === "customer")
    throw new AppError(403, "운영자 권한이 필요합니다.");
  return rows[0] as Actor;
}
export async function provision(
  email: string,
  password: string,
  name = "관리자",
  role = "admin",
  org = "agency",
) {
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    throw new AppError(400, "올바른 관리자 이메일을 입력하세요.");
  if (!["admin", "operator", "customer"].includes(role))
    throw new AppError(400, "역할을 확인하세요.");
  await migrate();
  const id = randomUUID();
  await db.run(
    "INSERT INTO users(id,org_id,email,name,password_hash,role,created_at) VALUES(?,?,?,?,?,?,?)",
    [
      id,
      org,
      email.toLowerCase(),
      name,
      passwordHash(password),
      role,
      new Date().toISOString(),
    ],
  );
  return id;
}
export async function rateLimit(key: string, max: number, seconds = 3600) {
  await transaction(async (q) => {
    const now = Date.now(),
      k = hash(key);
    const [row] = await q.all("SELECT * FROM rate_limits WHERE key=?", [k]);
    if (!row || row.window_start < now - seconds * 1000) {
      await q.run(
        "INSERT INTO rate_limits(key,count,window_start) VALUES(?,1,?) ON CONFLICT(key) DO UPDATE SET count=1,window_start=excluded.window_start",
        [k, now],
      );
    } else {
      if (row.count >= max)
        throw new AppError(429, "요청이 많습니다. 잠시 후 다시 시도하세요.");
      await q.run("UPDATE rate_limits SET count=count+1 WHERE key=?", [k]);
    }
  });
}
export async function login(email: string, password: string) {
  await rateLimit("login:" + email.toLowerCase(), 10, 900);
  const [u] = await db.all("SELECT * FROM users WHERE email=?", [
    email.toLowerCase(),
  ]);
  if (!u || !passwordMatches(password, u.password_hash))
    throw new AppError(401, "이메일 또는 비밀번호를 확인하세요.");
  const token = randomBytes(32).toString("hex"),
    now = new Date();
  await db.run(
    "INSERT INTO sessions(id,user_id,expires_at,created_at) VALUES(?,?,?,?)",
    [
      hash(token),
      u.id,
      new Date(now.getTime() + 8 * 3600000).toISOString(),
      now.toISOString(),
    ],
  );
  return token;
}
export function cookie(token: string, max = 28800) {
  return `hankan_session=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${max}${process.env.NODE_ENV === "production" ? "; Secure" : ""}`;
}
export function checkOrigin(req: Request) {
  const origin = req.headers.get("origin");
  const host = req.headers.get("host");
  const expected =
    process.env.APP_URL ||
    (host && /^[a-zA-Z0-9.:[\]-]+$/.test(host)
      ? new URL(req.url).protocol + "//" + host
      : new URL(req.url).origin);
  if (origin && origin !== expected)
    throw new AppError(403, "다른 사이트의 요청은 허용하지 않습니다.");
}
