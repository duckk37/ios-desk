import test from "node:test";
import assert from "node:assert/strict";
import { normalizeServerUrl, WdaClient, WdaError } from "../src/wda-client.js";

function response(body, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
}

test("normalizeServerUrl accepts local HTTP and strips trailing slash", () => {
  assert.equal(normalizeServerUrl(" http://127.0.0.1:8100/ "), "http://127.0.0.1:8100");
  assert.equal(normalizeServerUrl("http://192.168.1.25:8100"), "http://192.168.1.25:8100");
  assert.throws(() => normalizeServerUrl("file:///tmp/wda"), WdaError);
  assert.throws(() => normalizeServerUrl("http://user:pass@localhost"), WdaError);
  assert.throws(() => normalizeServerUrl("https://example.com/wda"), /mạng nội bộ/);
});

test("client creates a W3C session and reads size", async () => {
  const calls = [];
  const client = new WdaClient("http://127.0.0.1:8100", {
    fetchImpl: async (url, options = {}) => {
      calls.push({ url, options });
      if (url.endsWith("/session")) return response({ value: { sessionId: "abc" } });
      if (url.endsWith("/session/abc/window/size")) return response({ value: { width: 390, height: 844 } });
      return response({ value: { ready: true } });
    },
  });
  assert.equal(await client.createSession({ platformName: "iOS" }), "abc");
  assert.deepEqual(await client.windowSize(), { width: 390, height: 844 });
  assert.equal(calls[0].options.method, "POST");
  assert.equal(JSON.parse(calls[0].options.body).capabilities.alwaysMatch.platformName, "iOS");
});

test("client sends tap and drag to WDA endpoints", async () => {
  const calls = [];
  const client = new WdaClient("http://localhost:8100", {
    fetchImpl: async (url, options = {}) => { calls.push({ url, options }); return response({ value: null }); },
  });
  client.sessionId = "session one";
  await client.tap(12.4, 31.8);
  await client.drag({ x: 1, y: 2 }, { x: 3, y: 4 }, .3);
  assert.match(calls[0].url, /session\/session%20one\/wda\/tap\/0$/);
  assert.deepEqual(JSON.parse(calls[0].options.body), { x: 12, y: 32 });
  assert.match(calls[1].url, /wda\/dragfromtoforduration$/);
});

test("HTTP errors include WDA message", async () => {
  const client = new WdaClient("http://localhost:8100", {
    fetchImpl: async () => response({ value: { message: "not ready" } }, 500),
  });
  await assert.rejects(() => client.status(), /not ready/);
});
