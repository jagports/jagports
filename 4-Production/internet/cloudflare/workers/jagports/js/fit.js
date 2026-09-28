// Source-qualified normalized Fit reader (#641/#877). TEST=1 uses only
// fixture rows; real mode reads only independently reviewed JEPC occurrence evidence
// from the Range D1 selected by parts.js. No free-text inference or fallback.
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
const missingData = (reason, fixtureMode = false, range = null) => send({
  ...empty('error', [], [], '', reason, fixtureMode),
  ...(range ? { range } : {}),
  error_code: reason,
  error: fixtureMode
    ? 'Deterministic Fit test data has not been loaded.'
    : 'Reviewed JEPC Fit data has not been published for this Range.',
}, 503);

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

// The shared operational D1 contains the searchable TEST parts, but the
// richer #877 SQL-only fixture assertions are loaded only by isolated test DBs.
// Supply their same eight *synthetic* dimensions from a self-contained fallback
// when those optional rows have not been published. Never enter this path in
// real mode and never represent these records as JEPC fitment evidence.
const EMBEDDED_SOURCE = 'fixture:embedded-fit:v1';
const EMBEDDED_VALUES = [
  ['body', 'Body', 'Kori', 'Vehicle body style', 'Ajoneuvon korimalli', [
    ['coupe', 'Coupe', 'Coupé'], ['convertible', 'Convertible', 'Avoauto']]],
  ['engine_aspiration', 'Engine aspiration', 'Moottorin ahtaminen',
    'Engine aspiration type', 'Moottorin ahtamistapa', [
      ['na', 'NA', 'Vapaasti hengittävä'],
      ['supercharged', 'Supercharged', 'Mekaanisesti ahdettu']]],
  ['seat_equipment', 'Seat equipment', 'Istuinvarusteet',
    'Seat equipment features', 'Istuinten varustelu', [
      ['memory_seat', 'Memory Seat', 'Muisti-istuin'],
      ['powered_seats', 'Powered Seats', 'Sähkösäätöiset istuimet']]],
  ['steering', 'Steering', 'Ohjauspuoli', 'Steering side', 'Ohjauspuoli', [
    ['LHD', 'LHD', 'Vasemmalta ohjattava'],
    ['RHD', 'RHD', 'Oikealta ohjattava']]],
];
const EMBEDDED_OCCURRENCES = [
  ['MJB7703AA', 'TEST-O-A', 'FIX-TEST-X100', 'include', 'complete',
    ['body:coupe', 'steering:LHD', 'engine_aspiration:supercharged',
      'seat_equipment:memory_seat', 'seat_equipment:powered_seats']],
  ['MJB7703AA', 'TEST-O-B', 'FIX-TEST-X100', 'include', 'complete',
    ['body:convertible', 'steering:RHD', 'engine_aspiration:na',
      'seat_equipment:powered_seats']],
  ['MNA7691AA', 'TEST-O-C', 'FIX-TEST-X100', 'include', 'complete',
    ['body:coupe', 'steering:RHD', 'engine_aspiration:na']],
  ['XR847031', 'TEST-O-D', 'FIX-TEST-X100', 'exclude', 'complete',
    ['body:convertible', 'steering:LHD']],
  ['FIX538C', 'TEST-O-E', 'FIX-TEST-X100', 'include', 'incomplete',
    ['body:coupe']],
  ['MJB7703AA', 'TEST-O-F', 'FIX-TEST-X150', 'include', 'complete',
    ['body:coupe', 'steering:RHD', 'engine_aspiration:supercharged']],
];

