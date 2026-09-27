import { normalizePartNumber } from "./part.js";
import { handleViepsPart, handleViepsTree } from "./vieps.js";
import { handleLivePart, handleLiveTree, liveRangeDatabase } from "./vieps-live.js";
import { handleViepsSuitability } from "./suitability.js";
import { handleSuitabilityAdmin } from "./suitability-admin.js";

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

function isAuthorized(request, env) {
  if (!env.ADMIN_TOKEN) return false;
  return request.headers.get("x-admin-token") === env.ADMIN_TOKEN;
}

function requireAdmin(request, env) {
  if (!isAuthorized(request, env)) {
    return json({ error: "admin authorization required", error_code: "authorization_required" }, 401);
  }
  return null;
}

function stockValidation(code, message) {
  const error = new Error(message);
  error.code = code;
  error.status = 400;
  return error;
}

function text(value) {
  return typeof value === "string" ? value.trim() : "";
}

const STOCK_CONDITION_CODES = new Set(["A", "B", "C", "D", "E"]);

function hasOwn(object, key) {
  return Object.prototype.hasOwnProperty.call(object, key);
}

function nullableText(value) {
  const normalized = text(value);
  return normalized || null;
}

function nullableId(value) {
  if (value === null || value === undefined || value === "") return null;
  const normalized = Number(value);
  return Number.isInteger(normalized) && normalized > 0 ? normalized : NaN;
}

function nullableNumber(value) {
  if (value === null || value === undefined || value === "") return null;
  const normalized = Number(value);
  return Number.isFinite(normalized) ? normalized : NaN;
}

function normalizedAvailability(value) {
  if (value === true || value === 1 || value === "1") return 1;
  if (value === false || value === 0 || value === "0") return 0;
  return NaN;
}

function normalizeStockRecord(body, existing = null) {
  const base = existing || {
    part_number: "",
    quantity: 0,
    condition: "",
    status: "unavailable",
    location: null,
    donor_vehicle: null,
    source_ref: null,
    notes: null,
    part_id: null,
    donor_vehicle_id: null,
    source: null,
    verification_status: "unverified",
    confidence: null,
    available: 0,
    condition_code: null,
    storage_location_id: null,
    source_party_id: null,
    price: null,
    currency: "EUR",
  };

  const record = {
    part_number: hasOwn(body, "part_number") ? text(body.part_number) : base.part_number,
    quantity: hasOwn(body, "quantity") ? Number(body.quantity) : Number(base.quantity),
    condition: hasOwn(body, "condition") ? text(body.condition) : base.condition,
    location: hasOwn(body, "location") ? nullableText(body.location) : base.location,
    donor_vehicle: hasOwn(body, "donor_vehicle") ? nullableText(body.donor_vehicle) : base.donor_vehicle,
    source_ref: hasOwn(body, "source_ref") ? nullableText(body.source_ref) : base.source_ref,
    notes: hasOwn(body, "notes") ? nullableText(body.notes) : base.notes,
    part_id: hasOwn(body, "part_id") ? nullableId(body.part_id) : base.part_id,
    donor_vehicle_id: hasOwn(body, "donor_vehicle_id") ? nullableId(body.donor_vehicle_id) : base.donor_vehicle_id,
    source: hasOwn(body, "source") ? nullableText(body.source) : base.source,
    verification_status: hasOwn(body, "verification_status") ? text(body.verification_status) : base.verification_status,
    confidence: hasOwn(body, "confidence") ? nullableNumber(body.confidence) : base.confidence,
    available: hasOwn(body, "available") ? normalizedAvailability(body.available) : Number(base.available),
    storage_location_id: hasOwn(body, "storage_location_id") ? nullableId(body.storage_location_id) : base.storage_location_id,
    source_party_id: hasOwn(body, "source_party_id") ? nullableId(body.source_party_id) : base.source_party_id,
    price: hasOwn(body, "price") ? nullableNumber(body.price) : base.price,
    currency: hasOwn(body, "currency") ? text(body.currency).toUpperCase() : base.currency,
  };

  if (hasOwn(body, "condition_code")) {
    const conditionCode = text(body.condition_code).toUpperCase();
    record.condition_code = conditionCode || null;
  } else {
    record.condition_code = base.condition_code;
  }

  record.status = hasOwn(body, "status")
    ? text(body.status)
    : (existing ? base.status : (record.available === 1 ? "available" : "unavailable"));

  if (!record.part_number && record.part_id === null) {
    return { error: "part_number is required", error_code: "quantity_or_part_invalid" };
  }
  if (!Number.isInteger(record.quantity) || record.quantity < 0) {
    return { error: "quantity must be a non-negative integer", error_code: "quantity_or_part_invalid" };
  }
  for (const [name, value] of [
    ["part_id", record.part_id],
    ["donor_vehicle_id", record.donor_vehicle_id],
    ["storage_location_id", record.storage_location_id],
    ["source_party_id", record.source_party_id],
  ]) {
    if (Number.isNaN(value)) return { error: `${name} must be a positive integer or null`, error_code: "invalid_integer" };
  }
  if (!Number.isInteger(record.available) || ![0, 1].includes(record.available)) {
    return { error: "available must be 0, 1, true, or false", error_code: "availability_invalid" };
  }
  if (record.condition_code !== null && !STOCK_CONDITION_CODES.has(record.condition_code)) {
    return { error: "condition_code must be A-E or null", error_code: "condition_invalid" };
  }
  if (record.available === 1 && record.storage_location_id === null) {
    return { error: "available stock requires storage_location_id", error_code: "stock_location_required" };
  }
  if (record.part_id === null && record.source_party_id === null && !record.source) {
    return { error: "unresolved stock requires source evidence", error_code: "unresolved_source_required" };
  }
  if (Number.isNaN(record.price) || (record.price !== null && record.price < 0)) {
    return { error: "price must be a non-negative number or null", error_code: "price_invalid" };
  }
  if (Number.isNaN(record.confidence)) {
    return { error: "confidence must be a number or null", error_code: "validation_failed" };
  }
  if (!/^[A-Z]{3}$/.test(record.currency || "")) {
    return { error: "currency must be a three-letter uppercase code", error_code: "currency_invalid" };
  }

  return { record };
}

