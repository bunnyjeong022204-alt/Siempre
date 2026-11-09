// auth 파트 라우트 등록. shared/server.js에서 한 줄로 부른다.
// API 표: auth/README.md

import { ApiError } from '../shared/errors.js';
import { clientIp, parseCookies, readJson } from '../shared/http.js';
import { RATE_LIMITS, SESSION_COOKIE, SESSION_DAYS } from './config.js';
import { migrateAuth } from './schema.js';
import { createAuthService } from './service.js';

function createRateLimiter(now) {
  const hits = new Map();
  return function check(name, ip) {
    const { limit, windowMs } = RATE_LIMITS[name];
    const key = `${name}:${ip}`;
    const t = now();
    const recent = (hits.get(key) || []).filter((x) => t - x < windowMs);
    if (recent.length >= limit) {
      throw new ApiError(429, 'rate_limited', '요청이 너무 많아요. 잠시 후 다시 시도해 주세요.', { retryAfter: Math.ceil((windowMs - (t - recent[0])) / 1000) });
    }
    recent.push(t);
    hits.set(key, recent);
  };
}

export function registerAuthRoutes(router, ctx) {
  const { db, env, now } = ctx;
  migrateAuth(db, { seedDemo: env.SEED_DEMO !== '0', now: now() });
  const svc = createAuthService(db, { now, sessionSecret: env.SESSION_SECRET });
  const limit = createRateLimiter(now);
  const secure = env.COOKIE_SECURE === '1' ? '; Secure' : '';
  const sessionCookie = (token) => `${SESSION_COOKIE}=${token}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${SESSION_DAYS * 24 * 3600}${secure}`;
  const clearCookie = `${SESSION_COOKIE}=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0${secure}`;
  const tokenOf = (req) => parseCookies(req)[SESSION_COOKIE] || null;

  /** 다른 파트에 주는 함수 (shared/README.md 3장) */
  const currentUser = (req) => svc.userFromToken(tokenOf(req));
  const requireUser = (req) => {
    const u = currentUser(req);
    if (!u) throw new ApiError(401, 'login_required', '로그인이 필요해요.');
    return u;
  };

  router.post('/api/auth/check-email', async (req) => {
    limit('checkEmail', clientIp(req));
    return { body: svc.checkEmail(await readJson(req)) };
  });

  router.post('/api/auth/check-nickname', async (req) => ({ body: svc.checkNickname(await readJson(req)) }));

  router.post('/api/auth/signup', async (req) => {
    limit('signup', clientIp(req));
    return { status: 201, body: svc.signup(await readJson(req)) };
  });

  router.post('/api/auth/login', async (req) => {
    limit('login', clientIp(req));
    const { user, token } = svc.login(await readJson(req));
    return { body: { user }, headers: { 'set-cookie': sessionCookie(token) } };
  });

  router.post('/api/auth/logout', async (req) => {
    svc.logout(tokenOf(req));
    return { body: { ok: true }, headers: { 'set-cookie': clearCookie } };
  });

  router.get('/api/auth/me', async (req) => {
    const user = requireUser(req);
    return { body: { user, subscribed: ctx.getSubscription(user.id) != null } };
  });

  return { currentUser, requireUser };
}
