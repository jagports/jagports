const CATEGORIES = Object.freeze([
  ['SKILL /', 'category:skill'],
  ['AGENT /', 'category:agent'],
  ['KNOWLEDGE /', 'category:knowledge']
]);

function getCategorySyncPlan(title, labels) {
  const currentLabels = new Set(labels || []);
  const matches = CATEGORIES.filter(([prefix]) => title.startsWith(prefix));

  if (matches.length === 0) {
    return {
      prefix: null,
      expectedLabel: null,
      add: [],
      remove: [],
      error: null
    };
  }

  if (matches.length > 1) {
    return {
      prefix: null,
      expectedLabel: null,
      add: [],
      remove: [],
      error: 'Title contains multiple supported category prefixes; exactly one primary category prefix is permitted.'
    };
  }

  const [prefix, expectedLabel] = matches[0];
  const categoryLabels = CATEGORIES.map(([, label]) => label);
  const remove = categoryLabels.filter(
    label => label !== expectedLabel && currentLabels.has(label)
  );

  return {
    prefix,
    expectedLabel,
    add: currentLabels.has(expectedLabel) ? [] : [expectedLabel],
    remove,
    error: null
  };
}

module.exports = { CATEGORIES, getCategorySyncPlan };
