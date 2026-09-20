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

export async function handleViepsPart(request, env) {
  if (request.method !== "GET") return json({ error: "method not allowed" }, 405);

  const url = new URL(request.url);
  const query = text(url.searchParams.get("q"));
  if (!query) return json({ error: "part-number query is required" }, 400);

  const normalized = normalizePartNumber(query);
  if (!normalized) return json({ error: "invalid part-number query", query }, 400);

  const part = await env.DB.prepare(
    `SELECT id, part_number_raw, part_number_normalized, description, source, source_ref, verification_status
     FROM part
     WHERE part_number_normalized = ?
        OR part_number_raw = ?
        OR description = ?
     ORDER BY CASE WHEN part_number_normalized = ? THEN 0 WHEN part_number_raw = ? THEN 1 ELSE 2 END
     LIMIT 1`
  ).bind(normalized, query, query, normalized, query).first();

  if (!part) return json({ error: "part not found", query }, 404);

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
