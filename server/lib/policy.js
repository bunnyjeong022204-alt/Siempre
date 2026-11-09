// 회원가입 정책 값. 프런트의 app/src/config/signup.ts와 같은 값을 유지한다.
// 근거: intent/20261109-signup-flow/spec.md

export const PASSWORD = { min: 8, max: 20 };
export const NICKNAME_RE = /^[가-힣a-zA-Z0-9]{2,10}$/;
export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
export const PHONE_RE = /^010-\d{4}-\d{4}$/;
export const NAME_MAX = 20;
export const EMAIL_MAX = 254;

/** 탈퇴 후 이 기간 안에 같은 본인이 돌아오면 기존 회원으로 복귀 */
export const RETURN_DAYS = 30;

/** 인증번호 유효 시간과 시도 횟수 */
export const CODE_TTL_MS = 3 * 60 * 1000;
export const CODE_MAX_ATTEMPTS = 5;
/** 본인 인증을 마친 뒤 가입까지 허용하는 시간 */
export const VERIFICATION_TTL_MS = 30 * 60 * 1000;
/** 가입 직후 동의 내용 수정에 쓰는 토큰 유효 시간 */
export const CONSENT_TOKEN_TTL_MS = 30 * 60 * 1000;
/** 간편가입 1회용 티켓 유효 시간 */
export const SOCIAL_TICKET_TTL_MS = 30 * 60 * 1000;
export const OAUTH_STATE_TTL_MS = 10 * 60 * 1000;

/** 약관. required가 false면 선택 항목 */
export const TERMS = [
  { key: 'tos', required: true },
  { key: 'privacy', required: true },
  { key: 'age14', required: true },
  { key: 'aiTransfer', required: true },
  { key: 'marketingEmail', required: false },
  { key: 'marketingSms', required: false },
];
export const TERM_KEYS = TERMS.map((t) => t.key);

export const RESERVED_NICKNAMES = ['siempre', '씨엠프레', 'admin', '관리자', '운영자', 'staff'];
