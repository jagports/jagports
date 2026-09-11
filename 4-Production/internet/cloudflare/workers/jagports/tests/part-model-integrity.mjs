import test from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { database, d1, migrate, migrations, sql } from './helpers/model-db.mjs';
import { handleViepsPart } from '../src/vieps.js';

const quote = (name) => `"${name.replaceAll('"', '""')}"`;
function withDatabase(t, options) {
  const db = database(options);
  t.after(() => db.close());
  return db;
}
function rollback(db, action) {
  db.exec('SAVEPOINT probe');
  try { action(); } finally { db.exec('ROLLBACK TO probe; RELEASE probe'); }
}
function rejected(db, statement, reason = /constraint failed/i) {
  rollback(db, () => assert.throws(() => db.exec(statement), reason, statement));
}

test('complete migration chain and representative graph have no integrity failures', (t) => {
  const db = withDatabase(t);
  assert.equal(migrations.length, 10);
  assert.equal(db.prepare('PRAGMA foreign_keys').get().foreign_keys, 1);
  assert.deepEqual(db.prepare('PRAGMA foreign_key_check').all(), []);
  assert.equal(db.prepare('PRAGMA integrity_check').get().integrity_check, 'ok');
  assert.equal(db.prepare('SELECT count(*) AS n FROM part_occurrence WHERE part_id = 53801').get().n, 2);
  assert.equal(db.prepare(`SELECT count(*) AS n FROM part p
    JOIN part_model_range m ON m.part_id=p.id JOIN part_vin_range v ON v.part_id=p.id
    WHERE p.id=53801`).get().n, 1);
  assert.equal(db.prepare(`SELECT count(*) AS n FROM diagram_hotspot h
    JOIN part_occurrence_diagram od ON od.diagram_id=h.diagram_id AND od.part_occurrence_id=h.part_occurrence_id
    JOIN part_fitment f ON f.part_occurrence_id=h.part_occurrence_id
    WHERE h.id=53871 AND f.applicability_state='excluded' AND f.except_flag='1'`).get().n, 1);
  assert.equal(db.prepare(`SELECT p.part_number_normalized AS number FROM part_supersession a
    JOIN part_supersession b ON b.superseded_part_id=a.superseding_part_id
    JOIN part p ON p.id=b.superseding_part_id WHERE a.superseded_part_id=53801`).get().number, 'FIX538C');
  assert.equal(db.prepare('SELECT count(*) AS n FROM part_supersession WHERE superseding_part_id=53802').get().n, 2);
  assert.equal(db.prepare('SELECT count(*) AS n FROM stock_item WHERE part_id=53801').get().n, 2);
  assert.equal(db.prepare(`SELECT v.vin_raw FROM stock_item s JOIN vehicle v ON v.id=s.donor_vehicle_id WHERE s.id=53901`).get().vin_raw, 'SAJJNADW3TJ123456');
  assert.equal(db.prepare('SELECT part_id FROM stock_item WHERE id=53903').get().part_id, null);
  assert.equal(db.prepare('SELECT count(*) AS n FROM part_image WHERE part_id=53804').get().n, 2);
  for (const table of ['part', 'part_occurrence', 'part_image', 'model_range', 'vin_range', 'part_model_range', 'part_vin_range', 'part_supersession', 'part_fitment', 'diagram', 'part_vehicle_location', 'stock_item']) {
    assert.ok(db.prepare(`SELECT count(*) AS n FROM ${table} WHERE source='fixture' AND source_ref IS NOT NULL`).get().n > 0, table);
  }
});

