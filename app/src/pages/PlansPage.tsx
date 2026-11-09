import { useNavigate } from 'react-router-dom';
import { BillingToggle } from '../components/plans/BillingToggle';
import { CartSummary } from '../components/plans/CartSummary';
import { ProviderCard } from '../components/plans/ProviderCard';
import { PROVIDERS } from '../config/providers';
import { useAppState } from '../state/AppState';

export function PlansPage() {
  const { cart, billing, summary, setTier, setBilling, checkout } = useAppState();
  const navigate = useNavigate();

  function handleCheckout() {
    // 데모 결제: 실제 결제 연동은 MVP 범위 밖
    // TODO(docs/tasks.md): 결제 완료 상태 화면("이번 주 N크레딧이 채워졌어요") 보여 준 뒤 이동
    checkout();
    navigate('/');
  }

  return (
    <main className="mx-auto flex max-w-[1280px] flex-col gap-8 px-5 py-10 md:px-20">
      <header className="flex flex-col gap-3">
        <h1 className="text-4xl font-bold tracking-tight">쓸 AI만 골라 담으세요</h1>
        <p className="max-w-3xl text-[17px] leading-relaxed text-ink-sub">
          AI마다 사용량을 고르면 월 요금이 바로 계산돼요. 담은 사용량은 하나의 크레딧 지갑으로 합쳐져서, 대화할 때 요청에 맞는 AI가 자동으로 골라져요.
        </p>
        <BillingToggle value={billing} onChange={setBilling} />
      </header>
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        <div className="flex min-w-0 flex-1 flex-col gap-4">
          {PROVIDERS.map((p) => (
            <ProviderCard key={p.id} provider={p} level={cart[p.id]} onChange={(lv) => setTier(p.id, lv)} />
          ))}
        </div>
        <div className="lg:w-[400px]">
          <CartSummary summary={summary} billing={billing} onCheckout={handleCheckout} />
        </div>
      </div>
    </main>
  );
}
