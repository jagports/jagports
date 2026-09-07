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

test("empty normalized part numbers are not valid PART identities", () => {
  assert.equal(normalizePartNumber("   -  "), "");
});

test("PART migration defines raw and normalized identities", () => {
  assert.match(migration, /CREATE TABLE part_new/);
  assert.match(migration, /part_number_raw TEXT NOT NULL/);
  assert.match(migration, /part_number_normalized TEXT NOT NULL UNIQUE/);
  assert.match(migration, /ALTER TABLE part_new RENAME TO part/);
  assert.match(migration, /CREATE INDEX idx_part_number_normalized ON part\(part_number_normalized\)/);
  assert.doesNotMatch(migration, /CREATE TABLE part_new[\s\S]*applicability/i);
});
