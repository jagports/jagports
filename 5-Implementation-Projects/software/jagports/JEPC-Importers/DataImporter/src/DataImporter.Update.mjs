import { openLedger } from './DataImporter.Runtime.mjs';
import { transformBundle } from './DataImporter.Transform.mjs';
import {
  d1Client, rangeForSource, readPartsDatabaseConfiguration, readSourceRangeMap, verifyPartsDatabaseSchema,
} from '../../../../../../3-Deployment/internet/cloudflare/d1/parts/parts-d1-client.mjs';

const statement = (sql, ...params) => ({ sql, params: params.map(value => String(value ?? '')) });
const treeId = (model, category, item, node) => [model, category, item, node];
const nodeLookup = `SELECT id FROM part_tree_node WHERE source_namespace='JEPC'
  AND source_language=? AND source_model_id=? AND source_category_id=?
  AND source_item_id=? AND source_node_id=?`;
const partLookup = 'SELECT id FROM part WHERE part_number_normalized=?';
const unverifiedJePCCountSql = `SELECT
  (SELECT COUNT(*) FROM part WHERE source_origin='ImportJEPC' AND source='JEPC' AND verification_status<>'verified') +
  (SELECT COUNT(*) FROM part_occurrence WHERE source='JEPC' AND verification_status<>'verified') +
  (SELECT COUNT(*) FROM part_tree_node WHERE source_namespace='JEPC' AND verification_status<>'verified') +
  (SELECT COUNT(*) FROM part_occurrence_tree_path WHERE source_namespace='JEPC' AND verification_status<>'verified')
  AS pending`;

export function d1VerificationStatements() {
  return [
    statement("UPDATE part SET verification_status='verified' WHERE source_origin='ImportJEPC' AND source='JEPC' AND verification_status<>'verified'"),
    statement("UPDATE part_occurrence SET verification_status='verified' WHERE source='JEPC' AND verification_status<>'verified'"),
    statement("UPDATE part_tree_node SET verification_status='verified' WHERE source_namespace='JEPC' AND verification_status<>'verified'"),
    statement("UPDATE part_occurrence_tree_path SET verification_status='verified' WHERE source_namespace='JEPC' AND verification_status<>'verified'"),
  ];
}

export async function upgradeJePCVerification(client) {
  const [before] = await client.query(unverifiedJePCCountSql);
  const pending = Number(before?.pending ?? 0);
  if (!pending) return 0;
  await client.batch(d1VerificationStatements());
  const [after] = await client.query(unverifiedJePCCountSql);
  if (Number(after?.pending ?? 0) !== 0) {
    throw new Error('D1 did not confirm all JEPC catalogue records as verified.');
  }
  return pending;
}

function insertNode({ language, model, category = '', item = '', node, parent = null,
  label, order = 0, sourceRef = null }) {
  const parentSql = parent ? `(${nodeLookup})` : 'NULL';
  const parentParams = parent ? [language, ...parent] : [];
  return statement(`INSERT INTO part_tree_node
    (parent_id,label,sort_order,source_namespace,source_language,source_model_id,
     source_category_id,source_item_id,source_node_id,parent_source_node_id,
     source_description,source_order,source_ref,verification_status)
    VALUES(${parentSql},?,?,'JEPC',?,?,?,?,?,?,?, ?,?,'verified')
    ON CONFLICT(source_namespace,source_language,source_model_id,source_category_id,source_item_id,source_node_id)
    DO UPDATE SET label=excluded.label,source_description=excluded.source_description,
      source_ref=excluded.source_ref,source_order=excluded.source_order,
      verification_status=excluded.verification_status`,
  ...parentParams, label, order, language, model, category, item, node,
  parent?.[3] ?? null, label, order, sourceRef);
}

