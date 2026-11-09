// Siempre 백엔드 서버 시작 파일 (공통, A·B 합의해서만 고친다)
//   cd backend && npm start   → http://localhost:8787
// 파트별 라우트 등록은 아래 "라우트 등록"에 한 줄씩. 각자 자기 줄만 건드린다.

import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { openDb } from './db.js';
import { ApiError, errorBody, serverError } from './errors.js';
import { sendJson } from './http.js';
import { createRouter } from './router.js';
import { registerAuthRoutes } from '../auth/routes.js';

const BACKEND_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export function createApp({ env = process.env, now = () => Date.now() } = {}) {
  const db = openDb(env.DATABASE_URL, BACKEND_DIR);
  const router = createRouter();
  const ctx = {
    db,
    env,
    now,
    // subscription 파트(A)가 생기면 getSubscription(userId)로 바꾼다. 지금은 모두 "구독 안 함".
    getSubscription: () => null,
  };

  // ── 라우트 등록 (파트별 한 줄) ─────────────────────
  const auth = registerAuthRoutes(router, ctx); // A: 회원가입·로그인 /api/auth/*
  // registerSubscriptionRoutes(router, ctx);   // A: 구독·데모 결제 (예정)
  // registerChatRoutes(router, ctx);           // B: 대화 (예정)
  // registerCreditsRoutes(router, ctx);        // B: 크레딧 (예정)
  ctx.currentUser = auth.currentUser;
  ctx.requireUser = auth.requireUser;

  const server = http.createServer(async (req, res) => {
    const url = new URL(req.url, 'http://local');
    try {
      const handler = router.find(req.method, url.pathname);
      if (!handler) throw new ApiError(404, 'not_found', '없는 주소예요.');
      const out = await handler(req, res, url);
      if (out && !res.headersSent) sendJson(res, out.status ?? 200, out.body, out.headers);
    } catch (e) {
      const err = e instanceof ApiError ? e : serverError();
      if (!(e instanceof ApiError)) console.error(e);
      if (!res.headersSent) sendJson(res, err.status, errorBody(err));
    } finally {
      // 로그에는 경로와 상태만 남긴다 (본문·비밀번호·쿠키 제외)
      if (!env.QUIET) console.log(`${req.method} ${url.pathname} ${res.statusCode}`);
    }
  });
  return { server, db, router };
}

function loadEnv(file) {
  try {
    for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m && !line.trim().startsWith('#') && process.env[m[1]] === undefined) process.env[m[1]] = m[2].replace(/^['"]|['"]$/g, '');
    }
  } catch {
    // .env가 없으면 기본값
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  loadEnv(path.join(BACKEND_DIR, '.env'));
  const port = Number(process.env.PORT || 8787);
  const { server, router } = createApp();
  server.listen(port, () => {
    console.log(`Siempre 백엔드: http://localhost:${port}`);
    console.log(`라우트: ${router.list().join(', ')}`);
    if (!process.env.SESSION_SECRET) console.warn('SESSION_SECRET이 없어 임시 키를 써요. 서버를 다시 켜면 로그인이 풀려요.');
  });
}