test('upgrade preserves populated 0003 presentation records and operational identities', (t) => {
  const db = new DatabaseSync(':memory:');
  t.after(() => db.close());
  db.exec('PRAGMA foreign_keys=ON');
  migrate(db, migrations.slice(0, 1));
  db.exec(`INSERT INTO part_reference(id,part_number,description) VALUES(700,' mna-7691-aa ','legacy');
    INSERT INTO stock_item(id,part_number,quantity,location) VALUES(701,' mna-7691-aa ',2,'legacy-bin');`);
  migrate(db, migrations.slice(1, 3));
  // The fixture's original table names are the supported pre-0005/0008 schema.
  db.exec(sql('tests/fixtures/deployment1.sql').replaceAll('deployment1_part_image', 'part_image').replaceAll('deployment1_part_fitment', 'part_fitment'));
  db.exec(`INSERT INTO part_image(part_id,image_url,image_kind) VALUES(700,'https://example.test/old.png','identification');`);
  const images = db.prepare('SELECT * FROM part_image ORDER BY id').all();
  const fitment = db.prepare('SELECT * FROM part_fitment ORDER BY id').all();
  migrate(db, migrations.slice(3));
  assert.deepEqual(db.prepare('SELECT * FROM deployment1_part_image ORDER BY id').all(), images);
  assert.deepEqual(db.prepare('SELECT * FROM deployment1_part_fitment ORDER BY id').all(), fitment);
  assert.equal(db.prepare('SELECT part_number_normalized FROM part WHERE id=700').get().part_number_normalized, 'MNA7691AA');
  const stock = db.prepare('SELECT * FROM stock_item WHERE id=701').get();
  assert.equal(stock.part_id, null); // no automatic catalogue resolution
  assert.equal(stock.part_number, ' mna-7691-aa ');
  assert.equal(stock.location, 'legacy-bin');
  assert.equal(stock.quantity, 2);
  assert.equal(stock.available, 1);
  assert.equal(db.prepare('SELECT count(*) AS n FROM part_image').get().n, 0);
  assert.equal(db.prepare('SELECT count(*) AS n FROM part_fitment').get().n, 0);
  assert.deepEqual(db.prepare('PRAGMA foreign_key_check').all(), []);
});

test('0002 rejects normalized collisions transactionally without losing legacy rows', (t) => {
  const db = new DatabaseSync(':memory:');
  t.after(() => db.close());
  db.exec('PRAGMA foreign_keys=ON');
  migrate(db, migrations.slice(0, 1));
  db.exec("INSERT INTO part_reference(part_number) VALUES('MNA-7691-AA'),('MNA7691AA')");
  assert.throws(() => migrate(db, migrations.slice(1, 2)), /UNIQUE constraint failed/);
  assert.equal(db.prepare('SELECT count(*) AS n FROM part_reference').get().n, 2);
});

test('every declared foreign key rejects an invalid parent at runtime', (t) => {
  const db = withDatabase(t);
  const tables = db.prepare("SELECT name FROM sqlite_schema WHERE type='table' AND name NOT LIKE 'sqlite_%'").all();
  let checked = 0;
  for (const { name } of tables) {
    for (const fk of db.prepare(`PRAGMA foreign_key_list(${quote(name)})`).all()) {
      assert.ok(db.prepare(`SELECT 1 FROM ${quote(name)} WHERE ${quote(fk.from)} IS NOT NULL LIMIT 1`).get(), `fixture for ${name}.${fk.from}`);
      rejected(db, `UPDATE ${quote(name)} SET ${quote(fk.from)}=-999999 WHERE rowid=(SELECT rowid FROM ${quote(name)} WHERE ${quote(fk.from)} IS NOT NULL LIMIT 1)`, /FOREIGN KEY constraint failed/);
      checked++;
    }
  }
  assert.ok(checked >= 25, `checked ${checked} foreign keys`);
});

test('canonical and relationship uniqueness reject duplicate populated identities', (t) => {
  const db = withDatabase(t);
  for (const [table, where] of [
    ['part', 'id=53801'], ['part_occurrence', 'id=53811'], ['part_image', 'id=53821'],
    ['model_range', 'id=53831'], ['part_model_range', 'part_id=53801'], ['part_vin_range', 'part_id=53801'],
    ['part_supersession', 'superseded_part_id=53801'], ['part_fitment', 'id=53851'],
    ['part_fitment', 'id=53853'], ['diagram', 'id=53861'], ['part_occurrence_diagram', 'part_occurrence_id=53811'],
    ['part_vehicle_location', 'id=53881'], ['vehicle_range', 'id=1'],
    ['part_tree_part', 'tree_node_id=3'], ['deployment1_part_fitment', 'id=1'],
  ]) {
    const columns = db.prepare(`PRAGMA table_info(${quote(table)})`).all().filter((c) => c.name !== 'id').map((c) => quote(c.name)).join(',');
    rejected(db, `INSERT INTO ${quote(table)} (${columns}) SELECT ${columns} FROM ${quote(table)} WHERE ${where} LIMIT 1`, /UNIQUE constraint failed/);
  }
});

