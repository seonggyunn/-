import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { hash } from "./auth";

function remote() {
  if (process.env.STORAGE_PROVIDER !== "supabase") return null;
  const url = new URL(process.env.SUPABASE_URL || "");
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const bucket = process.env.SUPABASE_STORAGE_BUCKET || "hankan-private";
  if (
    url.protocol !== "https:" ||
    !url.hostname.endsWith(".supabase.co") ||
    url.username ||
    url.password ||
    !key ||
    !/^[a-z0-9-]+$/.test(bucket)
  )
    throw new Error("비공개 저장소 설정을 확인하세요.");
  return { base: url.origin + "/storage/v1", key, bucket };
}
async function request(path: string, init: RequestInit = {}) {
  const config = remote()!;
  return fetch(config.base + path, {
    ...init,
    redirect: "error",
    headers: {
      ...init.headers,
      apikey: config.key,
      Authorization: "Bearer " + config.key,
    },
    signal: AbortSignal.timeout(20000),
  });
}
async function privateBucket() {
  const config = remote()!;
  const response = await request("/bucket/" + config.bucket);
  if (!response.ok || (await response.json()).public !== false)
    throw new Error(
      "비공개 버킷을 확인하세요. 공개 버킷에는 저장하지 않습니다.",
    );
  return config;
}
function objectKey(org: string, name: string) {
  if (!/^[a-f0-9-]+(?:\.pdf)?$/.test(name))
    throw new Error("잘못된 파일 식별자");
  return hash(org) + "/" + name;
}
export async function putObject(
  org: string,
  name: string,
  content: Buffer,
  type: string,
  overwrite = false,
) {
  const key = objectKey(org, name);
  if (remote()) {
    const config = await privateBucket();
    const response = await request("/object/" + config.bucket + "/" + key, {
      method: "POST",
      headers: { "Content-Type": type, "x-upsert": String(overwrite) },
      body: new Uint8Array(content),
    });
    if (!response.ok)
      throw new Error("비공개 파일 저장 실패: " + response.status);
    return;
  }
  const folder = join(
    process.env.PRIVATE_STORAGE_PATH || ".data/private",
    hash(org),
  );
  await mkdir(folder, { recursive: true, mode: 0o700 });
  await writeFile(join(folder, name), content, {
    mode: 0o600,
    flag: overwrite ? "w" : "wx",
  });
}
export async function getObject(org: string, name: string) {
  const key = objectKey(org, name);
  if (remote()) {
    const config = await privateBucket();
    const response = await request(
      "/object/authenticated/" + config.bucket + "/" + key,
    );
    if (!response.ok)
      throw new Error("비공개 파일 읽기 실패: " + response.status);
    return Buffer.from(await response.arrayBuffer());
  }
  return readFile(
    join(process.env.PRIVATE_STORAGE_PATH || ".data/private", key),
  );
}
