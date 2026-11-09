// SQLite 저장소. 나중에 Postgres(Supabase 등)로 옮기기 쉽게 중복 금지는 UNIQUE 제약으로 건다.

import fs from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { RESERVED_NICKNAMES } from './policy.js';

const SCHEMA = `
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY,
  public_id TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL UNIQUE COLLATE NOCASE,
  nickname TEXT NOT NULL UNIQUE COLLATE NOCASE,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  member_type TEXT NOT NULL CHECK (member_type IN ('new', 'returning')),
  first_joined_at TEXT NOT NULL,
  created_at TEXT NOT NULL,
  social_provider TEXT,
  social_subject TEXT,
  UNIQUE (social_provider, social_subject)
);
-- 한 사람(본인 인증 휴대폰)당 계정 하나
CREATE UNIQUE INDEX IF NOT EXISTS users_phone ON users (phone);
CREATE TABLE IF NOT EXISTS withdrawn_members (
  id INTEGER PRIMARY KEY,
  email TEXT NOT NULL COLLATE NOCASE,
  phone TEXT NOT NULL,
  first_joined_at TEXT NOT NULL,
  withdrawn_at TEXT NOT NULL,
  seed INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS withdrawn_email ON withdrawn_members (email);
CREATE TABLE IF NOT EXISTS blocked_emails (
  email TEXT PRIMARY KEY COLLATE NOCASE
);
CREATE TABLE IF NOT EXISTS reserved_nicknames (
  nickname TEXT PRIMARY KEY COLLATE NOCASE
);
CREATE TABLE IF NOT EXISTS verifications (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  code_hash TEXT NOT NULL,
  code_expires_at INTEGER NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL DEFAULT 0,
  token_hash TEXT UNIQUE,
  token_expires_at INTEGER,
  used_at INTEGER
);
CREATE TABLE IF NOT EXISTS consents (
  user_id INTEGER NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  term_key TEXT NOT NULL,
  agreed INTEGER NOT NULL CHECK (agreed IN (0, 1)),
  updated_at TEXT NOT NULL,
  PRIMARY KEY (user_id, term_key)
);
CREATE TABLE IF NOT EXISTS consent_tokens (
  token_hash TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  expires_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS social_tickets (
  ticket_hash TEXT PRIMARY KEY,
  provider TEXT NOT NULL,
  subject TEXT NOT NULL,
  email TEXT,
  nickname TEXT,
  expires_at INTEGER NOT NULL,
  used_at INTEGER
);
`;

/** 예전 DB 파일에 없는 컬럼은 시작할 때 붙인다. [테이블, 컬럼, 정의] */
const ADDED_COLUMNS = [
  ['users', 'social_provider', 'TEXT'],
  ['users', 'social_subject', 'TEXT'],
  ['withdrawn_members', 'seed', 'INTEGER NOT NULL DEFAULT 0'],
  ['verifications', 'created_at', 'INTEGER NOT NULL DEFAULT 0'],
];

const DAY = 24 * 3600 * 1000;

export function openDb(file) {
  if (file !== ':memory:') fs.mkdirSync(path.dirname(path.resolve(file)), { recursive: true });
  const db = new DatabaseSync(file);
  db.exec('PRAGMA foreign_keys = ON; PRAGMA journal_mode = WAL;');
  db.exec(SCHEMA);
  for (const [table, column, def] of ADDED_COLUMNS) {
    const cols = db.prepare(`PRAGMA table_info(${table})`).all().map((c) => c.name);
    if (!cols.includes(column)) db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${def}`);
  }
  seed(db);
  return db;
}

/**
 * 시연용 데이터. 실제 회원 정보가 아니다.
 * 탈퇴일처럼 날짜가 걸린 값은 실행 시점 기준으로 매번 다시 넣는다.
 */
function seed(db) {
  const insertReserved = db.prepare('INSERT OR IGNORE INTO reserved_nicknames (nickname) VALUES (?)');
  for (const n of RESERVED_NICKNAMES) insertReserved.run(n);
  db.prepare('INSERT OR IGNORE INTO blocked_emails (email) VALUES (?)').run('blocked@siempre.test');

  const now = Date.now();
  db.prepare('DELETE FROM withdrawn_members WHERE seed = 1').run();
  const insertWithdrawn = db.prepare(
    'INSERT INTO withdrawn_members (email, phone, first_joined_at, withdrawn_at, seed) VALUES (?, ?, ?, ?, 1)',
  );
  // 18일 전 탈퇴 → 같은 휴대폰이면 기존 회원 복귀
  insertWithdrawn.run('rejoin@siempre.test', '010-1234-5678', iso(now - 200 * DAY), iso(now - 18 * DAY));
  // 45일 전 탈퇴 → 복귀 기간이 지나 신규 가입
  insertWithdrawn.run('old@siempre.test', '010-1234-5678', iso(now - 400 * DAY), iso(now - 45 * DAY));

  const exists = db.prepare('SELECT 1 FROM users WHERE email = ?').get('doyoon@siempre.test');
  if (!exists) {
    db.prepare(
      `INSERT INTO users (public_id, email, nickname, password_hash, name, phone, member_type, first_joined_at, created_at)
       VALUES (?, ?, ?, '!', ?, ?, 'new', ?, ?)`,
    ).run('seed-doyoon', 'doyoon@siempre.test', '도윤', '김도윤', '010-9999-0000', iso(now), iso(now));
  }
}

export const iso = (ms) => new Date(ms).toISOString();
