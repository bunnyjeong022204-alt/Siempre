import { num, percent, won } from '../../lib/format';
import type { CartSummary as Summary } from '../../lib/pricing';
import type { Billing } from '../../types';

interface Props {
  summary: Summary;
  billing: Billing;
  onCheckout: () => void;
}

export function CartSummary({ summary: s, billing, onCheckout }: Props) {
  const empty = s.lines.length === 0;
  return (
    <aside className="flex flex-col gap-4 rounded-3xl bg-brand p-7 text-ink lg:sticky lg:top-6">
      <h2 className="text-lg font-bold">내 구독 구성</h2>
      {empty ? (
        <p className="text-sm">왼쪽에서 쓸 AI의 사용량을 골라 주세요.</p>
      ) : (
        <ul className="flex flex-col gap-2.5 text-[15px]">
          {s.lines.map((l) => (
            <li key={l.providerId} className="flex justify-between"><span>{l.providerName} · {l.tierName}</span><b>{won(l.price)}</b></li>
          ))}
          {s.bundleDiscount > 0 && (
            <li className="flex justify-between"><span>{s.lines.length}개 묶음 할인 {percent(s.bundleRate)}</span><b>−{won(s.bundleDiscount)}</b></li>
          )}
        </ul>
      )}
      <div className="flex flex-col gap-1 border-t border-ink/20 pt-4">
        <span className="text-[13px]">{billing === 'annual' ? '연간 결제액 (부가세 포함)' : '월 결제액 (부가세 포함)'}</span>
        <span className="text-4xl font-bold">{won(s.charge)}</span>
        {billing === 'annual' && !empty && <span className="text-[13px]">월 약 {won(s.charge / 12)}</span>}
        <span className="text-[13px]">매주 {num(s.weeklyCredits)}크레딧 · 담은 AI 어디에나 나눠 쓸 수 있어요</span>
      </div>
      <p className="rounded-2xl bg-brand-soft p-3.5 text-[13px] leading-relaxed">
        크레딧은 매주 월요일에 채워지고 다음 주로 넘어가지 않아요.
      </p>
      <button type="button" onClick={onCheckout} disabled={empty}
        className="min-h-[56px] rounded-2xl bg-surface text-[17px] font-bold text-ink disabled:opacity-50">
        이 구성으로 결제하기
      </button>
    </aside>
  );
}
