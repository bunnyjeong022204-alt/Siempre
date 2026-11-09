// backend/auth API 호출. 요청·응답 형식은 backend/auth/README.md 표 그대로.
// 실패 응답: { error: { code, message, ... } } (backend/shared/README.md 2장)

export interface User { id: number; email: string; nickname: string }
export type EmailStatus = 'new' | 'exists' | 'rejoin';
export interface NicknameCheck { available: boolean; reason?: 'invalid' | 'reserved' | 'taken' }
export interface SignupInput { email: string; password: string; nickname: string; agreeTerms: boolean; marketing?: boolean }

export class ApiError extends Error {
  constructor(public status: number, public code: string, message: string, public extra: Record<string, unknown> = {}) {
    super(message);
  }
}

async function call<T>(path: string, body?: unknown): Promise<T> {
  let res: Response;
  try {
    res = await fetch(path, {
      method: body === undefined ? 'GET' : 'POST',
      headers: body === undefined ? undefined : { 'content-type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
      credentials: 'same-origin',
    });
  } catch {
    throw new ApiError(0, 'network', '서버와 연결하지 못했어요. 잠시 후 다시 시도해 주세요.');
  }
  const data = (await res.json().catch(() => ({}))) as { error?: { code?: string; message?: string } & Record<string, unknown> };
  if (!res.ok) {
    const { code = 'server_error', message = '요청을 처리하지 못했어요.', ...extra } = data.error ?? {};
    throw new ApiError(res.status, code, message, extra);
  }
  return data as T;
}

export const authApi = {
  checkEmail: (email: string) => call<{ status: EmailStatus }>('/api/auth/check-email', { email }),
  checkNickname: (nickname: string) => call<NicknameCheck>('/api/auth/check-nickname', { nickname }),
  signup: (input: SignupInput) => call<{ ok: true }>('/api/auth/signup', input),
  login: (email: string, password: string) => call<{ user: User }>('/api/auth/login', { email, password }),
  logout: () => call<{ ok: true }>('/api/auth/logout', {}),
  me: () => call<{ user: User; subscribed: boolean }>('/api/auth/me'),
};
