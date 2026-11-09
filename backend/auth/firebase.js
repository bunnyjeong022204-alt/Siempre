// Firebase ID 토큰 확인. 서비스 계정 키 없이 구글 공개 인증서로 서명을 확인한다 (설치 패키지 없음).
// 확인 규칙: https://firebase.google.com/docs/auth/admin/verify-id-tokens#verify_id_tokens_using_a_third-party_jwt_library

import crypto from 'node:crypto';

export const FIREBASE_CERTS_URL = 'https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com';
const CLOCK_SKEW_S = 60;

/** 공개 인증서 { kid: PEM }. Cache-Control max-age 동안 다시 받지 않는다. */
export function createCertSource(fetchImpl = fetch, now = () => Date.now()) {
  let cache = { certs: {}, expiresAt: 0 };
  return async function getCerts(force = false) {
    if (!force && now() < cache.expiresAt) return cache.certs;
    const res = await fetchImpl(FIREBASE_CERTS_URL);
    if (!res.ok) throw new Error(`firebase certs ${res.status}`);
    const maxAge = Number(/max-age=(\d+)/.exec(res.headers.get('cache-control') || '')?.[1] || 3600);
    cache = { certs: await res.json(), expiresAt: now() + maxAge * 1000 };
    return cache.certs;
  };
}

const decode = (part) => JSON.parse(Buffer.from(part, 'base64url').toString('utf8'));

/**
 * 토큰이 맞으면 { uid, email, emailVerified }, 아니면 null.
 * getCerts는 테스트에서 가짜 키로 바꿔 끼울 수 있다.
 */
export function createIdTokenVerifier({ projectId, getCerts, now = () => Date.now() }) {
  return async function verify(token) {
    if (!projectId || typeof token !== 'string' || token.length > 4096) return null;
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    let header, payload;
    try {
      header = decode(parts[0]);
      payload = decode(parts[1]);
    } catch {
      return null;
    }
    if (header.alg !== 'RS256' || typeof header.kid !== 'string') return null;

    let certs = await getCerts();
    if (!certs[header.kid]) certs = await getCerts(true); // 인증서가 바뀌었을 수 있어 한 번 더 받는다
    const pem = certs[header.kid];
    if (!pem) return null;
    let ok = false;
    try {
      ok = crypto.createVerify('RSA-SHA256').update(`${parts[0]}.${parts[1]}`).verify(pem, Buffer.from(parts[2], 'base64url'));
    } catch {
      return null;
    }
    if (!ok) return null;

    const t = now() / 1000;
    if (payload.aud !== projectId) return null;
    if (payload.iss !== `https://securetoken.google.com/${projectId}`) return null;
    if (typeof payload.sub !== 'string' || !payload.sub || payload.sub.length > 128) return null;
    if (!(payload.exp > t)) return null;
    if (!(payload.iat <= t + CLOCK_SKEW_S)) return null;
    if (!(payload.auth_time <= t + CLOCK_SKEW_S)) return null;
    return { uid: payload.sub, email: typeof payload.email === 'string' ? payload.email.toLowerCase() : null, emailVerified: payload.email_verified === true };
  };
}
