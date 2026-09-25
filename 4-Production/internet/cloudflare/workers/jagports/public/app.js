const $ = (id) => {
  if (typeof document !== "undefined" && typeof document.getElementById === "function") {
    return document.getElementById(id);
  }
  if (typeof globalThis !== "undefined" && typeof globalThis.$ === "function") {
    return globalThis.$(id);
  }
  return null;
};
const i18n = globalThis.viepsI18n;
const t = (key, options) => i18n?.t(key, options) ?? key;
const empty = (message) => `<p class="empty">${escapeHtml(message)}</p>`;
let currentData = null;
let fitmentRows = [];
let visualItems = [];
let requestVersion = 0;
let selectedTreeNodeId = null;
let cachedRootData = null;
let cachedBrowseData = null;
let cachedCandidatesData = null;
let pendingCandidateId = null;
let viewMode = "empty";
let suitabilitySelection = new Set();
let suitabilityRequestVersion = 0;
let suitabilityData = null;
let suitabilityMatchingIds = null; // Null means the source-backed filter is unavailable.


const BROWSE_RANGE_LABELS = Object.freeze([
  "Jaguar Accessories", "Daimler Limousine", "E-Pace", "E-Type", "F-Pace",
  "F-Type", "S-Type", "X-Type", "XE Range", "XF Range", "XJ Range",
  "XJS", "XK Range",
]); // #875 browse-only labels, never evidence of PART fitment.
function renderBrowseRangeIndex() {
  const note = escapeHtml(t("header.filter_pending"));
  $("ranges").innerHTML = `<p id="rangeBrowseNote" class="muted compact-note">${note}</p>
    <ul class="range-list browse-range-list">${BROWSE_RANGE_LABELS.map((label, index) =>
      `<li><label><input type="checkbox" disabled aria-describedby="rangeBrowseNote"
        data-browse-range-index="${index}"> ${escapeHtml(label)}</label></li>`).join("")}</ul>`;
}
function renderApplicableState(state) {
  const message = state === "error" ? t("ranges.error")
    : state === "no_match" ? t("ranges.no_match")
    : t("ranges.unavailable");
  $("ranges").innerHTML = empty(message);
}


function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"]/g, (ch) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;",
  }[ch]));
}

function formatMoney(value, currency) {
  if (value === null || value === undefined || value === "") return escapeHtml(t("common.not_supplied"));
  const number = Number(value);
  if (!Number.isFinite(number)) return escapeHtml(value);
  return escapeHtml(i18n?.formatCurrency(number, currency || "EUR") ?? `${number} ${currency || "EUR"}`);
}

function formatStockLocationSummary(stock) {
  const locations = [...new Set(stock.map((item) => item.location).filter(Boolean))];
  return locations.length ? locations.join(", ") : t("stock.no_fixture_location");
}

function formatStockQuality(item) {
  const code = typeof item.condition_code === "string" ? item.condition_code : null;
  if (code && /^[A-E]$/.test(code)) {
    return `${code} — ${t(`stock.quality.${code}.label`)}`;
  }
  if (code) return code;
  return t("stock.quality.unclassified.label");
}

function partSearchValue(part) {
  return part.part_number_normalized || part.part_number_raw || part.description || "";
}

function partDisplayLabel(part) {
  const identity = part.part_number_normalized || part.part_number_raw || part.description || `#${part.id}`;
  return part.description && part.description !== identity ? `${identity} — ${part.description}` : identity;
}

async function resolvePart(partNumber, stockOnly = false, candidateId = null) {
  const stockFilter = stockOnly ? "&stock_only=1" : "";
  const candidateFilter = candidateId === null ? "" : `&candidate_id=${encodeURIComponent(candidateId)}`;
  const response = await fetch(`/api/vieps/part?q=${encodeURIComponent(partNumber)}${stockFilter}${candidateFilter}`);
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.error || `${response.status} ${response.statusText}`);
    error.code = data.error_code;
    throw error;
  }
  return data;
}

async function resolveTreeRoots(stockOnly = false) {
  const response = await fetch(`/api/vieps/tree?root=1${stockOnly ? "&stock_only=1" : ""}`);
  if (!response.ok) throw new Error("tree roots unavailable");
  return response.json();
}

function clearSelectionUrl() {
  if (!globalThis.location || typeof URLSearchParams !== "function") return;
  const params = new URLSearchParams(globalThis.location.search || "");
  if (!params.has("part") && !params.has("tree") && !params.has("candidate_id")) return;
  params.delete("part");
  params.delete("tree");
  params.delete("candidate_id");
  const query = params.toString();
  globalThis.history?.replaceState?.(null, "",
    `${globalThis.location.pathname || "/"}${query ? `?${query}` : ""}${globalThis.location.hash || ""}`);
}

async function resolveTreeNode(nodeId, stockOnly = false) {
  const stockFilter = stockOnly ? "&stock_only=1" : "";
  const response = await fetch(`/api/vieps/tree?node_id=${encodeURIComponent(nodeId)}${stockFilter}`);
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.error || `${response.status} ${response.statusText}`);
    error.code = data.error_code;
    throw error;
  }
  return data;
}

