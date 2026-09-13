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
  assert.equal(migrations.length, 11);
  assert.equal(db.prepare('PRAGMA foreign_keys').get().foreign_keys, 1);
  assert.deepEqual(db.prepare('PRAGMA foreign_key_check').all(), []);
  assert.equal(db.prepare('PRAGMA integrity_check').get().integrity_check, 'ok');
  assert.equal(db.prepare("SELECT count(*) AS n FROM part_occurrence WHERE part_id = 53801 AND source = 'fixture'").get().n, 2);
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
  assert.equal(db.prepare("SELECT count(*) AS n FROM stock_item WHERE part_id=53801 AND source = 'fixture'").get().n, 2);
  assert.equal(db.prepare(`SELECT v.vin_raw FROM stock_item s JOIN vehicle v ON v.id=s.donor_vehicle_id WHERE s.id=53901`).get().vin_raw, 'SAJJNADW3TJ123456');
  assert.equal(db.prepare('SELECT part_id FROM stock_item WHERE id=53903').get().part_id, null);
  assert.equal(db.prepare('SELECT count(*) AS n FROM part_image WHERE part_id=53804').get().n, 2);
  for (const table of ['part', 'part_occurrence', 'part_image', 'model_range', 'vin_range', 'part_model_range', 'part_vin_range', 'part_supersession', 'part_fitment', 'diagram', 'part_vehicle_location', 'stock_item']) {
    assert.ok(db.prepare(`SELECT count(*) AS n FROM ${table} WHERE source='fixture' AND source_ref IS NOT NULL`).get().n > 0, table);
  }
  const forbidden = db.prepare("SELECT name FROM sqlite_schema WHERE type='table' AND (name LIKE 'deployment%' OR name LIKE 'compatibility%')").all();
  assert.deepEqual(forbidden, []);
  const tempTables = db.prepare("SELECT name FROM sqlite_schema WHERE type='table' AND name LIKE 'temp_%'").all();
  assert.deepEqual(tempTables, []);
});

test('upgrade preserves populated 0003 presentation records in normal tables', (t) => {
  const db = new DatabaseSync(':memory:');
  t.after(() => db.close());
  db.exec('PRAGMA foreign_keys=ON');
  migrate(db, migrations.slice(0, 1));
  db.exec(`INSERT INTO part_reference(id,part_number,description) VALUES(700,' mna-7691-aa ','legacy');
    INSERT INTO stock_item(id,part_number,quantity,location) VALUES(701,' mna-7691-aa ',2,'legacy-bin');`);
  migrate(db, migrations.slice(1, 3));
  db.exec(`
    INSERT INTO vehicle_range(id,range_code,name,verification_status) VALUES(700,'OLD','Old range','fixture');
    INSERT INTO part_image(id,part_id,image_url,image_kind,description,verification_status) VALUES
      (700,700,'https://example.test/old.png','identification','old image','fixture'),
      (701,700,NULL,'representative','missing image','unverified'),
      (702,700,NULL,'identification','second missing view','fixture');
    INSERT INTO part_fitment(id,part_id,vehicle_range_id,variation,qualifier,verification_status)
      VALUES(700,700,700,'old variation','old qualifier','fixture'),
      (701,700,700,NULL,NULL,'unverified'), (702,700,700,NULL,NULL,'fixture');
  `);
  const oldImages = db.prepare('SELECT id,part_id,image_url,image_kind,description,verification_status FROM part_image ORDER BY id').all();
  const oldFitments = db.prepare('SELECT id,part_id,vehicle_range_id,variation,qualifier,verification_status FROM part_fitment ORDER BY id').all();
  migrate(db, migrations.slice(3));
  assert.deepEqual(db.prepare('SELECT id,part_id,image_ref AS image_url,image_kind,description,verification_status FROM part_image ORDER BY id').all(), oldImages);
  assert.deepEqual(db.prepare('SELECT id,part_id,vehicle_range_id,variation,qualifier,verification_status FROM part_fitment ORDER BY id').all(), oldFitments);
  assert.equal(db.prepare("SELECT count(*) AS n FROM part_image WHERE image_ref IS NULL AND availability_status='unavailable'").get().n, 2);
  assert.equal(db.prepare("SELECT count(*) AS n FROM part_fitment WHERE applicability_state='unavailable'").get().n, 3);
  const image = db.prepare('SELECT * FROM part_image WHERE id=700').get();
  assert.equal(image.part_id, 700);
  assert.equal(image.image_ref, 'https://example.test/old.png');
  assert.equal(image.image_kind, 'identification');
  assert.equal(image.availability_status, 'available');
  const fitment = db.prepare('SELECT * FROM part_fitment WHERE id=700').get();
  assert.equal(fitment.part_id, 700);
  assert.equal(fitment.vehicle_range_id, 700);
  assert.equal(fitment.variation, 'old variation');
  assert.equal(fitment.qualifier, 'old qualifier');
  assert.equal(fitment.part_occurrence_id, null);
  assert.equal(db.prepare('SELECT part_number_normalized FROM part WHERE id=700').get().part_number_normalized, 'MNA7691AA');
  const stock = db.prepare('SELECT * FROM stock_item WHERE id=701').get();
  assert.equal(stock.part_id, null);
  assert.equal(stock.part_number, ' mna-7691-aa ');
  assert.equal(stock.location, 'legacy-bin');
  assert.equal(stock.quantity, 2);
  assert.equal(stock.available, 1);
  assert.deepEqual(db.prepare('PRAGMA foreign_key_check').all(), []);
  assert.deepEqual(db.prepare("SELECT name FROM sqlite_schema WHERE type='table' AND name LIKE 'temp_%'").all(), []);
});

