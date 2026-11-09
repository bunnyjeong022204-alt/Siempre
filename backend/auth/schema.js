// auth 파트가 소유하는 테이블: users, sessions, withdrawn_members (shared/README.md 4장)
// 나중에 PostgreSQL로 옮기기 쉽게 중복 금지는 UNIQUE 제약으로 건다.

import { addMissingColumns, nowIso } from '../shared/db.js';

export function migrateAuth(db, { seedDemo = true, now = Date.now() } = {}) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY,
      email TEXT NOT NULL UNIQUE COLLATE NOCASE,
      nickname TEXT NOT NULL UNIQUE COLLATE NOCASE,
      password_hash TEXT NOT NULL,
      marketing INTEGER NOT NULL DEFAULT 0 CHECK (marketing IN (0, 1)),
      terms_agreed_at TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS sessions (
      token_hash TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users (id) ON DELETE CASCADE,
      created_at TEXT NOT NULL,
      expires_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS sessions_user ON sessions (user_id);
    CREATE TABLE IF NOT EXISTS withdrawn_members (
      id INTEGER PRIMARY KEY,
      email TEXT NOT NULL COLLATE NOCASE,
      withdrawn_at TEXT NOT NULL,
      seed INTEGER NOT NULL DEFAULT 0
    );
    CREATE INDEX IF NOT EXISTS withdrawn_email ON withdrawn_members (email);
  `);
  addMissingColumns(db, 'users', [['marketing', 'INTEGER NOT NULL DEFAULT 0']]);
  addMissingColumns(db, 'withdrawn_members', [['seed', 'INTEGER NOT NULL DEFAULT 0']]);

  if (seedDemo) {
    // 시연용 탈퇴 기록 (실제 회원 아님). 날짜가 걸린 값이라 시작할 때마다 다시 넣는다.
    db.prepare('DELETE FROM withdrawn_members WHERE seed = 1').run();
    db.prepare('INSERT INTO withdrawn_members (email, withdrawn_at, seed) VALUES (?, ?, 1)')
      .run('rejoin@siempre.test', nowIso(now - 18 * 24 * 3600 * 1000));
  }
}
