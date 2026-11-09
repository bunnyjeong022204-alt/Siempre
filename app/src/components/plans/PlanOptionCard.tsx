import { won } from '../../lib/format';

interface Props {
  title: string;
  price: number;
  allowance: string;
  selected: boolean;
  onSelect: () => void;
}

/** Figma "Plan option": 안 씀/라이트/스탠다드/헤비 선택 칸 */
export function PlanOptionCard({ title, price, allowance, selected, onSelect }: Props) {
  return (
    <button type="button" onClick={onSelect} aria-pressed={selected}
      className={`flex min-h-[112px] flex-1 basis-36 flex-col items-start gap-1 rounded-2xl p-4 text-left transition-colors ${
        selected ? 'border-2 border-brand bg-brand-soft' : 'border border-lavender bg-surface hover:bg-lavender/40'
      }`}>
      <span className="text-sm font-semibold">{title}</span>
      <span className="text-xl font-bold">{won(price)}</span>
      <span className="text-xs leading-relaxed text-ink-sub">{allowance}</span>
    </button>
  );
}
