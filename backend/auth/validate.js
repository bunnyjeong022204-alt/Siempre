// 입력 검증. 통과하면 저장할 형태로 정리한 값을 돌려주고, 아니면 400 오류를 던진다.

import { badRequest } from '../shared/errors.js';
import { EMAIL_MAX, EMAIL_RE, NICKNAME_RE } from './config.js';

const mustString = (v, field) => {
  if (typeof v !== 'string') throw badRequest('invalid_body', `${field} 값이 문자열이 아니에요.`, { field });
  return v;
};

export function email(v) {
  const s = mustString(v, 'email').trim().toLowerCase();
  if (s.length > EMAIL_MAX || !EMAIL_RE.test(s)) throw badRequest('invalid_email', '이메일 형식을 확인해 주세요.');
  return s;
}

export function nickname(v) {
  const s = mustString(v, 'nickname').trim();
  if (!NICKNAME_RE.test(s)) throw badRequest('invalid_nickname', '닉네임은 한글·영문·숫자 2~12자예요.');
  return s;
}

export function optionalBoolean(v, field) {
  if (v === undefined) return false;
  if (typeof v !== 'boolean') throw badRequest('invalid_body', `${field} 값은 true 또는 false여야 해요.`, { field });
  return v;
}