test('required values and documented CHECK boundaries reject invalid data', (t) => {
  const db = withDatabase(t);
  for (const query of [
    "UPDATE part SET part_number_raw=' ' WHERE id=53801",
    "UPDATE part SET part_number_normalized='' WHERE id=53801",
    "UPDATE part SET verification_status=NULL WHERE id=53801",
    ...['source', 'source_ref', 'context_type'].map((field) => `UPDATE part_occurrence SET ${field}=' ' WHERE id=53811`),
    "UPDATE part_image SET image_ref='' WHERE id=53821",
    ...['range_code', 'name'].map((field) => `UPDATE model_range SET ${field}=' ' WHERE id=53831`),
    ...['vin_prefix', 'serial_start', 'serial_end'].map((field) => `UPDATE vin_range SET ${field}=' ' WHERE id=53841`),
    'UPDATE part_supersession SET superseding_part_id=superseded_part_id WHERE superseded_part_id=53801',
    "UPDATE part_fitment SET applicability_state='maybe' WHERE id=53851",
    "UPDATE part_fitment SET source_value=' ' WHERE id=53851",
    "UPDATE part_fitment SET except_flag='' WHERE id=53851",
    "UPDATE diagram SET diagram_ref='' WHERE id=53861",
    "UPDATE diagram_hotspot SET item_number='' WHERE id=53871",
    "UPDATE diagram_hotspot SET coordinate_system='' WHERE id=53871",
    'UPDATE diagram_hotspot SET source_y=NULL WHERE id=53871',
    "UPDATE part_vehicle_location SET mapping_state='maybe' WHERE id=53881",
    'UPDATE part_vehicle_location SET location_ref=NULL WHERE id=53881',
    ...['location_ref', 'system_ref', 'category_ref'].map((field) => `UPDATE part_vehicle_location SET ${field}='' WHERE id=53881`),
    'UPDATE stock_item SET quantity=-1 WHERE id=53901',
    'UPDATE stock_item SET available=2 WHERE id=53901',
    'UPDATE stock_item SET available=NULL WHERE id=53901',
  ]) rejected(db, query);
});

test('nullable uniqueness and source boundaries remain explicit, not invented validation', (t) => {
  const db = withDatabase(t);
  db.exec(`INSERT INTO part(description) VALUES('Unidentified clip'),('Unidentified clip');
    INSERT INTO diagram(diagram_ref) VALUES('unknown'),('unknown');
    INSERT INTO part_vehicle_location(part_occurrence_id) VALUES(53812),(53812);
    UPDATE vin_range SET serial_start='Z9',serial_end='A1' WHERE id=53841;
    UPDATE diagram_hotspot SET coordinate_system=NULL WHERE id=53871;
    UPDATE stock_item SET quantity=0,available=0 WHERE id=53901;`);
  assert.equal(db.prepare("SELECT count(*) AS n FROM diagram WHERE diagram_ref='unknown'").get().n, 2);
  assert.equal(db.prepare('SELECT count(*) AS n FROM part_vehicle_location WHERE part_occurrence_id=53812').get().n, 3);
  // Unspecified cycle policy: only direct self-links are rejected by the MVP.
  db.exec('INSERT INTO part_supersession(superseded_part_id,superseding_part_id) VALUES(53803,53801)');
  assert.equal(db.prepare('SELECT count(*) AS n FROM part_supersession WHERE superseded_part_id=53803').get().n, 1);
});

