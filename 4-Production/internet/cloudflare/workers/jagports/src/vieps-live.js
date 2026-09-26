import { normalizePartNumber } from './part.js';

const json = (data, status = 200) => new Response(JSON.stringify(data), { status,
  headers: { 'content-type': 'application/json; charset=utf-8' } });
const text = value => typeof value === 'string' ? value.trim() : '';

export function liveRangeDatabase(url, env) {
  let bindings;
  try { bindings = JSON.parse(env.RANGE_BINDINGS || '{}'); }
  catch { throw new Error('Invalid reviewed Range binding registry.'); }
  const names = Object.keys(bindings);
  const requested = text(url.searchParams.get('range'));
  const slug = requested || (names.length === 1 ? names[0] : '');
  if (!slug || !Object.hasOwn(bindings, slug)) {
    const error = new Error(names.length ? 'Select an available Range.' : 'No real Range database is bound.');
    error.status = names.length ? 400 : 503;
    error.code = names.length ? 'range_required' : 'range_unavailable';
    throw error;
  }
  const db = env[bindings[slug]];
  if (!db) {
    const error = new Error(`Range ${slug} D1 binding is unavailable.`);
    error.status = 503;
    error.code = 'range_unavailable';
    throw error;
  }
  return { slug, db };
}

async function realStock(env, number) {
  const normalized = normalizePartNumber(number);
  if (!normalized) return [];
  const result = await env.DB.prepare(`SELECT id,part_number,quantity,condition,condition_code,
      status,location,source,source_ref,verification_status,available,confidence,
      price,currency,notes
    FROM stock_item
    WHERE verification_status <> 'fixture'
      AND UPPER(REPLACE(REPLACE(TRIM(part_number),' ',''),'-','')) = ?
    ORDER BY available DESC,status,location,id`).bind(normalized).all();
  return result.results || [];
}

const partPayload = part => ({ id: part.id, part_number_raw: part.part_number_raw,
  part_number_normalized: part.part_number_normalized, description: part.description,
  source: part.source, source_ref: part.source_ref, verification_status: part.verification_status });
const partLabel = part => part.description
  ? `${part.part_number_normalized} — ${part.description}` : part.part_number_normalized;

async function roots(db) {
  const result = await db.prepare(`SELECT id AS node_id,label,sort_order FROM part_tree_node
    WHERE parent_id IS NULL ORDER BY sort_order,id`).all();
  return result.results || [];
}

async function pathsForPart(db, part) {
  const result = await db.prepare(`WITH RECURSIVE paths(leaf_id,id,parent_id,label,sort_order,depth) AS (
      SELECT n.id,n.id,n.parent_id,n.label,n.sort_order,0 FROM part_tree_node n
      JOIN part_tree_part tp ON tp.tree_node_id=n.id WHERE tp.part_id=?
      UNION ALL
      SELECT paths.leaf_id,p.id,p.parent_id,p.label,p.sort_order,paths.depth+1
      FROM part_tree_node p JOIN paths ON paths.parent_id=p.id
    ) SELECT leaf_id,id,parent_id,label,sort_order,depth FROM paths
    ORDER BY leaf_id,depth DESC`).bind(part.id).all();
  const byLeaf = new Map();
  for (const row of result.results || []) {
    if (!byLeaf.has(row.leaf_id)) byLeaf.set(row.leaf_id, []);
    byLeaf.get(row.leaf_id).push(row);
  }
  return [...byLeaf].map(([nodeId, rows]) => {
    const nodes = rows.map(row => ({ node_id: row.id, parent_id: row.parent_id,
      label: row.label, sort_order: row.sort_order }));
    const partNode = { kind: 'part', part_id: part.id, label: partLabel(part),
      part_query: part.part_number_normalized };
    return { node_id: nodeId, part_id: part.id,
      path: [...nodes.map(node => node.label), partNode.label],
      nodes: [...nodes, partNode], part };
  });
}

