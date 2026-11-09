// 회원가입 검사. 화면과 분리된 순수 함수.

import { EMAIL_PATTERN, NICKNAME_PATTERN, PASSWORD_MAX, PASSWORD_MIN } from '../config/auth';

export const isEmail = (s: string) => EMAIL_PATTERN.test(s.trim());
export const isNickname = (s: string) => NICKNAME_PATTERN.test(s.trim());

export type PasswordRule = 'length' | 'letter' | 'number';
export function passwordRules(s: string): Record<PasswordRule, boolean> {
  return {
    length: s.length >= PASSWORD_MIN && s.length <= PASSWORD_MAX,
    letter: /[a-zA-Z]/.test(s),
    number: /\d/.test(s),
  };
}
export const isPassword = (s: string) => Object.values(passwordRules(s)).every(Boolean);

/**
 * 비밀번호 확인칸 상태. 확실히 틀렸을 때만 오류로 본다.
 * 원래 비밀번호의 앞부분이면 아직 입력 중이고, 칸을 벗어났거나 더 길어지면 불일치.
 */
export function confirmState(pw: string, confirm: string, left: boolean): 'empty' | 'typing' | 'match' | 'mismatch' {
  if (!confirm) return 'empty';
  if (pw === confirm) return 'match';
  if (!left && pw.startsWith(confirm)) return 'typing';
  return 'mismatch';
}

/** 로그인 뒤 돌아갈 주소. 외부 주소로 튀지 않게 같은 사이트 경로만 허용한다. */
export function safeNext(next: string | null, fallback: string): string {
  return next && next.startsWith('/') && !next.startsWith('//') ? next : fallback;
}
