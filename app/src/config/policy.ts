// 할인과 크레딧 규칙. 근거는 docs/pricing.md

/** 담은 AI 개수 → 묶음 할인율 */
export function bundleDiscountRate(count: number): number {
  if (count >= 3) return 0.1;
  if (count === 2) return 0.05;
  return 0;
}

export const ANNUAL_DISCOUNT = 0.15;

/** 주간 크레딧 = 월 결제액 ÷ 36 */
export const WON_PER_WEEKLY_CREDIT = 36;

export const LIGHT_DAILY_LIMIT = 300;

/** 크레딧 지급: 매주 월요일 오전 9시 (한국 시간) */
export const GRANT_WEEKDAY = 1;
export const GRANT_HOUR_KST = 9;

/** 비용 안전장치 (백엔드에서 사용) */
export const PER_REQUEST_COST_CAP_KRW = 500;
export const PER_USER_DAILY_COST_ALERT_KRW = 3000;
