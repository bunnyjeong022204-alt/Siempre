// 앱 전체에서 쓰는 공통 타입

export type ProviderId = 'claude' | 'qwen' | 'mistral' | 'elevenlabs' | 'nanobanana';

/** 0 = 안 씀, 1 = 라이트, 2 = 스탠다드, 3 = 헤비 */
export type TierLevel = 0 | 1 | 2 | 3;

export interface Tier {
  name: '라이트' | '스탠다드' | '헤비';
  /** 월 가격(원, 부가세 포함) */
  price: number;
  /** 사용량 안내 문구 */
  allowance: string;
}

export interface Provider {
  id: ProviderId;
  name: string;
  /** 카드 한 줄 설명 */
  description: string;
  /** 카드 오른쪽 위 태그 */
  tag: string;
  /** 사용하는 모델 이름 */
  models: { chat: string; hard?: string };
  /** 밝은 배경색과 그 위 글자색 */
  color: { bg: string; ink: string };
  /** 라이트, 스탠다드, 헤비 순서 */
  tiers: [Tier, Tier, Tier];
  /** 비교할 공식 구독 (없으면 절약액을 표시하지 않음) */
  official?: { name: string; price: number };
}

export type RequestType = 'light' | 'translate' | 'bulk' | 'write' | 'hard' | 'voice' | 'image';

export interface RoutingRule {
  type: RequestType;
  label: string;
  /** 답변 아래에 보여 줄 선택 이유 */
  reason: string;
  provider: ProviderId;
  model: string;
  fallback?: { provider: ProviderId; model: string };
  /** 기본 차감 크레딧 (0 = 무제한). 음성은 1,000자당, 이미지는 1장당 */
  credits: number;
  unit?: '1,000자' | '장';
}

export type Cart = Record<ProviderId, TierLevel>;
export type Billing = 'monthly' | 'annual';

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  /** assistant 답변일 때만 */
  meta?: {
    type: RequestType;
    provider: ProviderId;
    model: string;
    reason: string;
    credits: number;
  };
}
