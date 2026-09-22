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

async function resolvePart(partNumber, stockOnly = false) {
  const stockFilter = stockOnly ? "&stock_only=1" : "";
  const response = await fetch(`/api/vieps/part?q=${encodeURIComponent(partNumber)}${stockFilter}`);
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.error || `${response.status} ${response.statusText}`);
    error.code = data.error_code;
    throw error;
  }
  return data;
}

async function resolveTreeRoots() {
  const response = await fetch("/api/vieps/tree?root=1");
  if (!response.ok) throw new Error("tree roots unavailable");
  return response.json();
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
  const looseParts = new Map();
  const keyFor = (node) => node.node_id !== undefined && node.node_id !== null
    ? `id:${node.node_id}`
    : `label:${node.label}`;

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
    if (Array.isArray(entry.nodes) && entry.nodes.length) return entry.nodes;
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
    if (!targets.length && options.allowLooseParts) {
      looseParts.set(key, part);
      continue;
    }
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
  const renderPartLeaf = (part, depth, contextNodeId) => {
    const selected = selectedPartId !== null && String(part.id) === selectedPartId;
    return `<li class="tree-part-leaf" role="treeitem"><div class="tree-part-row${selected ? ' selected-path' : ''}">
      <a href="${partHref(part, contextNodeId)}" data-part-query="${escapeHtml(partSearchValue(part))}"
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
  rows.push(...[...looseParts.values()].map((part) => renderPartLeaf(part, 0, null)));
  $("tree").innerHTML = rows.length
    ? `<ul class="tree-branch" role="tree">${rows.join("")}</ul>`
    : empty(t("tree.empty"));
}

function renderPartCandidates(data) {
  const candidates = (data.matches || []).filter((part) => partSearchValue(part));
  $("partCard").innerHTML = empty(t("part.no_part_selected"));
  renderTree([], {
    roots: data.tree_roots || [],
    partLeaves: candidates.map((part) => ({ part, paths: part.tree_paths || [] })),
    allowLooseParts: true,
  });
}

function renderTreeBrowse(data) {
  const path = Array.isArray(data.path) ? data.path : [];
  const children = Array.isArray(data.children) ? data.children : [];
  const selectedNodeId = data.selected_node?.node_id;
  const selectedPath = { nodes: path.map((node) => ({ node_id: node.node_id, label: node.label })) };
  const childrenPaths = children.map((child) => ({
    nodes: [...selectedPath.nodes, { node_id: child.node_id, label: child.label, sort_order: child.sort_order }],
  }));
  const linkedParts = (data.parts || []).filter((part) =>
    (data.part_nodes || []).some((link) =>
      String(link.part_id) === String(part.id) && String(link.node_id) === String(selectedNodeId)));
  renderTree([selectedPath, ...childrenPaths], {
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
  $("selectedRange").textContent = range ? `${range.range_code} — ${range.range_name}` : t("fitment.selected_none");
  $("locationStatus").textContent = range
    ? t("location.range_unavailable", { range: range.range_name })
    : t("location.verified_unavailable");

  let variationStateKey = "fitment.no_confirmed";
  if (!selected.length && rangeRows.some((item) => item.applicability_state === "unavailable")) {
    variationStateKey = "fitment.unavailable";
  } else if (!selected.length && rangeRows.length && rangeRows.every((item) => item.applicability_state === "excluded")) {
    variationStateKey = "fitment.no_match";
  }

  $("fitment").innerHTML = selected.length ? `<div class="table-scroll"><table>
    <thead><tr><th>${escapeHtml(t("fitment.variation"))}</th><th>${escapeHtml(t("fitment.qualifier"))}</th><th>${escapeHtml(t("fitment.verification"))}</th></tr></thead>
    <tbody>${selected.map((item) => `<tr><td>${escapeHtml(item.variation || t("common.not_specified"))}</td><td>${escapeHtml(item.qualifier || t("common.not_supplied"))}</td><td>${escapeHtml(item.verification_status || t("common.not_recorded"))}</td></tr>`).join("")}</tbody>
    </table></div>` : empty(t(variationStateKey));
}

function renderFitment(fitment) {
  fitmentRows = fitment;
  const applicable = fitment.filter((item) => item.applicability_state === "applicable");
  const ranges = [...new Map(applicable.map((item) => [item.range_code, item])).values()];
  const unavailable = fitment.some((item) => item.applicability_state === "unavailable");
  const confirmedNoMatch = fitment.length > 0 && fitment.every((item) => item.applicability_state === "excluded");

  let emptyLabel = t("ranges.no_suitable");
  if (unavailable && !ranges.length) emptyLabel = t("ranges.unavailable");
  else if (confirmedNoMatch) emptyLabel = t("ranges.no_match");

  $("rangeSelect").innerHTML = ranges.length ? ranges.map((item) =>
    `<option value="${escapeHtml(item.range_code)}">${escapeHtml(item.range_code)} — ${escapeHtml(item.range_name)}</option>`).join("")
    : `<option value="">${escapeHtml(emptyLabel)}</option>`;
  $("rangeSelect").disabled = !ranges.length;
  $("ranges").innerHTML = ranges.length ? `<ul class="range-list">${ranges.map((item) =>
    `<li>${escapeHtml(item.range_code)} — ${escapeHtml(item.range_name)}</li>`).join("")}</ul>` : empty(emptyLabel);
  renderSelectedRange();
  if (!ranges.length) {
    const variationStateKey = unavailable ? "fitment.unavailable" : confirmedNoMatch ? "fitment.no_match" : "fitment.no_confirmed";
    $("fitment").innerHTML = empty(t(variationStateKey));
  }
}

function renderResolvedData(data) {
  currentData = data;
  renderPart(data.part, data.occurrences || [], data.stock || []);
  renderTree(data.parts_tree || [], {
    roots: data.tree_roots || [],
    selectedPartId: data.part?.id,
    selectedNodeId: selectedTreeNodeId,
    partLeaves: [{ part: data.part, paths: data.parts_tree || [] }],
  });
  renderVisuals(data.images || [], data.diagrams || []);
  renderFitment(data.fitment || []);
}

function resetContext(messageKey = "part.no_part_selected") {
  currentData = null;
  fitmentRows = [];
  visualItems = [];
  const message = t(messageKey);
  $("partCard").innerHTML = empty(message);
  $("tree").innerHTML = empty(t("tree.no_selection", { message }));
  $("visuals").innerHTML = empty(t("visual.no_image_selected"));
  $("visualChooser").hidden = true;
  $("visualSelect").innerHTML = "";
  $("rangeSelect").innerHTML = `<option value="">${escapeHtml(t("ranges.no_part_selected"))}</option>`;
  $("rangeSelect").disabled = true;
  $("ranges").innerHTML = empty(t("ranges.applicable_help"));
  $("selectedRange").textContent = t("fitment.selected_none");
  $("fitment").innerHTML = empty(t("fitment.browse_help"));
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
  } else {
    resetContext();
    $("searchStatus").textContent = t("search.prompt");
  }
}

function setupViepsUi() {
  if (!$("partSearch")) return;
  i18n?.init();
  resetContext();
  $("searchStatus").textContent = t("search.prompt");

  document.querySelectorAll?.("[data-language]").forEach((control) => {
    control.addEventListener("click", () => {
      i18n?.changeLanguage(control.dataset.language);
      refreshForLanguageChange();
    });
  });
  $("rangeSelect").addEventListener("change", renderSelectedRange);
  $("visualSelect").addEventListener("change", renderSelectedVisual);
  $("partNumber").addEventListener("input", () => {
    requestVersion++;
    selectedTreeNodeId = null;
    resetContext();
    $("result").setAttribute("aria-busy", "false");
    $("searchStatus").className = "muted status-line";
    $("searchStatus").textContent = t("search.prompt_with_action");
  });
  const browseTree = async (nodeId) => {
    const version = ++requestVersion;
    resetContext();
    $("searchStatus").className = "muted status-line";
    $("searchStatus").textContent = t("tree.browse_loading");
    $("result").setAttribute("aria-busy", "true");
    try {
      const data = await resolveTreeNode(nodeId, Boolean($("availabilitySelect").checked));
      if (version !== requestVersion) return;
      selectedTreeNodeId = data.selected_node?.node_id ?? null;
      renderTreeBrowse(data);
      $("searchStatus").textContent = t("tree.browse_parts", { count: data.parts?.length || 0 });
    } catch (error) {
      if (version !== requestVersion) return;
      resetContext();
      $("searchStatus").textContent = t("tree.browse_error");
      $("searchStatus").className = "error status-line";
    } finally {
      if (version === requestVersion) $("result").setAttribute("aria-busy", "false");
    }
  };

  const submitSearch = async (event) => {
    event.preventDefault();
    const version = ++requestVersion;
    const partNumber = $("partNumber").value.trim();
    resetContext();
    $("searchStatus").className = "muted status-line";
    $("result").setAttribute("aria-busy", "false");
    if (!partNumber) {
      $("searchStatus").textContent = t("search.prompt");
      return;
    }
    $("searchStatus").textContent = t("search.resolving");
    $("result").setAttribute("aria-busy", "true");
    try {
      const data = await resolvePart(partNumber, Boolean($("availabilitySelect").checked));
      if (version !== requestVersion) return;
      if (data.state === "multiple_match") {
        renderPartCandidates(data);
        $("searchStatus").textContent = t("search.multiple_matches", { count: data.matches?.length || 0 });
        return;
      }
      renderResolvedData(data);
      $("searchStatus").textContent = t("search.resolved");
    } catch (error) {
      if (version !== requestVersion) return;
      resetContext("part.no_part_resolved");
      $("searchStatus").textContent = localizeError(error);
      $("searchStatus").className = "error status-line";
    } finally {
      if (version === requestVersion) $("result").setAttribute("aria-busy", "false");
    }
  };
  $("partSearch").addEventListener("submit", submitSearch);
  $("availabilitySelect").addEventListener("change", () => {
    if ($("partNumber").value.trim()) submitSearch({ preventDefault() {} });
  });

  const initialParams = typeof URLSearchParams === "function" && typeof globalThis.location?.search === "string"
    ? new URLSearchParams(globalThis.location.search)
    : null;
  const initialPart = initialParams?.get("part")?.trim();
  const initialTree = initialParams?.get("tree")?.trim();
  if (initialPart) {
    selectedTreeNodeId = initialTree || null;
    $("partNumber").value = initialPart;
    submitSearch({ preventDefault() {} });
  } else if (initialTree) {
    browseTree(initialTree);
  } else if (initialParams) {
    const version = requestVersion;
    resolveTreeRoots().then((data) => {
      if (version === requestVersion && !currentData) renderTree([], { roots: data.roots || [] });
    }).catch(() => {
      // The static shell remains usable when catalogue roots are unavailable.
    });
  }
}

if (typeof document !== "undefined" && typeof document.getElementById === "function") {
  if (document.readyState === "loading" && typeof document.addEventListener === "function") {
    document.addEventListener("DOMContentLoaded", setupViepsUi);
  } else {
    setupViepsUi();
  }
}
