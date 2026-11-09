// 로그인 상태. 처음 열 때 /api/auth/me로 세션 쿠키를 확인한다 (쿠키는 HttpOnly라 화면에서 읽지 않음).

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { authApi, type User } from '../api/auth';

interface AuthState {
  /** undefined = 확인 중, null = 로그인 안 함 */
  user: User | null | undefined;
  subscribed: boolean;
  login: (email: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
}

const Ctx = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null | undefined>(undefined);
  const [subscribed, setSubscribed] = useState(false);

  useEffect(() => {
    authApi.me()
      .then((r) => { setUser(r.user); setSubscribed(r.subscribed); })
      .catch(() => setUser(null)); // 401(로그인 안 함)이나 서버 연결 실패 모두 로그인 안 한 상태로 본다
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const r = await authApi.login(email, password);
    setUser(r.user);
    authApi.me().then((m) => setSubscribed(m.subscribed)).catch(() => {});
    return r.user;
  }, []);

  const logout = useCallback(async () => {
    await authApi.logout().catch(() => {});
    setUser(null);
    setSubscribed(false);
  }, []);

  const value = useMemo(() => ({ user, subscribed, login, logout }), [user, subscribed, login, logout]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const v = useContext(Ctx);
  if (!v) throw new Error('AuthProvider 안에서 써야 해요');
  return v;
}

// ── 회원가입 입력값 (메모리에만, 비밀번호를 sessionStorage·localStorage에 저장하지 않음) ──

export interface SignupDraft { email: string; emailStatus: 'new' | 'rejoin'; nickname: string; password: string }
interface SignupState {
  draft: SignupDraft | null;
  setDraft: (d: SignupDraft | null) => void;
  done: { email: string; nickname: string; marketing: boolean; loggedIn: boolean } | null;
  setDone: (d: SignupState['done']) => void;
}
const SignupCtx = createContext<SignupState | null>(null);

export function SignupProvider({ children }: { children: ReactNode }) {
  const [draft, setDraft] = useState<SignupDraft | null>(null);
  const [done, setDone] = useState<SignupState['done']>(null);
  const value = useMemo(() => ({ draft, setDraft, done, setDone }), [draft, done]);
  return <SignupCtx.Provider value={value}>{children}</SignupCtx.Provider>;
}

export function useSignup() {
  const v = useContext(SignupCtx);
  if (!v) throw new Error('SignupProvider 안에서 써야 해요');
  return v;
}
