import test from 'node:test';
import assert from 'node:assert/strict';
import { database, d1, migrate, migrations } from './helpers/model-db.mjs';
import { DatabaseSync } from 'node:sqlite';
import { readPartApplicability } from '../src/applicability.js';

function open(t) { const db=database(); t.after(()=>db.close()); return db; }
function rejects(db,statement,pattern=/constraint|incompatible|unconditional|conditional/i) {
  db.exec('SAVEPOINT probe');
  try { assert.throws(()=>db.exec(statement),pattern); }
  finally { db.exec('ROLLBACK TO probe; RELEASE probe'); }
}

test('PART reverse lookup preserves joint model and serial scope across sub-models', async t=>{
  const db=open(t);
  const result=await readPartApplicability(d1(db),65901);
  assert.deepEqual(result.assertions.map(a=>[
    a.model_context.source_model_id,
    a.model_context.serial_range.upper_value,
    a.alternatives[0].serial_range.lower_value,
    a.alternatives[0].serial_range.upper_value,
  ]),[['3187','042775','023700',null],['3178','A30644',null,'A00115']]);
  assert.equal(result.assertions[0].model_context.serial_range.lower_state,'unknown');
  assert.equal(result.assertions[0].alternatives[0].serial_range.upper_state,'unbounded');
  assert.equal(result.assertions[0].alternatives[0].effective_serial_range.upper_value,'042775');
  assert.equal(result.assertions[0].alternatives[0].effective_serial_range.vin_range_id,65901);
  const later=await readPartApplicability(d1(db),65902);
  assert.deepEqual(later.assertions.map(a=>a.model_context.source_model_id),['3178','3173']);
  assert.equal(later.assertions[1].model_context.serial_range.upper_state,'unknown');
  assert.equal(result.evaluation,'unavailable');
});

test('headlamp paths share one occurrence but retain separate conjunctions and evidence', async t=>{
  const db=open(t);
  const result=await readPartApplicability(d1(db),65903);
  assert.equal(result.assertions.length,1);
  const sets=result.assertions[0].alternatives;
  assert.equal(sets.length,2);
  assert.deepEqual(sets.map(g=>g.attributes.map(v=>[v.dimension,v.operator,v.value_code])),[
    [['steering','equals','RHD'],['installation_side','equals','LH'],['market','not_equals','Japan'],['headlamp_levelling','equals','present']],
    [['steering','equals','RHD'],['installation_side','equals','LH'],['market','not_equals','Japan'],['headlamp_powerwash','not_equals','present']],
  ]);
  assert.deepEqual(sets.map(g=>g.evidence[0].record_locator),['110080001','1100310001']);
  assert.equal(result.assertions[0].snapshot_coverage,'incomplete');
});

test('empty evidence and even verified stored assertions never pretend to evaluate fitment', async t=>{
  const db=open(t);
  const empty=await readPartApplicability(d1(db),53801);
  assert.deepEqual(empty.assertions,[]);
  assert.equal(empty.evaluation,'unavailable');
  db.exec("UPDATE occurrence_applicability SET verification='verified',coverage='complete'");
  const result=await readPartApplicability(d1(db),65901);
  assert.equal(result.reason,'evidence_only_no_evaluator');
  assert.equal(result.catalogue_coverage,'not_established');
  await assert.rejects(()=>readPartApplicability(d1(db),'65901'),TypeError);
});

test('replay identities reject duplicates while multiple evidence paths remain representable', async t=>{
  const db=open(t);
  rejects(db,"INSERT INTO applicability_bundle(source_namespace,bundle_key) VALUES('fixture','3187/8069/1')");
  rejects(db,"INSERT INTO applicability_snapshot(bundle_id,revision,parser_version,mapping_version) VALUES(65904,1,'p','m')");
  rejects(db,"INSERT INTO occurrence_applicability(snapshot_id,source_key,part_occurrence_id,model_context_id) VALUES(65904,'145251',65905,65901)");
  db.exec('INSERT INTO applicability_set_evidence VALUES(65905,65905)');
  const result=await readPartApplicability(d1(db),65903);
  assert.equal(result.assertions[0].alternatives[0].evidence.length,2);
  assert.equal(db.prepare('SELECT count(*) n FROM part WHERE id=65903').get().n,1);
});

test('failed replacement rolls back; successful snapshot switch retires stale assertions and retains history', async t=>{
  const db=open(t);
  const before=await readPartApplicability(d1(db),65902);
  db.exec('BEGIN');
  assert.throws(()=>{
    db.exec("UPDATE applicability_snapshot SET state='superseded' WHERE id=65902");
    db.exec("INSERT INTO applicability_snapshot(id,bundle_id,revision,parser_version,mapping_version,state) VALUES(66001,65902,2,'p2','m2','active')");
    db.exec("INSERT INTO occurrence_applicability(snapshot_id,source_key,part_occurrence_id,model_context_id) VALUES(66001,'bad',-1,65902)");
  },/FOREIGN KEY/);
  db.exec('ROLLBACK');
  assert.deepEqual(await readPartApplicability(d1(db),65902),before);
  db.exec(`BEGIN;
    INSERT INTO applicability_snapshot(id,bundle_id,revision,parser_version,mapping_version) VALUES(66001,65902,2,'p2','m2');
    INSERT INTO occurrence_applicability(id,snapshot_id,source_key,part_occurrence_id,model_context_id) VALUES(66001,66001,'151441',65902,65902);
    INSERT INTO applicability_condition_set(assertion_id,set_key,serial_range_id) VALUES(66001,'through-A00115',65905);
    UPDATE applicability_snapshot SET state='superseded' WHERE id=65902;
    UPDATE applicability_snapshot SET state='active' WHERE id=66001;
    COMMIT;`);
  assert.deepEqual((await readPartApplicability(d1(db),65902)).assertions.map(a=>a.model_context.source_model_id),['3173']);
  assert.equal(db.prepare('SELECT count(*) n FROM occurrence_applicability WHERE snapshot_id=65902').get().n,2);
  assert.equal((await readPartApplicability(d1(db),65901)).assertions[1].revision,2);
  rejects(db,"UPDATE applicability_snapshot SET state='active' WHERE id=65902");
  rejects(db,'DELETE FROM applicability_snapshot WHERE id=65902');
});

