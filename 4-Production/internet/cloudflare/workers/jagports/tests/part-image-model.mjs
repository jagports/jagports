import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const migration = await readFile(
  new URL("../migrations/0005_part_image.sql", import.meta.url),
  "utf8"
);
const fixture = await readFile(
  new URL("./fixtures/part_image.sql", import.meta.url),
  "utf8"
);


test("PART_IMAGE is a separate entity linked to canonical PART", () => {
  assert.match(migration, /CREATE TABLE part_image/i);
  assert.match(migration, /part_id INTEGER NOT NULL REFERENCES part\(id\) ON DELETE CASCADE/i);
  assert.match(migration, /image_ref TEXT NOT NULL/i);
  assert.doesNotMatch(migration, /image_data|BLOB/i);
});

test("PART_IMAGE supports multiple images per PART without description identity", () => {
  assert.match(migration, /CREATE UNIQUE INDEX idx_part_image_identity/i);
  assert.match(migration, /ON part_image\(part_id, image_ref\)/i);
  assert.doesNotMatch(migration, /UNIQUE\s*\(\s*part_id\s*,\s*description\s*\)/i);
  assert.doesNotMatch(migration, /description\s+TEXT\s+UNIQUE/i);
  assert.match(migration, /CREATE INDEX idx_part_image_part/i);
});

test("PART_IMAGE preserves source and verification metadata", () => {
  assert.match(migration, /source TEXT/i);
  assert.match(migration, /source_ref TEXT/i);
  assert.match(migration, /description TEXT/i);
  assert.match(migration, /verification_status TEXT NOT NULL DEFAULT 'unverified'/i);
});

test("image evidence can be attached to an unidentified PART", () => {
  assert.match(fixture, /part_number_raw,\s*\n\s*part_number_normalized/i);
  assert.match(fixture, /NULL,\s*\n\s*NULL,\s*\n\s*'Fir tree clip'/i);
  assert.match(fixture, /'image-001'/i);
  assert.match(fixture, /'image-002'/i);
  assert.match(fixture, /FROM part\s*\nWHERE source = 'fixture-image'/i);
});

test("image reference must not be blank", () => {
  assert.match(migration, /CHECK \(TRIM\(image_ref\) <> ''\)/i);
});
