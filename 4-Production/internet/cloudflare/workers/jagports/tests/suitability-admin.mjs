import assert from "node:assert/strict";
import test from "node:test";
import { database } from "./helpers/model-db.mjs";
import { handleApi } from "../src/index.js";
import { handleViepsSuitability } from "../src/suitability.js";

function fixture(withData = false) {
  const db = database({ fixtures: withData });
  const d1 = { prepare(sql) {
    let args = [];
    return {
      bind(...values) { args = values; return this; },
      async first() { return db.prepare(sql).get(...args) ?? null; },
      async all() { return { results: db.prepare(sql).all(...args) }; },
      async run() { const r = db.prepare(sql).run(...args);
        return { meta: { last_row_id: Number(r.lastInsertRowid), changes: r.changes } }; },
    };
  } };
  return { db, env: { DB: d1, ADMIN_TOKEN: "secret-test-token", ADMIN_ACTOR_REF: "test-admin" } };
}
function request(path, method = "GET", body, authorized = true) {
  const headers = { "content-type": "application/json" };
  if (authorized) headers["x-admin-token"] = "secret-test-token";
  return new Request("https://example.test" + path, {
    method, headers, body: body === undefined ? undefined : JSON.stringify(body),
  });
}
async function call(env, path, method, body, authorized = true) {
  const response = await handleApi(request(path, method, body, authorized), env);
  return { status: response.status, body: await response.json() };
}
const base = "/api/admin/suitability";
const labels = (en, fi) => ({
  names: { en, fi }, descriptions: { en: en + " description", fi: fi + " kuvaus" },
});

test("catalogue Admin read and mutation require server-side authorization", async t => {
  const { db, env } = fixture(); t.after(() => db.close());
  assert.equal((await call(env, base, "GET", undefined, false)).status, 401);
  assert.equal((await call(env, base + "/categories", "POST", {
    code: "body_test", ...labels("Body", "Kori"),
  }, false)).status, 401);
  assert.equal(db.prepare("SELECT COUNT(*) AS n FROM applicability_dimension").get().n, 0);
});

test("category/value lifecycle keeps codes and historic rows; every mutation audited", async t => {
  const { db, env } = fixture(); t.after(() => db.close());
  const created = await call(env, base + "/categories", "POST",
    { code: "body_test", ...labels("Body", "Kori") });
  assert.equal(created.status, 201);
  const id = created.body.id;
  assert.equal((await call(env, base + "/categories", "POST",
    { code: "body_test", ...labels("Duplicate", "Kopio") })).status, 409);
  assert.equal((await call(env, base + "/values", "POST",
    { dimension_id: id, value_code: "coupe", ...labels("Coupe", "Coupé") })).status, 201);
  assert.equal((await call(env, base + "/categories/" + id, "PATCH",
    { ...labels("Vehicle body", "Ajoneuvon kori"), verification: "verified" })).status, 200);
  assert.equal((await call(env, base + "/values/" + id + "/coupe", "PATCH",
    labels("Coupe body", "Coupé-kori"))).status, 200);
  const categoriesOnly = await call(env, base + "/categories?lang=fi");
  assert.equal(categoriesOnly.status, 200);
  assert.ok(categoriesOnly.body.categories.some(x => x.id === id));
  assert.equal(categoriesOnly.body.sources, undefined);
  const list = await call(env, base + "?lang=fi");
  assert.equal(list.body.categories.find(x => x.id === id).name_fi, "Ajoneuvon kori");
  assert.equal(list.body.values.find(x => x.dimension_id === id).name_fi, "Coupé-kori");
  assert.equal((await call(env, base + "/categories/" + id, "PATCH", {
    code: "changed_code", ...labels("Wrong", "Väärä"),
  })).body.error_code, "immutable_code");
  assert.equal((await call(env, base + "/values/" + id + "/coupe", "PATCH",
    { retire: true })).status, 200);
  assert.equal((await call(env, base + "/categories/" + id, "PATCH",
    { retire: true })).status, 200);
  assert.ok(db.prepare("SELECT retired_at FROM applicability_dimension_retirement WHERE dimension_id=?").get(id).retired_at);
  assert.ok(db.prepare("SELECT retired_at FROM applicability_dimension_value_retirement WHERE dimension_id=? AND value_code='coupe'").get(id).retired_at);
  assert.equal(db.prepare("SELECT COUNT(*) AS n FROM applicability_suitability_admin_audit").get().n, 6);
});