test('deleting catalogue identity preserves stock and unmapped hotspot evidence', (t) => {
  const db = withDatabase(t);
  const before = { ...db.prepare('SELECT * FROM stock_item WHERE id=53901').get() };
  db.exec('DELETE FROM part WHERE id=53801');
  assert.deepEqual({ ...db.prepare('SELECT * FROM stock_item WHERE id=53901').get() }, { ...before, part_id: null });
  for (const table of ['part_occurrence', 'part_model_range', 'part_vin_range']) {
    assert.equal(db.prepare(`SELECT count(*) AS n FROM ${table} WHERE part_id=53801`).get().n, 0);
  }
  assert.equal(db.prepare('SELECT count(*) AS n FROM part_fitment WHERE part_occurrence_id IN (53811,53812)').get().n, 0);
  assert.equal(db.prepare('SELECT count(*) AS n FROM part_vehicle_location WHERE part_occurrence_id IN (53811,53812)').get().n, 0);
  assert.equal(db.prepare('SELECT count(*) AS n FROM part_occurrence_diagram').get().n, 0);
  assert.equal(db.prepare('SELECT part_occurrence_id FROM diagram_hotspot WHERE id=53871').get().part_occurrence_id, null);
  assert.equal(db.prepare('SELECT count(*) AS n FROM part_supersession WHERE superseded_part_id=53801 OR superseding_part_id=53801').get().n, 0);
  assert.ok(db.prepare('SELECT id FROM part WHERE id=53802').get());
  db.exec('DELETE FROM vehicle WHERE id=53891');
  assert.equal(db.prepare('SELECT donor_vehicle_id FROM stock_item WHERE id=53901').get().donor_vehicle_id, null);
  assert.equal(db.prepare('SELECT donor_vehicle FROM stock_item WHERE id=53901').get().donor_vehicle, 'source donor text');
  assert.equal(db.prepare('SELECT count(*) AS n FROM vehicle_identifier WHERE vehicle_id=53891').get().n, 0);
  db.exec('DELETE FROM diagram WHERE id=53861');
  assert.equal(db.prepare('SELECT count(*) AS n FROM diagram_hotspot').get().n, 0);
  assert.deepEqual(db.prepare('PRAGMA foreign_key_check').all(), []);
});

test('range and evidence deletion cascades do not delete catalogue parts', (t) => {
  const db = withDatabase(t);
  db.exec('DELETE FROM model_range WHERE id=53831; DELETE FROM vin_range WHERE id=53841; DELETE FROM part WHERE id=53804');
  assert.equal(db.prepare('SELECT count(*) AS n FROM part_model_range').get().n, 0);
  assert.equal(db.prepare('SELECT count(*) AS n FROM part_vin_range').get().n, 0);
  assert.equal(db.prepare('SELECT count(*) AS n FROM part_vehicle_location WHERE id=53881').get().n, 0);
  assert.equal(db.prepare('SELECT count(*) AS n FROM part_image WHERE part_id=53804').get().n, 0);
  assert.ok(db.prepare('SELECT id FROM part WHERE id=53801').get());
});

test('each existing step fixture executes with explicit prerequisites', (t) => {
  const fixtures = ['part_occurrence', 'part_image', 'part_vehicle_vin_applicability', 'part_supersession', 'part_fitment', 'part_diagram_location', 'part_stock_relationship'];
  for (const fixture of fixtures) {
    const db = withDatabase(t, { fixtures: false });
    if (fixture === 'part_occurrence') db.exec("INSERT INTO part(id,description) VALUES(1,'fixture prerequisite')");
    if (fixture === 'part_vehicle_vin_applicability') db.exec("INSERT INTO part(part_number_raw,part_number_normalized) VALUES('MNA7691AA','MNA7691AA')");
    db.exec(sql(`tests/fixtures/${fixture}.sql`));
    assert.deepEqual(db.prepare('PRAGMA foreign_key_check').all(), [], fixture);
    assert.ok(db.prepare('SELECT count(*) AS n FROM part').get().n > 0, fixture);
  }
});

test('Deployment-1 API executes real queries after all migrations', async (t) => {
  const db = withDatabase(t);
  const env = { DB: d1(db) };
  const response = await handleViepsPart(new Request('https://example.test/api/vieps/part?q=MJB7703AA'), env);
  assert.equal(response.status, 200);
  const result = await response.json();
  assert.equal(result.part.part_number_normalized, 'MJB7703AA');
  assert.equal(result.images.length, 1);
  assert.equal(result.images[0].image_url, null);
  assert.equal(result.fitment.length, 4);
  assert.equal(result.diagrams[0].availability_status, 'unavailable');
  assert.deepEqual(result.parts_tree[0].path, ['Body', 'Exterior', 'Clips and Fasteners']);
  const missing = await handleViepsPart(new Request('https://example.test/api/vieps/part?q=DOESNOTEXIST'), env);
  assert.equal(missing.status, 404);
});

