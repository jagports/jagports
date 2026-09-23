import assert from "node:assert/strict";
import test from "node:test";
import { database } from "./helpers/model-db.mjs";
import { handleApi } from "../src/index.js";

function d1(db) {
  return {
    prepare(sql) {
      let values = [];
      return {
        bind(...args) {
          values = args;
          return this;
        },
        async first() {
          return db.prepare(sql).get(...values) ?? null;
        },
        async all() {
          return { results: db.prepare(sql).all(...values) };
        },
        async run() {
          const result = db.prepare(sql).run(...values);
          return { meta: { last_row_id: Number(result.lastInsertRowid), changes: result.changes } };
        },
      };
    },
  };
}

function request(path, method = "GET", body, token) {
  const headers = new Headers();
  if (token) headers.set("x-admin-token", token);
  if (body !== undefined) headers.set("content-type", "application/json");
  return new Request(`https://example.test${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

async function payload(response) {
  return { status: response.status, body: await response.json() };
}

function environment() {
  const db = database({ fixtures: false });
  db.prepare("INSERT INTO part (id, part_number_raw, part_number_normalized, description) VALUES (61201, 'JP61201', 'JP61201', 'Stock Admin integration PART')").run();
  db.prepare("INSERT INTO stock_site (id, name) VALUES (61201, 'Integration Site')").run();
  db.prepare("INSERT INTO stock_location (id, site_id, parent_id, location_type, name) VALUES (61201, 61201, NULL, 'shelf', 'Integration Shelf')").run();
  db.prepare("INSERT INTO stock_source_party (id, source_type, name, source_ref) VALUES (61201, 'vendor', 'Integration Vendor', 'test:612')").run();
  return { db, env: { ADMIN_TOKEN: "test-admin-token", DB: d1(db) } };
}

test("Stock Admin mutation requires administrator authorization", async () => {
  const { db, env } = environment();
  const before = db.prepare("SELECT COUNT(*) AS n FROM stock_item").get().n;
  const response = await handleApi(request("/api/stock", "POST", {
    part_id: 61201,
    quantity: 1,
    available: false,
  }), env);
  const result = await payload(response);
  assert.equal(result.status, 401);
  assert.equal(result.body.error_code, "authorization_required");
  assert.equal(db.prepare("SELECT COUNT(*) AS n FROM stock_item").get().n, before);
  db.close();
});

test("Stock Admin creates canonical stock from PART identity and reads it back", async () => {
  const { db, env } = environment();
  const response = await handleApi(request("/api/stock", "POST", {
    part_id: 61201,
    part_number: "CLIENT-SUPPLIED-WRONG",
    quantity: 2,
    condition_code: null,
    available: true,
    storage_location_id: 61201,
    price: 125.5,
    currency: "eur",
    notes: "integration create",
  }, "test-admin-token"), env);
  const result = await payload(response);
  assert.equal(result.status, 201);
  assert.equal(result.body.item.part_id, 61201);
  assert.equal(result.body.item.part_number, "JP61201");
  assert.equal(result.body.item.quantity, 2);
  assert.equal(result.body.item.condition_code, null);
  assert.equal(result.body.item.available, 1);
  assert.equal(result.body.item.currency, "EUR");
  assert.equal(db.prepare("SELECT part_number_raw FROM part WHERE id=61201").get().part_number_raw, "JP61201");
  db.close();
});

test("Stock Admin rejects implicit unresolved stock without source evidence", async () => {
  const { db, env } = environment();
  const before = db.prepare("SELECT COUNT(*) AS n FROM stock_item").get().n;
  const response = await handleApi(request("/api/stock", "POST", {
    part_number: "UNRESOLVED-612",
    part_id: null,
    quantity: 1,
    available: false,
  }, "test-admin-token"), env);
  const result = await payload(response);
  assert.equal(result.status, 400);
  assert.equal(result.body.error_code, "unresolved_source_required");
  assert.equal(db.prepare("SELECT COUNT(*) AS n FROM stock_item").get().n, before);
  db.close();
});

test("Stock Admin permits explicitly source-backed unresolved stock", async () => {
  const { db, env } = environment();
  const response = await handleApi(request("/api/stock", "POST", {
    part_number: "UNRESOLVED-612",
    part_id: null,
    quantity: 1,
    available: false,
    source_party_id: 61201,
  }, "test-admin-token"), env);
  const result = await payload(response);
  assert.equal(result.status, 201);
  assert.equal(result.body.item.part_id, null);
  assert.equal(result.body.item.part_number, "UNRESOLVED-612");
  assert.equal(result.body.item.source_party_id, 61201);
  db.close();
});

test("Stock Admin PATCH preserves omitted fields and DELETE removes only stock", async () => {
  const { db, env } = environment();
  const created = await payload(await handleApi(request("/api/stock", "POST", {
    part_id: 61201,
    quantity: 3,
    condition_code: "B",
    available: true,
    storage_location_id: 61201,
    notes: "before",
  }, "test-admin-token"), env));
  assert.equal(created.status, 201);
  const id = created.body.item.id;

  const patched = await payload(await handleApi(request(`/api/stock/${id}`, "PATCH", {
    notes: "after",
  }, "test-admin-token"), env));
  assert.equal(patched.status, 200);
  assert.equal(patched.body.item.quantity, 3);
  assert.equal(patched.body.item.condition_code, "B");
  assert.equal(patched.body.item.storage_location_id, 61201);
  assert.equal(patched.body.item.notes, "after");

  const deleted = await payload(await handleApi(request(`/api/stock/${id}`, "DELETE", undefined, "test-admin-token"), env));
  assert.equal(deleted.status, 200);
  assert.equal(db.prepare("SELECT COUNT(*) AS n FROM stock_item WHERE id=?").get(id).n, 0);
  assert.equal(db.prepare("SELECT COUNT(*) AS n FROM part WHERE id=61201").get().n, 1);
  db.close();
});


test("Stock Admin GET supports normalized quality, availability and location filters", async () => {
  const { db, env } = environment();
  db.prepare(`
    INSERT INTO stock_item
      (part_number, part_id, quantity, available, condition_code, storage_location_id, source)
    VALUES
      ('JP61201', 61201, 1, 1, NULL, 61201, 'filter-test'),
      ('JP61201', 61201, 1, 1, 'B', 61201, 'filter-test'),
      ('JP61201', 61201, 1, 0, NULL, NULL, 'filter-test')
  `).run();

  const filtered = await payload(await handleApi(
    request("/api/stock?condition_code=unclassified&available=1&storage_location_id=61201", "GET", undefined, "test-admin-token"),
    env,
  ));
  assert.equal(filtered.status, 200);
  assert.equal(filtered.body.results.length, 1);
  assert.equal(filtered.body.results[0].condition_code, null);
  assert.equal(filtered.body.results[0].available, 1);
  assert.equal(filtered.body.results[0].storage_location_id, 61201);

  const invalid = await payload(await handleApi(
    request("/api/stock?available=yes", "GET", undefined, "test-admin-token"),
    env,
  ));
  assert.equal(invalid.status, 400);
  assert.equal(invalid.body.error_code, "availability_invalid");
  db.close();
});

test("Stock Admin missing mutation target returns deterministic not-found errors", async () => {
  const { db, env } = environment();

  const patched = await payload(await handleApi(
    request("/api/stock/999999", "PATCH", { notes: "missing" }, "test-admin-token"),
    env,
  ));
  assert.equal(patched.status, 404);
  assert.equal(patched.body.error_code, "stock_not_found");

  const deleted = await payload(await handleApi(
    request("/api/stock/999999", "DELETE", undefined, "test-admin-token"),
    env,
  ));
  assert.equal(deleted.status, 404);
  assert.equal(deleted.body.error_code, "stock_not_found");
  db.close();
});
