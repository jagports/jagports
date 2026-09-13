const $ = (id) => {
  if (typeof document !== "undefined" && typeof document.getElementById === "function") {
    return document.getElementById(id);
  }
  if (typeof globalThis !== "undefined" && typeof globalThis.$ === "function") {
    return globalThis.$(id);
  }
  return null;
};
const empty = (message) => `<p class="empty">${escapeHtml(message)}</p>`;
let fitmentRows = [];
let visualItems = [];
let requestVersion = 0;

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"]/g, (ch) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;",
  }[ch]));
}

function formatMoney(value, currency) {
  if (value === null || value === undefined || value === "") return "Not supplied";
  const number = Number(value);
  if (!Number.isFinite(number)) return escapeHtml(value);
  return `${number.toFixed(2)} ${escapeHtml(currency || "EUR")}`;
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
    <p class="compact-note stock-note">Synthetic fixture stock values only; not real Jagports inventory evidence.</p>
    <div class="table-scroll"><table class="stock-table">
      <thead><tr><th>Qty</th><th>Status</th><th>Condition</th><th>Location</th><th>Price</th><th>Evidence</th></tr></thead>
      <tbody>${stock.map((item) => `<tr>
        <td>${escapeHtml(item.quantity ?? "0")}</td>
        <td>${escapeHtml(item.status || (item.available ? "available" : "unavailable"))}</td>
        <td>${escapeHtml(item.condition || item.condition_code || "Not supplied")}</td>
        <td>${escapeHtml(item.location || "Not supplied")}</td>
        <td>${formatMoney(item.price, item.currency)}</td>
        <td>${escapeHtml(item.source_ref || item.source || "fixture")}</td>
      </tr>`).join("")}</tbody>
    </table></div>
  </div>`;
}

function renderPart(part, occurrences = [], stock = []) {
  const occurrenceText = occurrences.length
    ? `${occurrences.length} EPC occurrence${occurrences.length === 1 ? "" : "s"}`
    : "No EPC occurrence context available";
  const stockText = stock.length
    ? `${stock.length} synthetic fixture stock record${stock.length === 1 ? "" : "s"}`
    : "No fixture stock shown";
  $("partCard").innerHTML = `
    <strong>${escapeHtml(part.part_number_normalized || "No Jaguar part number")}</strong>
    <p>${escapeHtml(part.description || "No description")}</p>
    <dl>
      <dt>Raw part number</dt><dd>${escapeHtml(part.part_number_raw || "Not supplied")}</dd>
      <dt>Verification</dt><dd>${escapeHtml(part.verification_status || "Not recorded")}</dd>
      <dt>Source</dt><dd>${escapeHtml(part.source || "Not recorded")}</dd>
      <dt>EPC context</dt><dd>${escapeHtml(occurrenceText)}</dd>
      <dt>Fixture stock</dt><dd>${escapeHtml(stockText)}</dd>
    </dl>
    ${renderStockRows(stock)}`;
}

function renderTree(paths) {
  const branches = paths.filter((entry) => entry.path?.length);
  $("tree").innerHTML = branches.map((entry) => {
    // The API supplies ordered paths, not interactive catalogue nodes.
    return entry.path.reduceRight((child, label, index) =>
      `<ul class="tree-branch"><li><span${index === entry.path.length - 1 ? ' class="selected-path"' : ''}>${escapeHtml(label)}</span>${child}</li></ul>`, "");
  }).join("") || empty("No Parts Tree context is available.");
}

function renderSelectedVisual() {
  const item = visualItems[Number($("visualSelect").value)];
  if (!item) {
    $("visuals").innerHTML = empty("No image or diagram context is available.");
    return;
  }
  const available = item.image_url && (!item.availability_status || item.availability_status === "available");
  $("visuals").innerHTML = `<figure><figcaption>${escapeHtml(item.label)}</figcaption>${available
    ? `<img src="${escapeHtml(item.image_url)}" alt="${escapeHtml(item.label)}">`
    : empty("Image / diagram unavailable.")}</figure>`;
  $("visuals").querySelector("img")?.addEventListener("error", () => {
    $("visuals").innerHTML = empty("Image / diagram unavailable.");
  });
}

function renderVisuals(images, diagrams) {
  visualItems = [
    ...images.map((item) => ({ ...item, label: item.description || "Part image" })),
    ...diagrams.map((item) => ({ ...item, label: item.title || "Diagram" })),
  ];
  $("visualSelect").innerHTML = visualItems.map((item, index) =>
    `<option value="${index}">${escapeHtml(item.label)}</option>`).join("");
  $("visualSelect").value = "0";
  $("visualChooser").hidden = visualItems.length < 2;
  renderSelectedVisual();
}

function renderSelectedRange() {
  const code = $("rangeSelect").value;
  const selected = fitmentRows.filter((item) => item.range_code === code);
  const range = selected[0];
  $("selectedRange").textContent = range ? `${range.range_code} — ${range.range_name}` : "No range selected.";
  $("locationStatus").textContent = range
    ? `${range.range_name}: verified vehicle views and part-location mapping are unavailable.`
    : "Verified vehicle views and part-location mapping are unavailable.";
  $("fitment").innerHTML = selected.length ? `<div class="table-scroll"><table>
    <thead><tr><th>Variation</th><th>Qualifier</th><th>Verification</th></tr></thead>
    <tbody>${selected.map((item) => `<tr><td>${escapeHtml(item.variation || "Not specified")}</td><td>${escapeHtml(item.qualifier || "Not supplied")}</td><td>${escapeHtml(item.verification_status || "Not recorded")}</td></tr>`).join("")}</tbody>
    </table></div>` : empty("No vehicle applicability is available.");
}

function renderFitment(fitment) {
  fitmentRows = fitment;
  const ranges = [...new Map(fitment.map((item) => [item.range_code, item])).values()];
  $("rangeSelect").innerHTML = ranges.length ? ranges.map((item) =>
    `<option value="${escapeHtml(item.range_code)}">${escapeHtml(item.range_code)} — ${escapeHtml(item.range_name)}</option>`).join("")
    : '<option value="">No applicability available</option>';
  $("rangeSelect").disabled = !ranges.length;
  $("ranges").innerHTML = ranges.length ? `<ul class="range-list">${ranges.map((item) =>
    `<li>${escapeHtml(item.range_code)} — ${escapeHtml(item.range_name)}</li>`).join("")}</ul>` : empty("No vehicle applicability is available.");
  renderSelectedRange();
}

// Keep the complete shell in its permanent positions in every state.
function resetContext(message = "No part selected.") {
  fitmentRows = [];
  visualItems = [];
  $("partCard").innerHTML = empty(message);
  $("tree").innerHTML = empty(`${message} Search to show the relevant Parts Tree path. Stock-based browsing is unavailable.`);
  $("visuals").innerHTML = empty("No part image selected.");
  $("visualChooser").hidden = true;
  $("visualSelect").innerHTML = "";
  $("rangeSelect").innerHTML = '<option value="">No part selected</option>';
  $("rangeSelect").disabled = true;
  $("ranges").innerHTML = empty("Search to show applicable model ranges. Stock-based browsing is unavailable.");
  $("selectedRange").textContent = "No range selected.";
  $("fitment").innerHTML = empty("Select a part and range to show variations and qualifiers.");
  $("locationStatus").textContent = "Select a part and model range. Verified vehicle-location mapping is unavailable.";
}

function setupViepsUi() {
  if (!$('partSearch')) return;

  $("rangeSelect").addEventListener("change", renderSelectedRange);
  $("visualSelect").addEventListener("change", renderSelectedVisual);
  $("partNumber").addEventListener("input", () => {
    requestVersion++;
    resetContext();
    $("result").setAttribute("aria-busy", "false");
    $("searchStatus").className = "muted status-line";
    $("searchStatus").textContent = "Enter a Jaguar part number and press Search.";
  });
  $("partSearch").addEventListener("submit", async (event) => {
    event.preventDefault();
    const version = ++requestVersion;
    const partNumber = $("partNumber").value.trim();
    resetContext();
    $("searchStatus").className = "muted status-line";
    $("result").setAttribute("aria-busy", "false");
    if (!partNumber) {
      $("searchStatus").textContent = "Enter a Jaguar part number to begin.";
      return;
    }
    $("searchStatus").textContent = "Resolving PART…";
    $("result").setAttribute("aria-busy", "true");
    try {
      const data = await resolvePart(partNumber);
      if (version !== requestVersion) return;
      renderPart(data.part, data.occurrences || [], data.stock || []);
      renderTree(data.parts_tree || []);
      renderVisuals(data.images || [], data.diagrams || []);
      renderFitment(data.fitment || []);
      $("searchStatus").textContent = "PART resolved.";
    } catch (error) {
      if (version !== requestVersion) return;
      resetContext("No part resolved.");
      $("searchStatus").textContent = error.message;
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