async function resolveStockIdentity(env, record) {
  if (record.part_id === null) return record;
  const part = await env.DB.prepare(
    "SELECT id, part_number_raw, part_number_normalized FROM part WHERE id=?"
  ).bind(record.part_id).first();
  if (!part) throw stockValidation("part_not_found", "canonical PART not found");
  record.part_number = text(part.part_number_raw) || text(part.part_number_normalized);
  return record;
}

function stockError(error) {
  const message = String(error?.message || error);
  const validation = error?.status === 400 || /required|must be|requires|constraint|CHECK/i.test(message);
  return json({
    error: message,
    error_code: error?.code || (validation ? "validation_failed" : "persistence_failed"),
  }, validation ? 400 : 500);
}

async function handleApi(request, env) {
  const url = new URL(request.url);
  const path = url.pathname;
  const testMode = url.searchParams.get("TEST") === "1";

  if (path === "/api/vieps/part") return testMode ? handleViepsPart(request, env) : handleLivePart(request, env);
  if (path === "/api/vieps/tree") return testMode ? handleViepsTree(request, env) : handleLiveTree(request, env);
  if (path === "/api/vieps/suitability") return testMode ? handleViepsSuitability(request, env)
    : json({ state: "unavailable", error: "applicability_unavailable",
      error_code: "applicability_unavailable" }, 503);
  if (path.startsWith("/api/admin/suitability")) {
    const denied = requireAdmin(request, env);
    if (denied) return denied;
    return handleSuitabilityAdmin(request, env);
  }

  if (path === "/api/health" && request.method === "GET") {
    try {
      await env.DB.prepare("SELECT 1").first();
      return json({ ok: true, database: "ok" });
    } catch (error) {
      return json({ ok: false, database: "error", message: String(error.message || error) }, 503);
    }
  }

  if (path === "/api/parts" && request.method === "GET") {
    const q = text(url.searchParams.get("q"));
    const normalized = normalizePartNumber(q);
    if (!testMode) {
      const { db } = liveRangeDatabase(url, env);
      const stmt = q
        ? db.prepare(`SELECT * FROM part p WHERE EXISTS
            (SELECT 1 FROM part_occurrence o WHERE o.part_id=p.id)
            AND (p.part_number_raw LIKE ? OR p.part_number_normalized LIKE ?)
            ORDER BY p.part_number_normalized LIMIT 100`).bind(`%${q}%`, `%${normalized}%`)
        : db.prepare(`SELECT * FROM part p WHERE EXISTS
            (SELECT 1 FROM part_occurrence o WHERE o.part_id=p.id)
            ORDER BY p.part_number_normalized LIMIT 100`);
      const { results } = await stmt.all();
      return json({ results });
    }
    const stmt = q
      ? env.DB.prepare(
          "SELECT * FROM part WHERE part_number_raw LIKE ? OR part_number_normalized LIKE ? OR description LIKE ? ORDER BY part_number_normalized LIMIT 100"
        ).bind(`%${q}%`, `%${normalized}%`, `%${q}%`)
      : env.DB.prepare("SELECT * FROM part ORDER BY part_number_normalized LIMIT 100");
    const { results } = await stmt.all();
    return json({ results });
  }

  if (path === "/api/stock" && request.method === "GET") {
    const denied = requireAdmin(request, env);
    if (denied) return denied;
    const q = text(url.searchParams.get("q"));
    const conditionCode = text(url.searchParams.get("condition_code"));
    const availableParam = text(url.searchParams.get("available"));
    const locationRaw = url.searchParams.get("storage_location_id");
    const storageLocationId = nullableId(locationRaw);
    if (locationRaw !== null && locationRaw !== "" && Number.isNaN(storageLocationId)) {
      return json({ error: "storage_location_id must be a positive integer or null", error_code: "invalid_integer" }, 400);
    }
    if (conditionCode && conditionCode !== "unclassified" && !STOCK_CONDITION_CODES.has(conditionCode)) {
      return json({ error: "condition_code must be A-E, unclassified or omitted", error_code: "condition_invalid" }, 400);
    }
    if (availableParam && !/^[01]$/.test(availableParam)) {
      return json({ error: "available must be 0, 1 or omitted", error_code: "availability_invalid" }, 400);
    }
    const base = `
      SELECT s.*, l.name AS storage_location_name, site.name AS storage_site_name,
             party.name AS source_party_name, party.source_type AS source_party_type,
             v.vin_raw AS donor_vehicle_vin
      FROM stock_item s
      LEFT JOIN stock_location l ON l.id = s.storage_location_id
      LEFT JOIN stock_site site ON site.id = l.site_id
      LEFT JOIN stock_source_party party ON party.id = s.source_party_id
      LEFT JOIN vehicle v ON v.id = s.donor_vehicle_id`;
    const where = testMode ? [] : ["s.verification_status <> 'fixture'"];
    const binds = [];
    if (q) {
      const pattern = `%${q}%`;
      where.push(`(s.part_number LIKE ? OR s.notes LIKE ? OR s.source LIKE ? OR s.location LIKE ?
        OR s.donor_vehicle LIKE ? OR l.name LIKE ? OR site.name LIKE ? OR party.name LIKE ? OR v.vin_raw LIKE ?)`);
      binds.push(pattern, pattern, pattern, pattern, pattern, pattern, pattern, pattern, pattern);
    }
    if (conditionCode === "unclassified") where.push("s.condition_code IS NULL");
    else if (conditionCode) {
      where.push("s.condition_code = ?");
      binds.push(conditionCode);
    }
    if (availableParam) {
      where.push("s.available = ?");
      binds.push(Number(availableParam));
    }
    if (storageLocationId !== null) {
      where.push("s.storage_location_id = ?");
      binds.push(storageLocationId);
    }
    const sql = base + (where.length ? ` WHERE ${where.join(" AND ")}` : "") +
      " ORDER BY s.part_number, s.id DESC LIMIT 200";
    const stmt = binds.length ? env.DB.prepare(sql).bind(...binds) : env.DB.prepare(sql);
    const { results } = await stmt.all();
    return json({ results });
  }

  if (path === "/api/stock-meta" && request.method === "GET") {
    const denied = requireAdmin(request, env);
    if (denied) return denied;
    const [locations, sourceParties, vehicles] = await Promise.all([
      env.DB.prepare(`
        SELECT l.id, l.name, l.location_type, l.parent_id, site.name AS site_name
        FROM stock_location l JOIN stock_site site ON site.id = l.site_id
        ORDER BY site.name, l.name`).all(),
      env.DB.prepare("SELECT id, source_type, name, source_ref FROM stock_source_party ORDER BY name").all(),
      env.DB.prepare("SELECT id, vin_raw, serial, model_range FROM vehicle ORDER BY id DESC LIMIT 200").all(),
    ]);
    return json({
      locations: locations.results,
      source_parties: sourceParties.results,
      vehicles: vehicles.results,
    });
  }

  if (path === "/api/stock" && request.method === "POST") {
    const denied = requireAdmin(request, env);
    if (denied) return denied;
    try {
      const body = await request.json();
      const normalized = normalizeStockRecord(body);
      if (normalized.error) return json({ error: normalized.error, error_code: normalized.error_code || "validation_failed" }, 400);
      const stock = await resolveStockIdentity(env, normalized.record);
      const result = await env.DB.prepare(
      `INSERT INTO stock_item (
        part_number, quantity, condition, status, location, donor_vehicle, source_ref, notes,
        part_id, donor_vehicle_id, source, verification_status, confidence, available,
        condition_code, storage_location_id, source_party_id, price, currency
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      stock.part_number, stock.quantity, stock.condition, stock.status, stock.location,
      stock.donor_vehicle, stock.source_ref, stock.notes, stock.part_id,
      stock.donor_vehicle_id, stock.source, stock.verification_status, stock.confidence,
      stock.available, stock.condition_code, stock.storage_location_id,
      stock.source_party_id, stock.price, stock.currency
      ).run();
      const item = await env.DB.prepare("SELECT * FROM stock_item WHERE id=?").bind(result.meta.last_row_id).first();
      return json({ id: result.meta.last_row_id, item }, 201);
    } catch (error) {
      return stockError(error);
    }
  }

  const stockMatch = path.match(/^\/api\/stock\/(\d+)$/);
  if (stockMatch && request.method === "PATCH") {
    const denied = requireAdmin(request, env);
    if (denied) return denied;
    try {
      const id = Number(stockMatch[1]);
      const existing = await env.DB.prepare("SELECT * FROM stock_item WHERE id=?").bind(id).first();
      if (!existing) return json({ error: "stock item not found", error_code: "stock_not_found" }, 404);
      const body = await request.json();
      const normalized = normalizeStockRecord(body, existing);
      if (normalized.error) return json({ error: normalized.error, error_code: normalized.error_code || "validation_failed" }, 400);
      const stock = await resolveStockIdentity(env, normalized.record);
      await env.DB.prepare(
      `UPDATE stock_item SET
        part_number=?, quantity=?, condition=?, status=?, location=?, donor_vehicle=?,
        source_ref=?, notes=?, part_id=?, donor_vehicle_id=?, source=?,
        verification_status=?, confidence=?, available=?, condition_code=?,
        storage_location_id=?, source_party_id=?, price=?, currency=?,
        updated_at=CURRENT_TIMESTAMP
      WHERE id=?`
    ).bind(
      stock.part_number, stock.quantity, stock.condition, stock.status, stock.location,
      stock.donor_vehicle, stock.source_ref, stock.notes, stock.part_id,
      stock.donor_vehicle_id, stock.source, stock.verification_status, stock.confidence,
      stock.available, stock.condition_code, stock.storage_location_id,
      stock.source_party_id, stock.price, stock.currency, id
      ).run();
      const item = await env.DB.prepare("SELECT * FROM stock_item WHERE id=?").bind(id).first();
      return json({ ok: true, item });
    } catch (error) {
      return stockError(error);
    }
  }

  if (stockMatch && request.method === "DELETE") {
    const denied = requireAdmin(request, env);
    if (denied) return denied;
    const result = await env.DB.prepare("DELETE FROM stock_item WHERE id=?").bind(Number(stockMatch[1])).run();
    if (!result.meta?.changes) {
      return json({ error: "stock item not found", error_code: "stock_not_found" }, 404);
    }
    return json({ ok: true });
  }

  if (path === "/api/vehicles" && request.method === "GET") {
    const denied = requireAdmin(request, env);
    if (denied) return denied;
    const q = text(url.searchParams.get("q"));
    const stmt = q
      ? env.DB.prepare("SELECT * FROM vehicle WHERE vin_raw LIKE ? OR serial LIKE ? OR model_range LIKE ? ORDER BY id DESC LIMIT 100").bind(`%${q}%`, `%${q}%`, `%${q}%`)
      : env.DB.prepare("SELECT * FROM vehicle ORDER BY id DESC LIMIT 100");
    const { results } = await stmt.all();
    return json({ results });
  }

  if (path === "/api/vehicles" && request.method === "POST") {
    const denied = requireAdmin(request, env);
    if (denied) return denied;
    const body = await request.json();
    const result = await env.DB.prepare(
      "INSERT INTO vehicle (vin_raw, serial, model_range, market, identity_status, notes) VALUES (?, ?, ?, ?, ?, ?)"
    ).bind(text(body.vin_raw), text(body.serial), text(body.model_range), text(body.market), text(body.identity_status) || "unresolved", text(body.notes)).run();
    return json({ id: result.meta.last_row_id }, 201);
  }

  return json({ error: "not found" }, 404);
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname.startsWith("/api/")) {
      try { return await handleApi(request, env); }
      catch (error) { return json({ error: String(error.message || error),
        error_code: error.code || "persistence_failed" }, error.status || 500); }
    }
    return env.ASSETS.fetch(request);
  },
};

export { handleApi, isAuthorized, normalizeStockRecord, resolveStockIdentity, text, normalizePartNumber };
