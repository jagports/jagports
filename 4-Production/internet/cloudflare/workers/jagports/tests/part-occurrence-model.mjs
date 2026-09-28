import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const migration = await readFile(
  new URL("../migrations/0004_part_occurrence_context.sql", import.meta.url),
  "utf8"
);
const fixture = await readFile(
  new URL("./fixtures/part_occurrence.sql", import.meta.url),
  "utf8"
);

test("PART occurrence references canonical PART and permits multiple source contexts", () => {
  assert.match(migration, /part_id INTEGER NOT NULL REFERENCES part\(id\) ON DELETE CASCADE/);
  assert.match(migration, /source TEXT NOT NULL/);
  assert.match(migration, /source_ref TEXT NOT NULL/);
  assert.match(migration, /CREATE UNIQUE INDEX idx_part_occurrence_identity/);
  assert.match(migration, /ON part_occurrence\(part_id, source, source_ref\)/);
});

test("PART occurrence preserves optional EPC context and diagram/item references", () => {
  assert.match(migration, /context_type TEXT NOT NULL DEFAULT 'epc'/);
  assert.match(migration, /context_ref TEXT/);
  assert.match(migration, /category_ref TEXT/);
  assert.match(migration, /item_number TEXT/);
  assert.match(migration, /diagram_ref TEXT/);
  assert.match(migration, /diagram_item_number TEXT/);
});

test("PART occurrence rejects blank source identity values", () => {
  assert.match(migration, /CHECK \(TRIM\(source\) <> ''\)/);
  assert.match(migration, /CHECK \(TRIM\(source_ref\) <> ''\)/);
  assert.match(migration, /CHECK \(TRIM\(context_type\) <> ''\)/);
});

test("representative fixture contains multiple contexts and an unavailable diagram context", () => {
  assert.match(fixture, /occurrence-001/);
  assert.match(fixture, /occurrence-002/);
  assert.match(fixture, /'diagram-001'/);
  assert.match(fixture, /'x150-body-exterior'.*NULL, NULL/s);
});

test("occurrence model does not place vehicle applicability on PART", () => {
  assert.doesNotMatch(migration, /CREATE TABLE part_occurrence[\s\S]*vehicle_range_id/i);
  assert.doesNotMatch(migration, /CREATE TABLE part_occurrence[\s\S]*fitment/i);
});
