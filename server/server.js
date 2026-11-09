// Siempre 회원가입 API 서버. 설치할 패키지 없이 Node.js 22.13 이상에서 실행된다.
//   npm start                      → http://localhost:8787
//   node server.js --db tmp/test.db  (시연 데이터를 소모하지 않게 테스트 DB를 따로 쓴다)
// 화면(app/)은 Vite 개발 서버가 /api 요청을 이 서버로 넘겨 준다.

import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { openDb } from './lib/db.js';
import { createSignupService } from './lib/signup.js';
import { HttpError, bad } from './lib/validate.js';
import { PROVIDERS, createStateStore, credentials, demoProfile, exchangeAndFetchProfile } from './lib/oauth.js';

const MAX_BODY = 64 * 1024;
const STATE_COOKIE = 'siempre_oauth_state';

export function createApp({ dbPath, env = process.env, now = () => Date.now() } = {}) {
  const db = openDb(dbPath);
  const smsDemo = !env.SMS_PROVIDER;
  const svc = createSignupService(db, { now, smsDemo });
  const states = createStateStore(now);
  const publicBase = new URL(env.PUBLIC_BASE_URL || 'http://localhost:5173');
  const secureCookie = publicBase.protocol === 'https:';

  const mode = () => Object.fromEntries(Object.keys(PROVIDERS).map((p) => [p, credentials(p, env) ? 'live' : 'demo']));

  async function handle(req, res) {
    const url = new URL(req.url, 'http://local');
    const route = `${req.method} ${url.pathname}`;
    const auth = url.pathname.match(/^\/api\/auth\/([a-z]+)\/(start|callback)$/);

    if (route === 'GET /api/health') return json(res, 200, { ok: true, oauth: mode(), sms: smsDemo ? 'demo' : 'live' });
    if (route === 'POST /api/verify/send') return json(res, 200, await svc.sendCode(await readJson(req)));
    if (route === 'POST /api/verify/confirm') return json(res, 200, svc.confirmCode(await readJson(req)));
    if (route === 'POST /api/email/check') return json(res, 200, svc.checkEmail(await readJson(req)));
    if (route === 'GET /api/users/check-nickname') return json(res, 200, svc.checkNickname(url.searchParams.get('nickname')));
    if (route === 'POST /api/signup') return json(res, 201, svc.signup(await readJson(req)));
    if (route === 'POST /api/consents') return json(res, 200, svc.updateConsents(await readJson(req)));
    if (route === 'POST /api/auth/ticket') return json(res, 200, svc.readTicket(await readJson(req)));
    if (req.method === 'GET' && auth && PROVIDERS[auth[1]]) {
      return auth[2] === 'start' ? oauthStart(req, res, auth[1]) : oauthCallback(req, res, auth[1], url);
    }
    throw new HttpError(404, 'NOT_FOUND', '없는 주소예요.');
  }

  function oauthStart(req, res, provider) {
    const cred = credentials(provider, env);
    // 실제 키가 있으면 쿠키 호스트를 맞추기 위해 공개 주소로 다시 시작시킨다 (127.0.0.1 vs localhost).
    if (cred && req.headers.host !== publicBase.host) return redirect(res, new URL(req.url, publicBase).href);
    const state = states.issue(provider);
    const cookie = `${STATE_COOKIE}=${state}; HttpOnly; SameSite=Lax; Path=/api/auth; Max-Age=600${secureCookie ? '; Secure' : ''}`;
    const redirectUri = new URL(`/api/auth/${provider}/callback`, publicBase).href;
    if (!cred) return redirect(res, `${redirectUri}?code=demo&state=${encodeURIComponent(state)}`, cookie);
    const p = PROVIDERS[provider];
    const q = new URLSearchParams({ response_type: 'code', client_id: cred.id, redirect_uri: redirectUri, state, ...(p.scope ? { scope: p.scope } : {}) });
    return redirect(res, `${p.authorizeUrl}?${q}`, cookie);
  }

  async function oauthCallback(req, res, provider, url) {
    const back = (hash) => redirect(res, new URL(`/signup#${hash}`, publicBase).href, `${STATE_COOKIE}=; HttpOnly; SameSite=Lax; Path=/api/auth; Max-Age=0`);
    const state = url.searchParams.get('state');
    if (!states.consume(state, cookies(req)[STATE_COOKIE], provider)) return back('social_error=state');
    if (url.searchParams.get('error') || !url.searchParams.get('code')) return back('social_error=denied');
    let profile;
    try {
      const cred = credentials(provider, env);
      profile = cred
        ? await exchangeAndFetchProfile(provider, { code: url.searchParams.get('code'), state, redirectUri: new URL(`/api/auth/${provider}/callback`, publicBase).href, cred })
        : demoProfile(provider);
    } catch (e) {
      console.error(`[oauth] ${provider} 실패: ${e.message}`);
      return back('social_error=provider');
    }
    try {
      // 티켓은 ? 대신 # 뒤에 붙여 서버 로그·Referer로 새지 않게 한다. DB에는 해시만 저장한다.
      return back(`social=${encodeURIComponent(svc.issueSocialTicket(profile))}`);
    } catch (e) {
      if (e instanceof HttpError && e.code === 'SOCIAL_ALREADY') return back('social_error=already');
      throw e;
    }
  }

  const server = http.createServer(async (req, res) => {
    try {
      await handle(req, res);
    } catch (e) {
      if (e instanceof HttpError) return json(res, e.status, { error: e.code, message: e.message, ...e.extra });
      console.error(e);
      json(res, 500, { error: 'INTERNAL', message: '잠시 후 다시 시도해 주세요.' });
    } finally {
      // 로그에는 경로와 상태만 남긴다 (본문·토큰 제외)
      if (!env.QUIET) console.log(`${req.method} ${req.url.split('?')[0].split('#')[0]} ${res.statusCode}`);
    }
  });
  return { server, db, mode };
}

