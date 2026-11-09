// 입력 검증. 통과하면 저장할 형태로 정리한 새 값을 돌려주고, 아니면 400 오류를 던진다.

import { EMAIL_MAX, EMAIL_RE, NAME_MAX, NICKNAME_RE, PASSWORD, PHONE_RE, TERMS } from './policy.js';

export class HttpError extends Error {
  constructor(status, code, message, extra = {}) {
    super(message);
    this.status = status;
    this.code = code;
    this.extra = extra;
  }
}

export const bad = (code, message, extra) => new HttpError(400, code, message, extra);

export function requireObject(v, what = '요청 본문') {
  if (v === null || typeof v !== 'object' || Array.isArray(v)) throw bad('INVALID_BODY', `${what}은 JSON 객체여야 해요.`);
  return v;
}

function requireString(v, field) {
  if (typeof v !== 'string') throw bad('INVALID_FIELD', `${field} 값이 문자열이 아니에요.`, { field });
  return v;
}

export function email(v) {
  const s = requireString(v, 'email').trim().toLowerCase();
  if (s.length > EMAIL_MAX || !EMAIL_RE.test(s)) throw bad('INVALID_EMAIL', '이메일 형식을 확인해 주세요.', { field: 'email' });
  return s;
}

export function phone(v) {
  const digits = requireString(v, 'phone').replace(/\D/g, '');
  const s = digits.length === 11 ? `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}` : '';
  if (!PHONE_RE.test(s)) throw bad('INVALID_PHONE', '휴대폰 번호를 확인해 주세요.', { field: 'phone' });
  return s;
}

export function name(v) {
  const s = requireString(v, 'name').trim().replace(/\s+/g, ' ');
  if (!s || s.length > NAME_MAX || !/^[가-힣a-zA-Z ]+$/.test(s)) throw bad('INVALID_NAME', '이름을 확인해 주세요.', { field: 'name' });
  return s;
}

export function nickname(v) {
  const s = requireString(v, 'nickname').trim();
  if (!NICKNAME_RE.test(s)) throw bad('INVALID_NICKNAME', '닉네임은 한글·영문·숫자 2~10자예요.', { field: 'nickname' });
  return s;
}

/** 프런트 체크리스트와 같은 규칙: 길이, 영문, 숫자, 특수문자, 공백 없음 */
export function passwordRules(s) {
  return {
    length: s.length >= PASSWORD.min && s.length <= PASSWORD.max,
    letter: /[a-zA-Z]/.test(s),
    number: /\d/.test(s),
    symbol: /[^a-zA-Z0-9\s]/.test(s),
    noSpace: !/\s/.test(s),
  };
}

export function password(v) {
  const s = requireString(v, 'password');
  if (!Object.values(passwordRules(s)).every(Boolean)) throw bad('INVALID_PASSWORD', '비밀번호 규칙을 확인해 주세요.', { field: 'password' });
  return s;
}

export function code(v) {
  const s = requireString(v, 'code').trim();
  if (!/^\d{6}$/.test(s)) throw bad('INVALID_CODE', '인증번호 6자리를 입력해 주세요.', { field: 'code' });
  return s;
}

export function token(v, field) {
  const s = requireString(v, field).trim();
  if (!s || s.length > 200) throw bad('INVALID_FIELD', `${field} 값을 확인해 주세요.`, { field });
  return s;
}

/**
 * 약관 동의. 알려진 키만 받고, 값은 boolean이어야 한다. 빠진 키는 미동의.
 * requireAll이면 필수 약관이 모두 true여야 한다.
 */
export function consents(v, { requireAll = true } = {}) {
  const obj = requireObject(v, 'consents');
  for (const k of Object.keys(obj)) {
    if (!TERMS.some((t) => t.key === k)) throw bad('INVALID_CONSENTS', `알 수 없는 약관 항목이에요: ${k}`);
  }
  const out = {};
  for (const t of TERMS) {
    const val = obj[t.key] ?? false;
    if (typeof val !== 'boolean') throw bad('INVALID_CONSENTS', `${t.key} 값은 true 또는 false여야 해요.`);
    out[t.key] = val;
  }
  if (requireAll) {
    const missing = TERMS.filter((t) => t.required && !out[t.key]).map((t) => t.key);
    if (missing.length) throw bad('REQUIRED_CONSENT', '필수 약관에 모두 동의해 주세요.', { missing });
  }
  return out;
}