export function d1ImportStatements(projection, evidenceHash, itemId) {
  const { identity, source, occurrences, unresolvedLeaves, files } = projection;
  const { model, category, language } = identity;
  const context = `${model}/${category}/L${language}`;
  const rootNode = treeId(model, '', '', `model:${model}`);
  const categoryNode = treeId(model, category, '', `category:${category}`);
  const itemFiles = itemId === undefined ? [] : files.filter(file =>
    file.path.split('/').at(-1).startsWith(`Itm_M${model}_C${category}_I${itemId}_L${language}.xml`));
  if (itemId !== undefined && !itemFiles.length) {
    throw new Error(`No source item file for ${model}/${category}/${itemId}/L${language}.`);
  }
  const queries = itemId === undefined ? [
    statement("DELETE FROM part_occurrence WHERE source='JEPC' AND context_ref=?", context),
    statement('DELETE FROM jepc_unresolved_leaf WHERE context_ref=?', context),
    statement(`DELETE FROM part_tree_node WHERE source_namespace='JEPC' AND source_language=?
      AND source_model_id=? AND source_category_id=? AND source_item_id=''`, language, model, category),
  ] : [
    statement("DELETE FROM part_occurrence WHERE source='JEPC' AND context_ref=? AND item_number=?", context, itemId),
    statement(`DELETE FROM jepc_unresolved_leaf WHERE context_ref=? AND (${itemFiles.map(() => 'substr(source_path,1,length(?))=?').join(' OR ')})`,
      context, ...itemFiles.flatMap(file => [`${file.path}:`, `${file.path}:`])),
    statement(`DELETE FROM part_tree_node WHERE source_namespace='JEPC' AND source_language=?
      AND source_model_id=? AND source_category_id=? AND source_item_id=?`, language, model, category, itemId),
    statement('DELETE FROM jepc_bundle WHERE model_id=? AND category_id=? AND language_id=?', model, category, language),
  ];
  queries.push(
    insertNode({ language, model, node: rootNode[3], label: source.modelLabel }),
    insertNode({ language, model, category, node: categoryNode[3], parent: rootNode,
      label: source.categoryLabel }),
  );
  const itemNodes = new Set(), conditionNodes = new Set(), parts = new Set();
  for (const occurrence of occurrences) {
    const number = occurrence.partNumberNormalized;
    if (!number || /[\x00-\x1f]/.test(number)) throw new Error(`Invalid normalized part number in ${context}.`);
    if (!parts.has(number)) {
      parts.add(number);
      queries.push(statement(`INSERT INTO part
        (canonical_key,part_number_raw,part_number_normalized,source_origin,source,verification_status)
        VALUES(?,?,?,'ImportJEPC','JEPC','verified')
        ON CONFLICT(part_number_normalized) DO UPDATE SET verification_status='verified'
        WHERE part.source_origin='ImportJEPC' AND part.source='JEPC'`, `JEPC:${number}`, occurrence.partNumberRaw, number));
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
      VALUES((${partLookup}),'JEPC',?,'epc',?,?,?,'verified')`, number,
    occurrence.sourcePath, context, category, item));
    queries.push(statement(`INSERT INTO part_tree_part(tree_node_id,part_id)
      VALUES((${nodeLookup}),(${partLookup})) ON CONFLICT DO NOTHING`,
    language, ...leaf, number));
    queries.push(statement(`INSERT INTO part_occurrence_tree_path
      (part_occurrence_id,tree_node_id,source_namespace,source_path_id,application_id,source_ref,verification_status)
      VALUES((SELECT id FROM part_occurrence WHERE source='JEPC' AND source_ref=?),
        (${nodeLookup}),'JEPC',?,?,?,'verified')`, occurrence.sourcePath,
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
  if (itemId === undefined) {
    queries.push(statement(`INSERT INTO jepc_bundle
      (model_id,category_id,language_id,evidence_hash,source_parent_id,
       source_model_label,source_category_label,source_breadcrumb,imported_at)
      VALUES(?,?,?,?,?,?,?,?,strftime('%Y-%m-%dT%H:%M:%fZ','now'))
      ON CONFLICT(model_id,category_id,language_id) DO UPDATE SET
        evidence_hash=excluded.evidence_hash,source_parent_id=excluded.source_parent_id,
        source_model_label=excluded.source_model_label,source_category_label=excluded.source_category_label,
        source_breadcrumb=excluded.source_breadcrumb,imported_at=excluded.imported_at`,
    model, category, language, evidenceHash, source.parentModel, source.modelLabel,
    source.categoryLabel, source.breadcrumb));

  }
  return queries;
}

export function d1ImportRows(rows, selection) {
  const selected = new Set(selection.bundles.map(bundle =>
    `${bundle.model}/${bundle.category}/L${bundle.language}`));
  return rows.filter(row => selected.has(
    `${row.staged.identity.model}/${row.staged.identity.category}/L${row.staged.identity.language}`));
}

export async function importSelectionToD1({ selection, stateDir, token, itemId, fetchImpl = fetch, onProgress }) {
  const ledger = await openLedger(selection.source, stateDir);
  try {
    if (itemId !== undefined && selection.selector !== 'MODEL_CATEGORY') throw new Error('--item is valid only with --category MODEL_ID:CATEGORY_ID.');
    const ranges = await readSourceRangeMap();
    const selected = new Set(selection.bundles.map(bundle =>
      `${bundle.model}/${bundle.category}/L${bundle.language}`));
    let skippedUnknown = 0;
    const prepared = [];
    for (const row of d1ImportRows(ledger.latestBundles(selection.modelIds), selection)) {
      const { model, category, language } = row.staged.identity;
      if (row.staged.status !== 'PARSED') { skippedUnknown++; continue; }
      const rangeSlug = rangeForSource({ model,
        ancestorModelIds: row.staged.source.ancestorModelIds
          ?? [row.staged.source.parentModel] }, ranges);
      prepared.push({ row, rangeSlug, selected: selected.has(`${model}/${category}/L${language}`) });
    }
    const clients = new Map();
    for (const rangeSlug of new Set(prepared.map(item => item.rangeSlug))) {
      const config = await readPartsDatabaseConfiguration(rangeSlug);
      const client = d1Client(config, token, fetchImpl);
      await client.verifyIdentity();
      await verifyPartsDatabaseSchema(client, config);
      clients.set(rangeSlug, { config, client });
    }
    const result = { phase: 'PARTS_D1_IMPORT', selected: selected.size,
      stagedBundles: prepared.length, skippedUnknown, imported: 0,
      reused: 0, occurrences: 0, verificationUpdated: 0, ranges: [...clients.keys()] };
    for (const { client } of clients.values()) {
      result.verificationUpdated += await upgradeJePCVerification(client);
    }
    for (const [index, item] of prepared.entries()) {
      const { config, client } = clients.get(item.rangeSlug);
      const { model, category, language } = item.row.staged.identity;
      if (ledger.d1ImportTargets(model, category, language).some(target =>
        target.range_slug !== item.rangeSlug || target.database_id !== config.databaseId)) {
        throw new Error(`Reviewed parts database target changed for ${model}/${category}/L${language}; reconcile the previous D1 import first.`);
      }
      const recorded = ledger.lastD1Import({ model, category, language,
        rangeSlug: item.rangeSlug, databaseId: config.databaseId });
      if (recorded === item.row.evidenceHash && !item.selected) {
        result.reused++;
        continue;
      }
      const previous = itemId === undefined ? await client.query(`SELECT evidence_hash FROM jepc_bundle
        WHERE model_id=? AND category_id=? AND language_id=?`, [model, category, language]) : [];
      if (itemId === undefined && previous[0]?.evidence_hash === item.row.evidenceHash) result.reused++;
      else {
        const projection = transformBundle(item.row.staged, { itemId });
        await client.batch(d1ImportStatements(projection, item.row.evidenceHash, itemId));
        if (itemId === undefined) {
          const confirmed = await client.query(`SELECT evidence_hash FROM jepc_bundle
            WHERE model_id=? AND category_id=? AND language_id=?`, [model, category, language]);
          if (confirmed[0]?.evidence_hash !== item.row.evidenceHash) {
            throw new Error(`Remote D1 did not confirm import of ${model}/${category}/L${language}.`);
          }
          ledger.recordD1Import({ model, category, language, rangeSlug: item.rangeSlug,
            databaseId: config.databaseId, evidenceHash: item.row.evidenceHash });
        } else {
          const confirmed = await client.query(`SELECT COUNT(*) AS count FROM part_occurrence
            WHERE source='JEPC' AND context_ref=? AND item_number=?`, [`${model}/${category}/L${language}`, itemId]);
          if (Number(confirmed[0]?.count) !== projection.occurrences.length) {
            throw new Error(`Remote D1 did not confirm item ${itemId} for ${model}/${category}/L${language}.`);
          }
          ledger.clearD1Import(model, category, language);
        }
        result.imported++;
        result.occurrences += projection.occurrences.length;
      }
      onProgress?.({ phase: 'd1_import', completed: index + 1, total: prepared.length, model });
    }
    return result;
  } finally { ledger.close(); }
}

