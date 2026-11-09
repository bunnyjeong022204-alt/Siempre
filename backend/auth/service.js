// Siempre 회원 정보 규칙. 계정 확인은 Firebase가 하고, 여기서는 닉네임·약관·회원 행을 다룬다.

import { ApiError } from '../shared/errors.js';
import { nowIso } from '../shared/db.js';
import * as v from './validate.js';
import { RESERVED_NICKNAMES } from './config.js';

const publicUser = (u) => ({ id: u.id, email: u.email, nickname: u.nickname });

export function createAuthService(db, { now = () => Date.now() } = {}) {
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

    /** Firebase 계정(identity)에 Siempre 회원 정보를 만든다. 이메일은 토큰의 값을 쓴다 (화면 값을 믿지 않음). */
    signup(identity, body) {
      if (!identity.email) throw new ApiError(400, 'invalid_email', '이메일로 만든 계정이 아니에요.');
      const em = v.email(identity.email);
      const nick = v.nickname(body.nickname);
      if (body.agreeTerms !== true) throw new ApiError(400, 'terms_required', '필수 약관에 동의해 주세요.');
      const marketing = v.optionalBoolean(body.marketing, 'marketing');

      if (db.prepare('SELECT 1 FROM users WHERE firebase_uid = ? OR email = ?').get(identity.uid, em)) {
        throw new ApiError(409, 'exists', '이미 가입한 계정이에요. 로그인해 주세요.');
      }
      if (!nicknameStatus(nick).available) throw new ApiError(409, 'nickname_taken', '이미 쓰고 있는 닉네임이에요.');
      const t = nowIso(now());
      try {
        const r = db.prepare('INSERT INTO users (firebase_uid, email, nickname, marketing, terms_agreed_at, created_at) VALUES (?, ?, ?, ?, ?, ?)')
          .run(identity.uid, em, nick, marketing ? 1 : 0, t, t);
        return { user: { id: Number(r.lastInsertRowid), email: em, nickname: nick } };
      } catch (e) {
        // 동시 가입이 겹치면 UNIQUE 제약이 마지막으로 막는다
        const msg = String(e?.message);
        if (msg.includes('users.nickname')) throw new ApiError(409, 'nickname_taken', '이미 쓰고 있는 닉네임이에요.');
        if (msg.includes('users.email') || msg.includes('users.firebase_uid')) throw new ApiError(409, 'exists', '이미 가입한 계정이에요. 로그인해 주세요.');
        throw e;
      }
    },

    /** Firebase uid → 회원 { id, email, nickname } 또는 null */
    userByUid(uid) {
      const row = db.prepare('SELECT id, email, nickname FROM users WHERE firebase_uid = ?').get(uid);
      return row ? publicUser(row) : null;
    },
  };
}