function renderStockRows(stock) {
  if (!stock.length) return "";
  return `<div class="stock-section">
    <p class="compact-note stock-note">${escapeHtml(t("stock.note"))}</p>
    <div class="table-scroll"><table class="stock-table">
      <thead><tr><th>${escapeHtml(t("stock.qty"))}</th><th>${escapeHtml(t("stock.status"))}</th><th>${escapeHtml(t("stock.condition"))}</th><th>${escapeHtml(t("stock.location"))}</th><th>${escapeHtml(t("stock.price"))}</th><th>${escapeHtml(t("stock.evidence"))}</th></tr></thead>
      <tbody>${stock.map((item) => `<tr>
        <td>${escapeHtml(item.quantity ?? "0")}</td>
        <td>${escapeHtml(item.status || (item.available ? "available" : "unavailable"))}</td>
        <td>${escapeHtml(formatStockQuality(item))}</td>
        <td>${escapeHtml(item.location || t("common.not_supplied"))}</td>
        <td>${formatMoney(item.price, item.currency)}</td>
        <td>${escapeHtml(item.source_ref || item.source || t("stock.fixture_evidence"))}</td>
      </tr>`).join("")}</tbody>
    </table></div>
  </div>`;
}

function renderPart(part, occurrences = [], stock = []) {
  const occurrenceText = occurrences.length
    ? t("part.epc_occurrence", { count: occurrences.length })
    : t("part.no_epc_context");
  const stockText = stock.length
    ? t("part.fixture_stock_record", { count: stock.length })
    : t("part.no_fixture_stock");
  $("partCard").innerHTML = `
    <strong>${escapeHtml(part.part_number_normalized || t("part.no_jaguar_part_number"))}</strong>
    <p>${escapeHtml(part.description || t("part.no_description"))}</p>
    <dl>
      <dt>${escapeHtml(t("part.raw_part_number"))}</dt><dd>${escapeHtml(part.part_number_raw || t("common.not_supplied"))}</dd>
      <dt>${escapeHtml(t("part.verification"))}</dt><dd>${escapeHtml(part.verification_status || t("common.not_recorded"))}</dd>
      <dt>${escapeHtml(t("part.source"))}</dt><dd>${escapeHtml(part.source || t("common.not_recorded"))}</dd>
      <dt>${escapeHtml(t("part.epc_context"))}</dt><dd>${escapeHtml(occurrenceText)}</dd>
      <dt>${escapeHtml(t("part.fixture_stock"))}</dt><dd>${escapeHtml(stockText)}</dd>
      <dt>${escapeHtml(t("stock.location"))}</dt><dd>${escapeHtml(formatStockLocationSummary(stock))}</dd>
    </dl>
    ${renderStockRows(stock)}`;
}

function partTreeLeafLabel(part) {
  const identity = part.part_number_normalized || part.part_number_raw || "";
  const description = part.description || "";
  if (description && identity && description !== identity) return `${description} — ${identity}`;
  return description || identity || `#${part.id}`;
}