test('image migration collision fails atomically and retains every original record', (t) => {
  const db = new DatabaseSync(':memory:');
  t.after(() => db.close());
  db.exec('PRAGMA foreign_keys=ON');
  migrate(db, migrations.slice(0, 4));
  db.exec(`INSERT INTO part(id) VALUES(700);
    INSERT INTO part_image(part_id,image_url,image_kind) VALUES(700,'same-ref','front'),(700,'same-ref','side');`);
  const before = db.prepare('SELECT * FROM part_image ORDER BY id').all();
  assert.throws(() => migrate(db, migrations.slice(4, 5)), /UNIQUE constraint failed/);
  assert.deepEqual(db.prepare('SELECT * FROM part_image ORDER BY id').all(), before);
  assert.deepEqual(db.prepare("SELECT name FROM sqlite_schema WHERE name LIKE 'temp_%'").all(), []);
});

test('fitment scopes and unavailable images reject ambiguous or incomplete records', (t) => {
  const db = withDatabase(t);
  for (const query of [
    'INSERT INTO part_fitment DEFAULT VALUES',
    'INSERT INTO part_fitment(part_id) VALUES(53801)',
    'INSERT INTO part_fitment(vehicle_range_id) VALUES(1)',
    'INSERT INTO part_fitment(part_occurrence_id,part_id) VALUES(53811,53802)',
    'INSERT INTO part_fitment(part_occurrence_id,part_id,vehicle_range_id) VALUES(53811,53801,1)',
    'INSERT INTO part_image(part_id) VALUES(53801)',
    "INSERT INTO part_image(part_id,availability_status) VALUES(53801,'maybe')",
  ]) rejected(db, query, /CHECK constraint failed/);
  db.exec("INSERT INTO part_image(part_id,availability_status) VALUES(53801,'unavailable'),(53801,'unavailable')");
  assert.equal(db.prepare('SELECT count(*) AS n FROM part_image WHERE part_id=53801 AND image_ref IS NULL').get().n, 2);
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
  assert.equal(checked, 28, 'all 28 FKs in the consolidated schema are exercised');
});

