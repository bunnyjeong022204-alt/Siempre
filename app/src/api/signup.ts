// 회원가입 API 호출. VITE_SIGNUP_API가 비어 있으면 화면 안의 가짜 응답(데모)으로 동작한다.
// 실제 서버: server/ (Vite가 /api를 넘겨 줌). 요청·응답 형식은 intent/20261109-signup-flow/spec.md.

import type { SocialProvider } from '../config/signup';
import type { Consents } from '../lib/signup';

export const SIGNUP_API_LIVE = Boolean(import.meta.env.VITE_SIGNUP_API);

export type EmailStatus = 'available' | 'returning' | 'rejoin_new' | 'unavailable';
export interface EmailCheck { status: EmailStatus; daysLeft?: number; reason?: 'expired' }
export interface SendCodeResult { requestId: string; expiresIn: number; demoCode?: string }
export interface ConfirmResult { verificationToken: string; expiresIn: number; alreadyMember: boolean }
export interface NicknameCheck { available: boolean; reason?: 'invalid' | 'reserved' | 'taken' }
export interface SocialProfile { provider: SocialProvider; email: string | null; nickname: string | null }
export interface SignupInput {
  verificationToken: string;
  email: string;
  nickname: string;
  password?: string;
  socialTicket?: string;
  consents: Consents;
}
export interface SignupResult {
  userId: string;
  nickname: string;
  email: string;
  memberType: 'new' | 'returning';
  firstJoinedAt: string;
  socialProvider: SocialProvider | null;
  consents: Consents;
  consentToken: string;
}

/** 서버 오류. code로 화면 문구와 다음 행동을 고른다. */
export class ApiError extends Error {
  constructor(public status: number, public code: string, message: string, public extra: Record<string, unknown> = {}) {
    super(message);
  }
}

async function call<T>(path: string, init?: { method?: string; body?: unknown }): Promise<T> {
  let res: Response;
  try {
    res = await fetch(path, {
      method: init?.method ?? (init?.body ? 'POST' : 'GET'),
      headers: init?.body ? { 'content-type': 'application/json' } : undefined,
      body: init?.body ? JSON.stringify(init.body) : undefined,
      credentials: 'same-origin',
    });
  } catch {
    throw new ApiError(0, 'NETWORK', '서버와 연결하지 못했어요. 잠시 후 다시 시도해 주세요.');
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const { error, message, ...extra } = data as { error?: string; message?: string };
    throw new ApiError(res.status, error ?? 'UNKNOWN', message ?? '요청을 처리하지 못했어요.', extra);
  }
  return data as T;
}

export const signupApi = {
  sendCode: (name: string, phone: string) =>
    SIGNUP_API_LIVE ? call<SendCodeResult>('/api/verify/send', { body: { name, phone } }) : mock.sendCode(),
  confirmCode: (requestId: string, code: string) =>
    SIGNUP_API_LIVE ? call<ConfirmResult>('/api/verify/confirm', { body: { requestId, code } }) : mock.confirmCode(requestId, code),
  checkEmail: (email: string, verificationToken: string) =>
    SIGNUP_API_LIVE ? call<EmailCheck>('/api/email/check', { body: { email, verificationToken } }) : mock.checkEmail(email),
  checkNickname: (nickname: string) =>
    SIGNUP_API_LIVE ? call<NicknameCheck>(`/api/users/check-nickname?nickname=${encodeURIComponent(nickname)}`) : mock.checkNickname(nickname),
  signup: (input: SignupInput) => (SIGNUP_API_LIVE ? call<SignupResult>('/api/signup', { body: input }) : mock.signup(input)),
  updateConsents: (consentToken: string, consents: Consents) =>
    SIGNUP_API_LIVE ? call<{ consents: Consents }>('/api/consents', { body: { consentToken, consents } }) : mock.wait({ consents }),
  readTicket: (ticket: string) =>
    SIGNUP_API_LIVE ? call<SocialProfile>('/api/auth/ticket', { body: { ticket } }) : mock.readTicket(ticket),
  /** 간편가입 시작 주소. 데모 모드면 null (화면이 가짜 티켓으로 같은 흐름을 탄다) */
  socialStartUrl: (provider: SocialProvider) => (SIGNUP_API_LIVE ? `/api/auth/${provider}/start` : null),
};

// ── 데모 모드 가짜 응답 ─────────────────────────────────
// 서버 규칙을 흉내 낸다: rejoin… → 복귀, old… → 신규(기간 지남), blocked… → 가입 불가.
// 실제 회원 정보는 넣지 않는다.
const mock = {
  wait<T>(value: T, ms = 400): Promise<T> {
    return new Promise((r) => setTimeout(() => r(value), ms));
  },
  codes: new Map<string, string>(),
  sendCode(): Promise<SendCodeResult> {
    const requestId = `demo-${Math.random().toString(36).slice(2)}`;
    const code = String(Math.floor(Math.random() * 1_000_000)).padStart(6, '0');
    mock.codes.set(requestId, code);
    return mock.wait({ requestId, expiresIn: 180, demoCode: code });
  },
  async confirmCode(requestId: string, code: string): Promise<ConfirmResult> {
    await mock.wait(null);
    if (mock.codes.get(requestId) !== code) throw new ApiError(400, 'CODE_MISMATCH', '인증번호가 맞지 않아요.');
    return { verificationToken: `demo-token-${requestId}`, expiresIn: 1800, alreadyMember: false };
  },
  async checkEmail(email: string): Promise<EmailCheck> {
    await mock.wait(null);
    const id = email.split('@')[0].toLowerCase();
    if (id.startsWith('blocked')) return { status: 'unavailable' };
    if (id.startsWith('rejoin')) return { status: 'returning', daysLeft: 12 };
    if (id.startsWith('old')) return { status: 'rejoin_new', reason: 'expired' };
    return { status: 'available' };
  },
  async checkNickname(nickname: string): Promise<NicknameCheck> {
    await mock.wait(null, 300);
    if (['siempre', 'admin', '관리자', '운영자'].includes(nickname.toLowerCase())) return { available: false, reason: 'reserved' };
    return { available: true };
  },
  async signup(input: SignupInput): Promise<SignupResult> {
    await mock.wait(null, 500);
    const returning = input.email.toLowerCase().startsWith('rejoin');
    return {
      userId: 'demo-user',
      nickname: input.nickname,
      email: input.email.toLowerCase(),
      memberType: returning ? 'returning' : 'new',
      firstJoinedAt: returning ? new Date(Date.now() - 200 * 864e5).toISOString() : new Date().toISOString(),
      socialProvider: input.socialTicket ? (input.socialTicket.split(':')[1] as SocialProvider) : null,
      consents: input.consents,
      consentToken: 'demo-consent',
    };
  },
  readTicket(ticket: string): Promise<SocialProfile> {
    const provider = ticket.split(':')[1] as SocialProvider;
    return mock.wait({ provider, email: `${provider}.demo@siempre.test`, nickname: null });
  },
};

/** 데모 모드 간편가입: 제공사 화면 없이 가짜 티켓을 만든다 */
export const demoSocialTicket = (provider: SocialProvider) => `demo:${provider}:${Date.now()}`;
