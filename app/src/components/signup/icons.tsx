// 회원가입 화면의 선 아이콘(SVG). 이모지는 쓰지 않는다.

const base = { fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' } as const;

export const CheckIcon = ({ size = 14 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" {...base} strokeWidth={3}><path d="M5 12.5 10 17.5 19 7" /></svg>
);
export const ArrowLeftIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" {...base}><path d="M15 6l-6 6 6 6" /></svg>
);
export const ChevronIcon = ({ open }: { open: boolean }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true" {...base} style={{ transform: open ? 'rotate(180deg)' : undefined }}><path d="M6 9l6 6 6-6" /></svg>
);
export const MailIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true" {...base}><rect x="3" y="5" width="18" height="14" rx="2.5" /><path d="m4 7 8 6 8-6" /></svg>
);
export const EyeIcon = ({ off }: { off: boolean }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" {...base}>
    <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z" /><circle cx="12" cy="12" r="3" />
    {off && <path d="M3 3l18 18" />}
  </svg>
);
export const AlertIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true" {...base} strokeWidth={2.5}><circle cx="12" cy="12" r="9" /><path d="M12 8v5M12 16.5v.01" /></svg>
);
