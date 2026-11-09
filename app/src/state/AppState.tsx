// 앱 전체 상태: 장바구니, 결제 방식, 구독 여부, 이번 주 크레딧.
// MVP는 메모리에만 저장한다. 로그인과 서버 저장은 MVP 범위 밖.

import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import { EMPTY_CART, summarizeCart, type CartSummary } from '../lib/pricing';
import type { Billing, Cart, ProviderId, TierLevel } from '../types';

interface AppState {
  cart: Cart;
  billing: Billing;
  summary: CartSummary;
  subscribed: boolean;
  balance: number;
  setTier: (id: ProviderId, level: TierLevel) => void;
  setBilling: (b: Billing) => void;
  /** 데모 결제: 구독 시작, 이번 주 크레딧 지급 */
  checkout: () => void;
  spend: (amount: number) => void;
  refund: (amount: number) => void;
}

const DEFAULT_CART: Cart = { ...EMPTY_CART, claude: 2, qwen: 1, mistral: 2 };

const Ctx = createContext<AppState | null>(null);

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<Cart>(DEFAULT_CART);
  const [billing, setBilling] = useState<Billing>('monthly');
  const [subscribed, setSubscribed] = useState(false);
  const [balance, setBalance] = useState(0);
  const summary = useMemo(() => summarizeCart(cart, billing), [cart, billing]);

  const value: AppState = {
    cart, billing, summary, subscribed, balance,
    setTier: (id, level) => setCart((c) => ({ ...c, [id]: level })),
    setBilling,
    checkout: () => { setSubscribed(true); setBalance(summary.weeklyCredits); },
    spend: (amount) => setBalance((b) => b - amount),
    refund: (amount) => setBalance((b) => b + amount),
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAppState(): AppState {
  const v = useContext(Ctx);
  if (!v) throw new Error('useAppState는 AppStateProvider 안에서만 쓸 수 있어요');
  return v;
}
