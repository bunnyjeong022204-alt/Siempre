// 회원가입 진행 상태. 메모리에만 둔다 (비밀번호를 sessionStorage·localStorage에 저장하지 않음).
// 새로고침하면 처음부터 다시 시작한다.

import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import type { SignupResult, SocialProfile, EmailCheck } from '../api/signup';
import { EMPTY_CONSENTS, type Consents } from '../lib/signup';

export interface Verified { name: string; phone: string; token: string }
export interface Account { email: string; emailCheck: EmailCheck; nickname: string; password: string }
export interface Social extends SocialProfile { ticket: string }

interface SignupState {
  social: Social | null;
  verified: Verified | null;
  account: Account | null;
  consents: Consents;
  result: SignupResult | null;
  setSocial: (s: Social | null) => void;
  setVerified: (v: Verified | null) => void;
  setAccount: (a: Account | null) => void;
  setConsents: (c: Consents) => void;
  setResult: (r: SignupResult) => void;
}

const Ctx = createContext<SignupState | null>(null);

export function SignupProvider({ children }: { children: ReactNode }) {
  const [social, setSocialRaw] = useState<Social | null>(null);
  const [verified, setVerified] = useState<Verified | null>(null);
  const [account, setAccount] = useState<Account | null>(null);
  const [consents, setConsents] = useState<Consents>(EMPTY_CONSENTS);
  const [result, setResultRaw] = useState<SignupResult | null>(null);

  const value = useMemo<SignupState>(() => ({
    social, verified, account, consents, result,
    // 가입 방식이 바뀌면 이전에 입력한 계정 정보는 버린다
    setSocial: (s) => { setSocialRaw(s); setAccount(null); },
    setVerified,
    setAccount,
    setConsents,
    // 가입이 끝나면 비밀번호를 메모리에서도 지운다
    setResult: (r) => { setResultRaw(r); setAccount((a) => (a ? { ...a, password: '' } : a)); },
  }), [social, verified, account, consents, result]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useSignup() {
  const v = useContext(Ctx);
  if (!v) throw new Error('SignupProvider 안에서 써야 해요');
  return v;
}