async function embeddedFixtureFit(db, { q, stockOnly, language, selected, selectedIds }) {
  const categories = EMBEDDED_VALUES.map(([code, en, fi, descriptionEn, descriptionFi, values]) => ({
    code, name: language === 'fi' ? fi : en,
    description: language === 'fi' ? descriptionFi : descriptionEn,
    values: values.map(([valueCode, valueEn, valueFi]) => ({
      id: facetId(code, valueCode), code: valueCode,
      name: language === 'fi' ? valueFi : valueEn,
      description: language === 'fi' ? valueFi : valueEn,
      source_descriptions: [{
        id: 'embedded:' + facetId(code, valueCode), mapping_revision_id: 'embedded:v1',
        source_namespace: EMBEDDED_SOURCE, dataset: 'embedded-v1',
        source_key: facetId(code, valueCode), language: 'en',
        locator: 'embedded/' + code + '/' + valueCode,
        original_text: valueEn, provenance: 'synthetic_fixture',
      }],
    })),
  }));
  const valid = new Set(categories.flatMap(c => c.values.map(v => v.id)));
  for (const facet of selectedIds) if (!valid.has(facet)) return invalid('facet_unknown');
  // The fallback only connects to already seeded fixture PARTs, never to any
  // operational/imported PART with a coincidentally similar description.
  const rows = (await db.prepare(
    "SELECT id,part_number_normalized,description FROM part WHERE verification_status='fixture' "
    + "AND part_number_normalized IN ('MJB7703AA','MNA7691AA','XR847031','FIX538C')"
  ).all()).results || [];
  const byNumber = new Map(rows.map(row => [row.part_number_normalized, row]));
  if (!byNumber.size) return missingData('test_fixture_data_missing', true);
  const candidates = EMBEDDED_OCCURRENCES.filter(([number]) => byNumber.has(number));
  const normalizedQuery = q.toUpperCase();
  let stocked = null;
  if (stockOnly === '1') {
    const ids = rows.map(row => row.id);
    const result = await db.prepare(
      'SELECT DISTINCT part_id FROM stock_item WHERE verification_status=? AND available=1 '
      + 'AND quantity>0 AND part_id IN (' + ids.map(() => '?').join(',') + ')'
    ).bind('fixture', ...ids).all();
    stocked = new Set((result.results || []).map(row => row.part_id));
  }
  const matches = [], excluded = [], unavailable = [], available = new Set();
  for (const [number, occurrenceKey, context, effect, coverage, facets] of candidates) {
    const part = byNumber.get(number);
    if (normalizedQuery && !number.includes(normalizedQuery)
        && !(part.description || '').toUpperCase().includes(normalizedQuery)) continue;
    if (stocked && !stocked.has(part.id)) continue;
    const tags = facets.map(id => {
      const [dimension, value_code] = id.split(':');
      return { dimension, value_code };
    });
    if (coverage !== 'complete') {
      if (stillPossible(tags, selected)) unavailable.push({
        part_id: part.id, occurrence_id: occurrenceKey,
        reason: 'incomplete_synthetic_fixture_evidence',
      });
      continue;
    }
    if (!match(tags, selected)) continue;
    if (effect === 'exclude') {
      excluded.push({ part_id: part.id, occurrence_id: occurrenceKey, model_context: context });
      continue;
    }
    matches.push({
      part_id: part.id, part_number: number, description: part.description,
      occurrence_id: occurrenceKey, occurrence_key: occurrenceKey,
      model_context: context, condition_set_id: 'embedded:' + occurrenceKey,
      values: facets, applicability_state: 'applicable', provenance: 'synthetic_fixture',
    });
    for (const facet of facets) available.add(facet);
  }
  return send({
    state: matches.length ? 'applicable' : unavailable.length ? 'unavailable'
      : excluded.length ? 'excluded' : 'no_match',
    fixture_mode: true, fixture_provider: 'embedded', source_namespace: EMBEDDED_SOURCE,
    query: q, selected: selectedIds, categories,
    available_options: [...available].sort(), matches,
    excluded_occurrences: excluded, unavailable_occurrences: unavailable,
  });
}

export async function handleViepsFit(request, env) {
  const testFlags = [...new URL(request.url).searchParams]
    .filter(([key]) => key.toLowerCase() === 'test');
  if (testFlags.length !== 1 || testFlags[0][1] !== '1') {
    return send({ error_code: 'test_mode_required' }, 400);
  }
  if (!env.DB) return missingData('test_fixture_data_missing', true);
  return readFit(request, env.DB, { fixtureMode: true });
}