export async function handleLivePart(request, env) {
  if (request.method !== 'GET') return json({ error: 'method not allowed' }, 405);
  const url = new URL(request.url);
  const { slug, db } = liveRangeDatabase(url, env);
  const query = text(url.searchParams.get('q'));
  if (!query) return json({ error: 'part-number query is required' }, 400);
  const normalized = normalizePartNumber(query);
  if (!normalized) return json({ error: 'part not found', query, state: 'not_found' }, 404);
  const stockOnlyParam = text(url.searchParams.get('stock_only'));
  if (stockOnlyParam && !['0', '1'].includes(stockOnlyParam)) {
    return json({ error: 'invalid stock-only filter', error_code: 'stock_filter_invalid' }, 400);
  }
  const stockOnly = stockOnlyParam === '1';
  const candidateId = url.searchParams.get('candidate_id');
  if (candidateId !== null && !/^[1-9]\d*$/.test(candidateId)) {
    return json({ error: 'invalid candidate id', error_code: 'candidate_id_invalid' }, 400);
  }
  const result = await db.prepare(`SELECT p.id,p.part_number_raw,p.part_number_normalized,
      p.description,p.source,p.source_ref,p.verification_status
    FROM part p WHERE EXISTS (SELECT 1 FROM part_occurrence o WHERE o.part_id=p.id)
      AND (p.part_number_normalized LIKE '%' || ? || '%'
        OR UPPER(p.part_number_raw) LIKE '%' || UPPER(?) || '%'
        OR EXISTS (SELECT 1 FROM part_tree_part tp
          JOIN part_tree_node n ON n.id=tp.tree_node_id WHERE tp.part_id=p.id
          AND UPPER(n.label) LIKE '%' || UPPER(?) || '%'))
    ORDER BY CASE WHEN p.part_number_normalized=? THEN 0 ELSE 1 END,
      p.part_number_normalized LIMIT 25`).bind(normalized, query, query, normalized).all();
  const found = result.results || [];
  const withStock = await Promise.all(found.map(async part => ({ ...part,
    stock: await realStock(env, part.part_number_normalized) })));
  const candidates = stockOnly ? withStock.filter(part => part.stock.some(row => row.available && row.quantity > 0)) : withStock;
  const searchPath = candidates.some(part => part.part_number_normalized === normalized)
    ? 'deterministic' : 'free_text';
  if (!candidates.length) return json({ error: stockOnly && found.length ? 'no stocked part match' : 'part not found',
    query, state: stockOnly && found.length ? 'stock_filtered_empty' : 'not_found',
    search_path: searchPath }, 404);
  const chosen = candidateId ? candidates.find(part => String(part.id) === candidateId) : null;
  if (candidateId && !chosen) return json({ error: 'candidate not in current results', error_code: 'candidate_not_found' }, 404);
  const part = chosen || candidates[0];
  if (!chosen && candidates.length > 1 && candidates.filter(item => item.part_number_normalized === normalized).length !== 1) {
    const partsTree = (await Promise.all(candidates.map(item => pathsForPart(db, partPayload(item))))).flat();
    return json({ state: 'multiple_match', range: slug, query, normalized_query: normalized,
      search_path: searchPath, matches: candidates.map(partPayload),
      tree_roots: await roots(db), parts_tree: partsTree, selected_part: null });
  }
  const [occurrences, treePaths] = await Promise.all([
    db.prepare(`SELECT id,source,source_ref,context_type,context_ref,category_ref,item_number,
      diagram_ref,diagram_item_number,verification_status FROM part_occurrence
      WHERE part_id=? ORDER BY id`).bind(part.id).all(),
    pathsForPart(db, partPayload(part)),
  ]);
  return json({ state: 'resolved', range: slug, search_path: searchPath,
    part: partPayload(part), tree_roots: await roots(db),
    occurrences: occurrences.results || [], parts_tree: treePaths,
    images: [], diagrams: [], fitment: [], stock: part.stock,
    applicability_state: 'unverified_source_evidence' });
}

