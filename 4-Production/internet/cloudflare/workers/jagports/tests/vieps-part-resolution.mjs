import test from "node:test";
import assert from "node:assert/strict";
import { handleViepsPart } from "../src/vieps.js";

function makeDb({ part = null, occurrences = [], tree = [], images = [], diagrams = [], fitment = [] } = {}) {
  return {
    prepare(sql) {
      return {
        bind() {
          return {
            async first() {
              if (/FROM part\b/i.test(sql)) return part;
              return null;
            },
            async all() {
              if (/FROM part_occurrence/i.test(sql)) return { results: occurrences };
              if (/part_tree_node/i.test(sql)) return { results: tree };
              if (/FROM part_image/i.test(sql)) return { results: images };
              if (/FROM part_diagram/i.test(sql)) return { results: diagrams };
              if (/FROM part_fitment/i.test(sql)) return { results: fitment };
              return { results: [] };
            },
          };
        },
      };
    },
  };
}

test("empty part-number query is explicit", async () => {
  const response = await handleViepsPart(
    new Request("https://example.test/api/vieps/part?q="),
    { DB: makeDb() },
  );
  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), { error: "part-number query is required" });
});

test("invalid normalized part-number query is explicit", async () => {
  const response = await handleViepsPart(
    new Request("https://example.test/api/vieps/part?q=---"),
    { DB: makeDb() },
  );
  assert.equal(response.status, 400);
  assert.equal((await response.json()).error, "invalid part-number query");
});

test("unknown part is an explicit not-found response", async () => {
  const response = await handleViepsPart(
    new Request("https://example.test/api/vieps/part?q=NOT-A-REAL-PART"),
    { DB: makeDb() },
  );
  assert.equal(response.status, 404);
  const data = await response.json();
  assert.equal(data.error, "part not found");
});

test("resolved PART returns canonical identity and occurrence context without duplication", async () => {
  const part = {
    id: 7,
    part_number_raw: "MJB-7703-AA",
    part_number_normalized: "MJB7703AA",
    description: "Representative part",
    source: "fixture",
    source_ref: "fixture:part-7",
    verification_status: "verified",
  };
  const occurrences = [{
    id: 21,
    source: "fixture",
    source_ref: "fixture:occurrence-21",
    context_type: "epc",
    context_ref: "fixture-context",
    category_ref: "fixture-category",
    item_number: "12",
    diagram_ref: "fixture-diagram",
    diagram_item_number: "12",
    verification_status: "verified",
  }];
  const response = await handleViepsPart(
    new Request("https://example.test/api/vieps/part?q=mjb 7703-aa"),
    { DB: makeDb({ part, occurrences }) },
  );
  assert.equal(response.status, 200);
  const data = await response.json();
  assert.equal(data.part.id, 7);
  assert.equal(data.part.part_number_normalized, "MJB7703AA");
  assert.deepEqual(data.occurrences, occurrences);
  assert.equal(data.occurrences[0].part_number_normalized, undefined);
  assert.ok(Array.isArray(data.parts_tree));
  assert.ok(Array.isArray(data.images));
  assert.ok(Array.isArray(data.diagrams));
  assert.ok(Array.isArray(data.fitment));
});

test("non-GET requests are rejected", async () => {
  const response = await handleViepsPart(
    new Request("https://example.test/api/vieps/part?q=MJB7703AA", { method: "POST" }),
    { DB: makeDb() },
  );
  assert.equal(response.status, 405);
});
