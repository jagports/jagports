(() => {
  const i18n = globalThis.viepsI18n;
  const t = (key) => i18n?.t(key) ?? key;
  let token = "";
  let rows = [];
  let statusTranslationKey = null;
  let statusIsError = false;

  const byId = (id) => document.getElementById(id);
  const headers = () => ({ "content-type": "application/json", "x-admin-token": token });
  const nullableNumber = (id) => byId(id).value ? Number(byId(id).value) : null;

  async function api(path, options = {}, admin = true) {
    const response = await fetch(path, {
      ...options,
      headers: { ...(admin ? headers() : { "content-type": "application/json" }), ...(options.headers || {}) },
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const error = new Error(data.error || `${response.status}`);
      error.code = data.error_code || "request_failed";
      throw error;
    }
    return data;
  }

  function localizedErrorKey(error) {
    const key = `stock_admin.error_${error?.code || "request_failed"}`;
    return t(key) === key ? "stock_admin.error_request_failed" : key;
  }

  function setStatus(message, error = false, translationKey = null) {
    byId("status").textContent = message;
    byId("status").classList.toggle("error", error);
    statusTranslationKey = translationKey;
    statusIsError = error;
  }

  function setLocalizedStatus(key, error = false) {
    setStatus(t(key), error, key);
  }

  function refreshForLanguageChange() {
    i18n?.applyDocument();
    render();
    if (statusTranslationKey) setLocalizedStatus(statusTranslationKey, statusIsError);
  }

  function option(value, label) {
    const node = document.createElement("option");
    node.value = value;
    node.textContent = label;
    return node;
  }

  function setIdentityMode(mode) {
    const canonical = mode === "canonical";
    byId("canonicalIdentity").hidden = !canonical;
    byId("partId").required = canonical;
    byId("partNumber").readOnly = canonical;
    if (!canonical) {
      byId("partId").value = "";
      byId("partNumber").readOnly = false;
      byId("partLookupResults").replaceChildren();
    }
  }

  async function lookupParts() {
    const q = byId("partLookupQuery").value.trim();
    if (!q) return;
    const results = (await api(`/api/parts?q=${encodeURIComponent(q)}`, {}, false)).results || [];
    const target = byId("partLookupResults");
    target.replaceChildren();
    if (!results.length) {
      target.textContent = t("stock_admin.part_lookup_none");
      return;
    }
    for (const part of results) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "card";
      const number = part.part_number_raw || part.part_number_normalized || `#${part.id}`;
      button.textContent = `${number}${part.description ? ` — ${part.description}` : ""}`;
      button.addEventListener("click", () => {
        byId("partId").value = part.id;
        byId("partNumber").value = number;
        target.replaceChildren();
        setLocalizedStatus("stock_admin.part_selected");
      });
      target.append(button);
    }
  }

  async function loadMeta() {
    const meta = await api("/api/stock-meta");
    const byLocationId = new Map(meta.locations.map((location) => [location.id, location]));
    const locationLabel = (location) => {
      const names = [];
      let current = location;
      const seen = new Set();
      while (current && !seen.has(current.id)) {
        seen.add(current.id);
        names.unshift(current.name);
        current = current.parent_id ? byLocationId.get(current.parent_id) : null;
      }
      return `${location.site_name} / ${names.join(" / ")} (${location.location_type})`;
    };
    for (const location of meta.locations) {
      const label = locationLabel(location);
      byId("storageLocationId").append(option(location.id, label));
      byId("stockLocationFilter").append(option(location.id, label));
    }
    for (const party of meta.source_parties) byId("sourcePartyId").append(option(party.id, `${party.name} (${party.source_type})`));
    for (const vehicle of meta.vehicles) byId("donorVehicleId").append(option(vehicle.id, vehicle.vin_raw || vehicle.serial || `#${vehicle.id}`));
  }

  function edit(row) {
    byId("stockId").value = row.id;
    byId("identityMode").value = row.part_id ? "canonical" : "unresolved";
    setIdentityMode(byId("identityMode").value);
    byId("partNumber").value = row.part_number || "";
    byId("partId").value = row.part_id || "";
    byId("quantity").value = row.quantity ?? 0;
    byId("conditionCode").value = row.condition_code || "";
    byId("storageLocationId").value = row.storage_location_id || "";
    byId("sourcePartyId").value = row.source_party_id || "";
    byId("donorVehicleId").value = row.donor_vehicle_id || "";
    byId("source").value = row.source || "";
    byId("sourceRef").value = row.source_ref || "";
    byId("price").value = row.price ?? "";
    byId("currency").value = row.currency || "EUR";
    byId("available").checked = Boolean(row.available);
    byId("notes").value = row.notes || "";
    byId("deleteStock").disabled = false;
  }

  function render() {
    const target = byId("stockList");
    target.replaceChildren();
    if (!rows.length) { target.textContent = t("stock_admin.no_records"); return; }
    for (const row of rows) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "card";
      const quality = row.condition_code || t("stock.quality.unclassified.label");
      const location = row.storage_location_name ? `${row.storage_site_name || ""} / ${row.storage_location_name}` : t("common.not_recorded");
      button.textContent = `${row.part_number} — ${t("stock.qty")}: ${row.quantity} — ${quality} — ${location}`;
      button.addEventListener("click", () => edit(row));
      target.append(button);
    }
  }

  async function loadStock() {
    const params = new URLSearchParams();
    const q = byId("stockQuery").value.trim();
    const condition = byId("stockConditionFilter").value;
    const available = byId("stockAvailabilityFilter").value;
    const locationId = byId("stockLocationFilter").value;
    if (q) params.set("q", q);
    if (condition) params.set("condition_code", condition);
    if (available !== "") params.set("available", available);
    if (locationId) params.set("storage_location_id", locationId);
    rows = (await api(`/api/stock?${params.toString()}`)).results;
    render();
  }

  function resetForm() {
    byId("stockForm").reset();
    byId("stockId").value = "";
    byId("quantity").value = "1";
    byId("currency").value = "EUR";
    byId("available").checked = true;
    byId("identityMode").value = "canonical";
    setIdentityMode("canonical");
    byId("partLookupResults").replaceChildren();
    byId("deleteStock").disabled = true;
  }

  i18n?.init();
  document.querySelectorAll?.("[data-language]").forEach((control) => {
    control.addEventListener("click", () => {
      i18n?.changeLanguage(control.dataset.language);
      refreshForLanguageChange();
    });
  });

  byId("identityMode").addEventListener("change", (event) => {
    setIdentityMode(event.target.value);
    byId("partNumber").value = "";
  });
  byId("partLookupButton").addEventListener("click", () => lookupParts().catch((error) => setLocalizedStatus(localizedErrorKey(error), true)));

  byId("accessForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    token = byId("adminToken").value;
    try { await loadMeta(); await loadStock(); setLocalizedStatus("stock_admin.connected"); }
    catch (error) { setLocalizedStatus(localizedErrorKey(error), true); }
  });

  byId("stockSearch").addEventListener("submit", async (event) => {
    event.preventDefault();
    try { await loadStock(); } catch (error) { setLocalizedStatus(localizedErrorKey(error), true); }
  });

  byId("stockForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    const id = byId("stockId").value;
    const canonical = byId("identityMode").value === "canonical";
    if (canonical && !byId("partId").value) {
      setLocalizedStatus("stock_admin.part_required", true);
      return;
    }
    if (!canonical && !byId("source").value.trim() && !byId("sourcePartyId").value) {
      setLocalizedStatus("stock_admin.unresolved_source_required", true);
      return;
    }
    const body = {
      part_number: byId("partNumber").value,
      part_id: canonical ? nullableNumber("partId") : null,
      quantity: Number(byId("quantity").value),
      condition_code: byId("conditionCode").value || null,
      storage_location_id: nullableNumber("storageLocationId"),
      source_party_id: nullableNumber("sourcePartyId"),
      donor_vehicle_id: nullableNumber("donorVehicleId"),
      source: byId("source").value || null,
      source_ref: byId("sourceRef").value || null,
      price: byId("price").value === "" ? null : Number(byId("price").value),
      currency: byId("currency").value,
      available: byId("available").checked,
      notes: byId("notes").value || null,
    };
    try {
      await api(id ? `/api/stock/${id}` : "/api/stock", { method: id ? "PATCH" : "POST", body: JSON.stringify(body) });
      setLocalizedStatus("stock_admin.saved");
      await loadStock();
    } catch (error) { setLocalizedStatus(localizedErrorKey(error), true); }
  });

  byId("newStock").addEventListener("click", resetForm);
  byId("deleteStock").addEventListener("click", async () => {
    const id = byId("stockId").value;
    if (!id || !confirm(t("stock_admin.delete_confirm"))) return;
    try { await api(`/api/stock/${id}`, { method: "DELETE" }); resetForm(); setLocalizedStatus("stock_admin.deleted"); await loadStock(); }
    catch (error) { setLocalizedStatus(localizedErrorKey(error), true); }
  });

  setIdentityMode("canonical");
})();