test('canonical and relationship uniqueness reject duplicate populated identities', (t) => {
  const db = withDatabase(t);
  for (const [table, where] of [
    ['part', 'id=53801'], ['part_occurrence', 'id=53811'], ['part_image', 'id=53821'],
    ['model_range', 'id=53831'], ['part_model_range', 'part_id=53801'], ['part_vin_range', 'part_id=53801'],
    ['part_supersession', 'superseded_part_id=53801'], ['part_fitment', 'id=53851'],
    ['part_fitment', 'id=53853'], ['diagram', 'id=53861'], ['part_occurrence_diagram', 'part_occurrence_id=53811'],
    ['part_vehicle_location', 'id=53881'], ['vehicle_range', 'id=1'], ['part_tree_part', 'tree_node_id=3'],
    ['part_fitment', 'id=1'],
  ]) {
    assert.ok(db.prepare(`SELECT 1 FROM ${table} WHERE ${where}`).get(), `${table} fixture ${where}`);
  }
  rejected(db, "INSERT INTO part(part_number_raw,part_number_normalized) VALUES('MNA-7691-AA','MNA7691AA')", /UNIQUE constraint failed/);
  rejected(db, "INSERT INTO part(part_number_raw,part_number_normalized) VALUES(NULL,'MNA7691AA')", /UNIQUE constraint failed/);
  rejected(db, "INSERT INTO part(part_number_raw,part_number_normalized) VALUES(NULL,'')", /CHECK constraint failed/);
  rejected(db, "INSERT INTO model_range(range_code,name) VALUES('X100','duplicate')", /UNIQUE constraint failed/);
  rejected(db, "INSERT INTO vin_range(range_code,serial_start,serial_end) VALUES('X100','A','B')", /UNIQUE constraint failed/);
  rejected(db, "INSERT INTO part_occurrence(part_id,source,source_ref,context_type,context_ref) VALUES(53801,'fixture','jepc:sheet:warning-label','epc','emission')", /UNIQUE constraint failed/);
  rejected(db, "INSERT INTO part_image(part_id,image_ref,image_kind) VALUES(53801,'fixture://jepc/warning-label.png','diagram')", /UNIQUE constraint failed/);
  rejected(db, "INSERT INTO part_model_range(part_id,model_range_id,source_ref) VALUES(53801,53831,'fixture:jepc:model')", /UNIQUE constraint failed/);
  rejected(db, "INSERT INTO part_vin_range(part_id,vin_range_id,source_ref) VALUES(53801,53841,'fixture:jepc:vin')", /UNIQUE constraint failed/);
  rejected(db, "INSERT INTO part_supersession(superseded_part_id,superseding_part_id,source_ref) VALUES(53801,53802,'fixture:classic:supersession')", /UNIQUE constraint failed/);
  rejected(db, "INSERT INTO part_fitment(part_occurrence_id,applicability_state,attribute,source_ref) VALUES(53811,'applicable','A/R','fixture:jepc:fitment')", /UNIQUE constraint failed/);
  rejected(db, "INSERT INTO part_fitment(part_occurrence_id,applicability_state,attribute,source_ref) VALUES(53813,'excluded','except VIN before A99999','fixture:jepc:exclusion')", /UNIQUE constraint failed/);
  rejected(db, "INSERT INTO diagram(id,diagram_ref) VALUES(53861,'JHM538-AIR')", /UNIQUE constraint failed/);
  rejected(db, "INSERT INTO part_occurrence_diagram(part_occurrence_id,diagram_id,item_number) VALUES(53811,53861,'3')", /UNIQUE constraint failed/);
  rejected(db, "INSERT INTO part_vehicle_location(part_id,vehicle_range_id,location_path,source_ref) VALUES(53801,1,'Engine bay / Front / Warning label','fixture:jepc:vehicle-location')", /UNIQUE constraint failed/);
  rejected(db, "INSERT INTO part_tree_part(tree_node_id,part_id) VALUES(3,1)", /UNIQUE constraint failed/);
});

test('required values and documented CHECK boundaries reject invalid data', (t) => {
  const db = withDatabase(t);
  const checks = [
    ['part_image', "INSERT INTO part_image(part_id,availability_status) VALUES(53801,'unknown')"],
    ['part_image', "INSERT INTO part_image(part_id,availability_status) VALUES(53801,'available')"],
    ['part_image', "INSERT INTO part_image(part_id,image_ref,image_kind,availability_status) VALUES(53801,'x','kind','unavailable')"],
    ['part_image', "INSERT INTO part_image(part_id,image_ref,image_kind,availability_status) VALUES(53801,'x','kind','available')"],
    ['part_fitment', "INSERT INTO part_fitment(part_occurrence_id,applicability_state) VALUES(53811,'maybe')"],
    ['part_fitment', "INSERT INTO part_fitment(part_occurrence_id,applicability_state) VALUES(53811,'unavailable')"],
    ['part_fitment', "INSERT INTO part_fitment(part_occurrence_id,applicability_state) VALUES(53811,'applicable')"],
    ['part_fitment', "INSERT INTO part_fitment(part_occurrence_id,applicability_state,except_flag) VALUES(53811,'excluded','maybe')"],
    ['part_fitment', "INSERT INTO part_fitment(part_occurrence_id,applicability_state,except_flag) VALUES(53811,'excluded','0')"],
    ['part_supersession', "INSERT INTO part_supersession(superseded_part_id,superseding_part_id,relationship_type) VALUES(53801,53802,'interchange')"],
    ['part_supersession', "INSERT INTO part_supersession(superseded_part_id,superseding_part_id,relationship_type) VALUES(53801,53801,'supersedes')"],
    ['stock_item', "INSERT INTO stock_item(part_id,quantity,available) VALUES(53801,-1,1)"],
    ['stock_item', "INSERT INTO stock_item(part_id,quantity,available) VALUES(53801,0,2)"],
    ['stock_item', "INSERT INTO stock_item(part_id,condition_code) VALUES(53801,'Z')"],
    ['stock_item', "INSERT INTO stock_item(part_id,confidence) VALUES(53801,1.2)"],
    ['vehicle', "INSERT INTO vehicle(vin_raw,vin_normalized,model_year) VALUES('short','SHORT',2000)"],
    ['part_vehicle_location', "INSERT INTO part_vehicle_location(part_id,vehicle_range_id,location_path) VALUES(53801,1,'')"],
  ];
  for (const [table, query] of checks) {
    rejected(db, query, /constraint failed/i);
    assert.ok(table);
  }
});