test('serial endpoint states, inclusivity and domain ownership reject ambiguous mutations', t=>{
  const db=open(t);
  for(const q of [
    "UPDATE applicability_serial_range SET lower_state='known' WHERE id=65901",
    "UPDATE applicability_serial_range SET upper_inclusive=NULL WHERE id=65901",
    "UPDATE applicability_serial_range SET lower_value='000000' WHERE id=65901",
    'UPDATE applicability_condition_set SET serial_range_id=65905 WHERE id=65901',
    'UPDATE applicability_condition_set SET effective_serial_range_id=65905 WHERE id=65901',
    'UPDATE applicability_condition_set SET assertion_id=65902 WHERE id=65901',
    'UPDATE applicability_model_context SET serial_range_id=65902 WHERE id=65901',
    'UPDATE occurrence_applicability SET model_context_id=65902 WHERE id=65901',
    "UPDATE applicability_serial_range SET serial_domain='other' WHERE id IN (65901)",
    "UPDATE applicability_serial_range SET comparator='other' WHERE id IN (65904)",
  ]) rejects(db,q);
  assert.equal(db.prepare('SELECT vin_range_id FROM applicability_serial_range WHERE id=65907').get().vin_range_id,65901);
});

test('unconditional sets cannot hide predicates and values cannot cross typed dimensions', t=>{
  const db=open(t);
  rejects(db,"UPDATE applicability_condition_set SET coverage='complete',unconditional=1 WHERE id=65901");
  rejects(db,"UPDATE applicability_condition_set SET coverage='complete',unconditional=1 WHERE id=65905");
  db.exec("INSERT INTO applicability_condition_set(id,assertion_id,set_key,coverage,unconditional) VALUES(66001,65905,'explicit','complete',1)");
  rejects(db,"INSERT INTO applicability_attribute_condition(set_id,dimension_id,operator,value_code) VALUES(66001,65901,'equals','RHD')");
  rejects(db,'UPDATE applicability_attribute_condition SET set_id=66001 WHERE id=65901');
  rejects(db,"UPDATE applicability_attribute_condition SET value_code='Japan' WHERE id=65901");
  rejects(db,"UPDATE applicability_attribute_condition SET operator='roughly' WHERE id=65901");
});

test('market conditions can live below a shared model without a separate region-specific model', async t=>{
  const db=open(t);
  const result=await readPartApplicability(d1(db),65904);
  assert.equal(result.assertions[0].model_context.source_model_id,'3178');
  assert.equal(result.assertions[0].model_context.region_ref,null);
  assert.equal(result.assertions[0].alternatives[0].attributes[0].value_code,'Canada');
  assert.equal(result.assertions[0].alternatives[0].attributes[1].value_code,'LH');
  assert.match(result.assertions[0].alternatives[0].evidence[0].raw_record,/\(\$\)/);
  // A fixture of one observed path, not exhaustive or verified source coverage.
});

test('additive upgrade preserves every pre-existing catalogue, fitment and stock row', t=>{
  const db=new DatabaseSync(':memory:'); t.after(()=>db.close()); db.exec('PRAGMA foreign_keys=ON');
  migrate(db,migrations.slice(0,13));
  const tables=db.prepare("SELECT name FROM sqlite_schema WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name").all();
  const before=new Map(tables.map(({name})=>[name,db.prepare(`SELECT * FROM "${name}" ORDER BY rowid`).all()]));
  migrate(db,migrations.slice(13));
  for(const [name,rows] of before) assert.deepEqual(db.prepare(`SELECT * FROM "${name}" ORDER BY rowid`).all(),rows,name);
  assert.equal(db.prepare('SELECT count(*) n FROM occurrence_applicability').get().n,0);
  assert.deepEqual(db.prepare('PRAGMA foreign_key_check').all(),[]);
});

test('evidence read executes one statement and principal reverse lookups are indexed', async t=>{
  const db=open(t); let count=0; const adapter=d1(db);
  await readPartApplicability({prepare(q){count++;return adapter.prepare(q);}},65901);
  assert.equal(count,1);
  for(const [table,column,value] of [['occurrence_applicability','model_context_id',65902],['occurrence_applicability','part_occurrence_id',65901],['applicability_attribute_condition','dimension_id',65901]]) {
    const plan=db.prepare(`EXPLAIN QUERY PLAN SELECT * FROM ${table} WHERE ${column}=?`).all(value);
    assert.match(plan.map(p=>p.detail).join(' '),/SEARCH .* USING (?:COVERING )?INDEX/);
  }
});
