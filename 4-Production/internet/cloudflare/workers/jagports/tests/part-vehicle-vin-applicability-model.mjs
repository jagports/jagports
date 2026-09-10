import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const migration = await readFile(
  new URL("../migrations/0006_part_vehicle_vin_applicability.sql", import.meta.url),
  "utf8"
);
const fixture = await readFile(
  new URL("./fixtures/part_vehicle_vin_applicability.sql", import.meta.url),
  "utf8"
);
const partModel = await readFile(
  new URL("../PART_MODEL.md", import.meta.url),
  "utf8"
);

test("model range and VIN range remain distinct entities", () => {
  assert.match(migration, /CREATE TABLE model_range/i);
  assert.match(migration, /CREATE TABLE vin_range/i);
  assert.match(partModel, /model_range.*vin_range are distinct concepts/is);
});

test("PART has explicit model-range and VIN-range relationships", () => {
  assert.match(migration, /CREATE TABLE part_model_range/i);
  assert.match(migration, /part_id INTEGER NOT NULL REFERENCES part\(id\) ON DELETE CASCADE/i);
  assert.match(migration, /model_range_id INTEGER NOT NULL REFERENCES model_range\(id\) ON DELETE CASCADE/i);
  assert.match(migration, /CREATE TABLE part_vin_range/i);
  assert.match(migration, /vin_range_id INTEGER NOT NULL REFERENCES vin_range\(id\) ON DELETE CASCADE/i);
});

test("applicability relationships support provenance and multiple records", () => {
  assert.match(migration, /source TEXT/i);
  assert.match(migration, /source_ref TEXT/i);
  assert.match(migration, /verification_status TEXT NOT NULL DEFAULT 'unverified'/i);
  assert.match(migration, /PRIMARY KEY \(part_id, model_range_id\)/i);
  assert.match(migration, /PRIMARY KEY \(part_id, vin_range_id\)/i);
});

test("VIN range retains structured source and discriminator fields without a decoder", () => {
  for (const field of [
    "vin_prefix",
    "serial_start",
    "serial_end",
    "model_year",
    "production_boundary",
    "market",
    "body",
    "engine_variant",
    "emissions",
    "transmission_steering",
  ]) {
    assert.match(migration, new RegExp(`${field}\\s+TEXT`, "i"));
  }
  assert.doesNotMatch(migration, /KOVuosi/i);
  assert.match(partModel, /does not implement a complete VIN decoder/i);
});

test("representative fixture links one PART to both applicability types", () => {
  assert.match(fixture, /part_model_range/i);
  assert.match(fixture, /part_vin_range/i);
  assert.match(fixture, /MNA7691AA/i);
  assert.match(fixture, /'X100'/i);
  assert.match(fixture, /'SAJJG'/i);
});
