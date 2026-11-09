import type { ReactNode } from 'react';

/** Figma "KPI tile": 숫자 요약 카드 */
export function StatCard({ label, value, note, tone = 'white' }: { label: string; value: ReactNode; note?: string; tone?: 'white' | 'soft' | 'lavender' }) {
  const bg = tone === 'soft' ? 'bg-brand-soft' : tone === 'lavender' ? 'bg-lavender' : 'bg-surface border border-lavender';
  return (
    <section className={`flex flex-1 flex-col gap-1.5 rounded-3xl p-6 ${bg}`}>
      <span className="text-sm font-medium text-ink-sub">{label}</span>
      <span className="text-3xl font-bold text-ink">{value}</span>
      {note && <span className="text-[13px] text-ink-sub">{note}</span>}
    </section>
  );
}