function renderTree(paths = [], options = {}) {
  // Merge by stable node identity *within the parent*, not by presentation label.
  // The same canonical PART may legitimately appear beneath different EPC paths.
  const roots = new Map();
  let unlinkedIndex = 0;
  const keyFor = (node) => node.node_id !== undefined && node.node_id !== null
    ? `id:${node.node_id}` : `unlinked:${++unlinkedIndex}`;

  const insertNode = (node, parent = null) => {
    const collection = parent ? parent.children : roots;
    const key = keyFor(node);
    if (!collection.has(key)) {
      collection.set(key, {
        key,
        nodeId: node.node_id ?? null,
        label: String(node.label ?? ""),
        order: Number.isFinite(Number(node.sort_order)) ? Number(node.sort_order) : Number.MAX_SAFE_INTEGER,
        children: new Map(),
        parts: new Map(),
      });
    }
    return collection.get(key);
  };

  const normalizePath = (entry) => {
    if (Array.isArray(entry.nodes) && entry.nodes.length) {
      return entry.nodes.filter((node) => node.kind !== "part");
    }
    return (entry.path || []).map((label) => ({ label }));
  };

  const appendPath = (entry) => {
    let last = null;
    for (const item of normalizePath(entry)) last = insertNode(item, last);
    return last;
  };

  for (const root of options.roots || []) insertNode(root);
  for (const entry of paths) appendPath(entry);

  for (const leaf of options.partLeaves || []) {
    const part = leaf.part;
    if (!part || !partSearchValue(part)) continue;
    const key = `part:${part.id ?? partSearchValue(part)}`;
    const targets = leaf.paths || [];
    if (!targets.length) continue; // No invented catalogue parent.
    for (const path of targets) {
      const parent = appendPath(path);
      if (parent) parent.parts.set(key, part);
    }
  }

  const selectedNodeId = options.selectedNodeId === null || options.selectedNodeId === undefined
    ? null : String(options.selectedNodeId);
  const selectedPartId = options.selectedPartId === null || options.selectedPartId === undefined
    ? null : String(options.selectedPartId);
  const sortNodes = (items) => [...items].sort((a, b) =>
    a.order - b.order || a.label.localeCompare(b.label) || String(a.nodeId).localeCompare(String(b.nodeId)));
  const partHref = (part, contextNodeId) => {
    const query = encodeURIComponent(partSearchValue(part));
    const context = contextNodeId !== null && contextNodeId !== undefined
      ? `&tree=${encodeURIComponent(contextNodeId)}` : "";
    return `?part=${query}${context}`;
  };
  let markedPartLeaf = false;
  const renderPartLeaf = (part, depth, contextNodeId) => {
    const selected = !markedPartLeaf && selectedPartId !== null
      && (selectedNodeId === null || String(contextNodeId) === selectedNodeId)
      && String(part.id) === selectedPartId;
    if (selected) markedPartLeaf = true;
    return `<li class="tree-part-leaf" role="treeitem"><div class="tree-part-row${selected ? ' selected-path' : ''}">
      <a href="${partHref(part, contextNodeId)}" data-part-query="${escapeHtml(partSearchValue(part))}" data-part-id="${escapeHtml(part.id ?? "")}" data-part-context="${escapeHtml(contextNodeId ?? "")}"
         ${selected ? 'aria-current="page"' : ''}>${escapeHtml(partTreeLeafLabel(part))}</a>
    </div></li>`;
  };
  const renderNode = (node, depth) => {
    const selected = selectedPartId === null && selectedNodeId !== null &&
      node.nodeId !== null && String(node.nodeId) === selectedNodeId;
    const label = node.nodeId !== null
      ? `<a href="?tree=${encodeURIComponent(node.nodeId)}" data-tree-node-id="${escapeHtml(node.nodeId)}"
            ${selected ? 'aria-current="location"' : ''}>${escapeHtml(node.label)}</a>`
      : `<span>${escapeHtml(node.label)}</span>`;
    const children = sortNodes(node.children.values());
    const parts = [...node.parts.values()].sort((a, b) => partTreeLeafLabel(a).localeCompare(partTreeLeafLabel(b)));
    const descendants = [
      ...children.map((child) => renderNode(child, depth + 1)),
      ...parts.map((part) => renderPartLeaf(part, depth + 1, node.nodeId)),
    ];
    return `<li role="treeitem"${descendants.length ? ' aria-expanded="true"' : ''}>
       <div class="tree-node-row tree-depth-${Math.min(depth, 3)}${selected ? ' selected-path' : ''}">${label}</div>
       ${descendants.length ? `<ul class="tree-children" role="group">${descendants.join("")}</ul>` : ""}
     </li>`;
  };
  const rows = sortNodes(roots.values()).map((root) => renderNode(root, 0));
  $("tree").innerHTML = rows.length
    ? `<ul class="tree-branch" role="tree">${rows.join("")}</ul>`
    : empty(t("tree.empty"));
  $("tree").querySelectorAll?.("[data-part-query]").forEach((link) => {
    link.addEventListener("click", (event) => {
      event.preventDefault();
      selectedTreeNodeId = link.dataset.partContext || null;
      pendingCandidateId = link.dataset.partId || null;
      $("partNumber").value = cachedCandidatesData?.query || link.dataset.partQuery;
      $("partSearch").dispatchEvent?.(new Event("submit", { cancelable: true }));
    });
  });
}

function canonicalCandidates(parts = []) {
  // API candidates are canonical, but defend the UI against repeated EPC
  // occurrences without ever merging distinct PART IDs by display label.
  return [...new Map(parts.filter((part) => part?.id != null)
    .map((part) => [String(part.id), part])).values()];
}

function candidateLeaves(data) {
  const paths = Array.isArray(data.parts_tree) ? data.parts_tree : [];
  return canonicalCandidates(visibleCandidates(data.matches || [])).map((part) => ({
    part,
    paths: (part.tree_paths?.length ? part.tree_paths : paths
      .filter((path) => String(path.part_id) === String(part.id))
      .map((path) => ({ nodes: (path.nodes || []).filter((node) => node.kind !== "part") })))
      .filter((path) => path.nodes?.length && path.nodes.every((node) => node.node_id != null)),
  }));
}


function visibleCandidates(parts = []) {
  if (!suitabilitySelection.size || suitabilityMatchingIds === null) return parts;
  return parts.filter((part) => suitabilityMatchingIds.has(String(part.id)));
}

