import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const migration = await readFile(
  new URL("../migrations/0008_part_fitment.sql", import.meta.url),
  "utf8"
);
const fixture = await readFile(
  new URL("./fixtures/part_fitment.sql", import.meta.url),
  "utf8"
);
const partModel = await readFile(
  new URL("../../../../../../5-Implementation-Projects/internet/jagports/solution/vieps/SPEC/MODEL_PART.md", import.meta.url),
  "utf8"
);

test("fitment is an explicit occurrence-level relationship", () => {
  assert.match(migration, /CREATE TABLE part_fitment/i);
  assert.match(migration, /part_occurrence_id INTEGER REFERENCES part_occurrence\(id\)/i);
  assert.match(migration, /part_occurrence_id IS NOT NULL AND part_id IS NULL AND vehicle_range_id IS NULL/i);
  assert.match(migration, /part_occurrence_id IS NULL AND part_id IS NOT NULL AND vehicle_range_id IS NOT NULL/i);
  assert.match(migration, /applicability_state TEXT NOT NULL/i);
  assert.match(migration, /applicability_state IN \('applicable', 'excluded', 'unavailable'\)/i);
  assert.match(partModel, /PART fitment and attribute applicability/i);
});

test("fitment preserves source attribute and exclusion representation", () => {
  assert.match(migration, /attribute_group TEXT/i);
  assert.match(migration, /attribute_key TEXT/i);
  assert.match(migration, /source_value TEXT/i);
  assert.match(migration, /except_flag TEXT/i);
  assert.match(fixture, /except_flag/i);
  assert.match(fixture, /convertible/i);
});

test("fitment preserves provenance and verification", () => {
  assert.match(migration, /source TEXT/i);
  assert.match(migration, /source_ref TEXT/i);
  assert.match(migration, /verification_status TEXT NOT NULL DEFAULT 'unverified'/i);
  assert.match(migration, /confidence TEXT/i);
});

test("fitment has relationship lookup and uniqueness constraints", () => {
  assert.match(migration, /idx_part_fitment_occurrence/i);
  assert.match(migration, /idx_part_fitment_attribute/i);
  assert.match(migration, /idx_part_fitment_identity/i);
});

test("fixture demonstrates positive and excluded applicability", () => {
  assert.match(fixture, /'applicable'/i);
  assert.match(fixture, /'excluded'/i);
  assert.match(partModel, /exceptFlag/i);
});

test("fitment does not invent semantic meanings for opaque attributes", () => {
  assert.match(partModel, /original source representation/i);
  assert.match(partModel, /opaque/i);
});