test('documented indexes exist and principal relationship lookups use indexed searches', (t) => {
  const db = withDatabase(t);
  const docs = sql('PART_MODEL.md');
  const indexes = db.prepare("SELECT name,tbl_name FROM sqlite_schema WHERE type='index' AND name NOT LIKE 'sqlite_%'").all();
  for (const { name } of indexes) assert.ok(docs.includes(`\`${name}\``), `undocumented index ${name}`);
  const documentedNames = [...new Set([...docs.matchAll(/`(idx_[a-z0-9_]+)`/g)].map((match) => match[1]))];
  assert.deepEqual(documentedNames.sort(), indexes.map((index) => index.name).sort());
  const principal = [
    ['part', 'part_number_normalized', 'MNA7691AA'], ['part', 'part_number_raw', 'MNA 7691-AA'],
    ['part_occurrence', 'part_id', 53801], ['part_occurrence', 'context_type', 'epc'],
    ['part_image', 'part_id', 53804], ['part_model_range', 'part_id', 53801],
    ['part_model_range', 'model_range_id', 53831], ['part_vin_range', 'part_id', 53801],
    ['part_vin_range', 'vin_range_id', 53841], ['vin_range', 'vin_prefix', 'SAJJG'],
    ['part_supersession', 'superseded_part_id', 53801], ['part_supersession', 'superseding_part_id', 53802],
    ['part_fitment', 'part_occurrence_id', 53811], ['part_fitment', 'attribute_group', 'source-group'],
    ['diagram', 'source', 'fixture'], ['part_occurrence_diagram', 'part_occurrence_id', 53811],
    ['part_occurrence_diagram', 'diagram_id', 53861], ['diagram_hotspot', 'diagram_id', 53861],
    ['diagram_hotspot', 'part_occurrence_id', 53811], ['part_vehicle_location', 'part_occurrence_id', 53811],
    ['part_vehicle_location', 'model_range_id', 53831], ['part_vehicle_location', 'mapping_state', 'verified'],
    ['stock_item', 'part_id', 53801], ['stock_item', 'donor_vehicle_id', 53891],
    ['stock_item', 'part_number', 'MNA7691AA'], ['stock_item', 'available', 1],
    ['stock_item', 'status', 'reserved'], ['stock_item', 'location', 'BIN-A1'], ['stock_item', 'source', 'fixture'],
    ['deployment1_part_image', 'part_id', 1], ['deployment1_part_fitment', 'part_id', 1],
    ['deployment1_part_fitment', 'vehicle_range_id', 1],
  ];
  for (const [table, column, value] of principal) {
    const plan = db.prepare(`EXPLAIN QUERY PLAN SELECT * FROM ${table} WHERE ${column}=?`).all(value).map((row) => row.detail).join('\n');
    assert.match(plan, /SEARCH .* USING (?:COVERING )?INDEX/, `${table}.${column}: ${plan}`);
  }
  for (const [name, columns] of [
    ['idx_part_occurrence_identity', ['part_id', 'source', 'source_ref']],
    ['idx_vin_range_prefix_serial', ['vin_prefix', 'serial_start', 'serial_end']],
    ['idx_diagram_hotspot_item', ['diagram_id', 'item_number']],
    ['idx_part_vehicle_location_identity', ['part_occurrence_id', 'model_range_id', 'location_ref', 'system_ref', 'category_ref']],
  ]) assert.deepEqual(db.prepare(`PRAGMA index_info(${name})`).all().map((row) => row.name), columns);
  const identity = db.prepare('PRAGMA index_list(part)').all().find((row) => row.name === 'idx_part_number_normalized_unique');
  assert.equal(identity.unique, 1);
  assert.equal(identity.partial, 1);
  const fitmentIdentity = db.prepare('PRAGMA index_xinfo(idx_part_fitment_identity)').all().filter((row) => row.key);
  assert.deepEqual(fitmentIdentity.map((row) => row.cid), [1, 2, -2, -2, -2, -2]);
});
