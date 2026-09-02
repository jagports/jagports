const $ = (id) => document.getElementById(id);
let adminToken = sessionStorage.getItem("jagports-admin-token") || "";
$("token").value = adminToken;
function authHeaders() { return adminToken ? { "x-admin-token": adminToken } : {}; }
async function api(path, options = {}) {
  const headers = { ...authHeaders(), ...(options.headers || {}) };
  if (options.body) headers["content-type"] = "application/json";
  const response = await fetch(path, { ...options, headers });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || `${response.status} ${response.statusText}`);
  return data;
}
function renderTable(target, rows) {
  if (!rows.length) { $(target).innerHTML = '<p class="muted">No results.</p>'; return; }
  const keys = Object.keys(rows[0]);
  $(target).innerHTML = `<table><thead><tr>${keys.map(k => `<th>${escapeHtml(k)}</th>`).join("")}</tr></thead><tbody>${rows.map(row => `<tr>${keys.map(k => `<td>${escapeHtml(row[k])}</td>`).join("")}</tr>`).join("")}</tbody></table>`;
}
function escapeHtml(value) { return String(value ?? "").replace(/[&<>\"]/g, ch => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[ch])); }
$("saveToken").onclick = () => { adminToken = $("token").value.trim(); sessionStorage.setItem("jagports-admin-token", adminToken); $("authStatus").textContent = adminToken ? "Token loaded" : "Not authenticated"; };
document.querySelectorAll("nav button").forEach(button => { button.onclick = () => { document.querySelectorAll("main section").forEach(s => s.hidden = true); $(button.dataset.section).hidden = false; }; });
$("findParts").onclick = async () => { try { renderTable("partResults", (await api(`/api/parts?q=${encodeURIComponent($("partQuery").value)}`)).results); } catch (e) { $("partResults").textContent = e.message; } };
$("addStock").onclick = async () => { try { await api("/api/stock", { method: "POST", body: JSON.stringify({ part_number: $("stockPart").value, quantity: Number($("stockQty").value), condition: $("stockCondition").value, status: $("stockStatus").value, location: $("stockLocation").value, donor_vehicle: $("stockDonor").value, source_ref: $("stockSource").value, notes: $("stockNotes").value }) }); await loadStock(); } catch (e) { $("stockResults").textContent = e.message; } };
async function loadStock() { try { renderTable("stockResults", (await api(`/api/stock?q=${encodeURIComponent($("stockQuery").value)}`)).results); } catch (e) { $("stockResults").textContent = e.message; } }
$("findStock").onclick = loadStock;
$("saveVehicle").onclick = async () => { try { await api("/api/vehicles", { method: "POST", body: JSON.stringify({ vin_raw: $("vehicleVin").value, serial: $("vehicleSerial").value, model_range: $("vehicleModel").value, market: $("vehicleMarket").value, identity_status: "unresolved" }) }); await loadVehicles(); } catch (e) { $("vehicleResults").textContent = e.message; } };
async function loadVehicles() { try { renderTable("vehicleResults", (await api(`/api/vehicles?q=${encodeURIComponent($("vehicleVin").value)}`)).results); } catch (e) { $("vehicleResults").textContent = e.message; } }
$("findVehicles").onclick = loadVehicles;
$("health").onclick = async () => { try { $("healthResult").textContent = JSON.stringify(await api("/api/health"), null, 2); } catch (e) { $("healthResult").textContent = e.message; } };