test("identically worded raw descriptions keep distinct source IDs and revision history", async t => {
  const { db, env } = fixture(true); t.after(() => db.close());
  const list = (await call(env, base + "?q=Coupe")).body;
  const same = list.sources.filter(x => x.original_text === "Coupe");
  assert.equal(same.length, 4);
  assert.equal(new Set(same.map(x => x.id)).size, 4);
  const original = same.find(x => x.id === 87709);
  const filtered = await call(env, base + "/descriptions?status=proposed&language=en&q=Coupe");
  assert.equal(filtered.status, 200);
  assert.deepEqual(filtered.body.sources.map(x => x.id), [87709]);
  assert.equal(filtered.body.categories, undefined);
  assert.equal(original.status, "proposed");
  const dim = list.categories.find(x => x.code === "body").id;
  const revised = await call(env, base + "/mappings", "POST", {
    source_description_id: original.id, dimension_id: dim, value_code: "coupe",
    status: "conflict", mapping_version: "test-v2", evidence_note: "Ambiguous JEPC group",
  });
  assert.equal(revised.status, 201);
  assert.equal(revised.body.mapping.revision, 2);
  assert.equal((await call(env, base + "/mappings/" + revised.body.mapping.id + "/retire", "POST", {
    mapping_version: "test-v3", evidence_note: "Unresolved interpretation retired",
  })).status, 201);
  assert.equal((await call(env, base + "/mappings/" + revised.body.mapping.id + "/retire", "POST", {
    mapping_version: "test-v4", evidence_note: "Stale retry",
  })).body.error_code, "stale_mapping_revision");
  const history = (await call(env, base + "/history?source_description_id=" + original.id)).body;
  assert.deepEqual(history.revisions.map(x => x.status), ["proposed", "conflict", "retired"]);
  assert.equal(history.audit.length, 2);
  assert.equal(db.prepare("SELECT original_text FROM applicability_source_description WHERE id=?").get(original.id).original_text, "Coupe");
  assert.equal((await call(env, base + "/sources/" + original.id, "PATCH",
    { original_text: "Tampered" })).status, 405);
  assert.equal((await call(env, base + "/mappings", "POST", {
    source_description_id: original.id, dimension_id: dim, value_code: "coupe",
    status: "verified", mapping_version: "test-v4",
    evidence_note: "Fixture cannot become JEPC", reviewer_ref: "reviewer",
  })).body.error_code, "fixture_not_verified");
});

test("verified JEPC mappings require recorded reviewer and never mutate source wording", async t => {
  const { db, env } = fixture(true); t.after(() => db.close());
  db.prepare("INSERT INTO applicability_source_description (id,source_namespace,dataset_key,source_key,source_language,original_text,record_locator,provenance_kind) VALUES (999001,'JEPC-test','import-1','item-999','en','Verified sample','item/999','jepc')").run();
  const dim = db.prepare("SELECT id FROM applicability_dimension WHERE code='body'").get().id;
  const body = { source_description_id: 999001, dimension_id: dim, value_code: "coupe",
    status: "verified", mapping_version: "source-v1", evidence_note: "Review test source" };
  assert.equal((await call(env, base + "/mappings", "POST", body)).body.error_code, "invalid_reviewer_ref");
  const created = await call(env, base + "/mappings", "POST", {
    ...body, reviewer_ref: "independent-reviewer",
  });
  assert.equal(created.status, 201);
  assert.equal(created.body.source_identity.namespace, "JEPC-test");
  assert.equal((await call(env, base + "/mappings", "POST", {
    ...body, status: "fixture", reviewer_ref: "independent-reviewer",
  })).body.error_code, "source_not_fixture");
  const listed = (await call(env, base + "?q=Verified%20sample")).body.sources[0];
  assert.equal(listed.status, "verified");
  assert.equal(listed.original_text, "Verified sample");
});

test("retiring a normalized value hides it from published fixtures, not source evidence", async t => {
  const { db, env } = fixture(true); t.after(() => db.close());
  const requestSuitability = () => handleViepsSuitability(request("/api/vieps/suitability"),
    { ...env, ENABLE_SUITABILITY_FIXTURES: "1" });
  assert.equal((await requestSuitability()).status, 200);
  const dim = db.prepare("SELECT id FROM applicability_dimension WHERE code='body'").get().id;
  assert.equal((await call(env, base + "/values/" + dim + "/coupe", "PATCH",
    { retire: true })).status, 200);
  const response = await requestSuitability();
  assert.equal(response.status, 200);
  const data = await response.json();
  assert.equal(data.categories.find(x => x.code === "body").values.some(x => x.code === "coupe"), false);
  assert.ok(db.prepare("SELECT COUNT(*) AS n FROM applicability_set_description_evidence").get().n > 0);
});
