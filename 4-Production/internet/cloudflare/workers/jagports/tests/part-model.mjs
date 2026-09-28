import test from "node:test";
import assert from "node:assert/strict";
import { normalizePartNumber } from "../src/part.js";

const migration = await import("node:fs/promises").then(({ readFile }) =>
  readFile(new URL("../migrations/0002_part_model.sql", import.meta.url), "utf8")
);

test("part number normalization preserves raw input separately", () => {
  assert.equal(normalizePartNumber(" MNA 7691-AA "), "MNA7691AA");
  assert.equal(normalizePartNumber("mna-7691-aa"), "MNA7691AA");
  assert.equal(normalizePartNumber("XR847031"), "XR847031");
});

test("part number normalization rejects non-string values", () => {
  assert.equal(normalizePartNumber(null), "");
  assert.equal(normalizePartNumber(undefined), "");
  assert.equal(normalizePartNumber(123), "");
});

test("empty normalized part numbers are not valid catalogue identities", () => {
  assert.equal(normalizePartNumber("   -  "), "");
});

test("PART migration permits unknown part numbers and uniquely indexes known ones", () => {
  assert.match(migration, /part_number_raw TEXT,/);
  assert.match(migration, /part_number_normalized TEXT,/);
  assert.match(migration, /CREATE UNIQUE INDEX idx_part_number_normalized_unique/);
  assert.match(migration, /WHERE part_number_normalized IS NOT NULL/);
  assert.doesNotMatch(migration, /part_number_normalized TEXT NOT NULL UNIQUE/);
  assert.match(migration, /CHECK \(part_number_raw IS NULL OR TRIM\(part_number_raw\) <> ''\)/);
  assert.match(migration, /ALTER TABLE part_new RENAME TO part/);
  assert.doesNotMatch(migration, /CREATE TABLE part_new[\s\S]*applicability/i);
});

test("PART migration does not make descriptions unique", () => {
  assert.doesNotMatch(migration, /UNIQUE\s*\(\s*description\s*\)/i);
  assert.doesNotMatch(migration, /description\s+TEXT\s+UNIQUE/i);
});
