import { useEffect, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { SIGNUP_STEPS, type SignupStepId } from '../../config/signup';
import { SignupAside } from './SignupAside';
import { ArrowLeftIcon } from './icons';

/** 회원가입 공통 틀: 상단바(GNB 축약) + 소개 패널 + 입력 카드 */
export function SignupLayout({ step, title, sub, children }: { step: SignupStepId; title: string; sub?: string; children: ReactNode }) {
  const navigate = useNavigate();
  const idx = SIGNUP_STEPS.findIndex((s) => s.id === step);
  const showProgress = idx > 0 && idx < SIGNUP_STEPS.length - 1;

  useEffect(() => {
    document.title = `${SIGNUP_STEPS[idx].label} · Siempre 회원가입`;
    window.scrollTo(0, 0);
  }, [idx]);

  return (
    <div className="min-h-screen bg-page text-ink">
      <header className="flex min-h-[67px] items-center justify-between gap-3 border-b border-lavender bg-surface px-4 py-3 md:px-10">
        <Link to="/signup" className="flex min-h-tap items-center gap-2.5 text-[17px] font-black text-ink">
          <span aria-hidden="true" className="inline-flex h-[30px] w-[30px] items-center justify-center rounded-lg bg-brand text-xs font-black">AI</span>
          Siempre
        </Link>
        <Link to="/" className="inline-flex min-h-tap items-center text-sm font-medium text-ink-sub hover:text-ink">
          서비스 둘러보기
        </Link>
      </header>

      <main className="mx-auto grid max-w-[1040px] items-start gap-0 lg:my-10 lg:grid-cols-[360px_minmax(0,1fr)] lg:gap-6 lg:px-6">
        <SignupAside current={step} />
        <section aria-labelledby="signup-title" className="bg-surface px-4 pb-10 pt-6 lg:min-h-[600px] lg:rounded-xl2 lg:border lg:border-lavender lg:px-10 lg:py-10">
          {showProgress && (
            <>
              <div aria-hidden="true" className="mb-5 flex gap-1.5">
                {SIGNUP_STEPS.slice(1, -1).map((s, i) => (
                  <span key={s.id} className={`h-1 flex-1 rounded-full ${i < idx ? 'bg-brand' : 'bg-lavender'}`} />
                ))}
              </div>
              <button type="button" onClick={() => navigate(-1)} className="-ml-1 mb-1 inline-flex min-h-tap items-center gap-1 pr-2 text-[15px] text-ink-sub hover:text-ink">
                <ArrowLeftIcon /> 이전
              </button>
            </>
          )}
          <h2 id="signup-title" className="text-2xl font-black tracking-[-0.01em]">{title}</h2>
          {sub && <p className="mt-1.5 text-[15px] text-ink-sub">{sub}</p>}
          <div className="mt-7">{children}</div>
        </section>
      </main>
    </div>
  );
}
