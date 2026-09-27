import assert from "node:assert/strict";
import test from "node:test";
import { database } from "./helpers/model-db.mjs";

test("Fit contract aliases retain normalized identities and mapping history", t => {
  const db = database({ fixtures: true });
  t.after(() => db.close());
  const legacy = db.prepare("SELECT id, code FROM applicability_dimension WHERE code='body'").get();
  const fit = db.prepare("SELECT id, code FROM fit_dimension WHERE code='body'").get();
  assert.deepEqual(fit, legacy);
  assert.equal(db.prepare("SELECT COUNT(*) AS n FROM fit_mapping_current").get().n,
    db.prepare("SELECT COUNT(*) AS n FROM applicability_description_mapping_current").get().n);
  assert.equal(db.prepare("SELECT COUNT(*) AS n FROM fit_admin_audit").get().n,
    db.prepare("SELECT COUNT(*) AS n FROM applicability_suitability_admin_audit").get().n);
});

test("all Fit aliases preserve historical tables without enabling direct writes", t => {
  const db = database({ fixtures: true });
  t.after(() => db.close());
  const aliases = {
    fit_dimension: "applicability_dimension",
    fit_dimension_value: "applicability_dimension_value",
    fit_source_description: "applicability_source_description",
    fit_mapping_revision: "applicability_description_mapping_revision",
    fit_mapping_current: "applicability_description_mapping_current",
    fit_dimension_label: "applicability_dimension_label",
    fit_dimension_value_label: "applicability_dimension_value_label",
    fit_dimension_retirement: "applicability_dimension_retirement",
    fit_dimension_value_retirement: "applicability_dimension_value_retirement",
    fit_admin_audit: "applicability_suitability_admin_audit",
  };
  for (const [view, source] of Object.entries(aliases)) {
    assert.equal(db.prepare("SELECT type FROM sqlite_schema WHERE name=?").get(view).type, "view", view);
    assert.deepEqual(db.prepare(`PRAGMA table_info(${view})`).all().map(column => column.name),
      db.prepare(`PRAGMA table_info(${source})`).all().map(column => column.name), view);
    assert.equal(db.prepare(`SELECT count(*) AS n FROM ${view}`).get().n,
      db.prepare(`SELECT count(*) AS n FROM ${source}`).get().n, view);
  }
  assert.throws(() => db.exec("INSERT INTO fit_dimension(id, code) VALUES (999999, 'write-probe')"),
    /cannot modify fit_dimension/i);
});

test("Fit aliases do not rename the persisted part-fitment state column", t => {
  const db = database({ fixtures: false });
  t.after(() => db.close());
  const columns = db.prepare("PRAGMA table_info(part_fitment)").all().map(row => row.name);
  assert.ok(columns.includes("applicability_state"));
  assert.ok(!columns.includes("fit_state"));
});
