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

async function resolvePart(partNumber) {
  const response = await fetch(`/api/vieps/part?q=${encodeURIComponent(partNumber)}`);
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || `${response.status} ${response.statusText}`);
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

function renderTree(paths) {
  const branches = paths.filter((entry) => entry.path?.length);
  $("tree").innerHTML = branches.map((entry) => {
    return entry.path.reduceRight((child, label, index) =>
      `<ul${index === 0 ? ' class="tree-branch"' : ''}><li><span${index === entry.path.length - 1 ? ' class="selected-path"' : ''}>${escapeHtml(label)}</span>${child}</li></ul>`, "");
  }).join("") || empty(t("tree.empty"));
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
  visualItems = [
    ...images.map((item) => ({ ...item, label: item.description || t("visual.part_image") })),
    ...diagrams.map((item) => ({ ...item, label: item.title || t("part.diagram") })),
  ];
  $("visualSelect").innerHTML = visualItems.map((item, index) =>
    `<option value="${index}">${escapeHtml(item.label)}</option>`).join("");
  $("visualSelect").value = "0";
  $("visualChooser").hidden = visualItems.length < 2;
  renderSelectedVisual();
}

function renderSelectedRange() {
  const code = $("rangeSelect").value;
  const selected = fitmentRows.filter((item) => item.range_code === code && item.applicability_state === "applicable");
  const range = selected[0];
  $("selectedRange").textContent = range ? `${range.range_code} — ${range.range_name}` : t("fitment.selected_none");
  $("locationStatus").textContent = range
    ? t("location.range_unavailable", { range: range.range_name })
    : t("location.verified_unavailable");
  $("fitment").innerHTML = selected.length ? `<div class="table-scroll"><table>
    <thead><tr><th>${escapeHtml(t("fitment.variation"))}</th><th>${escapeHtml(t("fitment.qualifier"))}</th><th>${escapeHtml(t("fitment.verification"))}</th></tr></thead>
    <tbody>${selected.map((item) => `<tr><td>${escapeHtml(item.variation || t("common.not_specified"))}</td><td>${escapeHtml(item.qualifier || t("common.not_supplied"))}</td><td>${escapeHtml(item.verification_status || t("common.not_recorded"))}</td></tr>`).join("")}</tbody>
    </table></div>` : empty(t("fitment.no_confirmed"));
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
  $("partSearch").addEventListener("submit", async (event) => {
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
      const data = await resolvePart(partNumber);
      if (version !== requestVersion) return;
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
  });
}

if (typeof document !== "undefined" && typeof document.getElementById === "function") {
  if (document.readyState === "loading" && typeof document.addEventListener === "function") {
    document.addEventListener("DOMContentLoaded", setupViepsUi);
  } else {
    setupViepsUi();
  }
}
