import test from "node:test";
import assert from "node:assert/strict";
import { isAuthorized, text } from "../src/index.js";

test("text normalizes string input and rejects non-strings", () => {
  assert.equal(text("  X100  "), "X100");
  assert.equal(text(""), "");
  assert.equal(text(null), "");
  assert.equal(text(123), "");
});

test("admin authorization requires the configured token", () => {
  const env = { ADMIN_TOKEN: "secret" };
  assert.equal(isAuthorized(new Request("https://example.test", { headers: { "x-admin-token": "secret" } }), env), true);
  assert.equal(isAuthorized(new Request("https://example.test", { headers: { "x-admin-token": "wrong" } }), env), false);
  assert.equal(isAuthorized(new Request("https://example.test"), env), false);
  assert.equal(isAuthorized(new Request("https://example.test", { headers: { "x-admin-token": "secret" } }), {}), false);
});
