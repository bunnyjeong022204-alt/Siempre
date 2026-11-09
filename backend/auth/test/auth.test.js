// auth API 검사. 매번 임시 DB를 새로 만든다.
// 한글 본문은 fetch(UTF-8)로 보낸다 (Git Bash curl은 CP949로 보낼 수 있음).

import assert from 'node:assert/strict';
import fs from 'node:fs';
import net from 'node:net';
import os from 'node:os';
import path from 'node:path';
import { after, before, describe, test } from 'node:test';
import { createApp } from '../../shared/server.js';

let base, app, dir;
let clock = Date.now();

before(async () => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), 'siempre-auth-'));
  app = createApp({ env: { QUIET: '1', DATABASE_URL: path.join(dir, 'test.db'), SESSION_SECRET: 'test-secret' }, now: () => clock });
  await new Promise((r) => app.server.listen(0, r));
  base = `http://localhost:${app.server.address().port}`;
});
after(() => {
  app.server.close();
  app.db.close();
  fs.rmSync(dir, { recursive: true, force: true });
});

async function call(p, body, cookie) {
  const res = await fetch(base + p, {
    method: body === undefined ? 'GET' : 'POST',
    headers: { ...(body !== undefined ? { 'content-type': 'application/json' } : {}), ...(cookie ? { cookie } : {}) },
    body: body === undefined ? undefined : typeof body === 'string' ? body : JSON.stringify(body),
  });
  return { status: res.status, body: await res.json(), cookie: res.headers.get('set-cookie') };
}
const post = (p, body, cookie) => call(p, body, cookie);

const NEW = { email: 'Dohyun@Example.com ', password: 'abcd1234', nickname: '편집하는고래', agreeTerms: true };

describe('회원가입 → 로그인 → me → 로그아웃 (README "끝났는지 확인")', () => {
  test('전체 흐름', async () => {
    assert.deepEqual((await post('/api/auth/check-email', { email: 'dohyun@example.com' })).body, { status: 'new' });
    const s = await post('/api/auth/signup', NEW);
    assert.equal(s.status, 201);
    assert.deepEqual(s.body, { ok: true });

    const row = app.db.prepare('SELECT email, password_hash FROM users WHERE email = ?').get('dohyun@example.com');
    assert.equal(row.email, 'dohyun@example.com'); // 공백 제거·소문자
    assert.ok(row.password_hash.startsWith('scrypt$'));
    assert.ok(!row.password_hash.includes('abcd1234')); // 평문 없음

    const l = await post('/api/auth/login', { email: 'dohyun@example.com', password: 'abcd1234' });
    assert.equal(l.status, 200);
    assert.equal(l.body.user.nickname, '편집하는고래');
    assert.equal(l.body.user.password_hash, undefined);
    assert.match(l.cookie, /siempre_session=.+; HttpOnly; SameSite=Lax/);
    const cookie = l.cookie.split(';')[0];

    const me = await call('/api/auth/me', undefined, cookie);
    assert.equal(me.status, 200);
    assert.deepEqual(me.body, { user: l.body.user, subscribed: false });

    const out = await post('/api/auth/logout', {}, cookie);
    assert.deepEqual(out.body, { ok: true });
    assert.match(out.cookie, /Max-Age=0/);
    const after = await call('/api/auth/me', undefined, cookie);
    assert.equal(after.status, 401);
    assert.equal(after.body.error.code, 'login_required');
  });

  test('같은 이메일 재가입 → exists, check-email도 exists', async () => {
    const r = await post('/api/auth/signup', { ...NEW, nickname: '다른닉네임' });
    assert.equal(r.status, 409);
    assert.equal(r.body.error.code, 'exists');
    assert.equal(typeof r.body.error.message, 'string');
    assert.deepEqual((await post('/api/auth/check-email', { email: 'DOHYUN@example.com' })).body, { status: 'exists' });
  });

  test('비밀번호 틀림·없는 이메일 → 401 invalid_credentials (같은 응답)', async () => {
    const a = await post('/api/auth/login', { email: 'dohyun@example.com', password: 'wrong1234' });
    const b = await post('/api/auth/login', { email: 'nobody@example.com', password: 'wrong1234' });
    assert.equal(a.status, 401);
    assert.deepEqual(a.body, b.body);
    assert.equal(a.body.error.code, 'invalid_credentials');
  });

  test('세션 만료(14일) 후 me → 401', async () => {
    const l = await post('/api/auth/login', { email: 'dohyun@example.com', password: 'abcd1234' });
    clock += 15 * 24 * 3600 * 1000;
    assert.equal((await call('/api/auth/me', undefined, l.cookie.split(';')[0])).status, 401);
  });
});

