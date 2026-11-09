interface Props {
  /** 0~1 */
  ratio: number;
  label: string;
  /** 막대 색 Tailwind 클래스 (기본: brand) */
  fillClassName?: string;
  /** 배경 Tailwind 클래스 (기본: lavender) */
  trackClassName?: string;
  /** AI별 색처럼 config에서 오는 값일 때만 사용 */
  color?: string;
  borderColor?: string;
}

/** 크레딧 막대. 색만으로 뜻을 전하지 않도록 옆에 항상 숫자를 함께 둔다. */
export function ProgressBar({ ratio, label, fillClassName = 'bg-brand', trackClassName = 'bg-lavender', color, borderColor }: Props) {
  const pct = Math.max(0, Math.min(1, ratio)) * 100;
  return (
    <div role="progressbar" aria-label={label} aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100}
      className={`h-2.5 w-full overflow-hidden rounded-full ${trackClassName}`}>
      <div className={`h-full rounded-full ${color ? '' : fillClassName}`}
        style={{ width: `${pct}%`, backgroundColor: color, border: borderColor ? `1px solid ${borderColor}` : undefined }} />
    </div>
  );
}
