// 간편가입 제공사 표. 제공사를 늘릴 때는 여기에 한 줄을 추가하고 화면에 버튼만 더한다.
// 키가 없으면 시연 모드: 제공사 화면 없이 바로 콜백으로 돌아와 가짜 프로필로 같은 흐름을 탄다.

import { OAUTH_STATE_TTL_MS } from './policy.js';
import { newToken, safeEqual } from './secure.js';

export const PROVIDERS = {
  google: {
    label: '구글',
    authorizeUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token',
    profileUrl: 'https://openidconnect.googleapis.com/v1/userinfo',
    scope: 'openid email profile',
    toProfile: (p) => ({ subject: p.sub, email: p.email, nickname: p.name }),
  },
  kakao: {
    label: '카카오',
    authorizeUrl: 'https://kauth.kakao.com/oauth/authorize',
    tokenUrl: 'https://kauth.kakao.com/oauth/token',
    profileUrl: 'https://kapi.kakao.com/v2/user/me',
    scope: 'account_email profile_nickname',
    toProfile: (p) => ({ subject: String(p.id), email: p.kakao_account?.email, nickname: p.kakao_account?.profile?.nickname }),
  },
  naver: {
    label: '네이버',
    authorizeUrl: 'https://nid.naver.com/oauth2.0/authorize',
    tokenUrl: 'https://nid.naver.com/oauth2.0/token',
    profileUrl: 'https://openapi.naver.com/v1/nid/me',
    scope: '',
    toProfile: (p) => ({ subject: p.response?.id, email: p.response?.email, nickname: p.response?.nickname }),
  },
};

export function credentials(provider, env = process.env) {
  const key = provider.toUpperCase();
  const id = env[`OAUTH_${key}_CLIENT_ID`];
  const secret = env[`OAUTH_${key}_CLIENT_SECRET`];
  return id && secret ? { id, secret } : null;
}

/** state는 서버 메모리와 HttpOnly 쿠키 둘 다와 맞아야 통과한다. 쓰면 바로 지운다. */
export function createStateStore(now = () => Date.now()) {
  const states = new Map();
  return {
    issue(provider) {
      const s = newToken();
      states.set(s, { provider, expiresAt: now() + OAUTH_STATE_TTL_MS });
      for (const [k, val] of states) if (val.expiresAt < now()) states.delete(k);
      return s;
    },
    consume(state, cookieState, provider) {
      const rec = state ? states.get(state) : null;
      if (state) states.delete(state);
      return !!rec && rec.provider === provider && rec.expiresAt >= now() && !!cookieState && safeEqual(state, cookieState);
    },
  };
}

export async function exchangeAndFetchProfile(provider, { code, state, redirectUri, cred }) {
  const p = PROVIDERS[provider];
  const form = new URLSearchParams({
    grant_type: 'authorization_code', code, redirect_uri: redirectUri, client_id: cred.id, client_secret: cred.secret,
    ...(provider === 'naver' ? { state } : {}),
  });
  const tokRes = await fetch(p.tokenUrl, { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body: form });
  if (!tokRes.ok) throw new Error(`token ${tokRes.status}`);
  const { access_token: accessToken } = await tokRes.json();
  const profRes = await fetch(p.profileUrl, { headers: { authorization: `Bearer ${accessToken}` } });
  if (!profRes.ok) throw new Error(`profile ${profRes.status}`);
  const prof = p.toProfile(await profRes.json());
  if (!prof.subject) throw new Error('profile without subject');
  return { provider, ...prof };
}

export function demoProfile(provider) {
  const tag = newToken().slice(0, 6).toLowerCase().replace(/[^a-z0-9]/g, 'x');
  return { provider, subject: `demo-${provider}-${tag}`, email: `${provider}-${tag}@siempre.test`, nickname: `${PROVIDERS[provider].label}${tag.slice(0, 3)}` };
}
