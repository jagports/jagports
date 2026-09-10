const $ = (id) => document.getElementById(id);

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>\"]/g, (ch) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
  }[ch]));
}

async function resolvePart(partNumber) {
  const response = await fetch(`/api/vieps/part?q=${encodeURIComponent(partNumber)}`);
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || `${response.status} ${response.statusText}`);
  return data;
}

function renderPart(part) {
  const number = part.part_number_normalized || "No Jaguar part number";
  const raw = part.part_number_raw || "Not supplied";
  $("partCard").innerHTML = `
    <strong>${escapeHtml(number)}</strong>
    <p>${escapeHtml(part.description || "No description")}</p>
    <dl>
      <dt>Raw part number</dt><dd>${escapeHtml(raw)}</dd>
      <dt>Verification</dt><dd>${escapeHtml(part.verification_status)}</dd>
      <dt>Source</dt><dd>${escapeHtml(part.source || "Not recorded")}</dd>
    </dl>`;
}

function renderTree(paths) {
  if (!paths.length) {
    $("tree").innerHTML = '<p class="empty">No Parts Tree context is available.</p>';
    return;
  }
  $("tree").innerHTML = paths.map((entry) =>
    `<div class="path">${entry.path.map((label) => `<span class="badge">${escapeHtml(label)}</span>`).join(" → ")}</div>`
  ).join("");
}

function renderVisuals(images, diagrams) {
  const imageCards = images.map((image) => {
    const content = image.image_url
      ? `<img src="${escapeHtml(image.image_url)}" alt="${escapeHtml(image.description || "Part image")}">`
      : '<p class="empty">Image unavailable.</p>';
    return `<div class="card"><h3>Part image</h3>${content}<p>${escapeHtml(image.description || "")}</p></div>`;
  });
  const diagramCards = diagrams.map((diagram) => {
    const content = diagram.image_url
      ? `<img src="${escapeHtml(diagram.image_url)}" alt="${escapeHtml(diagram.title)}">`
      : `<p class="empty">Diagram unavailable.</p>`;
    return `<div class="card"><h3>${escapeHtml(diagram.title)}</h3>${content}<p>Status: ${escapeHtml(diagram.availability_status)}</p></div>`;
  });
  $("visuals").innerHTML = [...imageCards, ...diagramCards].join("") || '<p class="empty">No image or diagram context is available.</p>';
}

function renderFitment(fitment) {
  if (!fitment.length) {
    $("fitment").innerHTML = '<p class="empty">No vehicle applicability is available.</p>';
    return;
  }
  $("fitment").innerHTML = fitment.map((item) => `
    <div class="card">
      <strong>${escapeHtml(item.range_code)} — ${escapeHtml(item.range_name)}</strong>
      <p>Variation: ${escapeHtml(item.variation || "Not specified")}</p>
      <p>Qualifier: ${escapeHtml(item.qualifier || "None")}</p>
      <p class="muted">${escapeHtml(item.verification_status)}</p>
    </div>`).join("");
}

$("partSearch").addEventListener("submit", async (event) => {
  event.preventDefault();
  const partNumber = $("partNumber").value.trim();
  if (!partNumber) return;
  $("searchStatus").textContent = "Resolving PART…";
  $("searchStatus").className = "muted";
  $("result").hidden = true;

  try {
    const data = await resolvePart(partNumber);
    renderPart(data.part);
    renderTree(data.parts_tree || []);
    renderVisuals(data.images || [], data.diagrams || []);
    renderFitment(data.fitment || []);
    $("result").hidden = false;
    $("searchStatus").textContent = "PART resolved.";
  } catch (error) {
    $("searchStatus").textContent = error.message;
    $("searchStatus").className = "error";
  }
});
