import Database, { Database as DatabaseType } from 'better-sqlite3';
import * as sqliteVec from 'sqlite-vec';

const DEFAULT_DB_PATH = process.env.MEMORY_DB_PATH;
if (!DEFAULT_DB_PATH && process.env.NODE_ENV !== 'test') {
  throw new Error('Variable d\'environnement MEMORY_DB_PATH requise. Definir dans .env ou en ligne de commande.');
}

const READONLY = process.env.MEMORY_DB_READONLY !== 'false';

let db: DatabaseType | null = null;

export function getDb(): DatabaseType {
  if (!db) {
    if (!DEFAULT_DB_PATH) {
      throw new Error('Variable d\'environnement MEMORY_DB_PATH requise.');
    }
    db = new Database(DEFAULT_DB_PATH, { readonly: READONLY });
    sqliteVec.load(db);
  }
  return db;
}

export function closeDb(): void {
  if (db) {
    db.close();
    db = null;
  }
}
