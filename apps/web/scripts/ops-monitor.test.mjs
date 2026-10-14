import { test } from "node:test";
import assert from "node:assert/strict";
import { checkPage, parseOrigin } from "./ops-monitor.mjs";
const { Response } = globalThis;

test("origin refuses credentials, queries and paths", () => {
  for (const value of ["https://user:secret@example.com", "https://example.com/app", "https://example.com/?secret=x", "file:///tmp/test"]) {
    assert.throws(() => parseOrigin(value));
  }
  assert.equal(parseOrigin("https://example.com/"), "https://example.com");
});

test("a rendered HTML page is healthy", async () => {
  const result = await checkPage("https://example.com", "/login", async () => new Response("<html><body><form>Login</form></body></html>", { headers: { "content-type": "text/html" } }));
  assert.equal(result.ok, true);
});

test("a private gate is followed and its HTML is checked", async () => {
  const paths = [];
  const result = await checkPage("https://example.com", "/login", async (url) => {
    paths.push(new URL(url).pathname);
    return paths.length === 1
      ? new Response(null, { status: 307, headers: { location: "/gate?next=/login" } })
      : new Response("<html>Access code</html>", { headers: { "content-type": "text/html" } });
  });
  assert.equal(result.ok, true);
  assert.equal(result.gated, true);
  assert.deepEqual(paths, ["/login", "/gate"]);
});

test("off-site redirects are not followed", async () => {
  let calls = 0;
  const result = await checkPage("https://example.com", "/", async () => {
    calls++;
    return new Response(null, { status: 307, headers: { location: "https://other.example/gate" } });
  });
  assert.equal(result.ok, false);
  assert.equal(calls, 1);
});

test("server errors and non-HTML success responses fail", async () => {
  for (const response of [new Response("Private error", { status: 500 }), new Response("{}", { headers: { "content-type": "application/json" } })]) {
    assert.equal((await checkPage("https://example.com", "/", async () => response)).ok, false);
  }
});

test("network errors do not expose their message or secrets", async () => {
  const result = await checkPage("https://example.com", "/", async () => { throw new Error("secret credential"); });
  assert.equal(result.ok, false);
  assert.ok(!JSON.stringify(result).includes("secret credential"));
});
