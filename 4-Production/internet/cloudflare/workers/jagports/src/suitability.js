// #641 fixture-backed normalized Suitability read contract.
// This module intentionally does not interpret imported JEPC assertions.
// Explicitly opt in with ENABLE_SUITABILITY_FIXTURES=1 on an isolated demo/test Worker.
const FIXTURE_SOURCE = 'fixture:pre-jepc-suitability:v1';
const json = (value, status = 200) => new Response(JSON.stringify(value), {
  status, headers: { 'content-type': 'application/json; charset=utf-8' },
});
const invalid = (message, code) => json({ error: message, error_code: code }, 400);
const key = (dimension, value) => dimension + ':' + value;
const add = (map, name, value) => {
  if (!map.has(name)) map.set(name, []);
  map.get(name).push(value);
};

function parseFilters(url) {
  const selected = new Map();
  for (const raw of url.searchParams.getAll('facet')) {
    if (!/^[a-z][a-z0-9_]*:[A-Za-z][A-Za-z0-9_]*$/.test(raw)) return null;
    const [dimension, value] = raw.split(':');
    if (!selected.has(dimension)) selected.set(dimension, new Set());
    selected.get(dimension).add(value);
  }
  return selected;
}

function predicatesMatch(conditions, memberships, selected, ignoreDimension = null) {
  // Evaluate every selected category against ONE complete occurrence alternative.
  // Scalar values within one dimension are alternatives; separate dimensions
  // and all explicitly selected members of a set-valued dimension are AND.
  for (const [dimension, values] of selected) {
    if (dimension === ignoreDimension) continue;
    const scalar = conditions.filter((row) => row.dimension === dimension);
    const members = memberships.filter((row) => row.dimension === dimension);
    if (members.length || dimension === 'seat_equipment') {
      if (![...values].every((value) =>
        members.some((row) => row.value_code === value && row.operator === 'contains')
        && !members.some((row) => row.value_code === value && row.operator === 'not_contains'))) return false;
    } else if (!scalar.length || !scalar.some((row) =>
      values.has(row.value_code) && row.operator === 'equals'
      && !scalar.some((negative) => negative.operator === 'not_equals'
        && negative.value_code === row.value_code))) return false;
  }
  return true;
}

function positiveValues(conditions, memberships, published) {
  const values = new Set();
  for (const row of [...conditions, ...memberships]) {
    if (row.operator !== 'equals' && row.operator !== 'contains') continue;
    if (published.has(key(row.dimension, row.value_code))) {
      values.add(key(row.dimension, row.value_code));
    }
  }
  return values;
}

