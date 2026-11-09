// DB 연결. 테이블은 파트별 소유라 각 파트가 자기 migrate(db)로 만든다 (shared/README.md 4장).

import fs from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';

/** DATABASE_URL: "data/siempre.db", "file:data/siempre.db", ":memory:" */
export function openDb(url, baseDir = process.cwd()) {
  const raw = String(url || 'data/siempre.db').replace(/^file:/, '');
  const file = raw === ':memory:' ? raw : path.resolve(baseDir, raw);
  if (file !== ':memory:') fs.mkdirSync(path.dirname(file), { recursive: true });
  const db = new DatabaseSync(file);
  db.exec('PRAGMA foreign_keys = ON; PRAGMA journal_mode = WAL; PRAGMA busy_timeout = 3000;');
  return db;
}

/** 예전 DB 파일에 없는 컬럼은 시작할 때 붙인다 */
export function addMissingColumns(db, table, columns) {
  const have = db.prepare(`PRAGMA table_info(${table})`).all().map((c) => c.name);
  for (const [name, def] of columns) if (!have.includes(name)) db.exec(`ALTER TABLE ${table} ADD COLUMN ${name} ${def}`);
}

export const nowIso = (ms = Date.now()) => new Date(ms).toISOString();