function showSuitability() {
  const panel = $("variationOptions"), status = $("variationsStatus");
  if (!panel || !status) return;
  if (!suitabilityData?.fixture_mode) {
    panel.innerHTML = "";
    status.textContent = t("suitability.unavailable");
    return;
  }
  const choices = (suitabilityData.categories || []).flatMap((category) =>
    (category.values || []).map((value) => ({
      ...value, category: category.name,
      selected: suitabilitySelection.has(value.id),
      available: (suitabilityData.available_options || []).includes(value.id),
    })));
  const locale = i18n?.language || "en";
  choices.sort((a, b) => Number(b.selected) - Number(a.selected)
    || a.name.localeCompare(b.name, locale) || a.category.localeCompare(b.category, locale)
    || a.id.localeCompare(b.id));
  panel.innerHTML = choices.map((item) => {
    const source = item.source_descriptions || [];
    const title = source.map((s) => `${s.original_text} [${s.language}; ${s.source_namespace}; ${s.locator}]`).join(" · ");
    return `<label class="variation-choice" title="${escapeHtml(title)}">
      <input type="checkbox" data-suitability-facet="${escapeHtml(item.id)}"
        aria-describedby="variationsStatus" ${item.selected ? "checked" : ""}
        ${!item.selected && !item.available ? "disabled" : ""}>
      <span>${escapeHtml(item.name)}</span>
      <small>(${escapeHtml(item.category)})</small>
    </label>`;
  }).join("");
  const matching = suitabilityData.matches?.length || 0;
  status.textContent = !choices.length ? t("suitability.no_options")
    : suitabilityData.state === "unavailable" && matching === 0
      ? t("suitability.incomplete")
      : suitabilitySelection.size && matching === 0 ? t("suitability.no_matches")
      : t("suitability.fixture_count", { count: matching });
}

async function refreshSuitability(query, stockOnly, mainVersion = requestVersion) {
  const version = ++suitabilityRequestVersion;
  const params = new URLSearchParams({
    q: query || "", stock_only: stockOnly ? "1" : "0",
    ui_language: i18n?.language || "en",
  });
  for (const id of suitabilitySelection) params.append("facet", id);
  try {
    const response = await fetch("/api/vieps/suitability?" + params.toString());
    const data = await response.json();
    if (version !== suitabilityRequestVersion || mainVersion !== requestVersion) return;
    if (!response.ok || data.fixture_mode !== true) {
      // Missing mapping never makes an ordinary PART result look unsuitable.
      suitabilityData = null;
      suitabilityMatchingIds = null;
      showSuitability();
      return;
    }
    suitabilityData = data;
    suitabilityMatchingIds = new Set((data.matches || []).map((m) => String(m.part_id)));
    showSuitability();
    if (viewMode === "candidates" && cachedCandidatesData) {
      renderPartCandidates(cachedCandidatesData);
      $("searchStatus").textContent = suitabilitySelection.size
        ? t("suitability.result_count", { count: visibleCandidates(cachedCandidatesData.matches || []).length })
        : t("search.multiple_matches", { count: cachedCandidatesData.matches?.length || 0 });
    } else if (viewMode === "resolved" && currentData && suitabilitySelection.size) {
      if (!suitabilityMatchingIds.has(String(currentData.part?.id))) {
        // A selected canonical PART cannot remain selected outside the
        // surviving occurrence-backed candidate set.
        if (cachedCandidatesData) {
          viewMode = "candidates";
          renderPartCandidates(cachedCandidatesData);
        } else {
          resetContext();
          renderTree([], { roots: cachedRootData?.roots || [] });
        }
        $("searchStatus").textContent = t("suitability.no_matches");
      } else {
        renderResolvedData(currentData);
      }
    }
  } catch {
    if (version === suitabilityRequestVersion && mainVersion === requestVersion) {
      suitabilityData = null;
      suitabilityMatchingIds = null;
      showSuitability();
    }
  }
}

function clearSuitability() {
  ++suitabilityRequestVersion;
  suitabilitySelection.clear();
  suitabilityData = null;
  suitabilityMatchingIds = null;
  showSuitability();
}

function renderSearchResults(parts = [], selectedId = null) {
  const panel = $("searchResults");
  if (!panel) return;
  const candidates = canonicalCandidates(visibleCandidates(parts));
  panel.innerHTML = candidates.length ? `<ul class="results-list">${candidates.map((part) => {
    const selected = selectedId != null && String(part.id) === String(selectedId);
    return `<li class="result-row${selected ? " selected-result" : ""}">
      <a href="?part=${encodeURIComponent(partSearchValue(part))}&candidate_id=${encodeURIComponent(part.id)}"
         data-result-part-id="${escapeHtml(part.id)}" ${selected ? 'aria-current="page"' : ""}>${escapeHtml(partDisplayLabel(part))}</a>
      <label class="bookmark-label"><input type="checkbox" disabled aria-label="${escapeHtml(`${t("search.bookmark_pending")}: ${partDisplayLabel(part)}`)}" title="${escapeHtml(t("search.bookmark_pending"))}"><span class="bookmark-caption">${escapeHtml(t("search.bookmark_pending"))}</span></label>
    </li>`;
  }).join("")}</ul>` : empty(t("part.no_part_selected"));
  panel.querySelectorAll?.("[data-result-part-id]").forEach((link) => {
    link.addEventListener("click", (event) => {
      event.preventDefault();
      const part = candidates.find((entry) => String(entry.id) === link.dataset.resultPartId);
      if (!part) return;
      selectedTreeNodeId = null; // A result row cannot guess an EPC occurrence.
      pendingCandidateId = String(part.id);
      $("partNumber").value = cachedCandidatesData?.query || partSearchValue(part);
      $("partSearch").dispatchEvent?.(new Event("submit", { cancelable: true }));
    });
  });
}

