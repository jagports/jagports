// Fixture-only, source-qualified normalized suitability read contract (#641/#877).
// Never evaluate imported JEPC descriptions as predicates until #354/#355
// provide reviewed occurrence mapping and operator semantics.
const SOURCE = 'fixture:pre-jepc-suitability:v1';
const send = (data, status = 200) => new Response(JSON.stringify(data), {
  status, headers: { 'content-type': 'application/json; charset=utf-8' },
});
const invalid = (code) => send({ error_code: code }, 400);
const facetId = (dimension, value) => dimension + ':' + value;
const put = (map, key, value) => { if (!map.has(key)) map.set(key, []); map.get(key).push(value); };
const empty = (state, selected = [], categories = [], query = '', reason = null, fixtureMode = true) => ({
  state, ...(reason ? { reason } : {}), fixture_mode: fixtureMode,
  source_namespace: fixtureMode ? SOURCE : null, query, selected, categories,
  available_options: [], matches: [], excluded_occurrences: [], unavailable_occurrences: [],
});

function selections(url) {
  const result = new Map();
  for (const raw of url.searchParams.getAll('facet')) {
    if (!/^[a-z][a-z0-9_]*:[A-Za-z][A-Za-z0-9_]*$/.test(raw)) return null;
    const [dimension, value] = raw.split(':');
    if (!result.has(dimension)) result.set(dimension, new Set());
    result.get(dimension).add(value);
  }
  return result;
}

// Selection is AND across dimensions, OR for alternatives within an
// ordinary dimension; two separately sourced seat features may coexist.
function match(tags, selected) {
  for (const [dimension, choices] of selected) {
    const present = new Set(tags.filter((t) => t.dimension === dimension).map((t) => t.value_code));
    if (dimension === 'seat_equipment') {
      if (![...choices].every((v) => present.has(v))) return false;
    } else if (![...choices].some((v) => present.has(v))) return false;
  }
  return true;
}
function stillPossible(tags, selected) {
  for (const [dimension, choices] of selected) {
    const present = new Set(tags.filter((t) => t.dimension === dimension).map((t) => t.value_code));
    if (present.size && dimension !== 'seat_equipment'
      && ![...choices].some((v) => present.has(v))) return false;
  }
  return true;
}

