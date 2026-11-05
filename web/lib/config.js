// 모델, 라우팅 규칙, 요금제 설정.
// 모델 ID는 공급사 문서에서 확인한 뒤 .env로 바꿀 수 있습니다.

const env = process.env;

export const MODELS = {
  'claude-haiku': { label: 'Claude Haiku 5.5', provider: 'anthropic', id: env.MODEL_CLAUDE_HAIKU || 'claude-haiku-5-5', estCostKRW: 1.6 },
  'claude-sonnet': { label: 'Claude Sonnet 5.5', provider: 'anthropic', id: env.MODEL_CLAUDE_SONNET || 'claude-sonnet-5-5', estCostKRW: 26 },
  'claude-opus': { label: 'Claude Opus 5.5', provider: 'anthropic', id: env.MODEL_CLAUDE_OPUS || 'claude-opus-5-5', estCostKRW: 118 },
  'gpt-sol': { label: 'GPT-6 Sol', provider: 'openai', id: env.MODEL_GPT_SOL || 'gpt-6-sol', estCostKRW: 26 },
  'gpt-luna': { label: 'GPT-6 Luna', provider: 'openai', id: env.MODEL_GPT_LUNA || 'gpt-6-luna', estCostKRW: 1.3 },
  'gemini-flash': { label: 'Gemini 3.8 Flash', provider: 'google', id: env.MODEL_GEMINI_FLASH || 'gemini-3.8-flash', estCostKRW: 10 },
  'gemini-argon': { label: 'Gemini 4 Argon', provider: 'google', id: env.MODEL_GEMINI_ARGON || 'gemini-4-argon', estCostKRW: 118 },
  'nano-banana': { label: 'Nano Banana', provider: 'google-image', id: env.MODEL_GEMINI_IMAGE || 'gemini-3.1-flash-image', estCostKRW: 109 }
};

// 요청 유형별 기본 모델과 대체 모델. credits = 차감 크레딧 (0 = 무제한).
export const RULES = {
  light: { label: '가벼운 대화', main: 'claude-haiku', fallback: 'gpt-luna', credits: 0, reason: '가벼운 대화' },
  write: { label: '글쓰기·일반 질문', main: 'claude-sonnet', fallback: 'gpt-sol', credits: 5, reason: '글쓰기 요청이라 자동 선택' },
  bulk: { label: '요약·번역·긴 문서', main: 'gemini-flash', fallback: 'claude-sonnet', credits: 3, reason: '요약·번역 요청이라 자동 선택' },
  hard: { label: '고난도 추론·코딩', main: 'claude-opus', fallback: 'gemini-argon', credits: 19, reason: '고난도 요청이라 자동 선택' },
  image: { label: '이미지 생성', main: 'nano-banana', fallback: null, credits: 17, reason: '이미지 요청이라 자동 선택' }
};

export const PLANS = {
  light: { name: '라이트', priceKRW: 24900, weekly: 650 },
  standard: { name: '스탠다드', priceKRW: 69000, weekly: 1900 },
  heavy: { name: '헤비', priceKRW: 139000, weekly: 3750 }
};

export const LIGHT_DAILY_LIMIT = Number(env.LIGHT_DAILY_LIMIT || 300);
export const PER_REQUEST_COST_CAP_KRW = Number(env.PER_REQUEST_COST_CAP_KRW || 500);

export function hasKey(provider) {
  if (provider === 'anthropic') return Boolean(env.ANTHROPIC_API_KEY);
  if (provider === 'openai') return Boolean(env.OPENAI_API_KEY);
  if (provider === 'google' || provider === 'google-image') return Boolean(env.GEMINI_API_KEY);
  return false;
}

// 어떤 모델이 어느 요청 유형에 속하는지 (다른 모델로 다시 받기 때 크레딧 계산용)
export function ruleForModel(modelKey) {
  for (const [type, rule] of Object.entries(RULES)) {
    if (rule.main === modelKey || rule.fallback === modelKey) return type;
  }
  return 'write';
}
