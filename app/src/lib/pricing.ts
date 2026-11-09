// 장바구니 금액 계산. 화면에서는 이 함수의 결과만 쓴다.

import { PROVIDERS } from '../config/providers';
import { ANNUAL_DISCOUNT, bundleDiscountRate, WON_PER_WEEKLY_CREDIT } from '../config/policy';
import type { Billing, Cart, ProviderId, TierLevel } from '../types';

export interface CartLine {
  providerId: ProviderId;
  providerName: string;
  tierName: string;
  price: number;
}

export interface CartSummary {
  lines: CartLine[];
  subtotal: number;
  bundleRate: number;
  bundleDiscount: number;
  /** 묶음 할인 뒤 월 결제액 */
  monthly: number;
  /** 연간 결제액 (연간 할인 적용) */
  annual: number;
  /** 지금 선택한 결제 방식의 결제액 */
  charge: number;
  weeklyCredits: number;
  /** 같은 AI를 공식 구독으로 따로 할 때 월 합계 (비교 가능한 것만) */
  officialTotal: number;
}

export const EMPTY_CART: Cart = { claude: 0, qwen: 0, mistral: 0, elevenlabs: 0, nanobanana: 0 };

export function summarizeCart(cart: Cart, billing: Billing = 'monthly'): CartSummary {
  const lines: CartLine[] = [];
  let officialTotal = 0;
  for (const p of PROVIDERS) {
    const level = cart[p.id];
    if (level === 0) continue;
    const tier = p.tiers[level - 1];
    lines.push({ providerId: p.id, providerName: p.name, tierName: tier.name, price: tier.price });
    if (p.official) officialTotal += p.official.price;
  }
  const subtotal = lines.reduce((sum, l) => sum + l.price, 0);
  const bundleRate = bundleDiscountRate(lines.length);
  const bundleDiscount = Math.round(subtotal * bundleRate);
  const monthly = subtotal - bundleDiscount;
  const annual = roundTo10(monthly * 12 * (1 - ANNUAL_DISCOUNT));
  const weeklyCredits = Math.round(monthly / WON_PER_WEEKLY_CREDIT);
  return {
    lines, subtotal, bundleRate, bundleDiscount, monthly, annual,
    charge: billing === 'annual' ? annual : monthly,
    weeklyCredits, officialTotal,
  };
}

/** 이 AI의 이 단계를 공식 구독과 비교한 월 절약액 (음수면 더 비쌈, 비교 대상 없으면 null) */
export function savingVsOfficial(providerId: ProviderId, level: TierLevel): number | null {
  const p = PROVIDERS.find((x) => x.id === providerId);
  if (!p?.official || level === 0) return null;
  return p.official.price - p.tiers[level - 1].price;
}

function roundTo10(n: number): number {
  return Math.round(n / 10) * 10;
}