function renderPartCandidates(data) {
  $("partCard").innerHTML = empty(t("part.no_part_selected"));
  const allowed = new Set(visibleCandidates(data.matches || []).map((part) => String(part.id)));
  const paths = (data.parts_tree || []).filter((path) => allowed.has(String(path.part_id)));
  renderTree(paths, {
    roots: data.tree_roots || cachedRootData?.roots || [],
    partLeaves: candidateLeaves(data),
  });
  renderSearchResults(data.matches || []);
}

function renderTreeBrowse(data) {
  const path = Array.isArray(data.path) ? data.path : [];
  const children = Array.isArray(data.children) ? data.children : [];
  const selectedNodeId = data.selected_node?.node_id;
  const selectedPath = { nodes: path.map((node) => ({ node_id: node.node_id, label: node.label, parent_id: node.parent_id, sort_order: node.sort_order })) };
  const childrenPaths = children.map((child) => ({
    nodes: [...selectedPath.nodes, { node_id: child.node_id, label: child.label, sort_order: child.sort_order }],
  }));
  const evidencedLinks = Array.isArray(data.part_nodes) ? data.part_nodes : [];
  // Compatibility with main's existing parts_tree API: use its terminal
  // stable catalogue node when explicit part_nodes is unavailable. Do not
  // expose descendants under unrelated collapsed branches.
  const linkedParts = (data.parts || []).filter((part) =>
    evidencedLinks.some((link) =>
      String(link.part_id) === String(part.id) && String(link.node_id) === String(selectedNodeId))
    || (data.parts_tree || []).some((entry) => String(entry.part_id) === String(part.id)
      && String(entry.node_id) === String(selectedNodeId)
      && entry.nodes?.some((node) => String(node.node_id) === String(selectedNodeId))));
  renderTree([...(path.length ? [selectedPath] : []), ...childrenPaths], {
    roots: data.roots || [],
    selectedNodeId,
    partLeaves: linkedParts.map((part) => ({ part, paths: [selectedPath] })),
  });
}

function renderSelectedVisual() {
  const item = visualItems[Number($("visualSelect").value)];
  if (!item) {
    $("visuals").innerHTML = empty(t("part.image_or_diagram_unavailable"));
    return;
  }
  const available = item.image_url && (!item.availability_status || item.availability_status === "available");
  $("visuals").innerHTML = `<figure><figcaption>${escapeHtml(item.label)}</figcaption>${available
    ? `<img src="${escapeHtml(item.image_url)}" alt="${escapeHtml(item.label)}">`
    : empty(t("part.image_or_diagram_unavailable"))}</figure>`;
  $("visuals").querySelector("img")?.addEventListener("error", () => {
    $("visuals").innerHTML = empty(t("part.image_or_diagram_unavailable"));
  });
}

function renderVisuals(images, diagrams) {
  const visualPriority = (item) => {
    const available = item.image_url && (!item.availability_status || item.availability_status === "available");
    const approved = item.verification_status === "verified" || item.verification_status === "fixture";
    if (available && approved) return 0;
    if (available) return 1;
    return 2;
  };
  visualItems = [
    ...images.map((item) => ({ ...item, label: item.description || t("visual.part_image") })),
    ...diagrams.map((item) => ({ ...item, label: item.title || t("part.diagram") })),
  ].sort((left, right) => visualPriority(left) - visualPriority(right));
  $("visualSelect").innerHTML = visualItems.map((item, index) =>
    `<option value="${index}">${escapeHtml(item.label)}</option>`).join("");
  $("visualSelect").value = "0";
  $("visualChooser").hidden = visualItems.length < 2;
  renderSelectedVisual();
}

function renderSelectedRange() {
  const code = $("rangeSelect").value;
  const rangeRows = fitmentRows.filter((item) => item.range_code === code);
  const selected = rangeRows.filter((item) => item.applicability_state === "applicable");
  const range = selected[0];
  $("locationStatus").textContent = range
    ? t("location.range_unavailable", { range: range.range_name })
    : t("location.verified_unavailable");

  let variationStateKey = "fitment.no_confirmed";
  if (!selected.length && rangeRows.some((item) => item.applicability_state === "unavailable")) {
    variationStateKey = "fitment.unavailable";
  } else if (!selected.length && rangeRows.length && rangeRows.every((item) => item.applicability_state === "excluded")) {
    variationStateKey = "fitment.no_match";
  }

  $("rangeEvidence").innerHTML = selected.length ? `<div class="table-scroll"><table>
    <thead><tr><th>${escapeHtml(t("fitment.variation"))}</th><th>${escapeHtml(t("fitment.qualifier"))}</th><th>${escapeHtml(t("fitment.verification"))}</th></tr></thead>
    <tbody>${selected.map((item) => `<tr><td>${escapeHtml(item.variation || t("common.not_specified"))}</td><td>${escapeHtml(item.qualifier || t("common.not_supplied"))}</td><td>${escapeHtml(item.verification_status || t("common.not_recorded"))}</td></tr>`).join("")}</tbody>
    </table></div>` : empty(t(variationStateKey));
}

