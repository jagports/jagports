import test from "node:test";
import assert from "node:assert/strict";
import { handleViepsTree } from "../src/vieps.js";

function makeDb({ selected = null, path = [], children = [], parts = [], onPrepare = () => {} } = {}) {
  return {
    prepare(sql) {
      onPrepare(sql);
      return {
        bind() {
          return {
            async first() {
              if (/FROM part_tree_node\s+WHERE id = \?/i.test(sql)) return selected;
              return null;
            },
            async all() {
              if (/WITH RECURSIVE ancestors/i.test(sql)) return { results: path };
              if (/WHERE parent_id = \?/i.test(sql)) return { results: children };
              if (/WITH RECURSIVE subtree/i.test(sql)) return { results: parts };
              return { results: [] };
            },
          };
        },
      };
    },
  };
}

test("Parts Tree browse requires a positive stable node id", async () => {
  const response = await handleViepsTree(
    new Request("https://example.test/api/vieps/tree?node_id=not-an-id"),
    { DB: makeDb() },
  );
  assert.equal(response.status, 400);
  assert.equal((await response.json()).error_code, "tree_node_invalid");
});

test("Parts Tree browse returns explicit not-found for an unknown node", async () => {
  const response = await handleViepsTree(
    new Request("https://example.test/api/vieps/tree?node_id=999"),
    { DB: makeDb() },
  );
  assert.equal(response.status, 404);
  assert.equal((await response.json()).error_code, "tree_node_not_found");
});

test("Parts Tree browse returns path, children and canonical PART candidates", async () => {
  const prepared = [];
  const response = await handleViepsTree(
    new Request("https://example.test/api/vieps/tree?node_id=103"),
    {
      DB: makeDb({
        selected: { id: 103, parent_id: 102, label: "Vertical Link", sort_order: 3 },
        path: [
          { node_id: 101, label: "Suspension", depth: 2 },
          { node_id: 102, label: "Front", depth: 1 },
          { node_id: 103, label: "Vertical Link", depth: 0 },
        ],
        children: [
          { node_id: 104, label: "Bushes", sort_order: 1 },
        ],
        parts: [
          {
            id: 7,
            part_number_raw: "MNC-1628-AA",
            part_number_normalized: "MNC1628AA",
            description: "Vertical link",
            source: "fixture",
            source_ref: "fixture:part-7",
            verification_status: "fixture",
          },
        ],
        onPrepare: (sql) => prepared.push(sql),
      }),
    },
  );

  assert.equal(response.status, 200);
  const data = await response.json();
  assert.equal(data.state, "resolved");
  assert.equal(data.selected_node.node_id, 103);
  assert.deepEqual(data.path.map((node) => node.node_id), [101, 102, 103]);
  assert.deepEqual(data.children.map((node) => node.node_id), [104]);
  assert.deepEqual(data.parts.map((part) => part.part_number_normalized), ["MNC1628AA"]);
  assert.ok(prepared.some((sql) => /INNER JOIN part_tree_part/i.test(sql)));
});

test("Parts Tree browse stock-only filter remains an operational STOCK constraint", async () => {
  const prepared = [];
  const response = await handleViepsTree(
    new Request("https://example.test/api/vieps/tree?node_id=103&stock_only=1"),
    {
      DB: makeDb({
        selected: { id: 103, parent_id: null, label: "Body", sort_order: 1 },
        path: [{ node_id: 103, label: "Body", depth: 0 }],
        parts: [],
        onPrepare: (sql) => prepared.push(sql),
      }),
    },
  );

  assert.equal(response.status, 200);
  assert.equal((await response.json()).state, "empty");
  const browseSql = prepared.find((sql) => /WITH RECURSIVE subtree/i.test(sql));
  assert.ok(browseSql);
  assert.match(browseSql, /FROM stock_item s/i);
  assert.match(browseSql, /s\.available = 1/i);
  assert.match(browseSql, /s\.quantity > 0/i);
});

test("Parts Tree browse rejects invalid stock-only values", async () => {
  const response = await handleViepsTree(
    new Request("https://example.test/api/vieps/tree?node_id=103&stock_only=yes"),
    { DB: makeDb() },
  );
  assert.equal(response.status, 400);
  assert.equal((await response.json()).error_code, "stock_filter_invalid");
});
