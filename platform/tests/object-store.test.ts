process.env.SKIP_ENV_FILES = "true";
import { test } from "node:test";
import assert from "node:assert/strict";
import { putObject, getObject } from "../src/server/object-store";

test("비공개 원격 파일 업로드·다운로드와 공개 버킷 거부", async () => {
  const original = globalThis.fetch;
  process.env.STORAGE_PROVIDER = "supabase";
  process.env.SUPABASE_URL = "https://test.supabase.co";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "mock-key";
  let publicBucket = false;
  let writes = 0;
  const paths: string[] = [];
  globalThis.fetch = async (url, init) => {
    const path = String(url);
    paths.push(path);
    assert.equal(
      (init?.headers as Record<string, string>).Authorization,
      "Bearer mock-key",
    );
    assert.equal(init?.redirect, "error");
    if (path.includes("/bucket/"))
      return Response.json({ public: publicBucket });
    if (init?.method === "POST") {
      writes++;
      assert.equal(
        Buffer.from(init.body as Uint8Array).toString(),
        "private example",
      );
      return Response.json({ Key: "ok" });
    }
    return new Response("private example");
  };
  try {
    await putObject(
      "agency",
      "abc-123",
      Buffer.from("private example"),
      "text/plain",
    );
    assert.equal(
      (await getObject("agency", "abc-123")).toString(),
      "private example",
    );
    await getObject("other-org", "abc-123");
    assert.notEqual(paths[3], paths[5]);
    publicBucket = true;
    await assert.rejects(() =>
      putObject(
        "agency",
        "abc-123",
        Buffer.from("private example"),
        "text/plain",
      ),
    );
    assert.equal(writes, 1);
    await assert.rejects(() => getObject("agency", "../secret"));
  } finally {
    globalThis.fetch = original;
    for (const key of [
      "STORAGE_PROVIDER",
      "SUPABASE_URL",
      "SUPABASE_SERVICE_ROLE_KEY",
    ])
      delete process.env[key];
  }
});
