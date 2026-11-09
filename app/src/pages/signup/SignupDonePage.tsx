import { Navigate, useNavigate } from 'react-router-dom';
import { AFTER_SIGNUP_PATH, SOCIAL_PROVIDERS } from '../../config/signup';
import { SignupLayout } from '../../components/signup/SignupLayout';
import { PrimaryButton } from '../../components/signup/SignupControls';
import { CheckIcon } from '../../components/signup/icons';
import { formatDate, marketingSummary } from '../../lib/signup';
import { useSignup } from '../../state/SignupState';

/** 5단계: 가입 완료. 동의 현황을 한 곳에서 보여 주고 "동의 내용 수정"으로 돌아갈 수 있게 한다. */
export function SignupDonePage() {
  const navigate = useNavigate();
  const { result } = useSignup();
  if (!result) return <Navigate to="/signup" replace />;

  const returning = result.memberType === 'returning';
  const via = result.socialProvider ? `${SOCIAL_PROVIDERS.find((p) => p.id === result.socialProvider)?.label} 간편가입` : '이메일';
  const rows: [string, string][] = [
    ['닉네임', result.nickname],
    ['이메일', result.email],
    ['가입 방식', via],
    ['회원 구분', returning ? `기존 회원 복귀 · 처음 가입 ${formatDate(result.firstJoinedAt)}` : '신규 회원'],
    ['소식 받기', marketingSummary(result.consents)],
  ];

  return (
    <SignupLayout step="done" title={returning ? `다시 오신 걸 환영해요, ${result.nickname}님` : `가입을 환영해요, ${result.nickname}님`}
      sub="이제 쓸 AI를 골라 나만의 구독을 만들어 보세요.">
      <div aria-hidden="true" className="-mt-2 mb-6 inline-flex h-16 w-16 items-center justify-center rounded-[20px] bg-brand-soft text-ink">
        <CheckIcon size={30} />
      </div>
      <section aria-labelledby="done-summary" className="rounded-2xl bg-page px-5 py-[18px]">
        <h3 id="done-summary" className="mb-2.5 text-sm font-bold">가입 정보</h3>
        <dl className="grid grid-cols-[minmax(72px,auto)_1fr] gap-x-3 gap-y-1.5 text-sm">
          {rows.map(([k, v]) => (
            <div key={k} className="contents">
              <dt className="text-ink-sub">{k}</dt>
              <dd className="min-w-0 break-words font-medium">{v}</dd>
            </div>
          ))}
        </dl>
      </section>
      <PrimaryButton className="mt-7" onClick={() => navigate(AFTER_SIGNUP_PATH)}>구독 구성 시작하기</PrimaryButton>
      <p className="mt-2 text-center">
        <button type="button" onClick={() => navigate('/signup/consent')} className="min-h-tap px-2 text-sm font-bold text-ink underline underline-offset-2">
          동의 내용 수정
        </button>
      </p>
    </SignupLayout>
  );
}
