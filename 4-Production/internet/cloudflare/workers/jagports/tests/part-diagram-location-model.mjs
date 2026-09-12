import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(fileURLToPath(new URL('.', import.meta.url)), '..');
const migration = fs.readFileSync(path.join(root, 'migrations/0009_part_diagram_location.sql'), 'utf8');
const fixture = fs.readFileSync(path.join(root, 'tests/fixtures/part_diagram_location.sql'), 'utf8');
const docs = fs.readFileSync(path.join(root, 'PART_MODEL.md'), 'utf8');

assert.match(migration, /CREATE TABLE diagram/);
assert.match(migration, /CREATE TABLE part_occurrence_diagram/);
assert.match(migration, /REFERENCES part_occurrence\(id\)/);
assert.match(migration, /CREATE TABLE diagram_hotspot/);
assert.match(migration, /REFERENCES diagram\(id\)/);
assert.match(migration, /coordinate_system TEXT/);
assert.match(migration, /source_x REAL/);
assert.match(migration, /source_y REAL/);
assert.match(migration, /CREATE TABLE part_vehicle_location/);
assert.match(migration, /REFERENCES model_range\(id\)/);
assert.match(migration, /mapping_state IN \('verified', 'unavailable'\)/);
assert.match(migration, /mapping_state = 'unavailable' OR location_ref IS NOT NULL/);
assert.match(migration, /CREATE INDEX idx_diagram_hotspot_occurrence/);
assert.match(migration, /CREATE INDEX idx_part_vehicle_location_model/);
assert.match(fixture, /DGM-001/);
assert.match(fixture, /fixture-stage-v1/);
assert.match(fixture, /'verified'/);
assert.match(fixture, /'unavailable'/);
assert.match(docs, /PART diagram and hotspot/);
assert.match(docs, /vehicle location/);

console.log('part-diagram-location-model: 20 assertions passed');
