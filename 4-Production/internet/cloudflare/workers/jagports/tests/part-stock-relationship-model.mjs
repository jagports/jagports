import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(fileURLToPath(new URL('.', import.meta.url)), '..');
const specRoot = path.join(root, '../../../../../5-Implementation-Projects/internet/jagports/solution/vieps/SPEC');
const migration = fs.readFileSync(path.join(root, 'migrations/0010_part_stock_relationship.sql'), 'utf8');
const fixture = fs.readFileSync(path.join(root, 'tests/fixtures/part_stock_relationship.sql'), 'utf8');
const docs = fs.readFileSync(path.join(specRoot, 'MODEL_PART.md'), 'utf8');

assert.match(migration, /ALTER TABLE stock_item ADD COLUMN part_id INTEGER REFERENCES part\(id\) ON DELETE SET NULL/);
assert.match(migration, /ALTER TABLE stock_item ADD COLUMN donor_vehicle_id INTEGER REFERENCES vehicle\(id\) ON DELETE SET NULL/);
assert.match(migration, /ADD COLUMN source TEXT/);
assert.match(migration, /ADD COLUMN verification_status TEXT NOT NULL DEFAULT 'unverified'/);
assert.match(migration, /ADD COLUMN confidence REAL/);
assert.match(migration, /ADD COLUMN available INTEGER NOT NULL DEFAULT 1 CHECK \(available IN \(0, 1\)\)/);
assert.match(migration, /CREATE INDEX idx_stock_item_part_id ON stock_item\(part_id\)/);
assert.match(migration, /CREATE INDEX idx_stock_item_available ON stock_item\(available\)/);
assert.match(migration, /CREATE INDEX idx_stock_item_donor_vehicle ON stock_item\(donor_vehicle_id\)/);
assert.match(fixture, /9301/);
assert.match(fixture, /9302/);
assert.match(fixture, /part_id, donor_vehicle_id/);
assert.match(fixture, /9303/);
assert.match(fixture, /NULL, NULL,\s+'fixture', 'unverified'/);
assert.match(docs, /PART to operational stock/);
assert.match(docs, /multiple stock records/);
assert.match(docs, /Unresolved stock is representable/);
assert.match(docs, /donor vehicle/);

console.log('part-stock-relationship-model: 16 assertions passed');