export async function handleLiveTree(request, env) {
  if (request.method !== 'GET') return json({ error: 'method not allowed' }, 405);
  const url = new URL(request.url);
  const { slug, db } = liveRangeDatabase(url, env);
  const treeRoots = await roots(db);
  const rawNode = url.searchParams.get('node_id');
  const stockOnlyParam = text(url.searchParams.get('stock_only'));
  if (stockOnlyParam && !['0', '1'].includes(stockOnlyParam)) {
    return json({ error: 'invalid stock-only filter', error_code: 'stock_filter_invalid' }, 400);
  }
  if (rawNode && url.searchParams.get('root') === '1') {
    return json({ error: 'tree request invalid', error_code: 'tree_request_invalid' }, 400);
  }
  if (!rawNode) return json({ state: url.searchParams.get('root') === '1' ? 'root' : 'empty',
    range: slug, root_index_state: treeRoots.length ? 'available' : 'empty',
    selected_node: null, path: [], roots: treeRoots, children: treeRoots,
    parts: [], parts_tree: [] });
  if (!/^[1-9]\d*$/.test(rawNode)) return json({ error: 'valid tree node id is required' }, 400);
  const nodeId = Number(rawNode);
  const selected = await db.prepare(`SELECT id,parent_id,label,sort_order FROM part_tree_node WHERE id=?`)
    .bind(nodeId).first();
  if (!selected) return json({ error: 'tree node not found', error_code: 'tree_node_not_found' }, 404);
  const [pathResult, childrenResult, partsResult] = await Promise.all([
    db.prepare(`WITH RECURSIVE ancestors(id,parent_id,label,sort_order,depth) AS (
      SELECT id,parent_id,label,sort_order,0 FROM part_tree_node WHERE id=?
      UNION ALL SELECT p.id,p.parent_id,p.label,p.sort_order,a.depth+1
      FROM part_tree_node p JOIN ancestors a ON a.parent_id=p.id)
      SELECT id AS node_id,parent_id,label,sort_order,depth FROM ancestors ORDER BY depth DESC`)
      .bind(nodeId).all(),
    db.prepare(`SELECT id AS node_id,label,sort_order FROM part_tree_node
      WHERE parent_id=? ORDER BY sort_order,id`).bind(nodeId).all(),
    db.prepare(`WITH RECURSIVE subtree(id) AS (
      SELECT id FROM part_tree_node WHERE id=?
      UNION ALL SELECT c.id FROM part_tree_node c JOIN subtree s ON c.parent_id=s.id)
      SELECT DISTINCT p.id,p.part_number_raw,p.part_number_normalized,p.description,
        p.source,p.source_ref,p.verification_status,tp.tree_node_id
      FROM subtree JOIN part_tree_part tp ON tp.tree_node_id=subtree.id
      JOIN part p ON p.id=tp.part_id ORDER BY p.part_number_normalized LIMIT 100`)
      .bind(nodeId).all(),
  ]);
  const withStock = await Promise.all((partsResult.results || []).map(async part => ({ ...part,
    stock: await realStock(env, part.part_number_normalized) })));
  const filtered = stockOnlyParam === '1'
    ? withStock.filter(part => part.stock.some(row => row.available && row.quantity > 0)) : withStock;
  const parts = [...new Map(filtered.map(part => [part.id, partPayload(part)])).values()];
  const partsTree = (await Promise.all(parts.map(part => pathsForPart(db, part)))).flat();
  const path = pathResult.results || [];
  return json({ state: parts.length || (childrenResult.results || []).length ? 'resolved' : 'empty',
    range: slug, root_index_state: treeRoots.length ? 'available' : 'empty',
    roots: treeRoots, selected_node: { node_id: selected.id, parent_id: selected.parent_id,
      label: selected.label }, path,
    ancestry_state: path.length && path[0].parent_id == null ? 'complete' : 'unavailable',
    children: childrenResult.results || [], parts,
    part_nodes: filtered.map(part => ({ part_id: part.id, node_id: part.tree_node_id })),
    parts_tree: partsTree });
}
