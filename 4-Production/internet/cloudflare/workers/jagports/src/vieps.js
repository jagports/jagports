import { normalizePartNumber } from "./part.js";

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

function text(value) {
  return typeof value === "string" ? value.trim() : "";
}

function candidateIdentity(part) {
  return part.part_number_normalized || part.part_number_raw || part.description || `#${part.id}`;
}

function isExactCandidate(part, query, normalized) {
  return part.part_number_normalized === normalized
    || normalizePartNumber(part.part_number_raw) === normalized
    || part.description === query;
}

function candidatePayload(part) {
  return {
    id: part.id,
    part_number_raw: part.part_number_raw,
    part_number_normalized: part.part_number_normalized,
    description: part.description,
    source: part.source,
    source_ref: part.source_ref,
    verification_status: part.verification_status,
  };
}

async function findPartCandidates(env, query, normalized) {
  const result = await env.DB.prepare(
    `SELECT id, part_number_raw, part_number_normalized, description, source, source_ref, verification_status
     FROM part
     WHERE part_number_normalized = ?
        OR UPPER(part_number_raw) = UPPER(?)
        OR description = ?
        OR part_number_normalized LIKE '%' || ? || '%'
        OR UPPER(part_number_raw) LIKE '%' || UPPER(?) || '%'
     ORDER BY CASE
        WHEN part_number_normalized = ? THEN 0
        WHEN UPPER(part_number_raw) = UPPER(?) THEN 1
        WHEN description = ? THEN 2
        WHEN part_number_normalized LIKE ? || '%' THEN 3
        WHEN UPPER(part_number_raw) LIKE UPPER(?) || '%' THEN 4
        ELSE 5
      END,
      part_number_normalized,
      part_number_raw,
      id
     LIMIT 25`
  ).bind(
    normalized,
    query,
    query,
    normalized,
    query,
    normalized,
    query,
    query,
    normalized,
    query,
  ).all();
  return result.results || [];
}

export async function handleViepsPart(request, env) {
  if (request.method !== "GET") return json({ error: "method not allowed" }, 405);

  const url = new URL(request.url);
  const query = text(url.searchParams.get("q"));
  if (!query) return json({ error: "part-number query is required" }, 400);

  const normalized = normalizePartNumber(query);
  if (!normalized) return json({ error: "invalid part-number query", query }, 400);

  const candidates = await findPartCandidates(env, query, normalized);
  if (!candidates.length) return json({ error: "part not found", query }, 404);

  const exactCandidates = candidates.filter((part) => isExactCandidate(part, query, normalized));
  if (exactCandidates.length > 1 || (!exactCandidates.length && candidates.length > 1)) {
    return json({
      state: "multiple_match",
      query,
      normalized_query: normalized,
      matches: candidates.map(candidatePayload),
    });
  }

  const part = exactCandidates[0] || candidates[0];

  const [occurrenceResult, treeResult, imageResult, diagramResult, fitmentResult, stockResult] = await Promise.all([
    env.DB.prepare(
      `SELECT id, source, source_ref, context_type, context_ref, category_ref,
              item_number, diagram_ref, diagram_item_number, verification_status
       FROM part_occurrence
       WHERE part_id = ?
       ORDER BY id`
    ).bind(part.id).all(),
    env.DB.prepare(
      `WITH RECURSIVE tree(id, parent_id, label, sort_order) AS (
         SELECT n.id, n.parent_id, n.label, n.sort_order
         FROM part_tree_node n
         INNER JOIN part_tree_part tp ON tp.tree_node_id = n.id
         WHERE tp.part_id = ?
         UNION
         SELECT parent.id, parent.parent_id, parent.label, parent.sort_order
         FROM part_tree_node parent
         INNER JOIN tree child ON child.parent_id = parent.id
       )
       SELECT DISTINCT id, parent_id, label, sort_order
       FROM tree
       ORDER BY sort_order, id`
    ).bind(part.id).all(),
    env.DB.prepare(
      `SELECT id, image_ref AS image_url, image_kind, description, verification_status, availability_status
       FROM part_image WHERE part_id = ? ORDER BY id`
    ).bind(part.id).all(),
    env.DB.prepare(
      `SELECT id, title, image_url, availability_status, source_ref, verification_status
       FROM part_diagram WHERE part_id = ? ORDER BY id`
    ).bind(part.id).all(),
    env.DB.prepare(
      `SELECT f.id, r.range_code, r.name AS range_name, f.variation, f.qualifier,
              f.verification_status, f.applicability_state
       FROM part_fitment f
       INNER JOIN vehicle_range r ON r.id = f.vehicle_range_id
       WHERE f.part_id = ? AND f.vehicle_range_id IS NOT NULL
       ORDER BY r.range_code, f.variation, f.qualifier`
    ).bind(part.id).all(),
    env.DB.prepare(
      `SELECT id, part_number, quantity, condition, condition_code, status, location, source, source_ref,
              verification_status, available, confidence, price, currency, notes
       FROM stock_item
       WHERE part_id = ?
       ORDER BY available DESC, status, location, id`
    ).bind(part.id).all(),
  ]);

  const nodes = treeResult.results || [];
  const byId = new Map(nodes.map((node) => [node.id, node]));
  const leafNodes = nodes.filter((node) => !nodes.some((candidate) => candidate.parent_id === node.id));
  const paths = leafNodes.map((node) => {
    const labels = [];
    let current = node;
    const seen = new Set();
    while (current && !seen.has(current.id)) {
      seen.add(current.id);
      labels.unshift(current.label);
      current = byId.get(current.parent_id);
    }
    return { node_id: node.id, path: labels };
  });

  return json({
    part,
    occurrences: occurrenceResult.results || [],
    parts_tree: paths,
    images: imageResult.results || [],
    diagrams: diagramResult.results || [],
    fitment: fitmentResult.results || [],
    stock: stockResult.results || [],
  });
}
