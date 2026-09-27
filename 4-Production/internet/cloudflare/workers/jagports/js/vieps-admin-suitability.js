// Admin-only catalogue vocabulary and immutable source-description mapping (#877).
// Raw JEPC/fixture description text is read-only: only derived semantic mappings
// and normalized vocabulary may change here. This endpoint never writes STOCK.
const reply = (payload, status = 200) => new Response(JSON.stringify(payload), {
  status, headers: { "content-type": "application/json; charset=utf-8" },
});
function failure(code, message, status = 400) {
  const error = new Error(message);
  error.code = code;
  error.status = status;
  throw error;
}
function required(value, key, max = 200) {
  if (typeof value !== "string" || !value.trim() || value.trim().length > max) {
    failure("invalid_" + key, key + " must be non-empty text (max " + max + ")");
  }
  return value.trim();
}
function positive(value, key) {
  const n = Number(value);
  if (!Number.isSafeInteger(n) || n <= 0) failure("invalid_" + key, key + " must be a positive integer");
  return n;
}
function labels(body) {
  const names = body.names || {}, descriptions = body.descriptions || {};
  return ["en", "fi"].map((lang) => ({
    lang, name: required(names[lang], "name_" + lang, 120),
    description: required(descriptions[lang], "description_" + lang, 1000),
  }));
}
function actor(env) {
  return (typeof env.ADMIN_ACTOR_REF === "string" && env.ADMIN_ACTOR_REF.trim())
    ? env.ADMIN_ACTOR_REF.trim().slice(0, 200) : "admin-token";
}
async function audit(db, env, action, dimensionId, valueCode, sourceId, mappingId, detail) {
  await db.prepare("INSERT INTO applicability_suitability_admin_audit (action,dimension_id,value_code,source_description_id,mapping_revision_id,actor_ref,detail_json) VALUES (?,?,?,?,?,?,?)")
    .bind(action, dimensionId ?? null, valueCode ?? null, sourceId ?? null,
      mappingId ?? null, actor(env), JSON.stringify(detail)).run();
}
async function select(db, sql, ...args) {
  return (await db.prepare(sql).bind(...args).all()).results || [];
}
async function one(db, sql, ...args) {
  return db.prepare(sql).bind(...args).first();
}
async function responseBody(request) {
  try {
    const body = await request.json();
    if (!body || typeof body !== "object" || Array.isArray(body)) throw Error();
    return body;
  } catch { failure("invalid_json", "a JSON object is required"); }
}
async function dimension(db, id) {
  const row = await one(db, "SELECT d.id,d.code,d.verification,r.retired_at FROM applicability_dimension d LEFT JOIN applicability_dimension_retirement r ON r.dimension_id=d.id WHERE d.id=?", id);
  if (!row) failure("category_not_found", "category does not exist", 404);
  return row;
}
async function value(db, id, code) {
  const row = await one(db, "SELECT v.dimension_id,v.value_code,r.retired_at FROM applicability_dimension_value v LEFT JOIN applicability_dimension_value_retirement r ON r.dimension_id=v.dimension_id AND r.value_code=v.value_code WHERE v.dimension_id=? AND v.value_code=?", id, code);
  if (!row) failure("value_not_found", "value does not exist", 404);
  return row;
}
async function listing(db, url) {
  const lang = url.searchParams.get("lang") || "en";
  if (!["en", "fi"].includes(lang)) failure("invalid_language", "language must be en or fi");
  const q = (url.searchParams.get("q") || "").trim();
  if (q.length > 160) failure("invalid_query", "search text is too long");
  const mappingStatus = (url.searchParams.get("status") || "").trim();
  if (!["", "proposed", "verified", "conflict", "retired", "fixture", "unmapped"].includes(mappingStatus)) failure("invalid_status", "unknown mapping status");
  const sourceLanguage = (url.searchParams.get("language") || "").trim();
  if (sourceLanguage && (sourceLanguage.length > 32 || !/^[A-Za-z]{2,8}(?:-[A-Za-z0-9]{2,8})*$/.test(sourceLanguage))) failure("invalid_language", "invalid source language");
  const offset = Number(url.searchParams.get("offset") || "0");
  if (!Number.isSafeInteger(offset) || offset < 0 || offset > 100000) failure("invalid_offset", "offset is out of range");
  const categories = await select(db,
    "SELECT d.id,d.code,d.verification,r.retired_at, en.name AS name_en, fi.name AS name_fi, en.description AS description_en, fi.description AS description_fi FROM applicability_dimension d LEFT JOIN applicability_dimension_retirement r ON r.dimension_id=d.id LEFT JOIN applicability_dimension_label en ON en.dimension_id=d.id AND en.language='en' LEFT JOIN applicability_dimension_label fi ON fi.dimension_id=d.id AND fi.language='fi' ORDER BY d.code");
  const values = await select(db,
    "SELECT v.dimension_id,v.value_code,r.retired_at, en.name AS name_en,fi.name AS name_fi,en.description AS description_en,fi.description AS description_fi FROM applicability_dimension_value v LEFT JOIN applicability_dimension_value_retirement r ON r.dimension_id=v.dimension_id AND r.value_code=v.value_code LEFT JOIN applicability_dimension_value_label en ON en.dimension_id=v.dimension_id AND en.value_code=v.value_code AND en.language='en' LEFT JOIN applicability_dimension_value_label fi ON fi.dimension_id=v.dimension_id AND fi.value_code=v.value_code AND fi.language='fi' ORDER BY v.dimension_id,v.value_code");
  const sources = await select(db,
    "SELECT s.id,s.source_namespace,s.dataset_key,s.source_key,s.source_language,s.source_group_code,s.source_value_code,s.source_model_ref,s.source_category_ref,s.source_item_ref,s.source_tree_path,s.record_locator,s.original_text,s.provenance_kind, m.id AS mapping_revision_id,m.revision,m.dimension_id,m.value_code,m.status,m.mapping_version,m.evidence_note,m.reviewer_ref FROM applicability_source_description s LEFT JOIN applicability_description_mapping_current m ON m.source_description_id=s.id WHERE (?='' OR instr(lower(s.original_text),lower(?))>0 OR instr(lower(s.source_key),lower(?))>0 OR instr(lower(COALESCE(s.source_group_code,'')),lower(?))>0 OR instr(lower(s.record_locator),lower(?))>0) AND (?='' OR COALESCE(m.status,'unmapped')=?) AND (?='' OR lower(s.source_language)=lower(?)) ORDER BY s.id LIMIT 100 OFFSET ?",
    q,q,q,q,q,mappingStatus,mappingStatus,sourceLanguage,sourceLanguage,offset);
  return reply({language:lang,categories,values,sources,next_offset:sources.length===100?offset+100:null});
}
async function history(db, url) {
  const sourceId = positive(url.searchParams.get("source_description_id"), "source_description_id");
  const source = await one(db, "SELECT id FROM applicability_source_description WHERE id=?", sourceId);
  if (!source) failure("source_not_found","source description does not exist",404);
  const revisions = await select(db, "SELECT * FROM applicability_description_mapping_revision WHERE source_description_id=? ORDER BY revision",sourceId);
  const auditRows = await select(db,"SELECT action,actor_ref,detail_json,created_at FROM applicability_suitability_admin_audit WHERE source_description_id=? ORDER BY id",sourceId);
  return reply({source_description_id:sourceId,revisions,audit:auditRows});
}
async function createCategory(db,env,body) {
  const code = required(body.code,"code",64);
  if (!/^[a-z][a-z0-9_]*$/.test(code)) failure("invalid_code","category code must be lower-case stable ASCII");
  const words=labels(body);
  const r=await db.prepare("INSERT INTO applicability_dimension (code,verification) VALUES (?,'unverified')").bind(code).run();
  const id=Number(r.meta.last_row_id);
  for (const item of words) await db.prepare("INSERT INTO applicability_dimension_label (dimension_id,language,name,description) VALUES (?,?,?,?)").bind(id,item.lang,item.name,item.description).run();
  await audit(db,env,"dimension_create",id,null,null,null,{code,names:body.names,descriptions:body.descriptions});
  return reply({id,code,verification:"unverified"},201);
}
async function editCategory(db,env,id,body) {
  const row=await dimension(db,id);
  if (row.retired_at) failure("category_retired","retired category cannot be modified",409);
  if (body.code!==undefined && body.code!==row.code) failure("immutable_code","category code is immutable",409);
  if (body.retire === true) {
    await db.prepare("INSERT INTO applicability_dimension_retirement (dimension_id) VALUES (?)").bind(id).run();
    await audit(db,env,"dimension_retire",id,null,null,null,{code:row.code});
    return reply({id,retired:true});
  }
  const words=labels(body);
  const verification=body.verification===undefined?row.verification:body.verification;
  if (!["verified","unverified","conflict"].includes(verification)) failure("invalid_verification","invalid category verification");
  for(const item of words) await db.prepare("INSERT INTO applicability_dimension_label (dimension_id,language,name,description) VALUES (?,?,?,?) ON CONFLICT(dimension_id,language) DO UPDATE SET name=excluded.name, description=excluded.description").bind(id,item.lang,item.name,item.description).run();
  if(verification!==row.verification) await db.prepare("UPDATE applicability_dimension SET verification=? WHERE id=?").bind(verification,id).run();
  await audit(db,env,"dimension_edit",id,null,null,null,{code:row.code,verification,names:body.names,descriptions:body.descriptions});
  return reply({id,code:row.code,verification});
}
async function createValue(db,env,body) {
  const id=positive(body.dimension_id,"dimension_id"), dim=await dimension(db,id);
  if(dim.retired_at) failure("category_retired","cannot add to retired category",409);
  const code=required(body.value_code,"value_code",64);
  if(!/^[A-Za-z][A-Za-z0-9_]*$/.test(code)) failure("invalid_code","value code must be stable ASCII");
  const words=labels(body);
  await db.prepare("INSERT INTO applicability_dimension_value (dimension_id,value_code) VALUES (?,?)").bind(id,code).run();
  for(const item of words) await db.prepare("INSERT INTO applicability_dimension_value_label (dimension_id,value_code,language,name,description) VALUES (?,?,?,?,?)").bind(id,code,item.lang,item.name,item.description).run();
  await audit(db,env,"value_create",id,code,null,null,{names:body.names,descriptions:body.descriptions});
  return reply({dimension_id:id,value_code:code},201);
}
async function editValue(db,env,id,code,body) {
  const item=await value(db,id,code);
  if(item.retired_at) failure("value_retired","retired value cannot be modified",409);
  const dim=await dimension(db,id);
  if(dim.retired_at) failure("category_retired","retired category cannot be edited",409);
  if(body.value_code!==undefined && body.value_code!==code) failure("immutable_code","value code is immutable",409);
  if(body.retire===true){
    await db.prepare("INSERT INTO applicability_dimension_value_retirement (dimension_id,value_code) VALUES (?,?)").bind(id,code).run();
    await audit(db,env,"value_retire",id,code,null,null,{});
    return reply({dimension_id:id,value_code:code,retired:true});
  }
  const words=labels(body);
  for(const word of words) await db.prepare("INSERT INTO applicability_dimension_value_label (dimension_id,value_code,language,name,description) VALUES (?,?,?,?,?) ON CONFLICT(dimension_id,value_code,language) DO UPDATE SET name=excluded.name, description=excluded.description").bind(id,code,word.lang,word.name,word.description).run();
  await audit(db,env,"value_edit",id,code,null,null,{names:body.names,descriptions:body.descriptions});
  return reply({dimension_id:id,value_code:code});
}
async function addMapping(db,env,body) {
  const sourceId=positive(body.source_description_id,"source_description_id");
  const source=await one(db,"SELECT id,provenance_kind,source_namespace,dataset_key,source_key,source_language FROM applicability_source_description WHERE id=?",sourceId);
  if(!source) failure("source_not_found","source description does not exist",404);
  const status=required(body.status,"status",24);
  if(!["proposed","verified","conflict","retired","fixture"].includes(status)) failure("invalid_status","invalid mapping status");
  const current=await one(db,"SELECT * FROM applicability_description_mapping_current WHERE source_description_id=?",sourceId);
  if(status==="retired" && !current) failure("mapping_not_found","no existing mapping to retire",409);
  const id=status==="retired"?current.dimension_id:positive(body.dimension_id,"dimension_id");
  const code=status==="retired"?current.value_code:required(body.value_code,"value_code",64);
  const dim=await dimension(db,id), val=await value(db,id,code);
  if(status!=="retired" && (dim.retired_at||val.retired_at)) failure("target_retired","cannot map to retired category or value",409);
  if(status==="verified" && source.provenance_kind!=="jepc") failure("fixture_not_verified","synthetic descriptions cannot become verified JEPC facts",409);
  if(status==="fixture" && source.provenance_kind!=="fixture") failure("source_not_fixture","JEPC descriptions cannot become synthetic fixtures",409);
  const reviewer=status==="verified"?required(body.reviewer_ref,"reviewer_ref",200):((typeof body.reviewer_ref==="string"&&body.reviewer_ref.trim())?body.reviewer_ref.trim().slice(0,200):null);
  const version=required(body.mapping_version,"mapping_version",120),note=required(body.evidence_note,"evidence_note",2000);
  const insert=await db.prepare("INSERT INTO applicability_description_mapping_revision (source_description_id,revision,dimension_id,value_code,status,mapping_version,evidence_note,reviewer_ref) SELECT ?,COALESCE((SELECT MAX(revision) FROM applicability_description_mapping_revision WHERE source_description_id=?),0)+1,?,?,?,?,?,?").bind(sourceId,sourceId,id,code,status,version,note,reviewer).run();
  const revisionId=Number(insert.meta.last_row_id);
  const row=await one(db,"SELECT * FROM applicability_description_mapping_revision WHERE id=?",revisionId);
  await audit(db,env,"mapping_revision",id,code,sourceId,revisionId,{status,version,evidence_note:note,reviewer_ref:reviewer});
  return reply({mapping:row,source_identity:{namespace:source.source_namespace,dataset:source.dataset_key,key:source.source_key,language:source.source_language}},201);
}
export async function handleSuitabilityAdmin(request,env) {
  if(!env.DB) return reply({error_code:"database_unavailable"},503);
  const url=new URL(request.url),path=url.pathname,method=request.method,db=env.DB;
  try {
    if(method==="GET" && path==="/api/admin/suitability") return await listing(db,url);
    if(method==="GET" && path==="/api/admin/suitability/categories") {
      const data = await (await listing(db,url)).json();
      return reply({language:data.language,categories:data.categories,values:data.values});
    }
    if(method==="GET" && path==="/api/admin/suitability/descriptions") {
      const data = await (await listing(db,url)).json();
      return reply({sources:data.sources,next_offset:data.next_offset});
    }
    if(method==="GET" && path==="/api/admin/suitability/history") return await history(db,url);
    if(method==="POST" && path==="/api/admin/suitability/categories") return await createCategory(db,env,await responseBody(request));
    let match=path.match(/^\/api\/admin\/suitability\/categories\/([0-9]+)$/);
    if(method==="PATCH" && match) return await editCategory(db,env,positive(match[1],"dimension_id"),await responseBody(request));
    if(method==="POST" && path==="/api/admin/suitability/values") return await createValue(db,env,await responseBody(request));
    match=path.match(/^\/api\/admin\/suitability\/values\/([0-9]+)\/([A-Za-z][A-Za-z0-9_]*)$/);
    if(method==="PATCH" && match) return await editValue(db,env,positive(match[1],"dimension_id"),match[2],await responseBody(request));
    if(method==="POST" && path==="/api/admin/suitability/mappings") return await addMapping(db,env,await responseBody(request));
    match=path.match(/^\/api\/admin\/suitability\/mappings\/([0-9]+)\/retire$/);
    if(method==="POST" && match) {
      const revisionId=positive(match[1],"mapping_revision_id");
      const mapping=await one(db,"SELECT source_description_id FROM applicability_description_mapping_revision WHERE id=?",revisionId);
      if(!mapping) failure("mapping_not_found","mapping revision does not exist",404);
      const current=await one(db,"SELECT id FROM applicability_description_mapping_current WHERE source_description_id=?",mapping.source_description_id);
      if(!current || current.id!==revisionId) failure("stale_mapping_revision","mapping was revised by another operator",409);
      return await addMapping(db,env,{...await responseBody(request),source_description_id:mapping.source_description_id,status:"retired"});
    }
    return reply({error_code:"method_not_allowed"},405);
  } catch(error) {
    if(error.status) return reply({error_code:error.code,error:error.message},error.status);
    const message=String(error.message||error);
    if(/UNIQUE constraint failed/.test(message)) return reply({error_code:"identity_conflict"},409);
    if(/FOREIGN KEY constraint failed|CHECK constraint failed|description evidence violates/.test(message)) return reply({error_code:"invalid_relationship"},409);
    if(/no such table|no such column/.test(message)) return reply({error_code:"migration_required"},503);
    return reply({error_code:"persistence_failed"},500);
  }
}
