// 회원가입 계산·검사. 화면과 분리된 순수 함수.

import {
  EMAIL_PATTERN, MARKETING_CHANNELS, NICKNAME_PATTERN, PASSWORD_POLICY, REQUIRED_TERMS, type TermKey,
} from '../config/signup';

/** 숫자만 남겨 010-0000-0000 형태로 */
export function formatPhone(raw: string): string {
  const d = raw.replace(/\D/g, '').slice(0, 11);
  if (d.length < 4) return d;
  if (d.length < 8) return `${d.slice(0, 3)}-${d.slice(3)}`;
  return `${d.slice(0, 3)}-${d.slice(3, 7)}-${d.slice(7)}`;
}
export const isPhone = (s: string) => /^010-\d{4}-\d{4}$/.test(s);
export const isName = (s: string) => /^[가-힣a-zA-Z ]{1,20}$/.test(s.trim());
export const isEmail = (s: string) => EMAIL_PATTERN.test(s.trim());
export const isNickname = (s: string) => NICKNAME_PATTERN.test(s.trim());

export type PasswordRule = 'length' | 'letter' | 'number' | 'symbol' | 'noSpace';
export function passwordRules(s: string): Record<PasswordRule, boolean> {
  return {
    length: s.length >= PASSWORD_POLICY.min && s.length <= PASSWORD_POLICY.max,
    letter: /[a-zA-Z]/.test(s),
    number: /\d/.test(s),
    symbol: /[^a-zA-Z0-9\s]/.test(s),
    noSpace: s.length > 0 && !/\s/.test(s),
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

export type Consents = Record<TermKey, boolean>;
export const EMPTY_CONSENTS: Consents = {
  tos: false, privacy: false, age14: false, aiTransfer: false, marketingEmail: false, marketingSms: false,
};
export const requiredLeft = (c: Consents) => REQUIRED_TERMS.filter((t) => !c[t.key]).length;
export const allAgreed = (c: Consents) => Object.values(c).every(Boolean);
export const setAll = (on: boolean): Consents =>
  Object.fromEntries(Object.keys(EMPTY_CONSENTS).map((k) => [k, on])) as Consents;
export const marketingOn = (c: Consents) => MARKETING_CHANNELS.some((m) => c[m.key]);

/** 완료 화면 "소식 받기" 요약: "이메일 동의 · 문자 미동의" */
export const marketingSummary = (c: Consents) =>
  MARKETING_CHANNELS.map((m) => `${m.label} ${c[m.key] ? '동의' : '미동의'}`).join(' · ');

export function formatDate(isoString: string): string {
  const d = new Date(isoString);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
}

export const formatTimer = (sec: number) => `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`;
