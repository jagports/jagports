import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const source = readFileSync(new URL("../public/app.js", import.meta.url), "utf8");
const i18nSource = readFileSync(new URL("../public/i18n-runtime.js", import.meta.url), "utf8");
const en = JSON.parse(readFileSync(new URL("../../../../../../5-Implementation-Projects/internet/jagports/solution/vieps/i18n/en.json", import.meta.url), "utf8"));
const fi = JSON.parse(readFileSync(new URL("../../../../../../5-Implementation-Projects/internet/jagports/solution/vieps/i18n/fi.json", import.meta.url), "utf8"));

function loadTreeRenderer() {
  const elements = {
    tree: { innerHTML: "" },
  };
  const context = {
    document: {
      documentElement: { lang: "en" },
      querySelectorAll() { return []; },
    },
    Intl,
    VIEPS_I18N_RESOURCES: { en, fi },
    window: {},
    console,
    escapeHtml: undefined,
  };
  context.$ = (id) => elements[id];
  context.globalThis = context;
  vm.createContext(context);
  vm.runInContext(i18nSource, context);
  context.viepsI18n.init({ language: "en" });
  const wrapped = `${source}\n;globalThis.testRenderTree = renderTree;`;
  vm.runInContext(wrapped, context);
  return { renderTree: context.testRenderTree, elements };
}

test("Parts Tree retains roots, merges stable shared ancestors and underlines only selection", () => {
  const { renderTree, elements } = loadTreeRenderer();
  renderTree([
    { nodes: [
      { node_id: 101, label: "Suspension", sort_order: 1 },
      { node_id: 102, label: "Front", sort_order: 1 },
      { node_id: 103, label: "Vertical Link", sort_order: 2 },
    ] },
    { nodes: [
      { node_id: 101, label: "Suspension", sort_order: 1 },
      { node_id: 102, label: "Front", sort_order: 1 },
      { node_id: 104, label: "Bushings", sort_order: 1 },
    ] },
  ], {
    roots: [
      { node_id: 101, label: "Suspension", sort_order: 1 },
      { node_id: 200, label: "Body", sort_order: 2 },
    ],
    selectedNodeId: 103,
  });

  const markup = elements.tree.innerHTML;
  assert.equal((markup.match(/href="\?tree=101"/g) || []).length, 1);
  assert.equal((markup.match(/href="\?tree=102"/g) || []).length, 1);
  assert.equal((markup.match(/href="\?tree=103"/g) || []).length, 1);
  assert.match(markup, /href="\?tree=200"/);
  assert.match(markup, /tree-depth-0/);
  assert.match(markup, /tree-depth-1/);
  assert.equal((markup.match(/selected-path/g) || []).length, 1);
  assert.match(markup, /aria-current="location"/);
  assert.ok(markup.indexOf("Bushings") < markup.indexOf("Vertical Link"), "stable sort order");
});

test("Same canonical PART appears beneath distinct evidenced occurrence paths, not twice in details", () => {
  const { renderTree, elements } = loadTreeRenderer();
  const part = { id: 9, part_number_normalized: "MNC1628AA", description: "Vertical link" };
  const paths = [
    { nodes: [
      { node_id: 10, label: "Suspension" },
      { node_id: 11, label: "Left" },
    ] },
    { nodes: [
      { node_id: 10, label: "Suspension" },
      { node_id: 12, label: "Right" },
    ] },
  ];
  renderTree([], {
    roots: [{ node_id: 10, label: "Suspension" }],
    partLeaves: [{ part, paths }],
    selectedPartId: 9,
    selectedNodeId: 12,
  });
  const markup = elements.tree.innerHTML;
  assert.equal((markup.match(/href="\?tree=10"/g) || []).length, 1);
  assert.equal((markup.match(/data-part-query=/g) || []).length, 2);
  assert.match(markup, /href="\?part=MNC1628AA&tree=11"/);
  assert.match(markup, /href="\?part=MNC1628AA&tree=12"/);
  assert.equal((markup.match(/aria-current="page"/g) || []).length, 1);
  assert.equal(part.part_number_normalized, "MNC1628AA");
});

test("Candidate PART without evidenced tree link is not attached to an invented branch", () => {
  const { renderTree, elements } = loadTreeRenderer();
  renderTree([], {
    roots: [{ node_id: 7, label: "Body" }],
    partLeaves: [{
      part: { id: 99, part_number_normalized: "NO_TREE_LINK" },
      paths: [],
    }],
  });
  assert.match(elements.tree.innerHTML, /Body/);
  assert.doesNotMatch(elements.tree.innerHTML, /NO_TREE_LINK/);
});

test("Missing Parts Tree context produces explicit unavailable state", () => {
  const { renderTree, elements } = loadTreeRenderer();
  renderTree([]);
  assert.match(elements.tree.innerHTML, /No Parts Tree context is available/);
});

test("Source labels alone never become navigable tree links", () => {
  const { renderTree, elements } = loadTreeRenderer();
  renderTree([{ path: ["Legacy", "Context"] }]);
  assert.match(elements.tree.innerHTML, /Legacy/);
  assert.doesNotMatch(elements.tree.innerHTML, /data-tree-node-id/);
  assert.doesNotMatch(elements.tree.innerHTML, /href="\?tree=/);
});
