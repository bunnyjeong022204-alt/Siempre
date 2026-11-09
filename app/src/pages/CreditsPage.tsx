import { Link } from 'react-router-dom';
import { ModelChip } from '../components/ui/ModelChip';
import { ProgressBar } from '../components/ui/ProgressBar';
import { StatCard } from '../components/ui/StatCard';
import { PROVIDERS } from '../config/providers';
import { SAMPLE_HISTORY } from '../data/mock';
import { num, won } from '../lib/format';
import { useAppState } from '../state/AppState';

// TODO(docs/tasks.md): AI별 사용량 카드, 요일별 사용량 차트를 Figma(HpjGEGRrFwSqTpooC3Vbdt, Page 2)에 맞춰 채우기
export function CreditsPage() {
  const { subscribed, balance, summary, cart } = useAppState();
  const weekly = summary.weeklyCredits;
  const left = subscribed ? balance : weekly;
  const used = weekly - left;
  const active = PROVIDERS.filter((p) => cart[p.id] > 0);

  return (
    <main className="mx-auto flex max-w-[1280px] flex-col gap-7 px-5 py-10 md:px-20">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">크레딧</h1>
          <p className="text-[15px] text-ink-sub">담은 AI {active.length}개 · 매주 월요일 오전 9시 충전</p>
        </div>
        <button type="button" className="min-h-tap rounded-xl bg-brand px-5 text-[15px] font-bold">크레딧 추가 충전</button>
      </div>

      <div className="flex flex-col gap-4 lg:flex-row">
        <section className="flex flex-col gap-3.5 rounded-3xl bg-brand p-7 lg:w-[560px]">
          <span className="text-[15px] font-semibold">이번 주 남은 크레딧</span>
          <div className="flex items-baseline gap-2"><span className="text-6xl font-bold">{num(left)}</span><span className="text-xl">/ {num(weekly)}</span></div>
          <ProgressBar ratio={weekly ? left / weekly : 0} label="이번 주 남은 크레딧" fillClassName="bg-surface" trackClassName="bg-brand-soft" />
          <span className="text-sm">남은 크레딧은 일요일 자정에 사라지고, 월요일에 {num(weekly)}크레딧이 새로 채워져요</span>
        </section>
        <StatCard label="이번 주 사용" value={`${num(used)} 크레딧`} tone="lavender" />
        <StatCard label="사라질 예정" value={`${num(left)} 크레딧`} note="일요일 자정까지 쓰지 않으면 사라져요" tone="soft" />
        <StatCard label="월 결제액" value={won(summary.monthly)} note={`묶음 할인 ${won(summary.bundleDiscount)} 적용`} />
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="text-xl font-bold">최근 기록</h2>
        <div className="overflow-x-auto rounded-3xl border border-lavender px-6 py-2">
          <table className="w-full min-w-[560px] text-sm">
            <thead><tr className="border-b border-lavender text-left text-ink-sub">
              <th className="py-2.5 font-semibold">시간</th><th className="font-semibold">AI</th><th className="font-semibold">작업</th><th className="text-right font-semibold">크레딧</th>
            </tr></thead>
            <tbody>
              {SAMPLE_HISTORY.map((h, i) => (
                <tr key={i} className="border-b border-lavender last:border-0">
                  <td className="py-3">{h.at}</td>
                  <td>{h.provider ? <ModelChip provider={h.provider} /> : '—'}</td>
                  <td>{h.task}</td>
                  <td className="text-right font-bold">{h.credits > 0 ? `+${num(h.credits)}` : h.credits < 0 ? num(h.credits) : '무제한'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {!subscribed && (
        <p className="rounded-2xl bg-brand-soft px-6 py-4 text-sm">
          아직 구독 전이라 예시 숫자를 보여 주고 있어요. <Link to="/plans" className="font-bold underline">구독 구성하기</Link>
        </p>
      )}
    </main>
  );
}
