// 회원가입·로그인 규칙. HTTP와 분리해서 db·시계·비밀 키를 주입받는다.

import crypto from 'node:crypto';
import { ApiError } from '../shared/errors.js';
import { nowIso } from '../shared/db.js';
import * as v from './validate.js';
import { RESERVED_NICKNAMES, SESSION_DAYS } from './config.js';

const SCRYPT = { N: 16384, r: 8, p: 1, keylen: 64 };

export function hashPassword(password) {
  const salt = crypto.randomBytes(16);
  const hash = crypto.scryptSync(password, salt, SCRYPT.keylen, { N: SCRYPT.N, r: SCRYPT.r, p: SCRYPT.p });
  return `scrypt$${SCRYPT.N}$${salt.toString('base64url')}$${hash.toString('base64url')}`;
}

function verifyPassword(password, stored) {
  const [kind, n, salt, hash] = String(stored).split('$');
  if (kind !== 'scrypt' || !salt || !hash) return false;
  const expected = Buffer.from(hash, 'base64url');
  const actual = crypto.scryptSync(password, Buffer.from(salt, 'base64url'), expected.length, { N: Number(n), r: SCRYPT.r, p: SCRYPT.p });
  return crypto.timingSafeEqual(expected, actual);
}

// 없는 이메일로 로그인해도 같은 시간이 걸리게 비교용 해시를 하나 만들어 둔다
const DUMMY_HASH = hashPassword('dummy-password-0');

const publicUser = (u) => ({ id: u.id, email: u.email, nickname: u.nickname });

export function createAuthService(db, { now = () => Date.now(), sessionSecret }) {
  const secret = sessionSecret || crypto.randomBytes(32).toString('hex');
  const tokenHash = (t) => crypto.createHmac('sha256', secret).update(t).digest('hex');

  function nicknameStatus(nick) {
    if (RESERVED_NICKNAMES.some((r) => r.toLowerCase() === nick.toLowerCase())) return { available: false, reason: 'reserved' };
    if (db.prepare('SELECT 1 FROM users WHERE nickname = ?').get(nick)) return { available: false, reason: 'taken' };
    return { available: true };
  }

  return {
    /**
     * 이메일 상태: new(처음) / exists(가입됨 → 로그인 안내) / rejoin(탈퇴 기록 있음)
     * ⚠️ 가입 여부를 알려 주므로 계정 열거에 쓰일 수 있다. 그래서 IP당 요청 제한을 건다(routes.js).
     */
    checkEmail(body) {
      const em = v.email(body.email);
      if (db.prepare('SELECT 1 FROM users WHERE email = ?').get(em)) return { status: 'exists' };
      if (db.prepare('SELECT 1 FROM withdrawn_members WHERE email = ?').get(em)) return { status: 'rejoin' };
      return { status: 'new' };
    },

    checkNickname(body) {
      let nick;
      try {
        nick = v.nickname(body.nickname);
      } catch {
        return { available: false, reason: 'invalid' };
      }
      return nicknameStatus(nick);
    },

    signup(body) {
      const em = v.email(body.email);
      const pw = v.password(body.password);
      const nick = v.nickname(body.nickname);
      if (body.agreeTerms !== true) throw new ApiError(400, 'terms_required', '필수 약관에 동의해 주세요.');
      const marketing = v.optionalBoolean(body.marketing, 'marketing');

      // 가입 직전에 다시 확인한다 (동시 가입 대비). 마지막 방어선은 UNIQUE 제약.
      if (db.prepare('SELECT 1 FROM users WHERE email = ?').get(em)) {
        throw new ApiError(409, 'exists', '이미 가입한 이메일이에요. 로그인해 주세요.');
      }
      if (!nicknameStatus(nick).available) throw new ApiError(409, 'nickname_taken', '이미 쓰고 있는 닉네임이에요.');
      const t = nowIso(now());
      try {
        db.prepare('INSERT INTO users (email, nickname, password_hash, marketing, terms_agreed_at, created_at) VALUES (?, ?, ?, ?, ?, ?)')
          .run(em, nick, hashPassword(pw), marketing ? 1 : 0, t, t);
      } catch (e) {
        const msg = String(e?.message);
        if (msg.includes('users.email')) throw new ApiError(409, 'exists', '이미 가입한 이메일이에요. 로그인해 주세요.');
        if (msg.includes('users.nickname')) throw new ApiError(409, 'nickname_taken', '이미 쓰고 있는 닉네임이에요.');
        throw e;
      }
      return { ok: true };
    },

    /** 성공하면 회원과 새 세션 토큰(원문, 쿠키로만 보냄)을 돌려준다. DB에는 HMAC 해시만 저장. */
    login(body) {
      const em = v.email(body.email);
      if (typeof body.password !== 'string' || !body.password) throw new ApiError(401, 'invalid_credentials', '이메일 또는 비밀번호가 맞지 않아요.');
      const user = db.prepare('SELECT * FROM users WHERE email = ?').get(em);
      const ok = verifyPassword(body.password.slice(0, 256), user ? user.password_hash : DUMMY_HASH);
      if (!user || !ok) throw new ApiError(401, 'invalid_credentials', '이메일 또는 비밀번호가 맞지 않아요.');
      const t = now();
      db.prepare('DELETE FROM sessions WHERE expires_at < ?').run(t);
      const token = crypto.randomBytes(32).toString('base64url');
      db.prepare('INSERT INTO sessions (token_hash, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)')
        .run(tokenHash(token), user.id, nowIso(t), t + SESSION_DAYS * 24 * 3600 * 1000);
      return { user: publicUser(user), token };
    },

    logout(token) {
      if (token) db.prepare('DELETE FROM sessions WHERE token_hash = ?').run(tokenHash(token));
    },

    /** 세션 토큰 → 회원 { id, email, nickname } 또는 null */
    userFromToken(token) {
      if (!token) return null;
      const row = db.prepare(
        'SELECT u.id, u.email, u.nickname, s.expires_at FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token_hash = ?',
      ).get(tokenHash(token));
      if (!row || row.expires_at < now()) return null;
      return publicUser(row);
    },
  };
}
