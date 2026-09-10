import test from "node:test";
import assert from "node:assert/strict";

const baseUrl = process.env.VIEPS_BASE_URL?.replace(/\/$/, "");
const partNumber = process.env.VIEPS_PART_NUMBER || "MJB7703AA";

if (!baseUrl) {
  test("Deployment-1 deployed runtime validation requires VIEPS_BASE_URL", { skip: "No deployed VIEPS URL supplied" }, () => {});
} else {
  test("deployed VIEPS UI is reachable", async () => {
    const response = await fetch(baseUrl);
    assert.equal(response.status, 200);
    const body = await response.text();
    assert.match(body, /VIEPS/i);
  });

  test("Worker reaches D1", async () => {
    const response = await fetch(`${baseUrl}/api/health`);
    assert.equal(response.status, 200);
    const data = await response.json();
    assert.equal(data.ok, true);
    assert.equal(data.database, "ok");
  });

  test("canonical part search returns Deployment-1 context", async () => {
    const response = await fetch(`${baseUrl}/api/vieps/part?q=${encodeURIComponent(partNumber)}`);
    assert.equal(response.status, 200);
    const data = await response.json();
    assert.equal(data.part.part_number_normalized, partNumber.replace(/[\s-]+/gu, "").toUpperCase());
    assert.ok(Array.isArray(data.parts_tree));
    assert.ok(Array.isArray(data.images));
    assert.ok(Array.isArray(data.diagrams));
    assert.ok(Array.isArray(data.fitment));
    assert.ok(data.fitment.length > 0);
  });

  test("unknown part returns explicit not-found response", async () => {
    const response = await fetch(`${baseUrl}/api/vieps/part?q=NOT-A-REAL-PART`);
    assert.equal(response.status, 404);
    const data = await response.json();
    assert.equal(data.error, "part not found");
  });
}
