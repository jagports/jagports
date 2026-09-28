const unquote = value => {
  if (typeof value !== 'string') return '';
  return value.startsWith("'") && value.endsWith("'")
    ? value.slice(1, -1).replaceAll("''", "'") : value;
};

const normalizedPartNumber = value => value.trim().replace(/[\s-]/g, '').toUpperCase();
const itemNumber = relative => {
  const match = /\/Itm_M\d+_C\d+_I(\d+)_L\d+\.xml$/.exec(relative);
  if (!match) throw new Error(`Unexpected item path: ${relative}`);
  return match[1];
};

function ancestry(nodes, parent, sourcePath) {
  const result = [], seen = new Set();
  let current = parent;
  while (nodes.has(current)) {
    if (seen.has(current)) throw new Error(`Cyclic source tree in ${sourcePath}`);
    seen.add(current);
    const node = nodes.get(current);
    result.unshift(node);
    current = node.parent;
  }
  return result;
}

// This projection preserves source facts for later mapping. It deliberately
// does not translate source descriptions or predicates into verified fitment.
export function transformBundle(staged) {
  if (staged?.schemaVersion !== 1 || staged?.status !== 'PARSED'
      || !staged.identity || !Array.isArray(staged.files)) {
    throw new Error('Only complete, parsed local evidence can be transformed.');
  }
  const { model, category, language } = staged.identity;
  const categoryFile = staged.files.find(file => file.kind === 'category');
  const topLevelFile = staged.files.find(file => file.kind === 'top-level');
  if (!categoryFile || !topLevelFile) throw new Error('Category and top-level evidence are required.');
  const breadcrumb = categoryFile.records.find(record => record.type === 'category-context'
    && record.fields[0].includes('/'))?.fields[0] ?? null;
  const itemDescriptions = new Map(topLevelFile.records.filter(record => record.type === 'top-level-item')
    .map(record => [record.fields[0], unquote(record.fields[1])]));
  const applications = new Map();
  for (const file of staged.files.filter(file => file.kind === 'attributes')) {
    for (const record of file.records.filter(record => record.type === 'applicability')) {
      const key = `${file.path}:${record.key}`;
      const records = applications.get(key) ?? [];
      records.push({ path: file.path, sha256: file.sha256, line: record.line,
        raw: record.raw, predicates: record.predicates });
      applications.set(key, records);
    }
  }
  const occurrences = [], unresolvedLeaves = [];
  for (const file of staged.files.filter(entry => entry.kind === 'item')) {
    const item = itemNumber(file.path);
    const nodes = new Map();
    for (const record of file.records.filter(entry => entry.type === 'item-tree-row')) {
      const fields = record.fields;
      if (fields.length !== 12 || !/^\d+$/.test(fields[3])) throw new Error(`Unsupported item row: ${file.path}:${record.line}`);
      const parent = fields[0], nodeId = fields[1], description = unquote(fields[2]);
      if (Number(fields[3]) === 0) {
        if (nodes.has(nodeId)) throw new Error(`Repeated source node ID: ${file.path}:${nodeId}`);
        nodes.set(nodeId, { id: nodeId, parent, description, line: record.line, raw: record.raw });
        continue;
      }
      const partNumber = unquote(fields[4]).trim();
      const sourcePath = `${file.path}:${record.line}`;
      const recordEvidence = { model, category, language, item, sourcePath, sourceFileSha256: file.sha256,
        sourceNodeId: nodeId, parentSourceNodeId: parent, applicationId: fields[11],
        topLevelDescription: itemDescriptions.get(item) ?? null,
        sourceConditions: ancestry(nodes, parent, sourcePath), rawRow: record.raw };
      const sidecar = file.path.replace(`/L${language}/`, '/').replace(new RegExp(`_L${language}\\.xml$`), '_attributes.xml');
      recordEvidence.applicabilityEvidence = applications.get(`${sidecar}:${fields[11]}`) ?? [];
      if (!partNumber || /^NSS$/i.test(partNumber) || partNumber === '0') {
        unresolvedLeaves.push({ ...recordEvidence, rawPartNumber: partNumber });
        continue;
      }
      occurrences.push({ ...recordEvidence, partNumberRaw: partNumber,
        partNumberNormalized: normalizedPartNumber(partNumber) });
    }
  }
  return {
    identity: { model, category, language },
    source: { root: staged.source.root, modelLabel: staged.source.modelLabel,
      parentModel: staged.source.parentModel, parentModelLabel: staged.source.parentModelLabel,
      ancestorModelIds: staged.source.ancestorModelIds,
      categoryLabel: staged.source.categoryLabel, categoryParent: staged.source.categoryParent,
      breadcrumb },
    files: staged.files.map(file => ({ path: file.path, size: file.size, sha256: file.sha256 })),
    occurrences, unresolvedLeaves,
  };
}
