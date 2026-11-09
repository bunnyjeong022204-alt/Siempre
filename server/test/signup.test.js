// 회원가입 API 검사. 매번 임시 DB를 새로 만들어 시연 데이터를 소모하지 않는다.
// 한글 본문은 fetch(UTF-8)로 보낸다 (Git Bash curl은 CP949로 보낼 수 있음).

import assert from 'node:assert/strict';
import fs from 'node:fs';
import net from 'node:net';
import os from 'node:os';
import path from 'node:path';
import { after, before, describe, test } from 'node:test';
import { createApp } from '../server.js';

let base, app, dir;
let clock = Date.now();

before(async () => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), 'siempre-'));
  app = createApp({ dbPath: path.join(dir, 'test.db'), env: { QUIET: '1', PUBLIC_BASE_URL: 'http://localhost:5173' }, now: () => clock });
  await new Promise((r) => app.server.listen(0, r));
  base = `http://localhost:${app.server.address().port}`;
});
after(() => {
  app.server.close();
  app.db.close();
  fs.rmSync(dir, { recursive: true, force: true });
});

const post = async (p, body) => {
  const res = await fetch(base + p, { method: 'POST', headers: { 'content-type': 'application/json' }, body: typeof body === 'string' ? body : JSON.stringify(body) });
  return { status: res.status, body: await res.json() };
};
const get = async (p) => {
  const res = await fetch(base + p, { redirect: 'manual' });
  return { status: res.status, headers: res.headers, body: res.status === 302 ? null : await res.json() };
};

let phoneSeq = 1000;
async function verify(phone = `010-5555-${phoneSeq++}`, name = '김도윤') {
  clock += 31 * 1000; // 같은 번호 재요청 간격(30초)을 넘긴다
  const s = await post('/api/verify/send', { name, phone });
  assert.equal(s.status, 200);
  assert.match(s.body.demoCode, /^\d{6}$/);
  const c = await post('/api/verify/confirm', { requestId: s.body.requestId, code: s.body.demoCode });
  assert.equal(c.status, 200);
  return c.body;
}
const ALL = { tos: true, privacy: true, age14: true, aiTransfer: true, marketingEmail: true, marketingSms: false };

describe('본인 인증', () => {
  test('인증번호 틀리면 남은 횟수, 5번 틀리면 잠김', async () => {
    const s = await post('/api/verify/send', { name: '김도윤', phone: '01077770000' });
    const wrong = s.body.demoCode === '000000' ? '111111' : '000000';
    const r1 = await post('/api/verify/confirm', { requestId: s.body.requestId, code: wrong });
    assert.equal(r1.status, 400);
    assert.equal(r1.body.attemptsLeft, 4);
    for (let i = 0; i < 4; i++) await post('/api/verify/confirm', { requestId: s.body.requestId, code: wrong });
    const locked = await post('/api/verify/confirm', { requestId: s.body.requestId, code: s.body.demoCode });
    assert.equal(locked.status, 429);
  });
  test('30초 안에 다시 받으면 429, 3분 지나면 만료', async () => {
    const s = await post('/api/verify/send', { name: '김도윤', phone: '010-7777-1111' });
    assert.equal((await post('/api/verify/send', { name: '김도윤', phone: '010-7777-1111' })).status, 429);
    clock += 4 * 60 * 1000;
    const r = await post('/api/verify/confirm', { requestId: s.body.requestId, code: s.body.demoCode });
    assert.equal(r.status, 410);
  });
  test('이름·번호 형식 오류는 400', async () => {
    assert.equal((await post('/api/verify/send', { name: '김도윤', phone: '02-123' })).status, 400);
    assert.equal((await post('/api/verify/send', { name: 123, phone: '01012345678' })).status, 400);
  });
});

describe('이메일 확인 상태', () => {
  test('available / returning / rejoin_new(expired) / unavailable', async () => {
    const { verificationToken } = await verify('010-1234-5678');
    const check = (email) => post('/api/email/check', { email, verificationToken }).then((r) => r.body);
    assert.deepEqual(await check('new.person@example.com'), { status: 'available' });
    const back = await check('REJOIN@siempre.test');
    assert.equal(back.status, 'returning');
    assert.equal(back.daysLeft, 12);
    assert.deepEqual(await check('old@siempre.test'), { status: 'rejoin_new', reason: 'expired' });
    assert.deepEqual(await check('blocked@siempre.test'), { status: 'unavailable' });
    assert.deepEqual(await check('doyoon@siempre.test'), { status: 'unavailable' });
  });
  test('휴대폰이 다르면 탈퇴 사유·남은 일수를 알려 주지 않음', async () => {
    const { verificationToken } = await verify('010-2222-3333');
    const r = await post('/api/email/check', { email: 'rejoin@siempre.test', verificationToken });
    assert.deepEqual(r.body, { status: 'rejoin_new' });
  });
  test('본인 인증 없이 확인하면 401', async () => {
    const r = await post('/api/email/check', { email: 'a@b.co', verificationToken: 'nope' });
    assert.equal(r.status, 401);
  });
});

describe('닉네임', () => {
  test('예약어·대소문자 무시 중복·형식', async () => {
    assert.deepEqual((await get('/api/users/check-nickname?nickname=ADMIN')).body, { available: false, reason: 'reserved' });
    assert.deepEqual((await get(`/api/users/check-nickname?nickname=${encodeURIComponent('도윤')}`)).body, { available: false, reason: 'taken' });
    assert.deepEqual((await get('/api/users/check-nickname?nickname=a')).body, { available: false, reason: 'invalid' });
    assert.deepEqual((await get(`/api/users/check-nickname?nickname=${encodeURIComponent('새닉네임1')}`)).body, { available: true });
  });
});

