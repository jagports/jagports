import test from "node:test";
import assert from "node:assert/strict";
import { handleViepsTree } from "../src/vieps.js";

function makeDb({ selected = null, path = [], roots = [], children = [], parts = [], onPrepare = () => {} } = {}) {
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
              if (/WHERE parent_id IS NULL/i.test(sql)) return { results: roots };
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


test("root browse provides persistent catalogue roots, never claims unsupported stock filtering", async () => {
  const roots = [
    { node_id: 20, label: "Suspension", sort_order: 1 },
    { node_id: 30, label: "Body", sort_order: 2 },
  ];
  const env = { DB: makeDb({ roots }) };
  const normal = await handleViepsTree(new Request("https://example.test/api/vieps/tree?root=1"), env);
  assert.equal(normal.status, 200);
  const rootData = await normal.json();
  assert.equal(rootData.state, "root");
  assert.equal(rootData.root_index_state, "available");
  assert.equal(rootData.stock_browse_state, "not_requested");
  assert.deepEqual(rootData.roots, roots);
  assert.deepEqual(rootData.children, roots);
  assert.deepEqual(rootData.path, []);
  assert.equal(rootData.selected_node, null);

  const filtered = await handleViepsTree(new Request("https://example.test/api/vieps/tree?root=1&stock_only=1"), env);
  const filteredData = await filtered.json();
  assert.equal(filtered.status, 200);
  assert.deepEqual(filteredData.roots, roots);
  assert.equal(filteredData.stock_browse_state, "unsupported");
});

test("root browse validates stock filter and rejects conflicting node selection", async () => {
  const env = { DB: makeDb() };
  const invalidFilter = await handleViepsTree(
    new Request("https://example.test/api/vieps/tree?root=1&stock_only=yes"), env,
  );
  assert.equal(invalidFilter.status, 400);
  assert.equal((await invalidFilter.json()).error_code, "stock_filter_invalid");

  const conflicting = await handleViepsTree(
    new Request("https://example.test/api/vieps/tree?root=1&node_id=20"), env,
  );
  assert.equal(conflicting.status, 400);
  assert.equal((await conflicting.json()).error_code, "tree_request_invalid");
});

test("selected browse retains authoritative root index, complete ancestry and direct link evidence", async () => {
  const roots = [
    { node_id: 1, label: "Body", sort_order: 1 },
    { node_id: 2, label: "Suspension", sort_order: 2 },
  ];
  const path = [
    { node_id: 2, parent_id: null, label: "Suspension", sort_order: 2, depth: 1 },
    { node_id: 3, parent_id: 2, label: "Front", sort_order: 5, depth: 0 },
  ];
  const response = await handleViepsTree(new Request("https://example.test/api/vieps/tree?node_id=3"), {
    DB: makeDb({
      roots, path,
      selected: { id: 3, parent_id: 2, label: "Front", sort_order: 5 },
      children: [{ node_id: 4, label: "Bushings", sort_order: 7 }],
    }),
  });
  assert.equal(response.status, 200);
  const data = await response.json();
  assert.deepEqual(data.roots, roots);
  assert.equal(data.root_index_state, "available");
  assert.deepEqual(data.path, path);
  assert.equal(data.ancestry_state, "complete");
  assert.equal(data.children[0].node_id, 4);
});

test("missing root-to-selected ancestry is unavailable, not silently inferred from labels", async () => {
  const response = await handleViepsTree(new Request("https://example.test/api/vieps/tree?node_id=3"), {
    DB: makeDb({
      selected: { id: 3, parent_id: 2, label: "Front", sort_order: 1 },
      path: [{ node_id: 3, parent_id: 2, label: "Front", depth: 0 }],
    }),
  });
  assert.equal(response.status, 200);
  assert.equal((await response.json()).ancestry_state, "unavailable");
});


test("disconnected ancestor chain is unavailable even if the first node is root and last node is selected", async () => {
  const response = await handleViepsTree(new Request("https://example.test/api/vieps/tree?node_id=4"), {
    DB: makeDb({
      selected: { id: 4, parent_id: 3, label: "Bracket", sort_order: 1 },
      roots: [{ node_id: 1, label: "Body", sort_order: 1 }],
      path: [
        { node_id: 1, parent_id: null, label: "Body", depth: 2 },
        { node_id: 2, parent_id: 99, label: "Front", depth: 1 },
        { node_id: 4, parent_id: 3, label: "Bracket", depth: 0 },
      ],
    }),
  });
  assert.equal(response.status, 200);
  const data = await response.json();
  assert.equal(data.ancestry_state, "unavailable");
  assert.deepEqual(data.roots.map((root) => root.node_id), [1]);
});
