import { won } from '../../lib/format';
import { savingVsOfficial } from '../../lib/pricing';
import type { Provider, TierLevel } from '../../types';
import { ProviderIcon } from '../ui/ModelChip';
import { PlanOptionCard } from './PlanOptionCard';

interface Props {
  provider: Provider;
  level: TierLevel;
  onChange: (level: TierLevel) => void;
}

/** 구독 선택 화면의 AI 카드 한 장 */
export function ProviderCard({ provider: p, level, onChange }: Props) {
  const saving = savingVsOfficial(p.id, level);
  return (
    <section className="flex flex-col gap-4 rounded-card border border-lavender bg-surface p-6">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <ProviderIcon provider={p.id} />
          <div>
            <h2 className="text-xl font-bold">{p.name}</h2>
            <p className="text-[13px] text-ink-sub">{p.description}</p>
          </div>
        </div>
        <span className="rounded-full px-3 py-1.5 text-xs font-bold" style={{ backgroundColor: p.color.bg, color: p.color.ink }}>{p.tag}</span>
      </div>
      <div className="flex flex-wrap gap-2.5">
        <PlanOptionCard title="안 씀" price={0} allowance="사용하지 않음" selected={level === 0} onSelect={() => onChange(0)} />
        {p.tiers.map((t, i) => (
          <PlanOptionCard key={t.name} title={t.name} price={t.price} allowance={t.allowance}
            selected={level === i + 1} onSelect={() => onChange((i + 1) as TierLevel)} />
        ))}
      </div>
      {saving !== null && p.official && (
        <p className={`rounded-xl px-3.5 py-2.5 text-[13px] font-medium ${saving >= 0 ? 'bg-brand-soft text-ink' : 'bg-lavender text-ink'}`}>
          {saving >= 0
            ? `공식 ${p.official.name}(약 ${won(p.official.price)})보다 매달 ${won(saving)} 저렴해요`
            : `이 사용량이면 공식 ${p.official.name}가 매달 ${won(-saving)} 더 저렴해요`}
        </p>
      )}
    </section>
  );
}
