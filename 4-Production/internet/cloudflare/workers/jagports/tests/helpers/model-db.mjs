import { DatabaseSync } from 'node:sqlite';
import { readdirSync, readFileSync } from 'node:fs';

export const root = new URL('../../', import.meta.url);
export const sql = (relative) => readFileSync(new URL(relative, root), 'utf8');
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
    // The shared integrity fixtures represent persisted data that already exists
    // before the MVP stock migration. Load them through 0010, then apply 0011+
    // so upgrade-preservation behavior is tested instead of reinserting legacy
    // available stock after the new availability trigger already exists.
    const mvpStockMigration = migrations.indexOf('0011_mvp_stock_model.sql');
    if (mvpStockMigration >= 0) {
      migrate(db, migrations.slice(0, mvpStockMigration));
      db.exec(sql('tests/fixtures/part_presentation.sql'));
      db.exec(sql('tests/fixtures/part_model_integrity.sql'));
      migrate(db, migrations.slice(mvpStockMigration));
      // Load normalized post-0011 stock fixtures as well so new foreign keys and
      // indexes are exercised alongside preserved legacy rows.
      db.exec(sql('tests/fixtures/mvp_stock_storage.sql'));
      db.exec(sql('tests/fixtures/vieps_searchable_fixture_dataset.sql'));
      return db;
    }
  }

  migrate(db);
  if (fixtures) {
    db.exec(sql('tests/fixtures/part_presentation.sql'));
    db.exec(sql('tests/fixtures/part_model_integrity.sql'));
  }
  return db;
}

// Execute real SQL through the small D1 interface used by the Worker.
export function d1(db) {
  return { prepare(query) {
    return { bind(...params) {
      return {
        async first() { return db.prepare(query).get(...params) ?? null; },
        async all() { return { results: db.prepare(query).all(...params) }; },
      };
    } };
  } };
}
