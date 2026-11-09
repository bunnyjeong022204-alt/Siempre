// auth API 검사. 매번 임시 DB를 새로 만들고, Firebase 대신 테스트용 RSA 키로 ID 토큰을 만들어 서명 확인까지 시험한다.
// 한글 본문은 fetch(UTF-8)로 보낸다 (Git Bash curl은 CP949로 보낼 수 있음).

import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import net from 'node:net';
import os from 'node:os';
import path from 'node:path';
import { after, before, describe, test } from 'node:test';
import { createApp } from '../../shared/server.js';

const PROJECT = 'siempre-test';
const KID = 'test-key-1';
const keys = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 });
const otherKeys = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 });
const publicPem = keys.publicKey.export({ type: 'spki', format: 'pem' });

let base, app, dir;
let clock = Date.now();

function idToken(claims = {}, { key = keys.privateKey, kid = KID, alg = 'RS256' } = {}) {
  const t = Math.floor(clock / 1000);
  const header = { alg, kid, typ: 'JWT' };
  const payload = { iss: `https://securetoken.google.com/${PROJECT}`, aud: PROJECT, auth_time: t - 10, iat: t - 10, exp: t + 3600, sub: 'uid-1', email: 'dohyun@example.com', email_verified: false, ...claims };
  const enc = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
  const data = `${enc(header)}.${enc(payload)}`;
  const sig = crypto.createSign('RSA-SHA256').update(data).sign(key).toString('base64url');
  return `${data}.${sig}`;
}

before(async () => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), 'siempre-auth-'));
  app = createApp({
    env: { QUIET: '1', DATABASE_URL: path.join(dir, 'test.db'), FIREBASE_PROJECT_ID: PROJECT },
    now: () => clock,
    getFirebaseCerts: async () => ({ [KID]: publicPem }),
  });
  await new Promise((r) => app.server.listen(0, r));
  base = `http://localhost:${app.server.address().port}`;
});
after(() => {
  app.server.close();
  app.db.close();
  fs.rmSync(dir, { recursive: true, force: true });
});

async function call(p, { body, token } = {}) {
  const res = await fetch(base + p, {
    method: body === undefined ? 'GET' : 'POST',
    headers: { ...(body !== undefined ? { 'content-type': 'application/json' } : {}), ...(token ? { authorization: `Bearer ${token}` } : {}) },
    body: body === undefined ? undefined : typeof body === 'string' ? body : JSON.stringify(body),
  });
  return { status: res.status, body: await res.json() };
}

describe('Firebase 토큰 → Siempre 가입 → me (README "끝났는지 확인")', () => {
  test('가입 전 me는 404 profile_missing, 가입 후 me에 닉네임', async () => {
    const token = idToken();
    const before0 = await call('/api/auth/me', { token });
    assert.equal(before0.status, 404);
    assert.equal(before0.body.error.code, 'profile_missing');
    assert.equal(before0.body.error.email, 'dohyun@example.com');

    // 본문의 email은 무시하고 토큰의 이메일을 쓴다
    const s = await call('/api/auth/signup', { token, body: { email: 'evil@example.com', nickname: '편집하는고래', agreeTerms: true } });
    assert.equal(s.status, 201);
    assert.deepEqual(s.body.user, { id: 1, email: 'dohyun@example.com', nickname: '편집하는고래' });

    const me = await call('/api/auth/me', { token });
    assert.equal(me.status, 200);
    assert.deepEqual(me.body, { user: s.body.user, subscribed: false });

    const cols = app.db.prepare('PRAGMA table_info(users)').all().map((c) => c.name);
    assert.ok(!cols.some((c) => c.includes('password'))); // 비밀번호는 저장하지 않는다 (Firebase가 보관)
  });

  test('같은 계정·같은 이메일 재가입 → 409 exists, check-email도 exists', async () => {
    const again = await call('/api/auth/signup', { token: idToken(), body: { nickname: '다른닉네임', agreeTerms: true } });
    assert.equal(again.status, 409);
    assert.equal(again.body.error.code, 'exists');
    const otherUid = await call('/api/auth/signup', { token: idToken({ sub: 'uid-2', email: 'DOHYUN@example.com' }), body: { nickname: '다른닉네임', agreeTerms: true } });
    assert.equal(otherUid.body.error.code, 'exists');
    assert.deepEqual((await call('/api/auth/check-email', { body: { email: 'Dohyun@Example.com ' } })).body, { status: 'exists' });
  });

  test('토큰 없음·만료·다른 프로젝트·다른 발급자·위조 서명·모르는 키·alg 바꿔치기 → 401 login_required', async () => {
    const t = Math.floor(clock / 1000);
    const bad = [
      undefined,
      'not.a.token',
      idToken({ exp: t - 1 }),
      idToken({ aud: 'other-project' }),
      idToken({ iss: 'https://securetoken.google.com/other-project' }),
      idToken({ sub: '' }),
      idToken({ iat: t + 600 }),
      idToken({}, { key: otherKeys.privateKey }),
      idToken({}, { kid: 'unknown-kid' }),
      idToken({}, { alg: 'HS256' }),
    ];
    for (const token of bad) {
      const r = await call('/api/auth/me', { token });
      assert.equal(r.status, 401, `token: ${String(token).slice(0, 20)}`);
      assert.equal(r.body.error.code, 'login_required');
    }
    const s = await call('/api/auth/signup', { body: { nickname: '토큰없음', agreeTerms: true } });
    assert.equal(s.status, 401);
  });
});

