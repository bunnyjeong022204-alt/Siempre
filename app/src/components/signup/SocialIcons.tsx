// 간편가입 로고. 각 제공사 로그인 버튼 가이드의 기본 색(구글 4색 G, 카카오 노랑 말풍선, 네이버 초록 N)을 따른다.
// 로고는 CLAUDE.md "선 아이콘만" 규칙의 예외로 둔다 (브랜드 가이드상 형태를 바꾸면 안 됨).

import type { SocialProvider } from '../../config/signup';

function Google() {
  return (
    <svg width="22" height="22" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </svg>
  );
}
function Kakao() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#191919" d="M12 4.2c-4.97 0-9 3.13-9 7 0 2.48 1.65 4.66 4.15 5.9l-.84 3.1c-.08.29.25.52.5.35l3.7-2.45c.49.06.98.1 1.49.1 4.97 0 9-3.13 9-7s-4.03-7-9-7z" />
    </svg>
  );
}
function Naver() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#FFFFFF" d="M16.27 12.84 7.42 0H0v24h7.73V11.16L16.58 24H24V0h-7.73z" />
    </svg>
  );
}

const STYLE: Record<SocialProvider, { bg: string; border: string; Logo: () => JSX.Element }> = {
  google: { bg: '#FFFFFF', border: '#D9DCE3', Logo: Google },
  kakao: { bg: '#FEE500', border: '#FEE500', Logo: Kakao },
  naver: { bg: '#03C75A', border: '#03C75A', Logo: Naver },
};

export function SocialLogo({ provider }: { provider: SocialProvider }) {
  const s = STYLE[provider];
  return (
    <span
      className="inline-flex h-[52px] w-[52px] items-center justify-center rounded-full border transition-transform group-hover:-translate-y-0.5"
      style={{ backgroundColor: s.bg, borderColor: s.border }}
    >
      <s.Logo />
    </span>
  );
}
