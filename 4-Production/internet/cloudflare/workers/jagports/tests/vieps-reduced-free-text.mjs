import test from "node:test";
import assert from "node:assert/strict";
import { handleViepsPart, handleViepsTree } from "../src/vieps.js";

function makeDb({ partSelects = [], treePathRows = [], rootChildren = [], detailRows = {} } = {}) {
  const partQueue = partSelects.map((rows) => [...rows]);
  return {
    prepare(sql) {
      return {
        bind() {
          return statement(sql);
        },
        ...statement(sql),
      };
    },
  };

  function statement(sql) {
    return {
      async first() {
        return detailRows.selectedNode || null;
      },
      async all() {
        if (/parent_id IS NULL/i.test(sql)) return { results: rootChildren };
        if (/WITH base\(part_id, tree_node_id\)/i.test(sql)) return { results: treePathRows };
        if (/FROM part\b/i.test(sql)) return { results: partQueue.length ? partQueue.shift() : [] };
        if (/FROM part_occurrence/i.test(sql)) return { results: detailRows.occurrences || [] };
        if (/FROM part_image/i.test(sql)) return { results: detailRows.images || [] };
        if (/FROM part_diagram/i.test(sql)) return { results: detailRows.diagrams || [] };
        if (/FROM part_fitment/i.test(sql)) return { results: detailRows.fitment || [] };
        if (/FROM stock_item/i.test(sql)) return { results: detailRows.stock || [] };
        if (/part_tree_node/i.test(sql)) return { results: detailRows.tree || [] };
        return { results: [] };
      },
    };
  }
}

const freeTextPart = {
  id: 101,
  part_number_raw: "TXT-101",
  part_number_normalized: "TXT101",
  description: "bonnet hinge cover",
  source: "fixture",
  source_ref: "fixture:text-101",
  verification_status: "fixture",
  has_available_stock: 1,
};

test("reduced-MVP free text fallback resolves after deterministic miss", async () => {
  const response = await handleViepsPart(
    new Request("https://example.test/api/vieps/part?q=hinge%20cover"),
    { DB: makeDb({ partSelects: [[], [freeTextPart]] }) },
  );

  assert.equal(response.status, 200);
  const data = await response.json();
  assert.equal(data.state, "resolved");
  assert.equal(data.search_path, "free_text");
  assert.equal(data.part.id, 101);
});

test("multiple free-text PART matches are tree leafs with no default selected PART", async () => {
  const otherPart = {
    ...freeTextPart,
    id: 102,
    part_number_raw: "TXT-102",
    part_number_normalized: "TXT102",
    description: "bonnet latch cover",
    source_ref: "fixture:text-102",
  };
  const treePathRows = [
    { part_id: 101, leaf_node_id: 11, node_id: 1, parent_id: null, label: "Body", sort_order: 1, depth: 1 },
    { part_id: 101, leaf_node_id: 11, node_id: 11, parent_id: 1, label: "Bonnet", sort_order: 1, depth: 0 },
    { part_id: 102, leaf_node_id: 12, node_id: 1, parent_id: null, label: "Body", sort_order: 1, depth: 1 },
    { part_id: 102, leaf_node_id: 12, node_id: 12, parent_id: 1, label: "Latch", sort_order: 2, depth: 0 },
  ];

  const response = await handleViepsPart(
    new Request("https://example.test/api/vieps/part?q=cover"),
    { DB: makeDb({ partSelects: [[], [freeTextPart, otherPart]], treePathRows }) },
  );

  assert.equal(response.status, 200);
  const data = await response.json();
  assert.equal(data.state, "multiple_match");
  assert.equal(data.search_path, "free_text");
  assert.equal(data.selected_part, null);
  assert.equal(data.part, undefined);
  assert.equal(data.parts_tree.length, 2);
  assert.deepEqual(data.parts_tree.map((entry) => entry.part_id), [101, 102]);
  assert.equal(data.parts_tree[0].nodes.at(-1).kind, "part");
  assert.equal(data.parts_tree[0].nodes.at(-1).part_query, "TXT101");
});

test("Parts Tree root request returns first-level branches", async () => {
  const response = await handleViepsTree(
    new Request("https://example.test/api/vieps/tree"),
    { DB: makeDb({ rootChildren: [
      { node_id: 1, label: "Body", sort_order: 1 },
      { node_id: 2, label: "Electrical", sort_order: 2 },
    ] }) },
  );

  assert.equal(response.status, 200);
  const data = await response.json();
  assert.equal(data.selected_node, null);
  assert.deepEqual(data.children.map((node) => node.label), ["Body", "Electrical"]);
  assert.deepEqual(data.parts, []);
});