// Called only by parts.js, after that module has selected and checked a
// real Range D1 binding; operational stock is resolved separately by part number.
export async function handleVerifiedFit(request, rangeDb, hasRealStock, range) {
  return readFit(request, rangeDb, { fixtureMode: false, hasRealStock, range });
}

async function readFit(request, db, { fixtureMode, hasRealStock, range = null }) {
  if (request.method !== 'GET') return send({ error_code: 'method_not_allowed' }, 405);
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
  const provenanceKind = fixtureMode ? 'fixture' : 'jepc';
  const mappingStatus = fixtureMode ? 'fixture' : 'verified';
  const sourceClause = fixtureMode ? 'sd.source_namespace = ? AND ' : '';
  // Publish only source-qualified current mappings with complete translated
  // metadata. Verified JEPC mappings require a recorded independent reviewer.
  let mappings;
  try {
    mappings = (await db.prepare(
    `SELECT m.id AS mapping_revision_id, sd.id AS source_description_id,
       sd.source_namespace, sd.dataset_key, sd.source_key, sd.source_language,
       sd.source_group_code, sd.source_value_code, sd.source_model_ref,
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
     WHERE ${sourceClause}sd.provenance_kind = ? AND m.status = ?
       ${fixtureMode ? '' : "AND TRIM(COALESCE(m.reviewer_ref, '')) <> ''"}
     ORDER BY d.code, m.value_code, sd.id`
  ).bind(language, language, ...(fixtureMode ? [SOURCE] : []),
    provenanceKind, mappingStatus).all()).results || [];
  } catch (error) {
    if (!fixtureMode || !/no such (?:table|view)/i.test(String(error?.message || error))) throw error;
    return embeddedFixtureFit(db, { q, stockOnly, language, selected, selectedIds });
  }
  if (!mappings.length) {
    if (fixtureMode) return embeddedFixtureFit(db,
      { q, stockOnly, language, selected, selectedIds });
    return missingData('real_fit_data_missing', false, range);
  }
  if (mappings.some((m) => !m.dimension_name || !m.dimension_description ||
      !m.value_name || !m.value_description || !m.source_language ||
      !m.record_locator || !m.dataset_key)) {
    return missingData(fixtureMode ? 'test_fixture_data_incomplete' :
      'real_fit_data_incomplete', fixtureMode, range);
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
      provenance: fixtureMode ? 'synthetic_fixture' : 'verified_jepc',
    });
  }
  for (const [d, values] of selected) {
    if (![...values].every((v) => published.has(facetId(d, v)))) return invalid('facet_unknown');
  }
  const categories = [...categoriesByCode.values()];
  const assertionScope = fixtureMode
    ? "b.source_namespace = ? AND o.source = ? AND p.verification_status = 'fixture' AND c.source_namespace = ?"
    : `p.verification_status <> 'fixture' AND c.source_namespace = b.source_namespace
       AND EXISTS (
         SELECT 1 FROM applicability_source_description candidate
         JOIN applicability_description_mapping_current approved
           ON approved.source_description_id = candidate.id
         WHERE candidate.source_namespace = b.source_namespace
           AND candidate.provenance_kind = 'jepc'
           AND approved.status = 'verified'
           AND TRIM(COALESCE(approved.reviewer_ref, '')) <> ''
       )`;
  let assertions = (await db.prepare(
    `SELECT a.id, a.part_occurrence_id, a.effect, a.verification, a.coverage,
       c.verification AS context_verification, c.source_model_id AS model_context,
       b.source_namespace AS assertion_namespace,
       p.id AS part_id, p.part_number_normalized AS part_number,
       p.description AS description, o.source_ref AS occurrence_key
     FROM occurrence_applicability a
     JOIN applicability_snapshot snap ON snap.id = a.snapshot_id AND snap.state = 'active'
     JOIN applicability_bundle b ON b.id = snap.bundle_id
     JOIN part_occurrence o ON o.id = a.part_occurrence_id
     JOIN part p ON p.id = o.part_id
     JOIN applicability_model_context c ON c.id = a.model_context_id
     WHERE ${assertionScope}
       AND (? = '' OR instr(upper(COALESCE(p.part_number_normalized, '')), upper(?)) > 0
         OR instr(upper(COALESCE(p.description, '')), upper(?)) > 0)
       ${fixtureMode ? "AND (? = '0' OR EXISTS (SELECT 1 FROM stock_item st WHERE st.part_id = p.id AND st.available = 1 AND st.quantity > 0))" : ''}
     ORDER BY p.id, o.id, a.id`
  ).bind(...(fixtureMode ? [SOURCE, SOURCE, SOURCE] : []),
    q, q, q, ...(fixtureMode ? [stockOnly] : [])).all()).results || [];
  if (!fixtureMode) {
    // A Range can have reviewed mappings but no verified published occurrences.
    // This is missing source data, not a legitimate zero-match search.
    if (!assertions.length) {
      const any = await db.prepare(`SELECT 1 AS present
        FROM occurrence_applicability a
        JOIN applicability_snapshot snap ON snap.id = a.snapshot_id AND snap.state = 'active'
        JOIN applicability_bundle b ON b.id = snap.bundle_id
        JOIN applicability_model_context c ON c.id = a.model_context_id
        WHERE a.verification = 'verified' AND c.verification = 'verified'
          AND c.source_namespace = b.source_namespace
          AND EXISTS (SELECT 1 FROM applicability_source_description sd
            JOIN applicability_description_mapping_current m ON m.source_description_id=sd.id
            WHERE sd.source_namespace=b.source_namespace AND sd.provenance_kind='jepc'
              AND m.status='verified' AND TRIM(COALESCE(m.reviewer_ref,'')) <> '')
        LIMIT 1`).first();
      if (!any) return missingData('real_fit_data_missing', false, range);
    }
    if (stockOnly === '1') {
      if (!hasRealStock) return missingData('real_stock_data_unavailable', false, range);
      const available = new Map();
      for (const number of new Set(assertions.map((a) => a.part_number))) {
        available.set(number, await hasRealStock(number));
      }
      assertions = assertions.filter((a) => available.get(a.part_number));
    }
  }
  if (!assertions.length) return send({
    ...empty('no_match', selectedIds, categories, q, null, fixtureMode),
    ...(range ? { range } : {}),
  });
  const sets = (await db.prepare(
    `SELECT id, assertion_id, coverage, unconditional, serial_range_id, effective_serial_range_id
       FROM applicability_condition_set WHERE assertion_id IN (${assertions.map(() => '?').join(',')})`
  ).bind(...assertions.map((a) => a.id)).all()).results || [];
  const byAssertion = new Map(), tagsBySet = new Map();
  for (const set of sets) put(byAssertion, set.assertion_id, set);
  if (sets.length) {
    const tags = (await db.prepare(
      `SELECT se.set_id, se.mapping_revision_id, se.verification,
         m.id AS current_id, m.status, m.reviewer_ref,
         d.code AS dimension, m.value_code,
         sd.source_namespace, sd.provenance_kind, sd.source_model_ref,
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
        t.current_id != null && t.status === mappingStatus && t.verification === mappingStatus
        && t.source_namespace === a.assertion_namespace
        && t.provenance_kind === provenanceKind
        && (fixtureMode || String(t.reviewer_ref || '').trim())
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
        applicability_state: 'applicable',
        provenance: fixtureMode ? 'synthetic_fixture' : 'verified_jepc' };
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
    fixture_mode: fixtureMode, source_namespace: fixtureMode ? SOURCE : null,
    ...(range ? { range } : {}), query: q, selected: selectedIds,
    categories, available_options: [...available].sort(), matches,
    excluded_occurrences: excluded, unavailable_occurrences: unavailable,
  });
}