test('nullable uniqueness and source boundaries remain explicit, not invented validation', (t) => {
  const db = withDatabase(t);
  db.exec("INSERT INTO part(part_number_raw,part_number_normalized,description) VALUES(NULL,NULL,'unknown fastener one'),(NULL,NULL,'unknown fastener one')");
  db.exec("INSERT INTO part_image(part_id,image_ref,image_kind) VALUES(53801,NULL,'reference'),(53801,NULL,'reference')");
  db.exec("INSERT INTO part_occurrence(part_id,source,source_ref,context_type,context_ref) VALUES(53801,'fixture','nullable-a','epc','a'),(53801,'fixture','nullable-b','epc','b')");
  db.exec("INSERT INTO stock_item(part_number,quantity,source_ref) VALUES('unmapped legacy',1,'same'),('unmapped legacy',1,'same')");
});

test('deleting catalogue identity preserves stock and unmapped hotspot evidence', (t) => {
  const db = withDatabase(t);
  assert.equal(db.prepare('SELECT count(*) AS n FROM stock_item WHERE part_id=53801').get().n > 0, true);
  assert.equal(db.prepare('SELECT count(*) AS n FROM diagram_hotspot WHERE part_id=53801').get().n > 0, true);
  db.exec('DELETE FROM part WHERE id=53801');
  assert.equal(db.prepare('SELECT count(*) AS n FROM stock_item WHERE part_id IS NULL AND part_number IS NOT NULL').get().n > 0, true);
  assert.equal(db.prepare('SELECT count(*) AS n FROM diagram_hotspot WHERE part_id IS NULL AND diagram_id IS NOT NULL').get().n > 0, true);
});

test('range and evidence deletion cascades do not delete catalogue parts', (t) => {
  const db = withDatabase(t);
  assert.ok(db.prepare('SELECT 1 FROM part_model_range WHERE part_id=53801 AND model_range_id=53831').get());
  assert.ok(db.prepare('SELECT 1 FROM part_vin_range WHERE part_id=53801 AND vin_range_id=53841').get());
  assert.ok(db.prepare('SELECT 1 FROM part_occurrence WHERE part_id=53801').get());
  assert.ok(db.prepare('SELECT 1 FROM part_image WHERE part_id=53801').get());
  assert.ok(db.prepare('SELECT 1 FROM diagram_hotspot WHERE part_id=53801').get());
  assert.ok(db.prepare('SELECT 1 FROM part_vehicle_location WHERE part_id=53801').get());
  db.exec('DELETE FROM model_range WHERE id=53831');
  db.exec('DELETE FROM vin_range WHERE id=53841');
  db.exec('DELETE FROM part_occurrence WHERE id=53811');
  db.exec('DELETE FROM part_image WHERE id=53821');
  db.exec('DELETE FROM diagram WHERE id=53861');
  db.exec('DELETE FROM part_vehicle_location WHERE id=53881');
  assert.ok(db.prepare('SELECT 1 FROM part WHERE id=53801').get());
});

test('each existing step fixture executes with explicit prerequisites', (t) => {
  for (let index = 0; index < migrations.length; index += 1) {
    const db = new DatabaseSync(':memory:');
    t.after(() => db.close());
    db.exec('PRAGMA foreign_keys=ON');
    migrate(db, migrations.slice(0, index + 1));
    for (const fixture of sql.fixturesByStep[index + 1] || []) db.exec(fixture);
    assert.deepEqual(db.prepare('PRAGMA foreign_key_check').all(), [], `step ${index + 1}`);
    assert.equal(db.prepare('PRAGMA integrity_check').get().integrity_check, 'ok', `step ${index + 1}`);
  }
});

test('MVP API executes real queries after all migrations', async (t) => {
  const db = withDatabase(t);
  const response = await handleViepsPart(new Request('https://example.test/api/vieps/part?q=MJB7703AA'), { DB: d1(db) });
  assert.equal(response.status, 200);
  const payload = await response.json();
  assert.equal(payload.part.part_number_normalized, 'MJB7703AA');
  assert.ok(Array.isArray(payload.parts_tree));
  assert.ok(Array.isArray(payload.images));
  assert.ok(Array.isArray(payload.fitment));
  assert.ok(Array.isArray(payload.diagrams));
  assert.ok(Array.isArray(payload.stock));
});