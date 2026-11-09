import { ANNUAL_DISCOUNT } from '../../config/policy';
import { percent } from '../../lib/format';
import type { Billing } from '../../types';

export function BillingToggle({ value, onChange }: { value: Billing; onChange: (b: Billing) => void }) {
  const opt = (b: Billing, label: string) => (
    <button type="button" aria-pressed={value === b} onClick={() => onChange(b)}
      className={`min-h-tap flex-1 rounded-full px-4 text-sm font-semibold ${value === b ? 'bg-surface text-ink shadow' : 'text-ink-sub'}`}>
      {label}
    </button>
  );
  return (
    <div className="flex w-full max-w-xs gap-1 rounded-full bg-lavender p-1" role="group" aria-label="결제 주기">
      {opt('monthly', '월간')}
      {opt('annual', `연간 ${percent(ANNUAL_DISCOUNT)} 할인`)}
    </div>
  );
}
