import { normalizePartNumber } from './part.js';

const json = (data, status = 200) => new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json; charset=utf-8' } });
const text = value => typeof value === 'string' ? value.trim() : '';

export function liveRangeDatabase(url, env) {
  let bindings;
  try { bindings = JSON.parse(env.RANGE_BINDINGS || '{}'); } catch { throw Object.assign(new Error('Invalid reviewed Range binding registry.'), { status: 503, code: 'range_unavailable' }); }
  const names = Object.keys(bindings);
  const slug = text(url.searchParams.get('range')) || (names.length === 1 ? names[0] : '');
  if (!slug || !Object.hasOwn(bindings, slug)) throw Object.assign(new Error(names.length ? 'Select an available Range.' : 'No real Range database is bound.'), { status: names.length ? 400 : 503, code: names.length ? 'range_required' : 'range_unavailable' });
  if (!env[bindings[slug]]) throw Object.assign(new Error(`Range ${slug} D1 binding is unavailable.`), { status: 503, code: 'range_unavailable' });
  return { slug, db: env[bindings[slug]] };
}

async function stock(env, number) {
  const normalized = normalizePartNumber(number);
  if (!normalized) return [];
  const result = await env.DB.prepare("SELECT * FROM stock_item WHERE verification_status <> 'fixture' AND UPPER(REPLACE(REPLACE(TRIM(part_number),' ',''),'-','')) = ? ORDER BY available DESC,id").bind(normalized).all();
  return result.results || [];
}

export async function handleLivePart(request, env) {
  if (request.method !== 'GET') return json({ error: 'method not allowed' }, 405);
  const url = new URL(request.url), { slug, db } = liveRangeDatabase(url, env), query = text(url.searchParams.get('q'));
  if (!query) return json({ error: 'part-number query is required' }, 400);
  const normalized = normalizePartNumber(query);
  const result = await db.prepare("SELECT p.* FROM part p WHERE EXISTS (SELECT 1 FROM part_occurrence o WHERE o.part_id=p.id) AND (p.part_number_normalized LIKE '%' || ? || '%' OR UPPER(p.part_number_raw) LIKE '%' || UPPER(?) || '%') ORDER BY p.part_number_normalized LIMIT 25").bind(normalized, query).all();
  const parts = await Promise.all((result.results || []).map(async part => ({ ...part, stock: await stock(env, part.part_number_normalized) })));
  if (!parts.length) return json({ error: 'part not found', state: 'not_found' }, 404);
  const part = parts[0];
  const occurrences = await db.prepare('SELECT * FROM part_occurrence WHERE part_id=? ORDER BY id').bind(part.id).all();
  return json({ state: 'resolved', range: slug, part, occurrences: occurrences.results || [], stock: part.stock, images: [], diagrams: [], fitment: [], applicability_state: 'unverified_source_evidence' });
}

export async function handleLiveTree(request, env) {
  if (request.method !== 'GET') return json({ error: 'method not allowed' }, 405);
  const url = new URL(request.url), { slug, db } = liveRangeDatabase(url, env);
  const result = await db.prepare('SELECT id AS node_id,label,sort_order FROM part_tree_node WHERE parent_id IS NULL ORDER BY sort_order,id').all();
  return json({ state: 'root', range: slug, root_index_state: (result.results || []).length ? 'available' : 'empty', roots: result.results || [], children: result.results || [], parts: [], parts_tree: [] });
}
