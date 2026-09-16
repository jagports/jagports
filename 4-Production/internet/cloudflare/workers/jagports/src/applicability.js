// Structured evidence read contract. This is not a fitment evaluator: SQL
// presence/defaults cannot establish verified applicability or full coverage.
// Works with D1's prepare/bind/all interface and the local SQLite test adapter.
export async function readPartApplicability(db, partId) {
  if (!Number.isSafeInteger(partId) || partId <= 0) throw new TypeError('partId must be a positive safe integer');
  // One SQL statement observes one database snapshot, including while an import
  // atomically switches active revisions. Static identifiers only; input is bound.
  const json = (alias, fields) => fields.split(' ').flatMap(f => [`'${f}'`, `${alias}.${f}`]).join(',');
  const rangeFields = 'id serial_domain comparator lower_state lower_value lower_inclusive upper_state upper_value upper_inclusive verification vin_range_id';
  const statement = `WITH selected AS (
    SELECT a.*, s.bundle_id,s.revision,s.parser_version,s.mapping_version,
      s.coverage AS snapshot_coverage,b.source_namespace,b.bundle_key,
      o.category_ref,o.item_number,o.context_ref
    FROM occurrence_applicability a JOIN part_occurrence o ON o.id=a.part_occurrence_id
    JOIN applicability_snapshot s ON s.id=a.snapshot_id
    JOIN applicability_bundle b ON b.id=s.bundle_id
    WHERE o.part_id=? AND s.state='active'
  ), selected_sets AS (
    SELECT g.* FROM applicability_condition_set g JOIN selected a ON a.id=g.assertion_id
  ), selected_contexts AS (
    SELECT DISTINCT c.* FROM applicability_model_context c JOIN selected a ON a.model_context_id=c.id
  ), selected_set_evidence AS (
    SELECT se.* FROM applicability_set_evidence se JOIN selected_sets g ON g.id=se.set_id
  ), selected_context_evidence AS (
    SELECT ce.* FROM applicability_context_evidence ce JOIN selected_contexts c ON c.id=ce.context_id
  )
  SELECT 'assertions' AS kind,json_object(${json('a', 'id snapshot_id source_key part_occurrence_id model_context_id effect verification coverage bundle_id revision parser_version mapping_version snapshot_coverage source_namespace bundle_key category_ref item_number context_ref')}) AS payload FROM selected a
  UNION ALL SELECT 'contexts',json_object(${json('c','id source_namespace source_model_id context_version source_parent_id region_ref model_range_id serial_range_id verification')}) FROM selected_contexts c
  UNION ALL SELECT 'sets',json_object(${json('g','id assertion_id set_key coverage unconditional serial_range_id effective_serial_range_id')}) FROM selected_sets g
  UNION ALL SELECT 'attributes',json_object(${json('v','id set_id dimension_id operator value_code')},'dimension',d.code,'dimension_verification',d.verification)
    FROM applicability_attribute_condition v JOIN selected_sets g ON g.id=v.set_id JOIN applicability_dimension d ON d.id=v.dimension_id
  UNION ALL SELECT 'ranges',json_object(${json('r',rangeFields)}) FROM applicability_serial_range r
    WHERE r.id IN (SELECT serial_range_id FROM selected_contexts UNION SELECT serial_range_id FROM selected_sets UNION SELECT effective_serial_range_id FROM selected_sets)
  UNION ALL SELECT 'evidence',json_object(${json('e','id snapshot_id relative_path file_sha256 record_locator raw_record')}) FROM applicability_evidence e
    WHERE e.id IN (SELECT evidence_id FROM selected_set_evidence UNION SELECT evidence_id FROM selected_context_evidence)
  UNION ALL SELECT 'setEvidence',json_object(${json('se','set_id evidence_id')}) FROM selected_set_evidence se
  UNION ALL SELECT 'contextEvidence',json_object(${json('ce','context_id evidence_id')}) FROM selected_context_evidence ce`;
  const rows = (await db.prepare(statement).bind(partId).all()).results;
  const records = { assertions: [], contexts: [], sets: [], attributes: [], ranges: [], evidence: [], setEvidence: [], contextEvidence: [] };
  for (const row of rows) records[row.kind].push(JSON.parse(row.payload));
  for (const values of Object.values(records)) values.sort((a,b) => (a.id ?? a.evidence_id) - (b.id ?? b.evidence_id));
  const { assertions,contexts,sets,attributes,ranges,evidence,setEvidence,contextEvidence } = records;
  const rangeMap = new Map(ranges.map(r => [r.id, r]));
  const evidenceMap = new Map(evidence.map(e => [e.id, e]));
  const contextMap = new Map(contexts.map(c => [c.id, {
    ...c, serial_range: rangeMap.get(c.serial_range_id) ?? null,
    evidence: contextEvidence.filter(e => e.context_id === c.id).map(e => evidenceMap.get(e.evidence_id)),
  }]));
  return {
    part_id: partId,
    evaluation: 'unavailable',
    reason: 'evidence_only_no_evaluator',
    catalogue_coverage: 'not_established',
    assertions: assertions.map(a => ({
      ...a, model_context: contextMap.get(a.model_context_id),
      alternatives: sets.filter(g => g.assertion_id === a.id).map(g => ({
        ...g, serial_range: rangeMap.get(g.serial_range_id) ?? null,
        effective_serial_range: rangeMap.get(g.effective_serial_range_id) ?? null,
        attributes: attributes.filter(v => v.set_id === g.id),
        evidence: setEvidence.filter(e => e.set_id === g.id).map(e => evidenceMap.get(e.evidence_id)),
      })),
    })),
  };
}
