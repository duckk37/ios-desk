import test from "node:test";
import assert from "node:assert/strict";
import { deriveMjpegUrl } from "../src/mjpeg.js";

test("deriveMjpegUrl maps local WDA and Appium ports to 9100", () => {
  assert.equal(deriveMjpegUrl("http://127.0.0.1:8100"), "http://127.0.0.1:9100/");
  assert.equal(deriveMjpegUrl("http://localhost:4723/wd/hub?x=1"), "http://localhost:9100/");
});

test("deriveMjpegUrl rejects invalid, remote, and HTTPS URLs", () => {
  assert.equal(deriveMjpegUrl("not a url"), null);
  assert.equal(deriveMjpegUrl("http://192.168.1.25:8100"), null);
  assert.equal(deriveMjpegUrl("https://localhost:8100"), null);
});
