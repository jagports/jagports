import { openLedger } from './DataImporter.Runtime.mjs';
import { transformBundle } from './DataImporter.Transform.mjs';
import {
  d1Client, rangeForSource, readRangeConfiguration, readSourceRangeMap, verifyRangeSchema,
} from '../../../../../../3-Deployment/internet/cloudflare/d1/ranges/range-d1-client.mjs';

const statement = (sql, ...params) => ({ sql, params: params.map(value => String(value ?? '')) });
const treeId = (model, category, item, node) => [model, category, item, node];
const nodeLookup = `SELECT id FROM part_tree_node WHERE source_namespace='JEPC'
  AND source_language=? AND source_model_id=? AND source_category_id=?
  AND source_item_id=? AND source_node_id=?`;
const partLookup = 'SELECT id FROM part WHERE part_number_normalized=?';

function insertNode({ language, model, category = '', item = '', node, parent = null,
  label, order = 0, sourceRef = null }) {
  const parentSql = parent ? `(${nodeLookup})` : 'NULL';
  const parentParams = parent ? [language, ...parent] : [];
  return statement(`INSERT INTO part_tree_node
    (parent_id,label,sort_order,source_namespace,source_language,source_model_id,
     source_category_id,source_item_id,source_node_id,parent_source_node_id,
     source_description,source_order,source_ref,verification_status)
    VALUES(${parentSql},?,?,'JEPC',?,?,?,?,?,?,?, ?,?,'unverified')
    ON CONFLICT(source_namespace,source_language,source_model_id,source_category_id,source_item_id,source_node_id)
    DO UPDATE SET label=excluded.label,source_description=excluded.source_description,
      source_ref=excluded.source_ref,source_order=excluded.source_order`,
  ...parentParams, label, order, language, model, category, item, node,
  parent?.[3] ?? null, label, order, sourceRef);
}

export function publicationStatements(projection, evidenceHash) {
  const { identity, source, occurrences, unresolvedLeaves } = projection;
  const { model, category, language } = identity;
  const context = `${model}/${category}/L${language}`;
  const rootNode = treeId(model, '', '', `model:${model}`);
  const categoryNode = treeId(model, category, '', `category:${category}`);
  const queries = [
    statement("DELETE FROM part_occurrence WHERE source='JEPC' AND context_ref=?", context),
    statement('DELETE FROM jepc_unresolved_leaf WHERE context_ref=?', context),
    statement(`DELETE FROM part_tree_node WHERE source_namespace='JEPC' AND source_language=?
      AND source_model_id=? AND source_category_id=? AND source_item_id=''`, language, model, category),
    insertNode({ language, model, node: rootNode[3], label: source.modelLabel }),
    insertNode({ language, model, category, node: categoryNode[3], parent: rootNode,
      label: source.categoryLabel }),
  ];
  const itemNodes = new Set(), conditionNodes = new Set(), parts = new Set();
  for (const occurrence of occurrences) {
    const number = occurrence.partNumberNormalized;
    if (!number || /[\x00-\x1f]/.test(number)) throw new Error(`Invalid normalized part number in ${context}.`);
    if (!parts.has(number)) {
      parts.add(number);
      queries.push(statement(`INSERT INTO part
        (canonical_key,part_number_raw,part_number_normalized,source_origin,source,verification_status)
        VALUES(?,?,?,'ImportJEPC','JEPC','unverified')
        ON CONFLICT(part_number_normalized) DO NOTHING`, `JEPC:${number}`, occurrence.partNumberRaw, number));
    }
    const item = occurrence.item;
    const itemNode = treeId(model, category, item, `item:${item}`);
    if (!itemNodes.has(item)) {
      itemNodes.add(item);
      queries.push(insertNode({ language, model, category, item, node: itemNode[3], parent: categoryNode,
        label: occurrence.topLevelDescription || `Item ${item}` }));
    }
    let leaf = itemNode;
    for (const [index, condition] of occurrence.sourceConditions.entries()) {
      const current = treeId(model, category, item, condition.id);
      const key = current.join('/');
      if (!conditionNodes.has(key)) {
        conditionNodes.add(key);
        queries.push(insertNode({ language, model, category, item, node: condition.id, parent: leaf,
          label: condition.description, order: index,
          sourceRef: `${occurrence.sourcePath.split(':')[0]}:${condition.line}` }));
      }
      leaf = current;
    }
    queries.push(statement(`INSERT INTO part_occurrence
      (part_id,source,source_ref,context_type,context_ref,category_ref,item_number,verification_status)
      VALUES((${partLookup}),'JEPC',?,'epc',?,?,?,'unverified')`, number,
    occurrence.sourcePath, context, category, item));
    queries.push(statement(`INSERT INTO part_tree_part(tree_node_id,part_id)
      VALUES((${nodeLookup}),(${partLookup})) ON CONFLICT DO NOTHING`,
    language, ...leaf, number));
    queries.push(statement(`INSERT INTO part_occurrence_tree_path
      (part_occurrence_id,tree_node_id,source_namespace,source_path_id,application_id,source_ref)
      VALUES((SELECT id FROM part_occurrence WHERE source='JEPC' AND source_ref=?),
        (${nodeLookup}),'JEPC',?,?,?)`, occurrence.sourcePath,
    language, ...leaf, occurrence.sourcePath, occurrence.applicationId, occurrence.sourcePath));
    queries.push(statement(`INSERT INTO jepc_occurrence_evidence
      (part_occurrence_id,source_file_sha256,source_node_id,parent_source_node_id,
       top_level_description,source_conditions_json,applicability_evidence_json,raw_row)
      VALUES((SELECT id FROM part_occurrence WHERE source='JEPC' AND source_ref=?),?,?,?,?,?,?,?)`,
    occurrence.sourcePath, occurrence.sourceFileSha256, occurrence.sourceNodeId,
    occurrence.parentSourceNodeId, occurrence.topLevelDescription,
    JSON.stringify(occurrence.sourceConditions), JSON.stringify(occurrence.applicabilityEvidence),
    occurrence.rawRow));
  }
  for (const leaf of unresolvedLeaves) {
    queries.push(statement(`INSERT INTO jepc_unresolved_leaf
      (source_path,context_ref,raw_part_number,source_file_sha256,source_node_id,
       application_id,source_conditions_json,applicability_evidence_json,raw_row)
      VALUES(?,?,?,?,?,?,?,?,?)`, leaf.sourcePath, context, leaf.rawPartNumber,
    leaf.sourceFileSha256, leaf.sourceNodeId, leaf.applicationId,
    JSON.stringify(leaf.sourceConditions), JSON.stringify(leaf.applicabilityEvidence), leaf.rawRow));
  }
  queries.push(statement(`INSERT INTO jepc_bundle
    (model_id,category_id,language_id,evidence_hash,source_parent_id,
     source_model_label,source_category_label,source_breadcrumb,published_at)
    VALUES(?,?,?,?,?,?,?,?,strftime('%Y-%m-%dT%H:%M:%fZ','now'))
    ON CONFLICT(model_id,category_id,language_id) DO UPDATE SET
      evidence_hash=excluded.evidence_hash,source_parent_id=excluded.source_parent_id,
      source_model_label=excluded.source_model_label,source_category_label=excluded.source_category_label,
      source_breadcrumb=excluded.source_breadcrumb,published_at=excluded.published_at`,
  model, category, language, evidenceHash, source.parentModel, source.modelLabel,
  source.categoryLabel, source.breadcrumb));
  return queries;
}

