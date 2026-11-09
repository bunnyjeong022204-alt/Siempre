// 회원가입에서 바뀔 수 있는 값과 문구. 서버 규칙은 server/lib/policy.js와 같은 값을 유지한다.
// 근거: intent/20261109-signup-flow/spec.md

export const SIGNUP_STEPS = [
  { id: 'entry', path: '/signup', label: '가입 방식' },
  { id: 'verify', path: '/signup/verify', label: '본인 인증' },
  { id: 'info', path: '/signup/info', label: '계정 정보' },
  { id: 'consent', path: '/signup/consent', label: '약관 동의' },
  { id: 'done', path: '/signup/done', label: '가입 완료' },
] as const;
export type SignupStepId = (typeof SIGNUP_STEPS)[number]['id'];

/** 왼쪽 소개 카드 */
export const SIGNUP_BENEFITS = [
  { title: '쓸 AI만 골라 담기', desc: '안 쓰는 AI엔 0원' },
  { title: '크레딧 지갑 하나로', desc: '담은 AI 사용량을 한곳에서 확인' },
  { title: '모델은 자동으로', desc: '요청에 맞는 AI가 답해요' },
];

export const PASSWORD_POLICY = { min: 8, max: 20 };
export const PASSWORD_RULE_LABELS = {
  length: '8~20자',
  letter: '영문',
  number: '숫자',
  symbol: '특수문자',
  noSpace: '공백 없음',
} as const;

export const NICKNAME_PATTERN = /^[가-힣a-zA-Z0-9]{2,10}$/;
export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
export const RETURN_DAYS = 30;
export const CODE_LENGTH = 6;

export type TermKey = 'tos' | 'privacy' | 'age14' | 'aiTransfer' | 'marketingEmail' | 'marketingSms';

/** 필수 약관. 문구는 임시 값이며 법무 검토 후 확정한다. */
export const REQUIRED_TERMS: { key: TermKey; label: string; detail?: string }[] = [
  { key: 'tos', label: '서비스 이용약관', detail: '구독 구성, 크레딧 충전·차감, 환불 기준 같은 서비스 이용 조건이에요. (임시 문구)' },
  { key: 'privacy', label: '개인정보 수집·이용', detail: '이름·휴대폰·이메일을 회원 확인과 결제 안내에 쓰고, 탈퇴 후 관계 법령에 따른 기간이 지나면 지워요. (임시 문구)' },
  { key: 'age14', label: '만 14세 이상이에요' },
  { key: 'aiTransfer', label: '외부 AI 제공사로 대화 전달', detail: '알맞은 답을 위해 입력한 대화를 담은 AI 제공사(GPT, Qwen, Mistral 등)로 보내요. (임시 문구)' },
];

/** 선택 약관: 마케팅 수신 채널 */
export const MARKETING_LABEL = '할인·새 AI 입점 소식 받기';
export const MARKETING_CHANNELS: { key: TermKey; label: string }[] = [
  { key: 'marketingEmail', label: '이메일' },
  { key: 'marketingSms', label: '문자' },
];

export type SocialProvider = 'google' | 'kakao' | 'naver';
export const SOCIAL_PROVIDERS: { id: SocialProvider; label: string }[] = [
  { id: 'google', label: '구글' },
  { id: 'kakao', label: '카카오' },
  { id: 'naver', label: '네이버' },
];

export const SOCIAL_ERRORS: Record<string, string> = {
  denied: '간편가입을 취소했어요.',
  state: '보안 확인에 실패했어요. 처음부터 다시 시도해 주세요.',
  provider: '간편가입 제공사와 연결하지 못했어요. 잠시 후 다시 시도해 주세요.',
  already: '이미 이 계정으로 가입했어요.',
};

/** 가입을 마친 뒤 이동할 화면 */
export const AFTER_SIGNUP_PATH = '/plans';