function renderFitment(fitment, declaredState = null) {
  // Consume only positive assertions returned by the approved PART read path.
  // The 13 synthetic browse labels never enter this selected-PART result.
  fitmentRows = Array.isArray(fitment) ? fitment : [];
  const applicable = fitmentRows.filter((item) =>
    item.applicability_state === "applicable" && item.range_code && item.range_name);
  const ranges = [...new Map(applicable.map((item) => [item.range_code, item])).values()];
  const error = declaredState === "error" || fitmentRows.some((item) => item.applicability_state === "error");
  const unavailable = !fitmentRows.length || declaredState === "unavailable"
    || fitmentRows.some((item) => item.applicability_state === "unavailable");
  const confirmedNoMatch = declaredState === "no_match"
    || (fitmentRows.length > 0 && fitmentRows.every((item) =>
      ["excluded", "no_match"].includes(item.applicability_state)));

  const emptyState = error ? "error" : confirmedNoMatch ? "no_match" : "unavailable";
  const emptyLabel = t(emptyState === "error" ? "ranges.error"
    : emptyState === "no_match" ? "ranges.no_match" : "ranges.unavailable");
  $("rangeSelect").innerHTML = ranges.length ? ranges.map((item) =>
    `<option value="${escapeHtml(item.range_code)}">${escapeHtml(item.range_code)} — ${escapeHtml(item.range_name)}</option>`).join("")
    : `<option value="">${escapeHtml(emptyLabel)}</option>`;
  $("rangeSelect").disabled = !ranges.length;
  $("ranges").innerHTML = ranges.length ? `<ul class="range-list">${ranges.map((item) =>
    `<li>${escapeHtml(item.range_code)} — ${escapeHtml(item.range_name)}</li>`).join("")}</ul>`
    : empty(emptyLabel);
  renderSelectedRange();
  if (!ranges.length) {
    $("rangeEvidence").innerHTML = empty(t(error ? "fitment.unavailable"
      : confirmedNoMatch ? "fitment.no_match" : "fitment.unavailable"));
  }
}

function renderResolvedData(data) {
  currentData = data;
  renderPart(data.part, data.occurrences || [], data.stock || []);
  renderTree(cachedCandidatesData
    ? (cachedCandidatesData.parts_tree || []).filter((path) =>
      visibleCandidates(cachedCandidatesData.matches || []).some((p) => String(p.id) === String(path.part_id)))
    : data.parts_tree || [], {
    roots: data.tree_roots || cachedRootData?.roots || [],
    selectedPartId: data.part?.id,
    selectedNodeId: selectedTreeNodeId,
    partLeaves: cachedCandidatesData ? candidateLeaves(cachedCandidatesData)
      : [{ part: data.part, paths: (data.parts_tree || []).filter((path) => path.nodes?.some((node) => node.node_id != null)) }],
  });
  renderSearchResults(cachedCandidatesData?.matches || [data.part], data.part?.id);
  renderVisuals(data.images || [], data.diagrams || []);
  renderFitment(data.fitment, data.fitment_state);
}

function resetContext(messageKey = "part.no_part_selected") {
  currentData = null;
  fitmentRows = [];
  visualItems = [];
  const message = t(messageKey);
  $("partCard").innerHTML = empty(message);
  renderSearchResults();
  $("tree").innerHTML = empty(t("tree.no_selection", { message }));
  $("visuals").innerHTML = empty(t("visual.no_image_selected"));
  $("visualChooser").hidden = true;
  $("visualSelect").innerHTML = "";
  $("rangeSelect").innerHTML = `<option value="">${escapeHtml(t("ranges.no_part_selected"))}</option>`;
  $("rangeSelect").disabled = true;
  renderBrowseRangeIndex();
  $("rangeEvidence").innerHTML = empty(t("fitment.browse_help"));
  $("vehicleLocation").innerHTML = empty(t("location.unavailable"));
  $("locationStatus").textContent = t("location.select_help");
}

function localizeError(error) {
  if (error?.code === "stock_filter_no_match") return t("search.no_stock_match");
  return String(error?.message || "") === "part not found" ? t("search.not_found") : t("search.error");
}