async function readJson(req) {
  const len = req.headers['content-length'];
  if (len !== undefined && !/^\d+$/.test(len)) throw bad('INVALID_LENGTH', 'Content-Length 값이 잘못됐어요.');
  if (len !== undefined && Number(len) > MAX_BODY) throw new HttpError(413, 'TOO_LARGE', '요청이 너무 커요.');
  const chunks = [];
  let size = 0;
  for await (const c of req) {
    size += c.length;
    if (size > MAX_BODY) throw new HttpError(413, 'TOO_LARGE', '요청이 너무 커요.');
    chunks.push(c);
  }
  let text;
  try {
    text = new TextDecoder('utf-8', { fatal: true }).decode(Buffer.concat(chunks));
  } catch {
    throw bad('INVALID_ENCODING', '본문은 UTF-8이어야 해요.');
  }
  let body;
  try {
    body = JSON.parse(text);
  } catch {
    throw bad('INVALID_JSON', 'JSON 형식이 아니에요.');
  }
  if (body === null || typeof body !== 'object' || Array.isArray(body)) throw bad('INVALID_BODY', '요청 본문은 JSON 객체여야 해요.');
  return body;
}

function cookies(req) {
  return Object.fromEntries(String(req.headers.cookie || '').split(';').map((s) => s.trim().split('=')).filter((p) => p[0]).map(([k, ...r]) => [k, r.join('=')]));
}

function json(res, status, body) {
  res.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' });
  res.end(JSON.stringify(body));
}

function redirect(res, location, cookie) {
  res.writeHead(302, { location, 'cache-control': 'no-store', ...(cookie ? { 'set-cookie': cookie } : {}) });
  res.end();
}

function loadEnv(file) {
  try {
    for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m && !line.trim().startsWith('#') && process.env[m[1]] === undefined) process.env[m[1]] = m[2].replace(/^['"]|['"]$/g, '');
    }
  } catch {
    // .env가 없으면 기본값(시연 모드)
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const here = path.dirname(fileURLToPath(import.meta.url));
  loadEnv(path.join(here, '.env'));
  const i = process.argv.indexOf('--db');
  const dbPath = i > 0 ? process.argv[i + 1] : path.resolve(here, process.env.DB_PATH || 'data/siempre.db');
  const port = Number(process.env.PORT || 8787);
  const { server, mode } = createApp({ dbPath });
  server.listen(port, () => {
    console.log(`Siempre 회원가입 API: http://localhost:${port}  (DB: ${dbPath})`);
    console.log(`간편가입: ${Object.entries(mode()).map(([p, m]) => `${p}=${m}`).join(', ')} · 문자 인증: ${process.env.SMS_PROVIDER ? 'live' : 'demo'}`);
  });
}
