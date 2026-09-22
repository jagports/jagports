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

async function resolveTreeNode(nodeId = null, stockOnly = false) {
  const params = new URLSearchParams();
  if (nodeId !== null && nodeId !== undefined && nodeId !== "") params.set("node_id", nodeId);
  if (stockOnly) params.set("stock_only", "1");
  const query = params.toString();
  const response = await fetch(`/api/vieps/tree${query ? `?${query}` : ""}`);
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

function setupTreePartLinks() {
  $("tree").querySelectorAll?.("[data-part-query]").forEach((link) => {
    link.addEventListener("click", (event) => {
      event.preventDefault();
      $("partNumber").value = link.dataset.partQuery;
      $("partSearch").dispatchEvent?.(new Event("submit", { cancelable: true }));
    });
  });
}

function renderPartCandidates(data = {}) {
  const matches = Array.isArray(data.matches) ? data.matches : [];
  const treePaths = Array.isArray(data.parts_tree) ? data.parts_tree : [];
  if (treePaths.length) renderTree(treePaths);
  else renderTree(matches.filter((part) => partSearchValue(part)).map((part) => {
    const label = partDisplayLabel(part);
    return {
      part_id: part.id,
      path: [label],
      nodes: [{ kind: "part", part_id: part.id, label, part_query: partSearchValue(part) }],
      part,
    };
  }));
  $("partCard").innerHTML = empty(t("part.no_part_selected"));
  $("visuals").innerHTML = empty(t("visual.no_image_selected"));
  $("visualChooser").hidden = true;
  $("visualSelect").innerHTML = "";
  $("rangeSelect").innerHTML = `<option value="">${escapeHtml(t("ranges.no_part_selected"))}</option>`;
  $("rangeSelect").disabled = true;
  $("ranges").innerHTML = empty(t("ranges.applicable_help"));
  $("fitment").innerHTML = empty(t("fitment.browse_help"));
  $("vehicleLocation").innerHTML = empty(t("location.unavailable"));
  $("locationStatus").textContent = t("location.select_help");
}

function renderTree(paths) {
  const branches = paths.filter((entry) => entry.path?.length);
  $("tree").innerHTML = branches.map((entry) => {
    const nodes = Array.isArray(entry.nodes) ? entry.nodes : [];
    const selectedNodeId = entry.selected_node_id ?? entry.node_id;
    return entry.path.reduceRight((child, label, index) => {
      const node = nodes[index] || {};
      const nodeId = node.node_id;
      const selected = node.kind === "part"
        ? false
        : (nodeId !== undefined && nodeId !== null ? nodeId === selectedNodeId : index === entry.path.length - 1);
      let content;
      if (node.kind === "part" && node.part_query) {
        content = `<span><a href="?part=${encodeURIComponent(node.part_query)}" data-part-query="${escapeHtml(node.part_query)}">${escapeHtml(label)}</a></span>`;
      } else if (nodeId !== undefined && nodeId !== null) {
        content = `<span${selected ? ' class="selected-path"' : ''}><a href="?tree=${encodeURIComponent(nodeId)}" data-tree-node-id="${escapeHtml(nodeId)}">${escapeHtml(label)}</a></span>`;
      } else {
        content = `<span${selected ? ' class="selected-path"' : ''}>${escapeHtml(label)}</span>`;
      }
      return `<ul${index === 0 ? ' class="tree-branch"' : ''}><li>${content}${child}</li></ul>`;
    }, "");
  }).join("") || empty(t("tree.empty"));
  setupTreePartLinks();
}

function partLeafBranchesForBrowse(data, parts) {
  const path = Array.isArray(data.path) ? data.path : [];
  const basePath = path.map((node) => node.label);
  const baseNodes = path.map((node) => ({ node_id: node.node_id, label: node.label }));
  return parts.filter((part) => partSearchValue(part)).map((part) => {
    const label = partDisplayLabel(part);
    return {
      part_id: part.id,
      path: [...basePath, label],
      nodes: [...baseNodes, { kind: "part", part_id: part.id, label, part_query: partSearchValue(part) }],
      part,
    };
  });
}

function renderTreeBrowse(data) {
  const path = Array.isArray(data.path) ? data.path : [];
  const children = Array.isArray(data.children) ? data.children : [];
  const selectedNodeId = data.selected_node?.node_id;
  const childBranches = children.map((child) => ({
    node_id: child.node_id,
    selected_node_id: selectedNodeId,
    path: [...path.map((node) => node.label), child.label],
    nodes: [...path.map((node) => ({ node_id: node.node_id, label: node.label })), child],
  }));
  const parts = Array.isArray(data.parts) ? data.parts : [];
  const partBranches = Array.isArray(data.parts_tree) && data.parts_tree.length
    ? data.parts_tree
    : partLeafBranchesForBrowse(data, parts);
  const fallbackBranch = (!childBranches.length && !partBranches.length && path.length) ? [{
    node_id: selectedNodeId,
    selected_node_id: selectedNodeId,
    path: path.map((node) => node.label),
    nodes: path.map((node) => ({ node_id: node.node_id, label: node.label })),
  }] : [];
  renderTree([...childBranches, ...partBranches, ...fallbackBranch]);
  $("partCard").innerHTML = empty(t("part.no_part_selected"));
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
  renderTree(data.parts_tree || []);
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
    resetContext();
    $("result").setAttribute("aria-busy", "false");
    $("searchStatus").className = "muted status-line";
    $("searchStatus").textContent = t("search.prompt_with_action");
  });
  const browseTree = async (nodeId = null, options = {}) => {
    const version = ++requestVersion;
    resetContext();
    $("searchStatus").className = "muted status-line";
    $("searchStatus").textContent = options.defaultLoad ? t("search.prompt") : t("tree.browse_loading");
    $("result").setAttribute("aria-busy", "true");
    try {
      const data = await resolveTreeNode(nodeId, Boolean($("availabilitySelect").checked));
      if (version !== requestVersion) return;
      renderTreeBrowse(data);
      $("searchStatus").textContent = options.defaultLoad
        ? t("search.prompt")
        : t("tree.browse_parts", { count: data.parts?.length || 0 });
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
    else browseTree(null, { defaultLoad: true });
  });

  const initialParams = typeof URLSearchParams === "function" && typeof globalThis.location?.search === "string"
    ? new URLSearchParams(globalThis.location.search)
    : null;
  const initialPart = initialParams?.get("part")?.trim();
  const initialTree = initialParams?.get("tree")?.trim();
  if (initialPart) {
    $("partNumber").value = initialPart;
    submitSearch({ preventDefault() {} });
  } else if (initialTree) {
    browseTree(initialTree);
  } else {
    browseTree(null, { defaultLoad: true });
  }
}

if (typeof document !== "undefined" && typeof document.getElementById === "function") {
  if (document.readyState === "loading" && typeof document.addEventListener === "function") {
    document.addEventListener("DOMContentLoaded", setupViepsUi);
  } else {
    setupViepsUi();
  }
}
