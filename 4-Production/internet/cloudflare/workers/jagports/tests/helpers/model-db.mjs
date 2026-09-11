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
  migrate(db);
  if (fixtures) {
    db.exec(sql('tests/fixtures/deployment1.sql'));
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
