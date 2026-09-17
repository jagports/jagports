import { normalizePartNumber } from "./part.js";
import { handleViepsPart } from "./vieps.js";

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
  if (!isAuthorized(request, env)) return json({ error: "admin authorization required" }, 401);
  return null;
}

function text(value) {
  return typeof value === "string" ? value.trim() : "";
}

function nullableText(value) {
  const valueText = text(value);
  return valueText || null;
}

function nullableInteger(value, field) {
  if (value === null || value === undefined || value === "") return null;
  const number = Number(value);
  if (!Number.isInteger(number)) throw new Error(`${field} must be an integer`);
  return number;
}

function stockInput(body) {
  const partNumber = text(body.part_number);
  const quantity = Number(body.quantity ?? 0);
  const conditionCode = nullableText(body.condition_code);
  const available = body.available === false || body.available === 0 ? 0 : 1;
  const price = body.price === null || body.price === undefined || body.price === "" ? null : Number(body.price);
  const currency = text(body.currency || "EUR").toUpperCase();

  if (!partNumber || !Number.isInteger(quantity) || quantity < 0) {
    throw new Error("part_number and non-negative integer quantity are required");
  }
  if (conditionCode && !/^[A-E]$/.test(conditionCode)) throw new Error("condition_code must be A-E or null");
  if (price !== null && (!Number.isFinite(price) || price < 0)) throw new Error("price must be non-negative or null");
  if (!/^[A-Z]{3}$/.test(currency)) throw new Error("currency must be a three-letter uppercase code");

  return {
    partNumber,
    quantity,
    conditionCode,
    available,
    price,
    currency,
    partId: nullableInteger(body.part_id, "part_id"),
    storageLocationId: nullableInteger(body.storage_location_id, "storage_location_id"),
    sourcePartyId: nullableInteger(body.source_party_id, "source_party_id"),
    donorVehicleId: nullableInteger(body.donor_vehicle_id, "donor_vehicle_id"),
    source: nullableText(body.source),
    sourceRef: nullableText(body.source_ref),
    notes: nullableText(body.notes),
  };
}

function stockError(error) {
  const message = String(error?.message || error);
  const validation = /required|must be|requires|constraint|CHECK/i.test(message);
  return json({ error: message }, validation ? 400 : 500);
}

async function handleApi(request, env) {
  const url = new URL(request.url);
  const path = url.pathname;

  if (path === "/api/vieps/part") return handleViepsPart(request, env);

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
    const stmt = q
      ? env.DB.prepare("SELECT * FROM stock_item WHERE part_number LIKE ? OR location LIKE ? OR donor_vehicle LIKE ? OR notes LIKE ? ORDER BY part_number, id DESC LIMIT 200").bind(`%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`)
      : env.DB.prepare("SELECT * FROM stock_item ORDER BY part_number, id DESC LIMIT 200");
    const { results } = await stmt.all();
    return json({ results });
  }

  if (path === "/api/stock" && request.method === "POST") {
    const denied = requireAdmin(request, env);
    if (denied) return denied;
    try {
      const input = stockInput(await request.json());
      const result = await env.DB.prepare(
        `INSERT INTO stock_item
          (part_number, part_id, quantity, condition_code, available, storage_location_id,
           source_party_id, donor_vehicle_id, source, source_ref, price, currency, notes)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).bind(
        input.partNumber, input.partId, input.quantity, input.conditionCode, input.available,
        input.storageLocationId, input.sourcePartyId, input.donorVehicleId, input.source,
        input.sourceRef, input.price, input.currency, input.notes
      ).run();
      return json({ id: result.meta.last_row_id }, 201);
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
      if (!existing) return json({ error: "stock item not found" }, 404);
      const input = stockInput({ ...existing, ...(await request.json()) });
      await env.DB.prepare(
        `UPDATE stock_item SET
          part_number=?, part_id=?, quantity=?, condition_code=?, available=?, storage_location_id=?,
          source_party_id=?, donor_vehicle_id=?, source=?, source_ref=?, price=?, currency=?, notes=?,
          updated_at=CURRENT_TIMESTAMP
         WHERE id=?`
      ).bind(
        input.partNumber, input.partId, input.quantity, input.conditionCode, input.available,
        input.storageLocationId, input.sourcePartyId, input.donorVehicleId, input.source,
        input.sourceRef, input.price, input.currency, input.notes, id
      ).run();
      return json({ ok: true });
    } catch (error) {
      return stockError(error);
    }
  }

  if (stockMatch && request.method === "DELETE") {
    const denied = requireAdmin(request, env);
    if (denied) return denied;
    await env.DB.prepare("DELETE FROM stock_item WHERE id=?").bind(Number(stockMatch[1])).run();
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
      catch (error) { return json({ error: String(error.message || error) }, 500); }
    }
    return env.ASSETS.fetch(request);
  },
};

export { isAuthorized, text, normalizePartNumber, stockInput };
