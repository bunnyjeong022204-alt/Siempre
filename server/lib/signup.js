// 회원가입 규칙. HTTP와 분리해서 테스트하기 쉽게 db와 시계를 주입받는다.

import * as v from './validate.js';
import { HttpError } from './validate.js';
import {
  CODE_MAX_ATTEMPTS, CODE_TTL_MS, CONSENT_TOKEN_TTL_MS, RETURN_DAYS, SOCIAL_TICKET_TTL_MS, TERMS, VERIFICATION_TTL_MS,
} from './policy.js';
import { hashPassword, newCode, newId, newToken, safeEqual, sha256 } from './secure.js';
import { iso } from './db.js';

const DAY = 24 * 3600 * 1000;
const RESEND_GAP_MS = 30 * 1000;

const smsNotConnected = async () => {
  throw new HttpError(503, 'SMS_NOT_CONNECTED', '문자 발송이 아직 연결되지 않았어요.');
};

export function createSignupService(db, { now = () => Date.now(), smsDemo = true, sendSms = smsNotConnected } = {}) {
  // ── 본인 인증 ─────────────────────────────────────────
  async function sendCode(body) {
    v.requireObject(body);
    const nm = v.name(body.name);
    const ph = v.phone(body.phone);
    const t = now();
    const recent = db.prepare('SELECT created_at FROM verifications WHERE phone = ? ORDER BY created_at DESC LIMIT 1').get(ph);
    if (recent && t - recent.created_at < RESEND_GAP_MS) {
      throw new HttpError(429, 'TOO_SOON', '잠시 후 다시 요청해 주세요.', { retryAfter: Math.ceil((RESEND_GAP_MS - (t - recent.created_at)) / 1000) });
    }
    const id = newId();
    const c = newCode();
    db.prepare('INSERT INTO verifications (id, name, phone, code_hash, code_expires_at, created_at) VALUES (?, ?, ?, ?, ?, ?)')
      .run(id, nm, ph, sha256(`${id}:${c}`), t + CODE_TTL_MS, t);
    if (!smsDemo) await sendSms(ph, c);
    // 문자 연동이 없으면 시연 모드: 인증번호를 응답에 담아 화면에 "시연용"으로 보여 준다.
    return { requestId: id, expiresIn: CODE_TTL_MS / 1000, ...(smsDemo ? { demoCode: c } : {}) };
  }

  function confirmCode(body) {
    v.requireObject(body);
    const id = v.token(body.requestId, 'requestId');
    const c = v.code(body.code);
    const row = db.prepare('SELECT * FROM verifications WHERE id = ?').get(id);
    const t = now();
    if (!row || row.token_hash) throw new HttpError(404, 'REQUEST_NOT_FOUND', '인증번호를 다시 받아 주세요.');
    if (row.attempts >= CODE_MAX_ATTEMPTS) throw new HttpError(429, 'TOO_MANY_ATTEMPTS', '인증번호를 5번 틀렸어요. 다시 받아 주세요.');
    if (t > row.code_expires_at) throw new HttpError(410, 'CODE_EXPIRED', '인증 시간이 지났어요. 다시 받아 주세요.');
    if (!safeEqual(row.code_hash, sha256(`${id}:${c}`))) {
      db.prepare('UPDATE verifications SET attempts = attempts + 1 WHERE id = ?').run(id);
      throw v.bad('CODE_MISMATCH', '인증번호가 맞지 않아요.', { attemptsLeft: CODE_MAX_ATTEMPTS - row.attempts - 1 });
    }
    const tok = newToken();
    db.prepare('UPDATE verifications SET token_hash = ?, token_expires_at = ? WHERE id = ?').run(sha256(tok), t + VERIFICATION_TTL_MS, id);
    // 휴대폰 소유를 확인한 뒤에만 가입 여부를 알려 준다.
    const alreadyMember = !!db.prepare('SELECT 1 FROM users WHERE phone = ?').get(row.phone);
    return { verificationToken: tok, expiresIn: VERIFICATION_TTL_MS / 1000, alreadyMember };
  }

  function verifiedPerson(tok) {
    const row = db.prepare('SELECT * FROM verifications WHERE token_hash = ?').get(sha256(v.token(tok, 'verificationToken')));
    if (!row || row.used_at || now() > row.token_expires_at) {
      throw new HttpError(401, 'VERIFICATION_REQUIRED', '본인 인증을 다시 해 주세요.');
    }
    return row;
  }

  // ── 이메일 확인 ───────────────────────────────────────
  // ⚠️ 정책 검토 필요: 이메일 소유 확인 전에 탈퇴 이력을 알려 주면 계정 열거 위험이 있다.
  //    그래서 본인 인증을 마친 사람에게만, 그 사람 휴대폰과 일치하는 탈퇴 기록만 자세히 알려 준다.
  function emailStatus(em, ph) {
    if (db.prepare('SELECT 1 FROM blocked_emails WHERE email = ?').get(em)) return { status: 'unavailable' };
    if (db.prepare('SELECT 1 FROM users WHERE email = ?').get(em)) return { status: 'unavailable' };
    const w = db.prepare('SELECT * FROM withdrawn_members WHERE email = ? ORDER BY withdrawn_at DESC LIMIT 1').get(em);
    if (!w) return { status: 'available' };
    if (w.phone !== ph) return { status: 'rejoin_new' }; // 남의 탈퇴 시점은 알려 주지 않는다
    const passed = (now() - Date.parse(w.withdrawn_at)) / DAY;
    if (passed < RETURN_DAYS) return { status: 'returning', daysLeft: Math.ceil(RETURN_DAYS - passed), firstJoinedAt: w.first_joined_at };
    return { status: 'rejoin_new', reason: 'expired' };
  }

  function checkEmail(body) {
    v.requireObject(body);
    const em = v.email(body.email);
    const person = verifiedPerson(body.verificationToken);
    const { firstJoinedAt: _hidden, ...pub } = emailStatus(em, person.phone);
    return pub;
  }

  // ── 닉네임 ─────────────────────────────────────────────
  function checkNickname(raw) {
    let nick;
    try { nick = v.nickname(raw ?? ''); } catch { return { available: false, reason: 'invalid' }; }
    if (db.prepare('SELECT 1 FROM reserved_nicknames WHERE nickname = ?').get(nick)) return { available: false, reason: 'reserved' };
    if (db.prepare('SELECT 1 FROM users WHERE nickname = ?').get(nick)) return { available: false, reason: 'taken' };
    return { available: true };
  }

  // ── 간편가입 티켓 ─────────────────────────────────────
  function issueSocialTicket(profile) {
    if (db.prepare('SELECT 1 FROM users WHERE social_provider = ? AND social_subject = ?').get(profile.provider, profile.subject)) {
      throw new HttpError(409, 'SOCIAL_ALREADY', '이미 이 계정으로 가입했어요.');
    }
    const tk = newToken();
    db.prepare('INSERT INTO social_tickets (ticket_hash, provider, subject, email, nickname, expires_at) VALUES (?, ?, ?, ?, ?, ?)')
      .run(sha256(tk), profile.provider, profile.subject, profile.email ?? null, profile.nickname ?? null, now() + SOCIAL_TICKET_TTL_MS);
    return tk;
  }

  function socialTicketRow(tk) {
    const row = db.prepare('SELECT * FROM social_tickets WHERE ticket_hash = ?').get(sha256(v.token(tk, 'ticket')));
    if (!row || row.used_at || now() > row.expires_at) throw new HttpError(401, 'TICKET_INVALID', '간편가입을 처음부터 다시 해 주세요.');
    return row;
  }

  function readTicket(body) {
    v.requireObject(body);
    const row = socialTicketRow(body.ticket);
    // 받은 프로필은 정보 입력 칸을 채우는 데만 쓰고, 가입할 때 서버가 다시 검증한다.
    let nick = null;
    try { nick = v.nickname(row.nickname ?? ''); } catch { /* 규칙에 안 맞으면 비워서 직접 입력 */ }
    let em = null;
    try { em = v.email(row.email ?? ''); } catch { /* 이메일 미동의 */ }
    return { provider: row.provider, email: em, nickname: nick };
  }

  // ── 가입 ───────────────────────────────────────────────
  function signup(body) {
    v.requireObject(body);
    const em = v.email(body.email);
    const nick = v.nickname(body.nickname);
    const agreed = v.consents(body.consents);
    const social = body.socialTicket !== undefined && body.socialTicket !== null;
    const pw = social ? null : v.password(body.password);

    db.exec('BEGIN IMMEDIATE');
    try {
      const person = verifiedPerson(body.verificationToken);
      const ticket = social ? socialTicketRow(body.socialTicket) : null;
      if (db.prepare('SELECT 1 FROM users WHERE phone = ?').get(person.phone)) {
        throw new HttpError(409, 'PHONE_IN_USE', '이미 가입한 휴대폰 번호예요. 로그인해 주세요.');
      }
      // 복귀/신규 판정은 화면 값을 믿지 않고 여기서 다시 계산한다.
      const st = emailStatus(em, person.phone);
      if (st.status === 'unavailable') throw new HttpError(409, 'EMAIL_UNAVAILABLE', '현재 이 이메일로 가입할 수 없어요.');
      const nk = checkNickname(nick);
      if (!nk.available) throw new HttpError(409, 'NICKNAME_UNAVAILABLE', '이미 쓰고 있는 닉네임이에요.', { reason: nk.reason });
      if (ticket && db.prepare('SELECT 1 FROM users WHERE social_provider = ? AND social_subject = ?').get(ticket.provider, ticket.subject)) {
        throw new HttpError(409, 'SOCIAL_ALREADY', '이미 이 계정으로 가입했어요.');
      }

      const t = now();
      const memberType = st.status === 'returning' ? 'returning' : 'new';
      const firstJoinedAt = st.status === 'returning' ? st.firstJoinedAt : iso(t);
      const publicId = newId();
      const res = db.prepare(
        `INSERT INTO users (public_id, email, nickname, password_hash, name, phone, member_type, first_joined_at, created_at, social_provider, social_subject)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      ).run(publicId, em, nick, pw ? hashPassword(pw) : '!', person.name, person.phone, memberType, firstJoinedAt, iso(t),
        ticket?.provider ?? null, ticket?.subject ?? null);
      const userId = Number(res.lastInsertRowid);
      saveConsents(userId, agreed, t);
      db.prepare('UPDATE verifications SET used_at = ? WHERE id = ?').run(t, person.id);
      if (ticket) db.prepare('UPDATE social_tickets SET used_at = ? WHERE ticket_hash = ?').run(t, ticket.ticket_hash);
      const consentToken = newToken();
      db.prepare('INSERT INTO consent_tokens (token_hash, user_id, expires_at) VALUES (?, ?, ?)').run(sha256(consentToken), userId, t + CONSENT_TOKEN_TTL_MS);
      db.exec('COMMIT');
      return {
        userId: publicId, nickname: nick, email: em, memberType, firstJoinedAt,
        socialProvider: ticket?.provider ?? null, consents: agreed, consentToken,
      };
    } catch (e) {
      db.exec('ROLLBACK');
      if (/UNIQUE constraint failed/.test(String(e?.message))) throw new HttpError(409, 'DUPLICATE', '방금 다른 가입과 겹쳤어요. 다시 확인해 주세요.');
      throw e;
    }
  }

  function saveConsents(userId, agreed, t) {
    const up = db.prepare(
      `INSERT INTO consents (user_id, term_key, agreed, updated_at) VALUES (?, ?, ?, ?)
       ON CONFLICT (user_id, term_key) DO UPDATE SET agreed = excluded.agreed, updated_at = excluded.updated_at`,
    );
    for (const term of TERMS) up.run(userId, term.key, agreed[term.key] ? 1 : 0, iso(t));
  }

  /** 가입 직후 "동의 내용 수정". 필수 약관은 철회할 수 없다. */
  function updateConsents(body) {
    v.requireObject(body);
    const tk = v.token(body.consentToken, 'consentToken');
    const agreed = v.consents(body.consents);
    const row = db.prepare('SELECT * FROM consent_tokens WHERE token_hash = ?').get(sha256(tk));
    if (!row || now() > row.expires_at) throw new HttpError(401, 'CONSENT_TOKEN_INVALID', '동의 내용 수정 시간이 지났어요.');
    saveConsents(row.user_id, agreed, now());
    return { consents: agreed };
  }

  return { sendCode, confirmCode, checkEmail, checkNickname, issueSocialTicket, readTicket, signup, updateConsents };
}