export async function publishSelection({ selection, stateDir, token, fetchImpl = fetch, onProgress }) {
  const ledger = await openLedger(selection.source, stateDir);
  try {
    const ranges = await readSourceRangeMap();
    const selected = new Set(selection.bundles.map(bundle =>
      `${bundle.model}/${bundle.category}/L${bundle.language}`));
    let skippedUnknown = 0;
    const prepared = [];
    for (const row of ledger.latestBundles(selection.modelIds)) {
      const { model, category, language } = row.staged.identity;
      if (row.staged.status !== 'PARSED') { skippedUnknown++; continue; }
      const rangeSlug = rangeForSource({ model,
        ancestorModelIds: row.staged.source.ancestorModelIds
          ?? [row.staged.source.parentModel] }, ranges);
      prepared.push({ row, rangeSlug, selected: selected.has(`${model}/${category}/L${language}`) });
    }
    const clients = new Map();
    for (const rangeSlug of new Set(prepared.map(item => item.rangeSlug))) {
      const config = await readRangeConfiguration(rangeSlug);
      const client = d1Client(config, token, fetchImpl);
      await client.verifyIdentity();
      await verifyRangeSchema(client, config);
      clients.set(rangeSlug, { config, client });
    }
    const result = { phase: 'RANGE_D1_PUBLICATION', selected: selected.size,
      stagedBundles: prepared.length, skippedUnknown, published: 0,
      reused: 0, occurrences: 0, ranges: [...clients.keys()] };
    for (const [index, item] of prepared.entries()) {
      const { config, client } = clients.get(item.rangeSlug);
      const { model, category, language } = item.row.staged.identity;
      if (ledger.publicationTargets(model, category, language).some(target =>
        target.range_slug !== item.rangeSlug || target.database_id !== config.databaseId)) {
        throw new Error(`Reviewed Range target changed for ${model}/${category}/L${language}; reconcile the previous publication first.`);
      }
      const recorded = ledger.lastPublication({ model, category, language,
        rangeSlug: item.rangeSlug, databaseId: config.databaseId });
      if (recorded === item.row.evidenceHash && !item.selected) {
        result.reused++;
        continue;
      }
      const previous = await client.query(`SELECT evidence_hash FROM jepc_bundle
        WHERE model_id=? AND category_id=? AND language_id=?`, [model, category, language]);
      if (previous[0]?.evidence_hash === item.row.evidenceHash) result.reused++;
      else {
        const projection = transformBundle(item.row.staged);
        await client.batch(publicationStatements(projection, item.row.evidenceHash));
        const confirmed = await client.query(`SELECT evidence_hash FROM jepc_bundle
          WHERE model_id=? AND category_id=? AND language_id=?`, [model, category, language]);
        if (confirmed[0]?.evidence_hash !== item.row.evidenceHash) {
          throw new Error(`Remote D1 did not confirm publication of ${model}/${category}/L${language}.`);
        }
        result.published++;
        result.occurrences += projection.occurrences.length;
      }
      ledger.recordPublication({ model, category, language, rangeSlug: item.rangeSlug,
        databaseId: config.databaseId, evidenceHash: item.row.evidenceHash });
      onProgress?.({ phase: 'publication', completed: index + 1, total: prepared.length, model });
    }
    return result;
  } finally { ledger.close(); }
}