function refreshForLanguageChange() {
  i18n?.applyDocument();
  if (currentData) {
    renderResolvedData(currentData);
    $("searchStatus").textContent = t("search.resolved");
  } else if (viewMode === "candidates" && cachedCandidatesData) {
    renderPartCandidates(cachedCandidatesData);
    $("searchStatus").textContent = t("search.multiple_matches", { count: cachedCandidatesData.matches?.length || 0 });
  } else if (viewMode === "browse" && cachedBrowseData) {
    renderTreeBrowse(cachedBrowseData);
    $("searchStatus").textContent = t("tree.browse_parts", { count: cachedBrowseData.parts?.length || 0 });
  } else if (cachedRootData) {
    renderTree([], { roots: cachedRootData.roots || [] });
    $("searchStatus").textContent = t("search.prompt");
  } else {
    resetContext();
    $("searchStatus").textContent = t("search.prompt");
  }
}

// The Stock help button is informational: its state never changes stock filtering.
function setupStockHelp() {
  const button = $("stockHelpButton");
  const popover = $("stockHelpPopover");
  if (!button || !popover) return;
  let pinned = false;
  const show = (open) => {
    popover.hidden = !open;
    button.setAttribute?.("aria-expanded", String(open));
  };
  button.addEventListener("mouseenter", () => { if (!pinned) show(true); });
  button.addEventListener("mouseleave", () => { if (!pinned) show(false); });
  button.addEventListener("focus", () => show(true));
  button.addEventListener("blur", () => { if (!pinned) show(false); });
  button.addEventListener("click", (event) => {
    event.stopPropagation?.();
    pinned = !pinned;
    show(pinned);
  });
  document.addEventListener?.("pointerdown", (event) => {
    if (pinned && !button.contains?.(event.target) && !popover.contains?.(event.target)) {
      pinned = false;
      show(false);
    }
  });
  document.addEventListener?.("keydown", (event) => {
    if (event.key === "Escape" && !popover.hidden) {
      pinned = false;
      button.focus?.();
      // Focusing the trigger may fire its show-on-focus handler: close last.
      show(false);
    }
  });
}

