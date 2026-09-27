import assert from "node:assert/strict";
import test from "node:test";
import { handleApi } from "../js/vieps-worker.js";

test("Admin routes use the canonical stock and suitability URLs", async () => {
  const assets = { fetch: async (request) => new Response(new URL(request.url).pathname) };
  const env = { ASSETS: assets };
  const stock = await handleApi(new Request("https://test.example/api/health"), { DB: { prepare: () => ({ first: async () => ({}) }) } });
  assert.equal(stock.status, 200);
  const worker = (await import("../js/vieps-worker.js")).default;
  const stockPage = await worker.fetch(new Request("https://test.example/admin-stock"), env);
  assert.equal(await stockPage.text(), "/admin-stock.html");
  const suitabilityPage = await worker.fetch(new Request("https://test.example/admin-suitability"), env);
  assert.equal(await suitabilityPage.text(), "/admin-suitability.html");
  const legacy = await worker.fetch(new Request("https://test.example/stock-admin.html"), env);
  assert.equal(legacy.status, 308);
  assert.equal(legacy.headers.get("location"), "https://test.example/admin-stock");
});