describe('입력 규칙', () => {
  test('탈퇴 기록 이메일 → rejoin, 새 이메일 → new, 형식 오류 → invalid_email', async () => {
    assert.deepEqual((await call('/api/auth/check-email', { body: { email: 'rejoin@siempre.test' } })).body, { status: 'rejoin' });
    assert.deepEqual((await call('/api/auth/check-email', { body: { email: 'new@example.com' } })).body, { status: 'new' });
    const bad = await call('/api/auth/check-email', { body: { email: 'nope' } });
    assert.equal(bad.status, 400);
    assert.equal(bad.body.error.code, 'invalid_email');
  });
  test('닉네임: 형식·예약어(대소문자 무시)·중복(대소문자 무시)', async () => {
    const nick = (n) => call('/api/auth/check-nickname', { body: { nickname: n } }).then((r) => r.body);
    assert.deepEqual(await nick('a'), { available: false, reason: 'invalid' });
    assert.deepEqual(await nick('ADMIN'), { available: false, reason: 'reserved' });
    assert.deepEqual(await nick('편집하는고래'), { available: false, reason: 'taken' });
    assert.deepEqual(await nick('열두글자닉네임까지가능해요'), { available: false, reason: 'invalid' });
    assert.deepEqual(await nick('열두글자닉네임까지가능'), { available: true });
    await call('/api/auth/signup', { token: idToken({ sub: 'uid-case', email: 'case@example.com' }), body: { nickname: 'Whale', agreeTerms: true } });
    assert.deepEqual(await nick('whale'), { available: false, reason: 'taken' });
  });
  test('terms_required / invalid_nickname / nickname_taken / marketing 타입', async () => {
    clock += 61_000; // 앞 테스트의 가입 요청 제한 창(1분 10회)을 넘긴다
    const token = idToken({ sub: 'uid-rules', email: 'rules@example.com' });
    const signup = (b) => call('/api/auth/signup', { token, body: { nickname: '규칙검사', agreeTerms: true, ...b } });
    assert.equal((await signup({ agreeTerms: false })).body.error.code, 'terms_required');
    assert.equal((await signup({ agreeTerms: 'true' })).body.error.code, 'terms_required');
    assert.equal((await signup({ nickname: 'a' })).body.error.code, 'invalid_nickname');
    assert.equal((await signup({ nickname: 'admin' })).body.error.code, 'nickname_taken');
    assert.equal((await signup({ marketing: 'yes' })).status, 400);
    const ok = await signup({ marketing: true });
    assert.equal(ok.status, 201);
    assert.equal(app.db.prepare('SELECT marketing FROM users WHERE email = ?').get('rules@example.com').marketing, 1);
  });
});

describe('잘못된 요청은 500이 아니라 400', () => {
  test('배열·JSON 아님·UTF-8 아님·잘못된 Content-Length·문자열 아닌 값', async () => {
    assert.equal((await call('/api/auth/check-email', { body: '[1]' })).body.error.code, 'invalid_body');
    assert.equal((await call('/api/auth/check-email', { body: '{oops' })).body.error.code, 'invalid_body');
    const latin = await fetch(base + '/api/auth/check-email', { method: 'POST', headers: { 'content-type': 'application/json' }, body: Buffer.from([0x7b, 0x22, 0xff, 0x22, 0x7d]) });
    assert.equal(latin.status, 400);
    assert.equal((await call('/api/auth/check-email', { body: { email: 123 } })).status, 400);
    const raw = await rawRequest('POST /api/auth/check-nickname HTTP/1.1\r\nHost: x\r\nContent-Type: application/json\r\nContent-Length: -5\r\nConnection: close\r\n\r\n');
    assert.match(raw, /^HTTP\/1\.1 400/);
    assert.equal((await call('/api/nope')).status, 404);
  });
});

describe('요청 제한·설정 누락', () => {
  test('check-email: IP당 1분 20회 넘으면 429 rate_limited, 1분 지나면 풀림', async () => {
    clock += 120_000;
    let last;
    for (let i = 0; i < 21; i++) last = await call('/api/auth/check-email', { body: { email: 'x@example.com' } });
    assert.equal(last.status, 429);
    assert.equal(last.body.error.code, 'rate_limited');
    clock += 61_000;
    assert.equal((await call('/api/auth/check-email', { body: { email: 'x@example.com' } })).status, 200);
  });
  test('FIREBASE_PROJECT_ID가 없으면 로그인 필요한 API는 503 auth_not_configured', async () => {
    const d = fs.mkdtempSync(path.join(os.tmpdir(), 'siempre-noauth-'));
    const a = createApp({ env: { QUIET: '1', DATABASE_URL: path.join(d, 't.db') } });
    await new Promise((r) => a.server.listen(0, r));
    const res = await fetch(`http://localhost:${a.server.address().port}/api/auth/me`, { headers: { authorization: `Bearer ${idToken()}` } });
    assert.equal(res.status, 503);
    assert.equal((await res.json()).error.code, 'auth_not_configured');
    a.server.close();
    a.db.close();
    fs.rmSync(d, { recursive: true, force: true });
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