export async function handleViepsSuitability(request, env) {
  if (request.method !== 'GET') return send({ error_code: 'method_not_allowed' }, 405);
  if (env.ENABLE_SUITABILITY_FIXTURES !== '1') {
    return send(empty('unavailable', [], [], '', 'normalized_suitability_not_published', false), 503);
  }
  if (!env.DB) return send({ error_code: 'database_unavailable' }, 503);
  const url = new URL(request.url);
  const q = (url.searchParams.get('q') || '').trim();
  if (q.length > 160) return invalid('query_invalid');
  const stockOnly = url.searchParams.get('stock_only') || '0';
  if (!['0', '1'].includes(stockOnly)) return invalid('stock_filter_invalid');
  const language = url.searchParams.get('ui_language') || 'en';
  if (!['en', 'fi'].includes(language)) return invalid('language_invalid');
  const selected = selections(url);
  if (!selected || [...selected.values()].reduce((sum, v) => sum + v.size, 0) > 32) {
    return invalid('facet_invalid');
  }
  const selectedIds = [...selected].flatMap(([d, v]) => [...v].map((x) => facetId(d, x)));
  const db = env.DB;

  // Publish only current mappings with complete source and requested-domain
  // language metadata. Same-looking source records retain distinct identities.
  const mappings = (await db.prepare(
    `SELECT m.id AS mapping_revision_id, sd.id AS source_description_id,
       sd.source_namespace, sd.dataset_key, sd.source_key, sd.source_language,
       sd.source_group_code, sd.source_value_code, sd.source_model_ref, sd.evidence_id AS source_evidence_id,
       sd.source_category_ref, sd.source_item_ref, sd.source_tree_path,
       sd.record_locator, sd.original_text, d.code AS dimension,
       m.value_code, dl.name AS dimension_name, dl.description AS dimension_description,
       vl.name AS value_name, vl.description AS value_description
     FROM applicability_description_mapping_current m
     JOIN applicability_source_description sd ON sd.id = m.source_description_id
     JOIN applicability_dimension d ON d.id = m.dimension_id
        AND NOT EXISTS (SELECT 1 FROM applicability_dimension_retirement dr WHERE dr.dimension_id=d.id)
     JOIN applicability_dimension_value v ON v.dimension_id = d.id
       AND v.value_code = m.value_code
        AND NOT EXISTS (SELECT 1 FROM applicability_dimension_value_retirement vr WHERE vr.dimension_id=v.dimension_id AND vr.value_code=v.value_code)
     LEFT JOIN applicability_dimension_label dl ON dl.dimension_id = d.id
       AND dl.language = ?
     LEFT JOIN applicability_dimension_value_label vl ON vl.dimension_id = d.id
       AND vl.value_code = v.value_code AND vl.language = ?
     WHERE sd.source_namespace = ? AND sd.provenance_kind = 'fixture'
       AND m.status = 'fixture'
     ORDER BY d.code, m.value_code, sd.id`
  ).bind(language, language, SOURCE).all()).results || [];
  if (mappings.some((m) => !m.dimension_name || !m.dimension_description ||
      !m.value_name || !m.value_description || !m.source_language ||
      !m.record_locator || !m.dataset_key || m.source_evidence_id == null)) {
    return send(empty('unavailable', selectedIds, [], q, 'mapping_language_or_provenance_unavailable'), 503);
  }
  const categoriesByCode = new Map();
  const published = new Set();
  for (const m of mappings) {
    const id = facetId(m.dimension, m.value_code);
    published.add(id);
    if (!categoriesByCode.has(m.dimension)) categoriesByCode.set(m.dimension, {
      code: m.dimension, name: m.dimension_name,
      description: m.dimension_description, values: [],
    });
    const category = categoriesByCode.get(m.dimension);
    let value = category.values.find((v) => v.id === id);
    if (!value) {
      value = { id, code: m.value_code, name: m.value_name,
        description: m.value_description, source_descriptions: [] };
      category.values.push(value);
    }
    value.source_descriptions.push({
      id: m.source_description_id, mapping_revision_id: m.mapping_revision_id,
      source_namespace: m.source_namespace, dataset: m.dataset_key,
      source_key: m.source_key, language: m.source_language,
      locator: m.record_locator, group: m.source_group_code,
      value_code: m.source_value_code, model: m.source_model_ref,
      category: m.source_category_ref, item: m.source_item_ref,
      tree_path: m.source_tree_path, original_text: m.original_text,
      provenance: 'synthetic_fixture',
    });
  }
  for (const [d, values] of selected) {
    if (![...values].every((v) => published.has(facetId(d, v)))) return invalid('facet_unknown');
  }
  const categories = [...categoriesByCode.values()];
  const assertions = (await db.prepare(
    `SELECT a.id, a.part_occurrence_id, a.effect, a.verification, a.coverage,
       c.verification AS context_verification, c.source_model_id AS model_context,
       p.id AS part_id, p.part_number_normalized AS part_number,
       p.description AS description, o.source_ref AS occurrence_key
     FROM occurrence_applicability a
     JOIN applicability_snapshot snap ON snap.id = a.snapshot_id AND snap.state = 'active'
     JOIN applicability_bundle b ON b.id = snap.bundle_id AND b.source_namespace = ?
     JOIN part_occurrence o ON o.id = a.part_occurrence_id AND o.source = ?
     JOIN part p ON p.id = o.part_id AND p.verification_status = 'fixture'
     JOIN applicability_model_context c ON c.id = a.model_context_id
       AND c.source_namespace = ?
     WHERE (? = '' OR instr(upper(COALESCE(p.part_number_normalized, '')), upper(?)) > 0
       OR instr(upper(COALESCE(p.description, '')), upper(?)) > 0)
       AND (? = '0' OR EXISTS (SELECT 1 FROM stock_item st
         WHERE st.part_id = p.id AND st.available = 1 AND st.quantity > 0))
     ORDER BY p.id, o.id, a.id`
  ).bind(SOURCE, SOURCE, SOURCE, q, q, q, stockOnly).all()).results || [];
  if (!assertions.length) return send(empty('no_match', selectedIds, categories, q));
  const sets = (await db.prepare(
    `SELECT id, assertion_id, coverage, unconditional, serial_range_id, effective_serial_range_id
       FROM applicability_condition_set WHERE assertion_id IN (${assertions.map(() => '?').join(',')})`
  ).bind(...assertions.map((a) => a.id)).all()).results || [];
  const byAssertion = new Map(), tagsBySet = new Map();
  for (const set of sets) put(byAssertion, set.assertion_id, set);
  if (sets.length) {
    const tags = (await db.prepare(
      `SELECT se.set_id, se.mapping_revision_id, se.verification,
         m.id AS current_id, m.status, d.code AS dimension, m.value_code,
         sd.source_namespace, sd.provenance_kind, sd.source_model_ref,
         sd.evidence_id AS source_evidence_id, se.evidence_id AS linked_evidence_id,
         dl.name AS dimension_name, vl.name AS value_name
       FROM applicability_set_description_evidence se
       JOIN applicability_description_mapping_revision historical
         ON historical.id = se.mapping_revision_id
       JOIN applicability_source_description sd
         ON sd.id = historical.source_description_id
       LEFT JOIN applicability_description_mapping_current m
         ON m.id = se.mapping_revision_id
       LEFT JOIN applicability_dimension d ON d.id = m.dimension_id
         AND NOT EXISTS (SELECT 1 FROM applicability_dimension_retirement dr WHERE dr.dimension_id=d.id)
       LEFT JOIN applicability_dimension_label dl ON dl.dimension_id = d.id
         AND dl.language = ?
       LEFT JOIN applicability_dimension_value v ON v.dimension_id=d.id AND v.value_code=m.value_code
         AND NOT EXISTS (SELECT 1 FROM applicability_dimension_value_retirement vr WHERE vr.dimension_id=v.dimension_id AND vr.value_code=v.value_code)
       LEFT JOIN applicability_dimension_value_label vl
         ON vl.dimension_id=d.id AND vl.value_code=v.value_code
         AND vl.language = ?
       WHERE se.set_id IN (${sets.map(() => '?').join(',')})`
    ).bind(language, language, ...sets.map((s) => s.id)).all()).results || [];
    for (const tag of tags) put(tagsBySet, tag.set_id, tag);
  }
  const matches = [], excluded = [], unavailable = [], available = new Set();
  for (const a of assertions) {
    for (const set of byAssertion.get(a.id) || []) {
      const tags = tagsBySet.get(set.id) || [];
      const valid = tags.length > 0 && tags.every((t) =>
        t.current_id != null && t.status === 'fixture' && t.verification === 'fixture'
        && t.source_namespace === SOURCE && t.provenance_kind === 'fixture'
        && t.source_evidence_id != null && t.source_evidence_id === t.linked_evidence_id
        && (!t.source_model_ref || t.source_model_ref === a.model_context)
        && t.dimension_name && t.value_name && published.has(facetId(t.dimension, t.value_code)));
      const complete = valid && a.verification === 'verified' && a.coverage === 'complete'
        && a.context_verification === 'verified' && set.coverage === 'complete'
        && set.unconditional !== 1 && set.serial_range_id == null
        && set.effective_serial_range_id == null;
      if (!complete) {
        if (!valid || stillPossible(tags, selected)) {
          unavailable.push({ part_id: a.part_id, occurrence_id: a.part_occurrence_id,
            reason: valid ? 'incomplete_or_unsupported_fixture_evidence'
              : 'source_mapping_or_language_unavailable' });
        }
        continue;
      }
      if (!match(tags, selected)) continue;
      if (a.effect === 'exclude') {
        excluded.push({ part_id: a.part_id, occurrence_id: a.part_occurrence_id,
          model_context: a.model_context });
        continue;
      }
      const values = [...new Set(tags.map((t) => facetId(t.dimension, t.value_code)))].sort();
      const item = { part_id: a.part_id, part_number: a.part_number, description: a.description,
        occurrence_id: a.part_occurrence_id, occurrence_key: a.occurrence_key,
        model_context: a.model_context, condition_set_id: set.id, values,
        applicability_state: 'applicable', provenance: 'synthetic_fixture' };
      matches.push(item);
      for (const value of values) available.add(value);
    }
    if (!(byAssertion.get(a.id) || []).length) {
      unavailable.push({ part_id: a.part_id, occurrence_id: a.part_occurrence_id,
        reason: 'missing_condition_alternative' });
    }
  }
  return send({
    state: matches.length ? 'applicable' : unavailable.length ? 'unavailable'
      : excluded.length ? 'excluded' : 'no_match',
    fixture_mode: true, source_namespace: SOURCE, query: q, selected: selectedIds,
    categories, available_options: [...available].sort(), matches,
    excluded_occurrences: excluded, unavailable_occurrences: unavailable,
  });
}
