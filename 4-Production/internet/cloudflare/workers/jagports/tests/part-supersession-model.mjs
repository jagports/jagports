import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const migration = await readFile(
  new URL("../migrations/0007_part_supersession.sql", import.meta.url),
  "utf8"
);
const fixture = await readFile(
  new URL("./fixtures/part_supersession.sql", import.meta.url),
  "utf8"
);
const partModel = await readFile(
  new URL("../../../../../../5-Implementation-Projects/internet/jagports/solution/vieps/SPEC/MODEL_PART.md", import.meta.url),
  "utf8"
);

test("supersession is an explicit directed PART relationship", () => {
  assert.match(migration, /CREATE TABLE part_supersession/i);
  assert.match(migration, /superseded_part_id INTEGER NOT NULL REFERENCES part\(id\)/i);
  assert.match(migration, /superseding_part_id INTEGER NOT NULL REFERENCES part\(id\)/i);
  assert.match(migration, /CHECK \(superseded_part_id <> superseding_part_id\)/i);
  assert.match(partModel, /explicit directed relationship between catalogue parts/i);
});

test("supersession preserves provenance and historical/effective metadata", () => {
  assert.match(migration, /source TEXT/i);
  assert.match(migration, /source_ref TEXT/i);
  assert.match(migration, /verification_status TEXT NOT NULL DEFAULT 'unverified'/i);
  assert.match(migration, /confidence TEXT/i);
  assert.match(migration, /effective_from TEXT/i);
  assert.match(migration, /effective_to TEXT/i);
});

test("supersession identity is unique and indexed in both directions", () => {
  assert.match(migration, /PRIMARY KEY \(superseded_part_id, superseding_part_id\)/i);
  assert.match(migration, /idx_part_supersession_superseding/i);
  assert.match(migration, /idx_part_supersession_superseded/i);
});

test("fixtures demonstrate the approved relationship and a supersession chain", () => {
  assert.match(fixture, /MNA7691AA/i);
  assert.match(fixture, /XR847031/i);
  assert.match(fixture, /FIX-A/i);
  assert.match(fixture, /FIX-B/i);
  assert.match(fixture, /FIX-C/i);
  assert.match(partModel, /MNA7691AA/i);
});

test("supersession is not generic interchangeability", () => {
  assert.match(partModel, /not a generic interchangeability/i);
  assert.match(partModel, /Historical and current part identities remain separately addressable/i);
});
