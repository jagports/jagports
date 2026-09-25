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
  const isTechnicalSitePlaceholder = (name) => /name not recorded in xlsx/i.test(name || "");
  const visibleSiteName = (name) => isTechnicalSitePlaceholder(name) ? "" : (name || "");

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
    renderSuitabilityAdmin();
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
      const path = [visibleSiteName(location.site_name), ...names].filter(Boolean).join(" / ");
      return `${path} (${location.location_type})`;
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
      const locationParts = [visibleSiteName(row.storage_site_name), row.storage_location_name].filter(Boolean);
      const location = row.storage_location_name ? locationParts.join(" / ") : t("common.not_recorded");
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


  // Catalogue suitability administration is independent of mutable STOCK.
  // Raw JEPC/source text is always displayed, never edited by this page.
  let suitCategories = [], suitValues = [], suitSources = [];
  let suitNextOffset = null;
  const suit = (name) => byId("suitability" + name);
  const suitLang = () => i18n?.language === "fi" ? "fi" : "en";
  const suitLabel = (row) => row?.["name_" + suitLang()] || row?.name_en || row?.code || "";
  const suitIsActive = (row) => row && !row.retired_at;
  const suitCategory = (id) => suitCategories.find((row) => String(row.id) === String(id));
  const suitValue = (id, code) => suitValues.find((row) =>
    String(row.dimension_id) === String(id) && row.value_code === code);
  const suitSource = (id) => suitSources.find((row) => String(row.id) === String(id));
  function suitStatus(key, error = false, detail = "") {
    const node = suit("AdminStatus");
    node.textContent = t("suitability_admin." + key) + (detail ? ": " + detail : "");
    node.classList.toggle("error", error);
  }
  function suitError(error) {
    suitStatus("error", true, error?.code || "request_failed");
  }
  function suitFillSelect(name, items, selected, empty) {
    const node = suit(name);
    node.replaceChildren();
    if (empty) node.append(option("", t("suitability_admin." + empty)));
    for (const item of items) node.append(option(item.value, item.label));
    node.value = items.some((item) => String(item.value) === String(selected)) ?
      String(selected) : (empty ? "" : String(items[0]?.value ?? ""));
  }
  function suitCategoryOptions(includeRetired = false) {
    return suitCategories.filter((row) => includeRetired || suitIsActive(row))
      .map((row) => ({value:String(row.id),label:suitLabel(row) + " [" + row.code + "]" +
        (row.retired_at ? " (" + t("suitability_admin.retired_suffix") + ")" : "")}));
  }
  function suitValueOptions(id, includeRetired = false) {
    return suitValues.filter((row) => String(row.dimension_id) === String(id) &&
      (includeRetired || suitIsActive(row)))
      .map((row) => ({value:row.value_code,label:suitLabel(row) + " [" + row.value_code + "]" +
        (row.retired_at ? " (" + t("suitability_admin.retired_suffix") + ")" : "")}));
  }
  function suitShowCategory() {
    const category = suitCategory(suit("CategorySelect").value);
    const fields = ["NameEn","NameFi","DescriptionEn","DescriptionFi"];
    const keys = ["name_en","name_fi","description_en","description_fi"];
    suit("CategoryCode").value = category?.code || "";
    suit("CategoryCode").readOnly = Boolean(category);
    fields.forEach((field, index) => { suit("Category" + field).value = category?.[keys[index]] || ""; });
    suit("RetireCategory").disabled = !suitIsActive(category);
    suit("CategoryForm").querySelector('button[type="submit"]').disabled = Boolean(category?.retired_at);
  }
  function suitShowValue() {
    const dimId = suit("ValueCategory").value;
    const code = suit("ValueSelect").value;
    const value = suitValue(dimId, code);
    const fields = ["NameEn","NameFi","DescriptionEn","DescriptionFi"];
    const keys = ["name_en","name_fi","description_en","description_fi"];
    suit("ValueCode").value = value?.value_code || "";
    suit("ValueCode").readOnly = Boolean(value);
    fields.forEach((field, index) => { suit("Value" + field).value = value?.[keys[index]] || ""; });
    suit("RetireValue").disabled = !suitIsActive(value);
    suit("ValueForm").querySelector('button[type="submit"]').disabled =
      !suitIsActive(suitCategory(dimId)) || Boolean(value?.retired_at);
  }
  function suitRenderValueSelect(chooseCode = suit("ValueSelect").value) {
    suitFillSelect("ValueSelect", suitValueOptions(suit("ValueCategory").value,true),chooseCode,"new_option");
    suitShowValue();
  }
  function suitRenderMappingValues(chooseCode = suit("MappingValue").value) {
    suitFillSelect("MappingValue",suitValueOptions(suit("MappingCategory").value),chooseCode);
  }
  function suitShowSource() {
    const selected=suitSource(suit("SourceSelect").value);
    suit("History").replaceChildren();
    if (!selected) {
      suit("SourceDetails").textContent=t("suitability_admin.no_source");
      return;
    }
    const identity = [selected.original_text + " [" + selected.source_language + "]",
      selected.source_namespace + " / " + selected.dataset_key + " / " + selected.source_key,
      selected.record_locator,
      selected.source_group_code && "group: " + selected.source_group_code,
      selected.source_value_code && "value: " + selected.source_value_code,
      selected.source_model_ref && "model: " + selected.source_model_ref,
      selected.source_tree_path && "path: " + selected.source_tree_path,
      selected.status && "current: " + selected.status + " (" + selected.revision + ")",
      selected.provenance_kind === "fixture" && t("suitability_admin.source_fixture_warning")];
    suit("SourceDetails").textContent = identity.filter(Boolean).join(" · ");
    if(selected.dimension_id && suitIsActive(suitCategory(selected.dimension_id))) {
      suit("MappingCategory").value = String(selected.dimension_id);
      suitRenderMappingValues(selected.value_code);
    }
    suit("MappingStatus").value=selected.status || "proposed";
    suit("MappingVersion").value=selected.mapping_version || "";
    suit("EvidenceNote").value=selected.evidence_note || "";
    suit("ReviewerRef").value=selected.reviewer_ref || "";
    suit("ReviewerRef").required=suit("MappingStatus").value==="verified";
    suit("MappingStatus").querySelector('[value="fixture"]').disabled =
      selected.provenance_kind !== "fixture";
    suit("MappingStatus").querySelector('[value="verified"]').disabled =
      selected.provenance_kind !== "jepc";
  }
  function suitRenderSourceSelect(selected = suit("SourceSelect").value) {
    const items=suitSources.map((row)=>({
      value:String(row.id),
      label:row.original_text + " [" + row.source_language + "; " +
        row.source_namespace + "; " + (row.source_group_code || row.source_key) +
        "; #" + row.id + "]",
    }));
    suitFillSelect("SourceSelect",items,selected);
    suitShowSource();
  }
  function renderSuitabilityAdmin(overrides = {}) {
    const category = overrides.category ?? suit("CategorySelect").value;
    const valueCategory = overrides.valueCategory ?? suit("ValueCategory").value;
    const value = overrides.value ?? suit("ValueSelect").value;
    const mappingCategory = overrides.mappingCategory ?? suit("MappingCategory").value;
    const source = overrides.source ?? suit("SourceSelect").value;
    suitFillSelect("CategorySelect",suitCategoryOptions(true),category,"new_option");
    suitShowCategory();
    suitFillSelect("ValueCategory",suitCategoryOptions(),valueCategory);
    suitRenderValueSelect(value);
    suitFillSelect("MappingCategory",suitCategoryOptions(),mappingCategory);
    suitRenderMappingValues();
    suitRenderSourceSelect(source);
    suit("MoreSources").hidden = suitNextOffset === null;
  }
  async function loadSuitabilityAdmin(query = suit("SourceQuery").value.trim(), overrides = {}) {
    const params=new URLSearchParams({lang:suitLang(),q:query});
    const data=await api("/api/admin/suitability?" + params.toString());
    suitCategories=data.categories || [];
    suitValues=data.values || [];
    suitSources=data.sources || [];
    suitNextOffset=data.next_offset;
    renderSuitabilityAdmin(overrides);
    suitStatus("loaded");
  }
  function suitWords(prefix) {
    return {names:{en:suit(prefix+"NameEn").value.trim(),fi:suit(prefix+"NameFi").value.trim()},
      descriptions:{en:suit(prefix+"DescriptionEn").value.trim(),
        fi:suit(prefix+"DescriptionFi").value.trim()}};
  }
  async function suitSaveCategory(event) {
    event.preventDefault();
    const id=suit("CategorySelect").value,body={
      code:suit("CategoryCode").value.trim(),...suitWords("Category"),
    };
    try {
      const response=await api(id ? "/api/admin/suitability/categories/"+id :
        "/api/admin/suitability/categories",{
          method:id?"PATCH":"POST",body:JSON.stringify(body),
        });
      await loadSuitabilityAdmin(undefined,{category:response.id,valueCategory:response.id});
      suitStatus("saved");
    } catch(error){suitError(error);}
  }
  async function suitSaveValue(event) {
    event.preventDefault();
    const id=suit("ValueCategory").value,code=suit("ValueSelect").value;
    if (!id) return suitStatus("missing_category",true);
    const body={dimension_id:Number(id),value_code:suit("ValueCode").value.trim(),
      ...suitWords("Value")};
    try{
      const response=await api(code ?
        "/api/admin/suitability/values/"+id+"/"+encodeURIComponent(code) :
        "/api/admin/suitability/values",{
          method:code?"PATCH":"POST",body:JSON.stringify(body),
        });
      await loadSuitabilityAdmin(undefined,{valueCategory:response.dimension_id,value:response.value_code});
      suitStatus("saved");
    }catch(error){suitError(error);}
  }
  async function suitSaveMapping(event) {
    event.preventDefault();
    const source=suitSource(suit("SourceSelect").value);
    if(!source)return suitStatus("missing_source",true);
    const status=suit("MappingStatus").value;
    const categoryId=suit("MappingCategory").value,value=suit("MappingValue").value;
    if(status!=="retired" && !categoryId)return suitStatus("missing_category",true);
    if(status!=="retired" && !value)return suitStatus("missing_value",true);
    const body={source_description_id:source.id,dimension_id:Number(categoryId),
      value_code:value,status,mapping_version:suit("MappingVersion").value.trim(),
      evidence_note:suit("EvidenceNote").value.trim(),reviewer_ref:suit("ReviewerRef").value.trim()};
    try{
      await api("/api/admin/suitability/mappings",{method:"POST",body:JSON.stringify(body)});
      await loadSuitabilityAdmin(undefined,{source:source.id,mappingCategory:categoryId});
      suitStatus("saved");
    }catch(error){suitError(error);}
  }
  async function suitLoadMore() {
    if(suitNextOffset===null)return;
    const params=new URLSearchParams({lang:suitLang(),q:suit("SourceQuery").value.trim(),
      offset:String(suitNextOffset)});
    try{
      const data=await api("/api/admin/suitability?" + params.toString());
      suitSources.push(...data.sources);
      suitNextOffset=data.next_offset;
      suitRenderSourceSelect();
      suit("MoreSources").hidden=suitNextOffset===null;
    }catch(error){suitError(error);}
  }
  async function suitShowHistory(){
    const source=suitSource(suit("SourceSelect").value);
    if(!source)return suitStatus("missing_source",true);
    try{
      const data=await api("/api/admin/suitability/history?source_description_id="+source.id);
      suit("History").replaceChildren();
      if(!data.revisions.length) {
        const item=document.createElement("li");
        item.textContent=t("suitability_admin.no_history");
        suit("History").append(item);
      }
      for(const row of data.revisions){
        const item=document.createElement("li");
        item.textContent="#" + row.revision + " · " + row.status + " · " +
          row.mapping_version + " · " + row.evidence_note +
          (row.reviewer_ref ? " · "+row.reviewer_ref : "");
        suit("History").append(item);
      }
    }catch(error){suitError(error);}
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
    try { await loadMeta(); await loadStock(); setLocalizedStatus("stock_admin.connected");
      try { await loadSuitabilityAdmin(""); } catch (error) { suitError(error); }
    }
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


  suit("CategorySelect").addEventListener("change",suitShowCategory);
  suit("CategoryForm").addEventListener("submit",suitSaveCategory);
  suit("NewCategory").addEventListener("click",()=>{
    suit("CategorySelect").value="";
    suitShowCategory();
  });
  suit("RetireCategory").addEventListener("click",async()=>{
    const id=suit("CategorySelect").value;
    if(!id || !confirm(t("suitability_admin.confirm_retire_category")))return;
    try{
      await api("/api/admin/suitability/categories/"+id,{
        method:"PATCH",body:JSON.stringify({retire:true}),
      });
      await loadSuitabilityAdmin(undefined,{category:id});
      suitStatus("saved");
    }catch(error){suitError(error);}
  });
  suit("ValueCategory").addEventListener("change",()=>suitRenderValueSelect(""));
  suit("ValueSelect").addEventListener("change",suitShowValue);
  suit("ValueForm").addEventListener("submit",suitSaveValue);
  suit("NewValue").addEventListener("click",()=>{suit("ValueSelect").value="";suitShowValue();});
  suit("RetireValue").addEventListener("click",async()=>{
    const id=suit("ValueCategory").value,code=suit("ValueSelect").value;
    if(!id||!code||!confirm(t("suitability_admin.confirm_retire_value")))return;
    try{
      await api("/api/admin/suitability/values/"+id+"/"+encodeURIComponent(code),{
        method:"PATCH",body:JSON.stringify({retire:true}),
      });
      await loadSuitabilityAdmin(undefined,{valueCategory:id,value:code});
      suitStatus("saved");
    }catch(error){suitError(error);}
  });
  suit("SourceSearch").addEventListener("submit",async(event)=>{
    event.preventDefault();
    try{await loadSuitabilityAdmin(suit("SourceQuery").value.trim(),{source:""});}
    catch(error){suitError(error);}
  });
  suit("SourceSelect").addEventListener("change",suitShowSource);
  suit("MoreSources").addEventListener("click",suitLoadMore);
  suit("MappingCategory").addEventListener("change",()=>suitRenderMappingValues(""));
  suit("MappingStatus").addEventListener("change",()=>{
    suit("ReviewerRef").required=suit("MappingStatus").value==="verified";
  });
  suit("MappingForm").addEventListener("submit",suitSaveMapping);
  suit("ShowHistory").addEventListener("click",suitShowHistory);

  setIdentityMode("canonical");
})();
