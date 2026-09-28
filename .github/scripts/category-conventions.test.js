const test = require('node:test');
const assert = require('node:assert/strict');
const { getCategorySyncPlan } = require('./category-conventions.js');

test('SKILL to AGENT rename removes stale skill label and adds agent label', () => {
  const plan = getCategorySyncPlan('AGENT / TEST FIXTURE', ['category:skill']);
  assert.deepEqual(plan.add, ['category:agent']);
  assert.deepEqual(plan.remove, ['category:skill']);
  assert.equal(plan.expectedLabel, 'category:agent');
});

test('AGENT to KNOWLEDGE rename removes stale agent label and adds knowledge label', () => {
  const plan = getCategorySyncPlan('KNOWLEDGE / TEST FIXTURE', ['category:agent']);
  assert.deepEqual(plan.add, ['category:knowledge']);
  assert.deepEqual(plan.remove, ['category:agent']);
  assert.equal(plan.expectedLabel, 'category:knowledge');
});

test('unrelated labels are preserved', () => {
  const plan = getCategorySyncPlan('AGENT / TEST FIXTURE', ['category:skill', 'priority:P1', 'test:human-pass']);
  assert.deepEqual(plan.add, ['category:agent']);
  assert.deepEqual(plan.remove, ['category:skill']);
});

test('already-correct category label requires no mutation', () => {
  const plan = getCategorySyncPlan('AGENT / TEST FIXTURE', ['category:agent', 'priority:P1']);
  assert.deepEqual(plan.add, []);
  assert.deepEqual(plan.remove, []);
  assert.equal(plan.error, null);
});

test('ordinary title is a valid no-op', () => {
  const plan = getCategorySyncPlan('Ordinary human title', ['category:skill']);
  assert.equal(plan.expectedLabel, null);
  assert.deepEqual(plan.add, []);
  assert.deepEqual(plan.remove, []);
  assert.equal(plan.error, null);
});

test('known prefix takes only its matching category label', () => {
  const plan = getCategorySyncPlan('SKILL / TEST FIXTURE', ['category:skill', 'category:agent', 'category:knowledge']);
  assert.deepEqual(plan.add, []);
  assert.deepEqual(plan.remove, ['category:agent', 'category:knowledge']);
  assert.equal(plan.expectedLabel, 'category:skill');
});
