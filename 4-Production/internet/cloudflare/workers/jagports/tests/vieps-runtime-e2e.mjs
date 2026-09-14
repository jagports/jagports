import test from "node:test";
import assert from "node:assert/strict";

const baseUrl = process.env.VIEPS_BASE_URL?.replace(/\/$/, "");
const partNumber = process.env.VIEPS_PART_NUMBER || "MJB7703AA";
const fixturePartNumbers = ["MJB7703AA", "MNA7691AA", "XR847031", "FIX538C"];
const fixtureDescriptiveIdentifiers = ["firtree1", "firtree2"];

const locations = { MJB7703AA: 'A14', MNA7691AA: 'C07', XR847031: 'X31', FIX538C: 'R02', firtree1: 'F12', firtree2: 'F29' };
const request = (url) => fetch(url, { signal: AbortSignal.timeout(15000) });

function assertFixtureStock(data, label) {
  assert.ok(Array.isArray(data.stock), label);
  assert.ok(data.stock.length > 0, `${label} should expose stock rows`);
  assert.ok(data.stock.some((item) => item.location === `Fixture Shelf XK / Box ${locations[label]}`), `${label} should expose a fixture stock location`);
}

if (!baseUrl) {
  test("VIEPS deployed runtime validation requires VIEPS_BASE_URL", { skip: "No deployed VIEPS URL supplied" }, () => {});
} else {
  test("deployed VIEPS UI is reachable", async () => {
    const response = await request(baseUrl);
    assert.equal(response.status, 200);
    const body = await response.text();
    assert.match(body, /VIEPS/i);
  });

  test("Worker reaches D1", async () => {
    const response = await request(`${baseUrl}/api/health`);
    assert.equal(response.status, 200);
    const data = await response.json();
    assert.equal(data.ok, true);
    assert.equal(data.database, "ok");
  });

  test("canonical part search returns VIEPS context", async () => {
    const response = await request(`${baseUrl}/api/vieps/part?q=${encodeURIComponent(partNumber)}`);
    assert.equal(response.status, 200);
    const data = await response.json();
    assert.equal(data.part.part_number_normalized, partNumber.replace(/[\s-]+/gu, "").toUpperCase());
    assert.ok(Array.isArray(data.parts_tree));
    assert.ok(Array.isArray(data.images));
    assert.ok(Array.isArray(data.diagrams));
    assert.ok(Array.isArray(data.fitment));
    assert.ok(data.fitment.length > 0);
  });

  test("deployed VIEPS fixture parts return stock locations", async () => {
    for (const fixturePartNumber of fixturePartNumbers) {
      const response = await request(`${baseUrl}/api/vieps/part?q=${encodeURIComponent(fixturePartNumber)}`);
      assert.equal(response.status, 200, fixturePartNumber);
      const data = await response.json();
      assert.equal(data.part.part_number_normalized, fixturePartNumber);
      assertFixtureStock(data, fixturePartNumber);
    }
  });

  test("deployed VIEPS non-numbered fixture identifiers return stock locations", async () => {
    for (const identifier of fixtureDescriptiveIdentifiers) {
      const response = await request(`${baseUrl}/api/vieps/part?q=${encodeURIComponent(identifier)}`);
      assert.equal(response.status, 200, identifier);
      const data = await response.json();
      assert.equal(data.part.part_number_normalized, null);
      assert.equal(data.part.description, identifier);
      assertFixtureStock(data, identifier);
    }
  });

  test("unknown part returns explicit not-found response", async () => {
    const response = await request(`${baseUrl}/api/vieps/part?q=NOT-A-REAL-PART`);
    assert.equal(response.status, 404);
    const data = await response.json();
    assert.equal(data.error, "part not found");
  });
}
