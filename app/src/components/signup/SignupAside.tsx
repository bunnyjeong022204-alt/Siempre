import { SIGNUP_BENEFITS, SIGNUP_STEPS, type SignupStepId } from '../../config/signup';
import { CheckIcon } from './icons';

/**
 * Figma "SU/Aside": 왼쪽 소개 패널.
 * - 소개 카드 3개는 같은 왼쪽 선·같은 너비·같은 색으로 맞춘다.
 * - 분홍(primary) 바탕 위 글자는 모두 ink (보조 회색은 대비 2.7:1이라 쓰지 않음).
 * - 큰 화면에서도 360px로 고정, 작은 화면에서는 제목만 보이는 띠로 줄어든다.
 */
export function SignupAside({ current }: { current: SignupStepId }) {
  const idx = SIGNUP_STEPS.findIndex((s) => s.id === current);
  return (
    <aside aria-label="Siempre 소개" className="bg-brand px-4 py-5 text-ink lg:sticky lg:top-6 lg:rounded-xl2 lg:p-7">
      <h1 className="text-[22px] font-black leading-tight tracking-[-0.02em] lg:text-[28px]">
        쓸 AI만 골라 담고,
        <br />한 대화에서 쓰세요
      </h1>
      <p className="mt-2 text-sm font-medium lg:text-[15px]">가입하면 바로 구독 구성을 시작할 수 있어요.</p>

      <ul className="mt-6 hidden flex-col gap-2.5 lg:flex">
        {SIGNUP_BENEFITS.map((b, i) => (
          <li key={b.title} className="flex items-center gap-3 rounded-2xl bg-surface px-4 py-3.5">
            <span aria-hidden="true" className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-brand-soft text-[15px] font-black">
              {i + 1}
            </span>
            <span className="min-w-0">
              <b className="block text-sm font-bold leading-snug">{b.title}</b>
              <span className="block text-[13px] leading-snug text-ink-sub">{b.desc}</span>
            </span>
          </li>
        ))}
      </ul>

      <ol aria-label="가입 단계" className="mt-7 hidden flex-col gap-1 lg:flex">
        {SIGNUP_STEPS.map((s, i) => {
          const done = i < idx;
          const on = i === idx;
          return (
            <li key={s.id} aria-current={on ? 'step' : undefined} className={`flex min-h-[30px] items-center gap-2.5 text-sm ${on ? 'font-black' : 'font-medium'}`}>
              <span
                aria-hidden="true"
                className={`inline-flex h-5 w-5 items-center justify-center rounded-full border-2 border-ink ${done ? 'bg-surface' : on ? 'bg-ink text-surface' : ''}`}
              >
                {done ? <CheckIcon size={11} /> : on ? <span className="h-1.5 w-1.5 rounded-full bg-surface" /> : null}
              </span>
              {s.label}
              {done && <span className="sr-only">(완료)</span>}
            </li>
          );
        })}
      </ol>
    </aside>
  );
}
