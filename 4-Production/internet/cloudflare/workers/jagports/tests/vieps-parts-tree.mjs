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

test("Parts Tree preserves hierarchy and highlights selected path", () => {
  const { renderTree, elements } = loadTreeRenderer();

  renderTree([
    { path: ["Suspension", "Front", "Vertical Link"] },
  ]);

  assert.match(elements.tree.innerHTML, /Suspension/);
  assert.match(elements.tree.innerHTML, /Front/);
  assert.match(elements.tree.innerHTML, /Vertical Link/);
  assert.match(elements.tree.innerHTML, /selected-path/);
});

test("Parts Tree renders multiple valid occurrence paths without changing canonical identity", () => {
  const { renderTree, elements } = loadTreeRenderer();

  const canonicalPart = { part_number_normalized: "MNC1628AA" };
  const occurrences = [
    { path: ["Front", "Left", "Vertical Link"] },
    { path: ["Front", "Right", "Vertical Link"] },
  ];

  renderTree(occurrences);

  assert.equal(canonicalPart.part_number_normalized, "MNC1628AA");
  assert.equal((elements.tree.innerHTML.match(/tree-branch/g) || []).length, 2);
  assert.match(elements.tree.innerHTML, /Left/);
  assert.match(elements.tree.innerHTML, /Right/);
});

test("Missing Parts Tree context produces explicit unavailable state", () => {
  const { renderTree, elements } = loadTreeRenderer();

  renderTree([]);

  assert.match(elements.tree.innerHTML, /No Parts Tree context is available/);
});