export async function handleViepsSuitability(request, env) {
  if (request.method !== 'GET') return json({ error: 'method not allowed' }, 405);
  // A public endpoint must not publish fixture evidence on an ordinary Worker.
  if (env.ENABLE_SUITABILITY_FIXTURES !== '1') {
    return json({ state: 'unavailable', reason: 'normalized_suitability_not_published',
      fixture_mode: false, categories: [], available_options: [], matches: [] }, 503);
  }
  if (!env.DB) return json({ error: 'database unavailable', error_code: 'database_unavailable' }, 503);
  const url = new URL(request.url);
  const q = (url.searchParams.get('q') || '').trim();
  if (q.length > 160) return invalid('search query too long', 'query_invalid');
  const only = url.searchParams.get('stock_only') || '0';
  if (!['0', '1'].includes(only)) return invalid('invalid stock-only filter', 'stock_filter_invalid');
  const selected = parseFilters(url);
  if (!selected || [...selected.values()].reduce((n, values) => n + values.size, 0) > 32) {
    return invalid('invalid normalized facet selection', 'facet_invalid');
  }
  const db = env.DB;
  // Use ONLY the latest fixture mapping revisions, and never merge source
  // descriptions by equal visible labels. Unmapped/proposed source records
  // do not publish an additional normalized vocabulary entry.
  const dimensions = (await db.prepare(
    `SELECT DISTINCT d.id, d.code, d.cardinality, v.value_code
       FROM applicability_dimension d
       JOIN applicability_dimension_value v ON v.dimension_id = d.id
       JOIN applicability_description_mapping_current m
         ON m.dimension_id = d.id AND m.value_code = v.value_code
       JOIN applicability_source_description sd ON sd.id = m.source_description_id
       WHERE sd.source_namespace = ? AND sd.provenance_kind = 'fixture'
         AND m.status = 'fixture'
       ORDER BY d.code, v.value_code`
  ).bind(FIXTURE_SOURCE).all()).results || [];
  const published = new Set(dimensions.map((row) => key(row.code, row.value_code)));
  for (const [dimension, values] of selected) {
    if (![...values].every((value) => published.has(key(dimension, value)))) {
      return invalid('unknown or unpublished facet', 'facet_unknown');
    }
  }
  const byDimension = new Map();
  for (const row of dimensions) {
    if (!byDimension.has(row.code)) byDimension.set(row.code, {
      code: row.code, cardinality: row.cardinality, values: [],
    });
    byDimension.get(row.code).values.push({ code: row.value_code, id: key(row.code, row.value_code) });
  }

  const assertions = (await db.prepare(
    `SELECT a.id, a.part_occurrence_id, a.model_context_id, a.effect,
          a.verification, a.coverage, s.coverage AS snapshot_coverage,
          p.id AS part_id, p.part_number_normalized AS part_number,
          p.description AS part_description, o.source_ref AS occurrence_key,
          c.source_model_id AS model_context, c.verification AS context_verification
       FROM occurrence_applicability a
       JOIN applicability_snapshot s ON s.id = a.snapshot_id AND s.state = 'active'
       JOIN applicability_bundle b ON b.id = s.bundle_id AND b.source_namespace = ?
       JOIN part_occurrence o ON o.id = a.part_occurrence_id AND o.source = ?
       JOIN part p ON p.id = o.part_id AND p.verification_status = 'fixture'
       JOIN applicability_model_context c ON c.id = a.model_context_id
         AND c.source_namespace = ?
       WHERE (? = '' OR instr(upper(coalesce(p.part_number_normalized, '')), upper(?)) > 0
         OR instr(upper(coalesce(p.description, '')), upper(?)) > 0)
         AND (? = '0' OR EXISTS (SELECT 1 FROM stock_item stock
           WHERE stock.part_id = p.id AND stock.available = 1 AND stock.quantity > 0))
       ORDER BY p.id, o.id, a.id`
  ).bind(FIXTURE_SOURCE, FIXTURE_SOURCE, FIXTURE_SOURCE, q, q, q, only).all()).results || [];

  if (!assertions.length) {
    return json({ state: 'no_match', fixture_mode: true, source_namespace: FIXTURE_SOURCE,
      query: q, selected: [...selected].flatMap(([d, values]) => [...values].map((v) => key(d, v))),
      categories: [...byDimension.values()], available_options: [], matches: [],
      excluded_occurrences: [], unavailable_occurrences: [] });
  }

  // All predicates are keyed by condition set and never collected by PART.
  const ids = assertions.map((row) => row.id);
  const placeholders = ids.map(() => '?').join(',');
  const sets = (await db.prepare(
    `SELECT id, assertion_id, coverage, unconditional, serial_range_id, effective_serial_range_id
       FROM applicability_condition_set WHERE assertion_id IN (${placeholders})`
  ).bind(...ids).all()).results || [];
  const setIds = sets.map((row) => row.id);
  const conditionsBySet = new Map();
  const membersBySet = new Map();
  if (setIds.length) {
    const binds = setIds.map(() => '?').join(',');
    const conditions = (await db.prepare(
      `SELECT ac.set_id, d.code AS dimension, ac.operator, ac.value_code
         FROM applicability_attribute_condition ac
         JOIN applicability_dimension d ON d.id = ac.dimension_id
         WHERE ac.set_id IN (${binds})`
    ).bind(...setIds).all()).results || [];
    const memberships = (await db.prepare(
      `SELECT mc.set_id, d.code AS dimension, mc.operator, mc.value_code
         FROM applicability_set_membership_condition mc
         JOIN applicability_dimension d ON d.id = mc.dimension_id
         WHERE mc.set_id IN (${binds})`
    ).bind(...setIds).all()).results || [];
    for (const row of conditions) add(conditionsBySet, row.set_id, row);
    for (const row of memberships) add(membersBySet, row.set_id, row);
  }
  const setsByAssertion = new Map();
  for (const set of sets) add(setsByAssertion, set.assertion_id, set);
  const options = new Set();
  const matches = new Map();
  const excluded = [];
  const unavailable = [];

  for (const row of assertions) {
    const alternatives = setsByAssertion.get(row.id) || [];
    // Incomplete source coverage cannot establish a negative result.
    const complete = row.verification === 'verified' && row.coverage === 'complete'
      && row.context_verification === 'verified' && alternatives.length > 0;
    if (!complete || alternatives.some((set) => set.coverage !== 'complete'
      || set.serial_range_id != null || set.effective_serial_range_id != null)) {
      unavailable.push({ part_id: row.part_id, occurrence_id: row.part_occurrence_id,
        reason: 'incomplete_or_unsupported_fixture_evidence' });
      continue;
    }
    for (const set of alternatives) {
      const attrs = conditionsBySet.get(set.id) || [];
      const members = membersBySet.get(set.id) || [];
      const values = positiveValues(attrs, members, published);
      // Empty unconditional alternatives do not yield selectable options.
      if (!predicatesMatch(attrs, members, selected)) continue;
      if (row.effect === 'exclude') {
        excluded.push({ part_id: row.part_id, occurrence_id: row.part_occurrence_id,
          model_context: row.model_context });
        continue;
      }
      const match = { part_id: row.part_id, part_number: row.part_number,
        description: row.part_description, occurrence_id: row.part_occurrence_id,
        occurrence_key: row.occurrence_key, model_context: row.model_context,
        condition_set_id: set.id, values: [...values].sort(),
        applicability_state: 'applicable', provenance: 'synthetic_fixture' };
      matches.set(row.part_occurrence_id + ':' + set.id, match);
      for (const value of values) options.add(value);
    }
  }
  const items = [...matches.values()];
  return json({
    state: items.length ? 'applicable' : unavailable.length ? 'unavailable'
      : excluded.length ? 'excluded' : 'no_match',
    fixture_mode: true, source_namespace: FIXTURE_SOURCE,
    query: q, selected: [...selected].flatMap(([d, values]) => [...values].map((v) => key(d, v))),
    categories: [...byDimension.values()], available_options: [...options].sort(),
    matches: items, excluded_occurrences: excluded,
    unavailable_occurrences: unavailable,
  });
}
