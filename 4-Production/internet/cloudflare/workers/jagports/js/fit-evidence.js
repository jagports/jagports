// Structured evidence read contract. This is not a fitment evaluator: SQL
// presence/defaults cannot establish verified applicability or full coverage.
// Works with D1's prepare/bind/all interface and the local SQLite test adapter.

const RECORD_KINDS = [
  'assertions',
  'contexts',
  'sets',
  'attributes',
  'ranges',
  'evidence',
  'setEvidence',
  'contextEvidence',
];

const ASSERTION_FIELDS = 'id snapshot_id source_key part_occurrence_id model_context_id effect verification coverage bundle_id revision parser_version mapping_version snapshot_coverage source_namespace bundle_key category_ref item_number context_ref';
const CONTEXT_FIELDS = 'id source_namespace source_model_id context_version source_parent_id region_ref model_range_id serial_range_id verification';
const SET_FIELDS = 'id assertion_id set_key coverage unconditional serial_range_id effective_serial_range_id';
const RANGE_FIELDS = 'id serial_domain comparator lower_state lower_value lower_inclusive upper_state upper_value upper_inclusive verification vin_range_id';
const EVIDENCE_FIELDS = 'id snapshot_id relative_path file_sha256 record_locator raw_record';

function jsonFields(alias, fields) {
  return fields
    .split(' ')
    .flatMap((field) => [`'${field}'`, `${alias}.${field}`])
    .join(',');
}

function buildApplicabilityStatement() {
  // One SQL statement observes one database snapshot, including while an import
  // atomically switches active revisions. Static identifiers only; input is bound.
  return `WITH selected AS (
    SELECT a.*, s.bundle_id, s.revision, s.parser_version, s.mapping_version,
      s.coverage AS snapshot_coverage, b.source_namespace, b.bundle_key,
      o.category_ref, o.item_number, o.context_ref
    FROM occurrence_applicability a
    JOIN part_occurrence o ON o.id = a.part_occurrence_id
    JOIN applicability_snapshot s ON s.id = a.snapshot_id
    JOIN applicability_bundle b ON b.id = s.bundle_id
    WHERE o.part_id = ? AND s.state = 'active'
  ), selected_sets AS (
    SELECT g.*
    FROM applicability_condition_set g
    JOIN selected a ON a.id = g.assertion_id
  ), selected_contexts AS (
    SELECT DISTINCT c.*
    FROM applicability_model_context c
    JOIN selected a ON a.model_context_id = c.id
  ), selected_set_evidence AS (
    SELECT se.*
    FROM applicability_set_evidence se
    JOIN selected_sets g ON g.id = se.set_id
  ), selected_context_evidence AS (
    SELECT ce.*
    FROM applicability_context_evidence ce
    JOIN selected_contexts c ON c.id = ce.context_id
  )
  SELECT 'assertions' AS kind,
    json_object(${jsonFields('a', ASSERTION_FIELDS)}) AS payload
    FROM selected a
  UNION ALL
  SELECT 'contexts',
    json_object(${jsonFields('c', CONTEXT_FIELDS)})
    FROM selected_contexts c
  UNION ALL
  SELECT 'sets',
    json_object(${jsonFields('g', SET_FIELDS)})
    FROM selected_sets g
  UNION ALL
  SELECT 'attributes',
    json_object(${jsonFields('v', 'id set_id dimension_id operator value_code')},
      'dimension', d.code,
      'dimension_verification', d.verification)
    FROM applicability_attribute_condition v
    JOIN selected_sets g ON g.id = v.set_id
    JOIN applicability_dimension d ON d.id = v.dimension_id
  UNION ALL
  SELECT 'ranges',
    json_object(${jsonFields('r', RANGE_FIELDS)})
    FROM applicability_serial_range r
    WHERE r.id IN (
      SELECT serial_range_id FROM selected_contexts
      UNION SELECT serial_range_id FROM selected_sets
      UNION SELECT effective_serial_range_id FROM selected_sets
    )
  UNION ALL
  SELECT 'evidence',
    json_object(${jsonFields('e', EVIDENCE_FIELDS)})
    FROM applicability_evidence e
    WHERE e.id IN (
      SELECT evidence_id FROM selected_set_evidence
      UNION SELECT evidence_id FROM selected_context_evidence
    )
  UNION ALL
  SELECT 'setEvidence',
    json_object(${jsonFields('se', 'set_id evidence_id')})
    FROM selected_set_evidence se
  UNION ALL
  SELECT 'contextEvidence',
    json_object(${jsonFields('ce', 'context_id evidence_id')})
    FROM selected_context_evidence ce`;
}

const APPLICABILITY_STATEMENT = buildApplicabilityStatement();

function emptyRecords() {
  return Object.fromEntries(RECORD_KINDS.map((kind) => [kind, []]));
}

function parseRecords(rows) {
  const records = emptyRecords();
  for (const row of rows) records[row.kind].push(JSON.parse(row.payload));
  for (const values of Object.values(records)) {
    values.sort((a, b) => (a.id ?? a.evidence_id) - (b.id ?? b.evidence_id));
  }
  return records;
}

function mapById(records) {
  return new Map(records.map((record) => [record.id, record]));
}

function groupBy(records, key) {
  const groups = new Map();
  for (const record of records) {
    const value = record[key];
    if (!groups.has(value)) groups.set(value, []);
    groups.get(value).push(record);
  }
  return groups;
}

function hydrateContexts(records, rangeMap, evidenceMap) {
  const evidenceIdsByContext = groupBy(records.contextEvidence, 'context_id');
  return new Map(records.contexts.map((context) => [context.id, {
    ...context,
    serial_range: rangeMap.get(context.serial_range_id) ?? null,
    evidence: (evidenceIdsByContext.get(context.id) ?? [])
      .map(({ evidence_id }) => evidenceMap.get(evidence_id)),
  }]));
}

function hydrateAlternatives(records, assertionId, rangeMap, evidenceMap) {
  const setsByAssertion = groupBy(records.sets, 'assertion_id');
  const attributesBySet = groupBy(records.attributes, 'set_id');
  const evidenceIdsBySet = groupBy(records.setEvidence, 'set_id');

  return (setsByAssertion.get(assertionId) ?? []).map((set) => ({
    ...set,
    serial_range: rangeMap.get(set.serial_range_id) ?? null,
    effective_serial_range: rangeMap.get(set.effective_serial_range_id) ?? null,
    attributes: attributesBySet.get(set.id) ?? [],
    evidence: (evidenceIdsBySet.get(set.id) ?? [])
      .map(({ evidence_id }) => evidenceMap.get(evidence_id)),
  }));
}

function hydrateAssertions(records) {
  const rangeMap = mapById(records.ranges);
  const evidenceMap = mapById(records.evidence);
  const contextMap = hydrateContexts(records, rangeMap, evidenceMap);

  return records.assertions.map((assertion) => ({
    ...assertion,
    model_context: contextMap.get(assertion.model_context_id),
    alternatives: hydrateAlternatives(records, assertion.id, rangeMap, evidenceMap),
  }));
}

export async function readPartApplicability(db, partId) {
  if (!Number.isSafeInteger(partId) || partId <= 0) {
    throw new TypeError('partId must be a positive safe integer');
  }

  const rows = (await db.prepare(APPLICABILITY_STATEMENT).bind(partId).all()).results;
  const records = parseRecords(rows);

  return {
    part_id: partId,
    evaluation: 'unavailable',
    reason: 'evidence_only_no_evaluator',
    catalogue_coverage: 'not_established',
    assertions: hydrateAssertions(records),
  };
}
