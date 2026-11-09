// auth 파트가 소유하는 테이블: users, withdrawn_members (shared/README.md 4장)
// 계정(이메일·비밀번호)은 Firebase Authentication에 있고, users에는 Siempre 회원 정보만 둔다.
// 나중에 PostgreSQL로 옮기기 쉽게 중복 금지는 UNIQUE 제약으로 건다.

import { nowIso } from '../shared/db.js';

export function migrateAuth(db, { seedDemo = true, now = Date.now() } = {}) {
  const cols = db.prepare('PRAGMA table_info(users)').all().map((c) => c.name);
  if (cols.length && !cols.includes('firebase_uid')) {
    // 비밀번호를 직접 저장하던 예전 개발용 DB. 자동으로 옮기지 않고 멈춰서 알려 준다.
    throw new Error('예전 방식(비밀번호 직접 저장)의 DB 파일이에요. 개발용이면 DATABASE_URL의 파일을 지우고 다시 시작해 주세요.');
  }
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY,
      firebase_uid TEXT NOT NULL UNIQUE,
      email TEXT NOT NULL UNIQUE COLLATE NOCASE,
      nickname TEXT NOT NULL UNIQUE COLLATE NOCASE,
      marketing INTEGER NOT NULL DEFAULT 0 CHECK (marketing IN (0, 1)),
      terms_agreed_at TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS withdrawn_members (
      id INTEGER PRIMARY KEY,
      email TEXT NOT NULL COLLATE NOCASE,
      withdrawn_at TEXT NOT NULL,
      seed INTEGER NOT NULL DEFAULT 0
    );
    CREATE INDEX IF NOT EXISTS withdrawn_email ON withdrawn_members (email);
  `);

  if (seedDemo) {
    // 시연용 탈퇴 기록 (실제 회원 아님). 날짜가 걸린 값이라 시작할 때마다 다시 넣는다.
    db.prepare('DELETE FROM withdrawn_members WHERE seed = 1').run();
    db.prepare('INSERT INTO withdrawn_members (email, withdrawn_at, seed) VALUES (?, ?, 1)')
      .run('rejoin@siempre.test', nowIso(now - 18 * 24 * 3600 * 1000));
  }
}