describe('입력 규칙', () => {
  test('탈퇴 기록 이메일 → rejoin, 형식 오류 → invalid_email', async () => {
    assert.deepEqual((await post('/api/auth/check-email', { email: 'rejoin@siempre.test' })).body, { status: 'rejoin' });
    const bad = await post('/api/auth/check-email', { email: 'nope' });
    assert.equal(bad.status, 400);
    assert.equal(bad.body.error.code, 'invalid_email');
  });
  test('닉네임: 형식·예약어(대소문자 무시)·중복(대소문자 무시)', async () => {
    assert.deepEqual((await post('/api/auth/check-nickname', { nickname: 'a' })).body, { available: false, reason: 'invalid' });
    assert.deepEqual((await post('/api/auth/check-nickname', { nickname: 'ADMIN' })).body, { available: false, reason: 'reserved' });
    assert.deepEqual((await post('/api/auth/check-nickname', { nickname: '편집하는고래' })).body, { available: false, reason: 'taken' });
    assert.deepEqual((await post('/api/auth/check-nickname', { nickname: '열두글자닉네임까지가능해요' })).body, { available: false, reason: 'invalid' });
    assert.deepEqual((await post('/api/auth/check-nickname', { nickname: '열두글자닉네임까지가능' })).body, { available: true });
    await post('/api/auth/signup', { email: 'case@example.com', password: 'abcd1234', nickname: 'Whale', agreeTerms: true });
    assert.deepEqual((await post('/api/auth/check-nickname', { nickname: 'whale' })).body, { available: false, reason: 'taken' });
  });
  test('weak_password / terms_required / nickname_taken / marketing 타입', async () => {
    const base0 = { email: 'rules@example.com', password: 'abcd1234', nickname: '규칙검사', agreeTerms: true };
    assert.equal((await post('/api/auth/signup', { ...base0, password: 'abcdefgh' })).body.error.code, 'weak_password');
    assert.equal((await post('/api/auth/signup', { ...base0, password: '12345678' })).body.error.code, 'weak_password');
    assert.equal((await post('/api/auth/signup', { ...base0, agreeTerms: false })).body.error.code, 'terms_required');
    assert.equal((await post('/api/auth/signup', { ...base0, agreeTerms: 'true' })).body.error.code, 'terms_required');
    assert.equal((await post('/api/auth/signup', { ...base0, nickname: 'admin' })).body.error.code, 'nickname_taken');
    assert.equal((await post('/api/auth/signup', { ...base0, marketing: 'yes' })).status, 400);
    const ok = await post('/api/auth/signup', { ...base0, marketing: true });
    assert.equal(ok.status, 201);
    assert.equal(app.db.prepare('SELECT marketing FROM users WHERE email = ?').get('rules@example.com').marketing, 1);
  });
});

describe('잘못된 요청은 500이 아니라 400', () => {
  test('배열·JSON 아님·UTF-8 아님·잘못된 Content-Length·문자열 아닌 값', async () => {
    clock += 61_000; // 앞 테스트의 가입 요청 제한 창을 넘긴다
    assert.equal((await post('/api/auth/signup', '[1]')).body.error.code, 'invalid_body');
    assert.equal((await post('/api/auth/signup', '{oops')).body.error.code, 'invalid_body');
    const latin = await fetch(base + '/api/auth/check-email', { method: 'POST', headers: { 'content-type': 'application/json' }, body: Buffer.from([0x7b, 0x22, 0xff, 0x22, 0x7d]) });
    assert.equal(latin.status, 400);
    assert.equal((await post('/api/auth/signup', { ...NEW, email: 123 })).status, 400);
    const raw = await rawRequest('POST /api/auth/login HTTP/1.1\r\nHost: x\r\nContent-Type: application/json\r\nContent-Length: -5\r\nConnection: close\r\n\r\n');
    assert.match(raw, /^HTTP\/1\.1 400/);
    assert.equal((await call('/api/nope')).status, 404);
  });
});

describe('요청 제한', () => {
  test('login: IP당 1분 10회 넘으면 429 rate_limited, 1분 지나면 풀림', async () => {
    clock += 120_000;
    let last;
    for (let i = 0; i < 11; i++) last = await post('/api/auth/login', { email: 'x@example.com', password: 'abcd1234' });
    assert.equal(last.status, 429);
    assert.equal(last.body.error.code, 'rate_limited');
    clock += 61_000;
    assert.equal((await post('/api/auth/login', { email: 'x@example.com', password: 'abcd1234' })).status, 401);
  });
});

function rawRequest(text) {
  return new Promise((resolve, reject) => {
    const s = net.connect(app.server.address().port, 'localhost', () => s.end(text));
    let out = '';
    s.on('data', (d) => (out += d));
    s.on('end', () => resolve(out));
    s.on('error', reject);
  });
}
