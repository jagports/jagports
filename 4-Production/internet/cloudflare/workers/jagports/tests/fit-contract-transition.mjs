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