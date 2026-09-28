import { DatabaseSync } from 'node:sqlite';
import { readdirSync, readFileSync } from 'node:fs';

export const root = new URL('../../', import.meta.url);
export const specRoot = new URL('../../../../../5-Implementation-Projects/internet/jagports/solution/vieps/SPEC/', root);
export const sql = (relative) => {
  if (relative === 'MODEL_PART.md') {
    return readFileSync(new URL('MODEL_PART.md', specRoot), 'utf8');
  }
  if (relative === 'MODEL_STOCK.md') {
    return readFileSync(new URL('MODEL_STOCK.md', specRoot), 'utf8');
  }
  return readFileSync(new URL(relative, root), 'utf8');
};
export const migrations = readdirSync(new URL('migrations/', root)).filter((name) => name.endsWith('.sql')).sort();

export function migrate(db, names = migrations) {
  for (const name of names) {
    // D1 applies each pending migration transactionally. Keep FK enforcement on.
    db.exec('BEGIN');
    try {
      db.exec(sql(`migrations/${name}`));
      db.exec('COMMIT');
    } catch (error) {
      db.exec('ROLLBACK');
      throw new Error(`Migration ${name}: ${error.message}`, { cause: error });
    }
  }
}

export function database({ fixtures = true } = {}) {
  const db = new DatabaseSync(':memory:');
  db.exec('PRAGMA foreign_keys = ON');

  if (fixtures) {
    // Shared integrity fixtures represent persisted data that already exists
    // before the stock-model migration. Load them through 0010, then apply
    // 0011+ so upgrade-preservation behavior is tested instead of reinserting
    // legacy available stock after the availability trigger already exists.
    const stockModelMigration = migrations.indexOf('0011_mvp_stock_model.sql');
    if (stockModelMigration >= 0) {
      migrate(db, migrations.slice(0, stockModelMigration));
      db.exec(sql('tests/fixtures/part_presentation.sql'));
      db.exec(sql('tests/fixtures/part_model_integrity.sql'));
      migrate(db, migrations.slice(stockModelMigration));
      // Load normalized stock and applicability fixtures so current foreign
      // keys, vocabularies and indexes are exercised alongside preserved rows.
      db.exec(sql('tests/fixtures/stock_storage.sql'));
      db.exec(sql('tests/fixtures/vieps_searchable_fixture_dataset.sql'));
      db.exec(sql('tests/fixtures/occurrence_applicability.sql'));
      db.exec(sql('tests/fixtures/part_tree_occurrence.sql'));
      return db;
    }
  }

  migrate(db);
  if (fixtures) {
    db.exec(sql('tests/fixtures/part_presentation.sql'));
    db.exec(sql('tests/fixtures/part_model_integrity.sql'));
    db.exec(sql('tests/fixtures/occurrence_applicability.sql'));
    db.exec(sql('tests/fixtures/part_tree_occurrence.sql'));
  }
  return db;
}

// Execute real SQL through the small D1 interface used by the Worker.
export function d1(db) {
  const statement = (query, params = []) => ({
    async first() {
      return db.prepare(query).get(...params) ?? null;
    },
    async all() {
      return { results: db.prepare(query).all(...params) };
    },
    async run() {
      const result = db.prepare(query).run(...params);
      return {
        success: true,
        meta: {
          changes: Number(result.changes),
          last_row_id: Number(result.lastInsertRowid),
        },
      };
    },
  });

  return {
    prepare(query) {
      return {
        ...statement(query),
        bind(...params) {
          return statement(query, params);
        },
      };
    },
  };
}