describe('가입', () => {
  test('신규 가입 → 동의 수정 → 같은 인증·닉네임 재사용 거부', async () => {
    const { verificationToken } = await verify();
    const body = { verificationToken, email: 'fresh@example.com', password: 'abc12345!', nickname: '새회원', consents: ALL };
    const r = await post('/api/signup', body);
    assert.equal(r.status, 201);
    assert.equal(r.body.memberType, 'new');
    assert.ok(r.body.consentToken);
    assert.equal(r.body.password, undefined);

    const upd = await post('/api/consents', { consentToken: r.body.consentToken, consents: { ...ALL, marketingSms: true } });
    assert.equal(upd.status, 200);
    assert.equal(upd.body.consents.marketingSms, true);
    const drop = await post('/api/consents', { consentToken: r.body.consentToken, consents: { ...ALL, tos: false } });
    assert.equal(drop.status, 400);

    assert.equal((await post('/api/signup', body)).status, 401); // 인증 토큰은 1회용
    const again = await verify();
    const dupNick = await post('/api/signup', { ...body, verificationToken: again.verificationToken, email: 'other@example.com', nickname: '새회원' });
    assert.equal(dupNick.status, 409);
    assert.equal(dupNick.body.error, 'NICKNAME_UNAVAILABLE');
  });
  test('탈퇴 30일 이내 같은 휴대폰 → 기존 회원 복귀 (서버가 다시 판정)', async () => {
    const { verificationToken } = await verify('010-1234-5678');
    const r = await post('/api/signup', { verificationToken, email: 'rejoin@siempre.test', password: 'abc12345!', nickname: '돌아온회원', consents: ALL });
    assert.equal(r.status, 201);
    assert.equal(r.body.memberType, 'returning');
    assert.ok(Date.parse(r.body.firstJoinedAt) < Date.now() - 100 * 24 * 3600 * 1000);
    const c = await post('/api/verify/send', { name: '김도윤', phone: '010-1234-5678' });
    clock += 31 * 1000;
    const c2 = await post('/api/verify/send', { name: '김도윤', phone: '010-1234-5678' });
    const conf = await post('/api/verify/confirm', { requestId: c2.body.requestId, code: c2.body.demoCode });
    assert.equal(c.status, 429);
    assert.equal(conf.body.alreadyMember, true);
  });
  test('필수 약관 누락·비밀번호 규칙·알 수 없는 약관 → 400', async () => {
    const { verificationToken } = await verify();
    const base0 = { verificationToken, email: 'x@example.com', password: 'abc12345!', nickname: '규칙검사' };
    assert.equal((await post('/api/signup', { ...base0, consents: { ...ALL, privacy: false } })).body.error, 'REQUIRED_CONSENT');
    assert.equal((await post('/api/signup', { ...base0, password: 'abcdefgh', consents: ALL })).body.error, 'INVALID_PASSWORD');
    assert.equal((await post('/api/signup', { ...base0, consents: { ...ALL, hack: true } })).status, 400);
    assert.equal((await post('/api/signup', { ...base0, consents: { ...ALL, tos: 'yes' } })).status, 400);
  });
});

describe('잘못된 요청은 500이 아니라 400', () => {
  test('배열 본문, JSON 아님, UTF-8 아님, 잘못된 Content-Length', async () => {
    assert.equal((await post('/api/signup', '[1,2]')).status, 400);
    assert.equal((await post('/api/signup', '{nope')).status, 400);
    const latin = await fetch(base + '/api/verify/send', { method: 'POST', headers: { 'content-type': 'application/json' }, body: Buffer.from([0x7b, 0x22, 0xff, 0x22, 0x7d]) });
    assert.equal(latin.status, 400);
    const raw = await rawRequest('POST /api/signup HTTP/1.1\r\nHost: x\r\nContent-Type: application/json\r\nContent-Length: -5\r\nConnection: close\r\n\r\n');
    assert.match(raw, /^HTTP\/1\.1 400/);
  });
});

describe('간편가입 (시연 모드)', () => {
  test('state 쿠키 왕복 → 티켓 → 가입, 티켓 재사용·state 위조 거부', async () => {
    const start = await get('/api/auth/kakao/start');
    assert.equal(start.status, 302);
    const cookie = start.headers.get('set-cookie').split(';')[0];
    const cb = await fetch(start.headers.get('location').replace('http://localhost:5173', base), { headers: { cookie }, redirect: 'manual' });
    const loc = cb.headers.get('location');
    assert.match(loc, /\/signup#social=/);
    const ticket = decodeURIComponent(loc.split('#social=')[1]);
    const prof = await post('/api/auth/ticket', { ticket });
    assert.equal(prof.body.provider, 'kakao');

    const { verificationToken } = await verify();
    const r = await post('/api/signup', { verificationToken, socialTicket: ticket, email: prof.body.email, nickname: prof.body.nickname, consents: ALL });
    assert.equal(r.status, 201);
    assert.equal(r.body.socialProvider, 'kakao');
    assert.equal((await post('/api/auth/ticket', { ticket })).status, 401);

    const forged = await fetch(start.headers.get('location').replace('http://localhost:5173', base), { headers: { cookie: 'siempre_oauth_state=forged' }, redirect: 'manual' });
    assert.match(forged.headers.get('location'), /social_error=state/);
  });
});

function rawRequest(text) {
  return new Promise((resolve, reject) => {
    const { port } = app.server.address();
    const s = net.connect(port, 'localhost', () => s.end(text));
    let out = '';
    s.on('data', (d) => (out += d));
    s.on('end', () => resolve(out));
    s.on('error', reject);
  });
}
