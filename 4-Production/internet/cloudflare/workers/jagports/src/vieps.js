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

function partLeafLabel(part) {
  const identity = candidateIdentity(part);
  return part.description && part.description !== identity ? `${identity} — ${part.description}` : identity;
}

function partLeafQuery(part) {
  return part.part_number_normalized || part.part_number_raw || part.description || String(part.id);
}

function isExactCandidate(part, query, normalized) {
  return (normalized && part.part_number_normalized === normalized)
    || (normalized && normalizePartNumber(part.part_number_raw) === normalized)
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

function stockAvailableClause(alias = "s") {
  return `${alias}.part_id = part.id AND ${alias}.available = 1 AND ${alias}.quantity > 0`;
}

async function findDeterministicPartCandidates(env, query, normalized) {
  const normalizedQuery = normalized || "\u0000NO_NORMALIZED_QUERY\u0000";
  const result = await env.DB.prepare(
    `SELECT id, part_number_raw, part_number_normalized, description, source, source_ref, verification_status,
            EXISTS (
              SELECT 1 FROM stock_item s
              WHERE ${stockAvailableClause("s")}
            ) AS has_available_stock
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
    normalizedQuery,
    query,
    query,
    normalizedQuery,
    query,
    normalizedQuery,
    query,
    query,
    normalizedQuery,
    query,
  ).all();
  return result.results || [];
}

async function findFreeTextPartCandidates(env, query) {
  const like = `%${query}%`;
  const result = await env.DB.prepare(
    `SELECT DISTINCT part.id, part.part_number_raw, part.part_number_normalized, part.description,
            part.source, part.source_ref, part.verification_status,
            EXISTS (
              SELECT 1 FROM stock_item s
              WHERE ${stockAvailableClause("s")}
            ) AS has_available_stock
     FROM part
     WHERE UPPER(COALESCE(part.description, '')) LIKE UPPER(?)
        OR UPPER(COALESCE(part.source, '')) LIKE UPPER(?)
        OR UPPER(COALESCE(part.source_ref, '')) LIKE UPPER(?)
        OR EXISTS (
          SELECT 1
          FROM part_tree_part tp
          INNER JOIN part_tree_node n ON n.id = tp.tree_node_id
          WHERE tp.part_id = part.id
            AND UPPER(COALESCE(n.label, '')) LIKE UPPER(?)
        )
        OR EXISTS (
          SELECT 1
          FROM part_occurrence o
          WHERE o.part_id = part.id
            AND (
              UPPER(COALESCE(o.source, '')) LIKE UPPER(?)
              OR UPPER(COALESCE(o.source_ref, '')) LIKE UPPER(?)
              OR UPPER(COALESCE(o.context_type, '')) LIKE UPPER(?)
              OR UPPER(COALESCE(o.context_ref, '')) LIKE UPPER(?)
              OR UPPER(COALESCE(o.category_ref, '')) LIKE UPPER(?)
              OR UPPER(COALESCE(o.item_number, '')) LIKE UPPER(?)
              OR UPPER(COALESCE(o.diagram_ref, '')) LIKE UPPER(?)
              OR UPPER(COALESCE(o.diagram_item_number, '')) LIKE UPPER(?)
            )
        )
        OR EXISTS (
          SELECT 1
          FROM stock_item s
          WHERE s.part_id = part.id
            AND (
              UPPER(COALESCE(s.part_number, '')) LIKE UPPER(?)
              OR CAST(COALESCE(s.quantity, '') AS TEXT) LIKE ?
              OR UPPER(COALESCE(s.condition, '')) LIKE UPPER(?)
              OR UPPER(COALESCE(s.condition_code, '')) LIKE UPPER(?)
              OR UPPER(COALESCE(s.status, '')) LIKE UPPER(?)
              OR UPPER(COALESCE(s.location, '')) LIKE UPPER(?)
              OR UPPER(COALESCE(s.source, '')) LIKE UPPER(?)
              OR UPPER(COALESCE(s.source_ref, '')) LIKE UPPER(?)
              OR UPPER(COALESCE(s.notes, '')) LIKE UPPER(?)
              OR CASE WHEN s.available = 1 THEN 'available' ELSE 'unavailable' END LIKE LOWER(?)
            )
        )
     ORDER BY CASE
        WHEN UPPER(COALESCE(part.description, '')) LIKE UPPER(?) THEN 0
        WHEN UPPER(COALESCE(part.part_number_raw, '')) LIKE UPPER(?) THEN 1
        WHEN UPPER(COALESCE(part.source_ref, '')) LIKE UPPER(?) THEN 2
        ELSE 3
      END,
      part.part_number_normalized,
      part.part_number_raw,
      part.description,
      part.id
     LIMIT 25`
  ).bind(
    like,
    like,
    like,
    like,
    like,
    like,
    like,
    like,
    like,
    like,
    like,
    like,
    like,
    like,
    like,
    like,
    like,
    like,
    like,
    like,
    like,
    like.toLowerCase(),
    like,
    like,
    like,
  ).all();
  return result.results || [];
}

export async function findPartCandidates(env, query, normalized) {
  const deterministic = await findDeterministicPartCandidates(env, query, normalized);
  if (deterministic.length) return { searchPath: "deterministic", candidates: deterministic };
  const freeText = await findFreeTextPartCandidates(env, query);
  return { searchPath: "free_text", candidates: freeText };
}

async function buildPartLeafPaths(env, parts) {
  const candidates = parts.map(candidatePayload).filter((part) => part.id !== undefined && part.id !== null);
  if (!candidates.length) return [];
  const placeholders = candidates.map(() => "?").join(", ");
  const result = await env.DB.prepare(
    `WITH base(part_id, tree_node_id) AS (
       SELECT p.id, tp.tree_node_id
       FROM part p
       INNER JOIN part_tree_part tp ON tp.part_id = p.id
       WHERE p.id IN (${placeholders})
     ),
     tree(part_id, leaf_node_id, id, parent_id, label, sort_order, depth) AS (
       SELECT base.part_id, n.id, n.id, n.parent_id, n.label, n.sort_order, 0
       FROM base
       INNER JOIN part_tree_node n ON n.id = base.tree_node_id
       UNION ALL
       SELECT tree.part_id, tree.leaf_node_id, parent.id, parent.parent_id, parent.label, parent.sort_order, tree.depth + 1
       FROM part_tree_node parent
       INNER JOIN tree ON tree.parent_id = parent.id
     )
     SELECT part_id, leaf_node_id, id AS node_id, parent_id, label, sort_order, depth
     FROM tree
     ORDER BY part_id, leaf_node_id, depth DESC, sort_order, id`
  ).bind(...candidates.map((part) => part.id)).all();

  const byPartId = new Map(candidates.map((part) => [part.id, part]));
  const groups = new Map();
  for (const row of result.results || []) {
    const key = `${row.part_id}:${row.leaf_node_id}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(row);
  }

  const paths = [];
  const partsWithTree = new Set();
  for (const rows of groups.values()) {
    const part = byPartId.get(rows[0]?.part_id);
    if (!part) continue;
    partsWithTree.add(part.id);
    const branchNodes = rows.map((row) => ({ node_id: row.node_id, label: row.label, sort_order: row.sort_order, parent_id: row.parent_id }));
    const partNode = {
      kind: "part",
      part_id: part.id,
      label: partLeafLabel(part),
      part_query: partLeafQuery(part),
    };
    paths.push({
      node_id: rows[rows.length - 1]?.leaf_node_id,
      part_id: part.id,
      path: [...branchNodes.map((node) => node.label), partNode.label],
      nodes: [...branchNodes, partNode],
      part,
    });
  }

  for (const part of candidates) {
    if (partsWithTree.has(part.id)) continue;
    const partNode = {
      kind: "part",
      part_id: part.id,
      label: partLeafLabel(part),
      part_query: partLeafQuery(part),
    };
    paths.push({
      part_id: part.id,
      path: [partNode.label],
      nodes: [partNode],
      part,
    });
  }

  return paths;
}

async function loadTreeRoots(env) {
  const result = await env.DB.prepare(
    `SELECT id AS node_id, label, sort_order
     FROM part_tree_node
     WHERE parent_id IS NULL
     ORDER BY sort_order, id`
  ).bind().all();
  return result.results || [];
}

export async function handleViepsTree(request, env) {
  if (request.method !== "GET") return json({ error: "method not allowed" }, 405);

  const url = new URL(request.url);
  const stockOnlyParam = text(url.searchParams.get("stock_only"));
  if (stockOnlyParam && stockOnlyParam !== "0" && stockOnlyParam !== "1") {
    return json({ error: "invalid stock-only filter", error_code: "stock_filter_invalid" }, 400);
  }
  const stockOnly = stockOnlyParam === "1";
  const rootMode = url.searchParams.get("root") === "1";
  const rawNodeId = text(url.searchParams.get("node_id"));
  if (rootMode && rawNodeId) {
    return json({ error: "root browse and selected node cannot be combined", error_code: "tree_request_invalid" }, 400);
  }
  const nodeId = rawNodeId ? Number(rawNodeId) : null;
  if (rawNodeId && (!Number.isInteger(nodeId) || nodeId <= 0)) {
    return json({ error: "valid tree node id is required", error_code: "tree_node_invalid" }, 400);
  }

  // The first-level index is authoritative. Root-level stock browsing is not
  // filtered by the current catalogue contract, so describe that explicitly.
  if (rootMode || nodeId === null) {
    const roots = await loadTreeRoots(env);
    return json({
      state: rootMode ? "root" : "empty",
      root_index_state: roots.length ? "available" : "empty",
      stock_browse_state: stockOnly ? "unsupported" : "not_requested",
      selected_node: null,
      path: [],
      roots,
      children: roots,
      parts: [],
      parts_tree: [],
    });
  }


  const selectedNode = await env.DB.prepare(
    `SELECT id, parent_id, label, sort_order
     FROM part_tree_node
     WHERE id = ?`
  ).bind(nodeId).first();

  if (!selectedNode) {
    return json({ error: "tree node not found", error_code: "tree_node_not_found", node_id: nodeId }, 404);
  }

  const stockClause = stockOnly
    ? `AND EXISTS (
         SELECT 1 FROM stock_item s
         WHERE s.part_id = p.id AND s.available = 1 AND s.quantity > 0
       )`
    : "";

  const [pathResult, childrenResult, partsResult, roots] = await Promise.all([
    env.DB.prepare(
      `WITH RECURSIVE ancestors(id, parent_id, label, sort_order, depth) AS (
         SELECT id, parent_id, label, sort_order, 0
         FROM part_tree_node
         WHERE id = ?
         UNION ALL
         SELECT parent.id, parent.parent_id, parent.label, parent.sort_order, child.depth + 1
         FROM part_tree_node parent
         INNER JOIN ancestors child ON child.parent_id = parent.id
       )
       SELECT id AS node_id, parent_id, label, sort_order, depth
       FROM ancestors
       ORDER BY depth DESC`
    ).bind(nodeId).all(),
    env.DB.prepare(
      `SELECT id AS node_id, label, sort_order
       FROM part_tree_node
       WHERE parent_id = ?
       ORDER BY sort_order, id`
    ).bind(nodeId).all(),
    env.DB.prepare(
      `WITH RECURSIVE subtree(id) AS (
         SELECT id FROM part_tree_node WHERE id = ?
         UNION ALL
         SELECT child.id
         FROM part_tree_node child
         INNER JOIN subtree parent ON child.parent_id = parent.id
       )
       SELECT DISTINCT p.id, p.part_number_raw, p.part_number_normalized, p.description,
              p.source, p.source_ref, p.verification_status, tp.tree_node_id
       FROM subtree
       INNER JOIN part_tree_part tp ON tp.tree_node_id = subtree.id
       INNER JOIN part p ON p.id = tp.part_id
       WHERE 1 = 1
       ${stockClause}
       ORDER BY p.part_number_normalized, p.part_number_raw, p.description, p.id
       LIMIT 100`
    ).bind(nodeId).all(),
    loadTreeRoots(env),
  ]);

  const partRows = partsResult.results || [];
  const parts = [...new Map(partRows.map((part) => [part.id, candidatePayload(part)])).values()];
  // Keep every evidenced part-to-tree occurrence, even when several source
  // placements resolve to the same canonical PART identity.
  const partNodes = partRows.map((part) => ({ part_id: part.id, node_id: part.tree_node_id }));
  const pathRows = pathResult.results || [];
  const ancestryComplete = pathRows.length > 0
    && pathRows[0].parent_id == null
    && String(pathRows.at(-1).node_id) === String(nodeId)
    && pathRows.every((node, index) => index === 0
      || String(node.parent_id) === String(pathRows[index - 1].node_id));
  const partsTree = await buildPartLeafPaths(env, parts);
  return json({
    state: parts.length || (childrenResult.results || []).length ? "resolved" : "empty",
    root_index_state: roots.length ? "available" : "empty",
    roots,
    selected_node: {
      node_id: selectedNode.id,
      parent_id: selectedNode.parent_id,
      label: selectedNode.label,
    },
    path: pathRows,
    ancestry_state: ancestryComplete ? "complete" : "unavailable",
    children: childrenResult.results || [],
    parts,
    part_nodes: partNodes,
    parts_tree: partsTree,
  });
}

export async function handleViepsPart(request, env) {
  if (request.method !== "GET") return json({ error: "method not allowed" }, 405);

  const url = new URL(request.url);
  const query = text(url.searchParams.get("q"));
  if (!query) return json({ error: "part-number query is required" }, 400);

  const normalized = normalizePartNumber(query);

  const stockOnlyParam = text(url.searchParams.get("stock_only"));
  if (stockOnlyParam && stockOnlyParam !== "0" && stockOnlyParam !== "1") {
    return json({ error: "invalid stock-only filter", error_code: "stock_filter_invalid" }, 400);
  }
  const stockOnly = stockOnlyParam === "1";
  // Selection is constrained to the current query result; an ID alone cannot
  // discover a PART or bypass stock-only eligibility.
  const candidateIdParam = url.searchParams.get("candidate_id");
  if (candidateIdParam !== null && !/^[1-9]\d*$/.test(candidateIdParam)) {
    return json({ error: "invalid candidate id", error_code: "candidate_id_invalid" }, 400);
  }

  const { searchPath, candidates: allCandidates } = await findPartCandidates(env, query, normalized);
  if (!allCandidates.length) return json({ error: "part not found", query, state: "not_found", search_path: searchPath }, 404);

  const candidates = stockOnly
    ? allCandidates.filter((part) => Number(part.has_available_stock) === 1)
    : allCandidates;
  if (!candidates.length) {
    return json({
      error: "no stocked part match",
      error_code: "stock_filter_no_match",
      state: "stock_filtered_empty",
      query,
      search_path: searchPath,
    }, 404);
  }

  const exactCandidates = searchPath === "deterministic"
    ? candidates.filter((part) => isExactCandidate(part, query, normalized))
    : [];
  // Resolve an explicitly chosen canonical PART only if it survives the same
  // search and supported STOCK filter that produced the candidate list.
  const chosen = candidateIdParam === null ? null
    : candidates.find((part) => String(part.id) === candidateIdParam);
  if (candidateIdParam !== null && !chosen) {
    return json({ error: "candidate not in current results", error_code: "candidate_not_found" }, 404);
  }
  if (!chosen && (exactCandidates.length > 1 || (!exactCandidates.length && candidates.length > 1))) {
    const matches = candidates.map(candidatePayload);
    const [partsTree, treeRoots] = await Promise.all([
      buildPartLeafPaths(env, matches), loadTreeRoots(env),
    ]);
    const pathsByPart = new Map();
    for (const entry of partsTree) {
      if (!pathsByPart.has(entry.part_id)) pathsByPart.set(entry.part_id, []);
      if (entry.node_id !== undefined) {
        pathsByPart.get(entry.part_id).push({
          node_id: entry.node_id,
          nodes: entry.nodes.filter((node) => node.kind !== "part"),
        });
      }
    }
    return json({
      state: "multiple_match",
      query,
      normalized_query: normalized,
      search_path: searchPath,
      matches: matches.map((part) => ({ ...part, tree_paths: pathsByPart.get(part.id) || [] })),
      tree_roots: treeRoots,
      parts_tree: partsTree,
      selected_part: null,
    });
  }

  const part = candidatePayload(chosen || exactCandidates[0] || candidates[0]);

  const [occurrenceResult, treeResult, imageResult, diagramResult, fitmentResult, stockResult, treeRoots] = await Promise.all([
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
    loadTreeRoots(env),
  ]);

  const nodes = treeResult.results || [];
  const byId = new Map(nodes.map((node) => [node.id, node]));
  const leafNodes = nodes.filter((node) => !nodes.some((candidate) => candidate.parent_id === node.id));
  const paths = leafNodes.map((node) => {
    const pathNodes = [];
    let current = node;
    const seen = new Set();
    while (current && !seen.has(current.id)) {
      seen.add(current.id);
      pathNodes.unshift(current);
      current = byId.get(current.parent_id);
    }
    return {
      node_id: node.id,
      path: pathNodes.map((item) => item.label),
      nodes: pathNodes.map((item) => ({ node_id: item.id, label: item.label })),
    };
  });

  return json({
    state: "resolved",
    search_path: searchPath,
    part,
    tree_roots: treeRoots,
    occurrences: occurrenceResult.results || [],
    parts_tree: paths,
    images: imageResult.results || [],
    diagrams: diagramResult.results || [],
    fitment: fitmentResult.results || [],
    stock: stockResult.results || [],
  });
}
