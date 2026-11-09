// 회원가입·로그인 규칙 (auth/README.md "규칙" 표, PRD 5-0). 바뀌면 이 파일과 README만 고친다.
// 프런트의 frontend/src/config/auth.ts와 같은 값을 유지한다.

export const EMAIL_MAX = 254;
export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** 닉네임: 2~12자, 한글·영문·숫자 */
export const NICKNAME_RE = /^[가-힣a-zA-Z0-9]{2,12}$/;
export const RESERVED_NICKNAMES = ['admin', 'administrator', '운영자', '관리자', 'siempre', '씨엠프레', 'staff', 'root'];

/** 비밀번호: 8자 이상, 영문·숫자 포함. 너무 긴 입력으로 해시 계산이 느려지지 않게 상한을 둔다 */
export const PASSWORD_MIN = 8;
export const PASSWORD_MAX = 64;

export const SESSION_COOKIE = 'siempre_session';
export const SESSION_DAYS = 14;

/** IP당 1분 요청 제한 */
export const RATE_LIMITS = {
  checkEmail: { limit: 20, windowMs: 60_000 },
  login: { limit: 10, windowMs: 60_000 },
  signup: { limit: 10, windowMs: 60_000 },
};
