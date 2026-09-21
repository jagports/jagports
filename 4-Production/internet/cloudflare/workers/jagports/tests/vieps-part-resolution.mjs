import test from "node:test";
import assert from "node:assert/strict";
import { handleViepsPart } from "../src/vieps.js";

function makeDb({ part = null, parts = null, occurrences = [], tree = [], images = [], diagrams = [], fitment = [], stock = [], onPrepare = () => {}, onBind = () => {} } = {}) {
  const partRows = parts ?? (part ? [part] : []);
  return {
    prepare(sql) {
      onPrepare(sql);
      return {
        bind(...args) {
          onBind(sql, args);
          return {
            async first() {
              return null;
            },
            async all() {
              if (/FROM part\b/i.test(sql)) return { results: partRows };
              if (/FROM part_occurrence/i.test(sql)) return { results: occurrences };
              if (/part_tree_node/i.test(sql)) return { results: tree };
              if (/FROM part_image/i.test(sql)) return { results: images };
              if (/FROM part_diagram/i.test(sql)) return { results: diagrams };
              if (/FROM part_fitment/i.test(sql)) return { results: fitment };
              if (/FROM stock_item/i.test(sql)) return { results: stock };
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

test("part search SQL supports case-insensitive exact and partial part-number matching", async () => {
  const preparedSql = [];
  const boundArgs = [];
  const part = {
    id: 7,
    part_number_raw: "MJB-7703-AA",
    part_number_normalized: "MJB7703AA",
    description: "Representative part",
    source: "fixture",
    source_ref: "fixture:part-7",
    verification_status: "verified",
  };

  const response = await handleViepsPart(
    new Request("https://example.test/api/vieps/part?q=mjb 7703-aa"),
    {
      DB: makeDb({
        part,
        onPrepare: (sql) => preparedSql.push(sql),
        onBind: (sql, args) => {
          if (/FROM part\b/i.test(sql)) boundArgs.push(args);
        },
      }),
    },
  );

  assert.equal(response.status, 200);
  const partSql = preparedSql.find((sql) => /FROM part\b/i.test(sql));
  assert.ok(partSql);
  assert.match(partSql, /UPPER\(part_number_raw\) = UPPER\(\?\)/i);
  assert.match(partSql, /part_number_normalized LIKE '%' \|\| \? \|\| '%'/i);
  assert.match(partSql, /UPPER\(part_number_raw\) LIKE '%' \|\| UPPER\(\?\) \|\| '%'/i);
  assert.deepEqual(boundArgs[0].slice(0, 2), ["MJB7703AA", "mjb 7703-aa"]);
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
  const stock = [{
    id: 31,
    part_number: "MJB7703AA",
    quantity: 2,
    condition: "used / inspected",
    status: "available",
    location: "Fixture Shelf XK / Box Label",
    source: "fixture-607",
    source_ref: "issue:#607:synthetic-stock:mjb7703aa",
    verification_status: "fixture",
    available: 1,
    confidence: 0.61,
    condition_code: "B",
    price: 14.5,
    currency: "EUR",
    notes: "Synthetic demo stock value; not real Jagports inventory evidence.",
  }];
  const response = await handleViepsPart(
    new Request("https://example.test/api/vieps/part?q=mjb 7703-aa"),
    { DB: makeDb({ part, occurrences, stock }) },
  );
  assert.equal(response.status, 200);
  const data = await response.json();
  assert.equal(data.part.id, 7);
  assert.equal(data.part.part_number_normalized, "MJB7703AA");
  assert.deepEqual(data.occurrences, occurrences);
  assert.deepEqual(data.stock, stock);
  assert.equal(data.occurrences[0].part_number_normalized, undefined);
  assert.ok(Array.isArray(data.parts_tree));
  assert.ok(Array.isArray(data.images));
  assert.ok(Array.isArray(data.diagrams));
  assert.ok(Array.isArray(data.fitment));
  assert.ok(Array.isArray(data.stock));
});

test("partial part-number input with one candidate resolves the canonical PART", async () => {
  const part = {
    id: 8,
    part_number_raw: "MNA 7691-AA",
    part_number_normalized: "MNA7691AA",
    description: "Fan warning label",
    source: "fixture",
    source_ref: "fixture:part-8",
    verification_status: "fixture",
  };

  const response = await handleViepsPart(
    new Request("https://example.test/api/vieps/part?q=7691"),
    { DB: makeDb({ parts: [part] }) },
  );

  assert.equal(response.status, 200);
  const data = await response.json();
  assert.equal(data.part.id, 8);
  assert.equal(data.part.part_number_normalized, "MNA7691AA");
});

test("partial part-number input with multiple candidates returns a multiple-match state", async () => {
  const parts = [
    {
      id: 8,
      part_number_raw: "MNA 7691-AA",
      part_number_normalized: "MNA7691AA",
      description: "Fan warning label",
      source: "fixture",
      source_ref: "fixture:part-8",
      verification_status: "fixture",
    },
    {
      id: 9,
      part_number_raw: "MNA 7691-AB",
      part_number_normalized: "MNA7691AB",
      description: "Related fixture label",
      source: "fixture",
      source_ref: "fixture:part-9",
      verification_status: "fixture",
    },
  ];

  const response = await handleViepsPart(
    new Request("https://example.test/api/vieps/part?q=mna7691"),
    { DB: makeDb({ parts }) },
  );

  assert.equal(response.status, 200);
  const data = await response.json();
  assert.equal(data.state, "multiple_match");
  assert.equal(data.normalized_query, "MNA7691");
  assert.deepEqual(data.matches.map((part) => part.part_number_normalized), ["MNA7691AA", "MNA7691AB"]);
  assert.equal(data.part, undefined);
});

test("stock-only filter is explicit and preserves canonical PART identity", async () => {
  const stocked = {
    id: 12,
    part_number_raw: "ABC-123",
    part_number_normalized: "ABC123",
    description: "Stocked fixture",
    source: "fixture",
    source_ref: "fixture:stocked",
    verification_status: "fixture",
    has_available_stock: 1,
  };
  const unavailable = {
    ...stocked,
    id: 13,
    part_number_raw: "ABC-124",
    part_number_normalized: "ABC124",
    description: "Unavailable fixture",
    source_ref: "fixture:unavailable",
    has_available_stock: 0,
  };

  const stockedResponse = await handleViepsPart(
    new Request("https://example.test/api/vieps/part?q=ABC123&stock_only=1"),
    { DB: makeDb({ parts: [stocked] }) },
  );
  assert.equal(stockedResponse.status, 200);
  const stockedData = await stockedResponse.json();
  assert.equal(stockedData.part.id, 12);
  assert.equal(stockedData.part.has_available_stock, undefined);

  const filteredResponse = await handleViepsPart(
    new Request("https://example.test/api/vieps/part?q=ABC124&stock_only=1"),
    { DB: makeDb({ parts: [unavailable] }) },
  );
  assert.equal(filteredResponse.status, 404);
  assert.equal((await filteredResponse.json()).error_code, "stock_filter_no_match");

  const unfilteredResponse = await handleViepsPart(
    new Request("https://example.test/api/vieps/part?q=ABC124"),
    { DB: makeDb({ parts: [unavailable] }) },
  );
  assert.equal(unfilteredResponse.status, 200);
  assert.equal((await unfilteredResponse.json()).part.id, 13);
});

test("invalid stock-only filter is rejected explicitly", async () => {
  const response = await handleViepsPart(
    new Request("https://example.test/api/vieps/part?q=ABC123&stock_only=yes"),
    { DB: makeDb() },
  );
  assert.equal(response.status, 400);
  assert.equal((await response.json()).error_code, "stock_filter_invalid");
});

test("resolved PART stock query preserves DB-specified stock columns", async () => {
  const preparedSql = [];
  const part = {
    id: 7,
    part_number_raw: "MJB-7703-AA",
    part_number_normalized: "MJB7703AA",
    description: "Representative part",
    source: "fixture",
    source_ref: "fixture:part-7",
    verification_status: "verified",
  };

  const response = await handleViepsPart(
    new Request("https://example.test/api/vieps/part?q=MJB7703AA"),
    { DB: makeDb({ part, onPrepare: (sql) => preparedSql.push(sql) }) },
  );

  assert.equal(response.status, 200);
  const stockSql = preparedSql.find((sql) => /FROM stock_item/i.test(sql));
  assert.ok(stockSql);
  for (const column of ["condition", "condition_code", "price", "currency", "notes"]) {
    assert.equal(new RegExp(`\\b${column}\\b`, "i").test(stockSql), true, column);
  }
});

test("non-GET requests are rejected", async () => {
  const response = await handleViepsPart(
    new Request("https://example.test/api/vieps/part?q=MJB7703AA", { method: "POST" }),
    { DB: makeDb() },
  );
  assert.equal(response.status, 405);
});