function setupViepsUi() {
  if (!$("partSearch")) return;
  i18n?.init();
  setupStockHelp();
  resetContext();
  $("searchStatus").textContent = t("search.prompt");

  document.querySelectorAll?.("[data-language]").forEach((control) => {
    control.addEventListener("click", () => {
      i18n?.changeLanguage(control.dataset.language);
      refreshForLanguageChange();
      void refreshSuitability($("partNumber").value.trim(),
        Boolean($("availabilitySelect").checked));
    });
  });
  $("variationOptions")?.addEventListener("change", (event) => {
    const id = event.target?.dataset?.suitabilityFacet;
    if (!id) return;
    if (event.target.checked) suitabilitySelection.add(id);
    else suitabilitySelection.delete(id);
    // The API recomputes facets from the same current search/stock universe.
    void refreshSuitability($("partNumber").value.trim(),
      Boolean($("availabilitySelect").checked));
  });
  $("rangeSelect").addEventListener("change", renderSelectedRange);
  $("visualSelect").addEventListener("change", renderSelectedVisual);
  const loadRootBrowse = async (version, options = {}) => {
    $("searchStatus").className = "muted status-line";
    $("searchStatus").textContent = options.defaultLoad ? t("search.prompt") : t("tree.browse_loading");
    $("result").setAttribute("aria-busy", "true");
    try {
      const data = await resolveTreeRoots(Boolean($("availabilitySelect").checked));
      if (version !== requestVersion) return;
      cachedRootData = data;
      selectedTreeNodeId = null;
      cachedBrowseData = null;
      cachedCandidatesData = null;
      viewMode = "empty";
      renderTree([], { roots: data.roots || [] });
      void refreshSuitability("", Boolean($("availabilitySelect").checked), version);
      $("searchStatus").textContent = data.stock_browse_state === "unsupported"
        ? t("tree.no_selection", { message: t("search.prompt") }) : t("search.prompt");
    } catch (error) {
      if (version !== requestVersion) return;
      cachedRootData = null;
      $("tree").innerHTML = empty(t("tree.browse_error"));
      $("searchStatus").textContent = t("tree.browse_error");
      $("searchStatus").className = "error status-line";
    } finally {
      if (version === requestVersion) $("result").setAttribute("aria-busy", "false");
    }
  };

  $("partNumber").addEventListener("input", () => {
    const version = ++requestVersion;
    selectedTreeNodeId = null;
    pendingCandidateId = null;
    cachedBrowseData = null;
    cachedCandidatesData = null;
    viewMode = "empty";
    resetContext();
    $("result").setAttribute("aria-busy", "false");
    $("searchStatus").className = "muted status-line";
    if (!$("partNumber").value.trim()) {
      clearSuitability();
      clearSelectionUrl();
      void loadRootBrowse(version);
    } else {
      renderTree([], { roots: cachedRootData?.roots || [] });
      $("searchStatus").textContent = t("search.prompt_with_action");
    }
  });

  const browseTree = async (nodeId = null, options = {}) => {
    const version = ++requestVersion;
    clearSuitability(); // Tree context has no source-qualified suitability read yet.
    resetContext();
    viewMode = "empty";
    $("searchStatus").className = "muted status-line";
    $("searchStatus").textContent = options.defaultLoad ? t("search.prompt") : t("tree.browse_loading");
    $("result").setAttribute("aria-busy", "true");
    try {
      if (nodeId === null || nodeId === undefined || nodeId === "") {
        await loadRootBrowse(version, options);
        return;
      }
      const data = await resolveTreeNode(nodeId, Boolean($("availabilitySelect").checked));
      if (version !== requestVersion) return;
      if (data.ancestry_state === "unavailable") {
        cachedRootData = { roots: data.roots || [] };
        renderTree([], { roots: data.roots || [] });
        $("searchStatus").textContent = t("tree.browse_error");
        return;
      }
      selectedTreeNodeId = data.selected_node?.node_id ?? null;
      cachedRootData = { roots: data.roots || [] };
      cachedBrowseData = data;
      cachedCandidatesData = null;
      viewMode = "browse";
      renderTreeBrowse(data);
      $("searchStatus").textContent = t("tree.browse_parts", { count: data.parts?.length || 0 });
    } catch (error) {
      if (version !== requestVersion) return;
      resetContext();
      renderTree([], { roots: cachedRootData?.roots || [] });
      $("searchStatus").textContent = t("tree.browse_error");
      $("searchStatus").className = "error status-line";
    } finally {
      if (version === requestVersion) $("result").setAttribute("aria-busy", "false");
    }
  };

  const submitSearch = async (event) => {
    event.preventDefault();
    const version = ++requestVersion;
    ++suitabilityRequestVersion; // Invalidate late responses for the previous query.
    const partNumber = $("partNumber").value.trim();
    const candidateId = pendingCandidateId;
    const preservedCandidates = candidateId ? cachedCandidatesData : null;
    pendingCandidateId = null;
    resetContext();
    cachedBrowseData = null;
    cachedCandidatesData = preservedCandidates;
    viewMode = "empty";
    $("searchStatus").className = "muted status-line";
    if (!partNumber) {
      selectedTreeNodeId = null;
      clearSuitability();
      clearSelectionUrl();
      await loadRootBrowse(version);
      return;
    }
    renderTree([], { roots: cachedRootData?.roots || [] });
    $("searchStatus").textContent = t("search.resolving");
    $("result").setAttribute("aria-busy", "true");
    try {
      const data = await resolvePart(partNumber, Boolean($("availabilitySelect").checked), candidateId);
      if (version !== requestVersion) return;
      if (data.state === "multiple_match") {
        cachedCandidatesData = data;
        cachedRootData = { roots: data.tree_roots || cachedRootData?.roots || [] };
        viewMode = "candidates";
        renderPartCandidates(data);
        $("searchStatus").textContent = t("search.multiple_matches", { count: data.matches?.length || 0 });
        void refreshSuitability(partNumber, Boolean($("availabilitySelect").checked), version);
        return;
      }
      cachedRootData = { roots: data.tree_roots || cachedRootData?.roots || [] };
      viewMode = "resolved";
      renderResolvedData(data);
      $("searchStatus").textContent = t("search.resolved");
      void refreshSuitability(partNumber, Boolean($("availabilitySelect").checked), version);
    } catch (error) {
      if (version !== requestVersion) return;
      resetContext("part.no_part_resolved");
      renderTree([], { roots: cachedRootData?.roots || [] });
      if (String(error?.message || "") !== "part not found") renderApplicableState("error");
      $("searchStatus").textContent = localizeError(error);
      $("searchStatus").className = "error status-line";
    } finally {
      if (version === requestVersion) $("result").setAttribute("aria-busy", "false");
    }
  };
  $("partSearch").addEventListener("submit", submitSearch);
  $("availabilitySelect").addEventListener("change", () => {
    if ($("partNumber").value.trim()) void submitSearch({ preventDefault() {} });
    else void browseTree(null, { defaultLoad: true });
  });

  const initialParams = typeof URLSearchParams === "function" && typeof globalThis.location?.search === "string"
    ? new URLSearchParams(globalThis.location.search)
    : null;
  const initialPart = initialParams?.get("part")?.trim();
  const initialTree = initialParams?.get("tree")?.trim();
  if (initialPart) {
    selectedTreeNodeId = initialTree || null;
    pendingCandidateId = initialParams?.get("candidate_id")?.trim() || null;
    $("partNumber").value = initialPart;
    void submitSearch({ preventDefault() {} });
  } else if (initialTree) {
    void browseTree(initialTree);
  } else {
    void browseTree(null, { defaultLoad: true });
  }
}

if (typeof document !== "undefined" && typeof document.getElementById === "function") {
  if (document.readyState === "loading" && typeof document.addEventListener === "function") {
    document.addEventListener("DOMContentLoaded", setupViepsUi);
  } else {
    setupViepsUi();
  }
}
