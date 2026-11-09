import { Navigate, useNavigate } from 'react-router-dom';
import { HOME_PATH } from '../../config/auth';
import { AuthLayout } from '../../components/auth/AuthLayout';
import { PrimaryButton } from '../../components/auth/Controls';
import { CheckIcon } from '../../components/auth/icons';
import { useSignup } from '../../state/AuthState';

/** 3단계: 가입 완료 */
export function SignupDonePage() {
  const navigate = useNavigate();
  const { done } = useSignup();
  if (!done) return <Navigate to="/signup" replace />;

  const rows: [string, string][] = [
    ['닉네임', done.nickname],
    ['이메일', done.email],
    ['소식 받기', done.marketing ? '동의' : '미동의'],
  ];

  return (
    <AuthLayout step="done" title={`가입을 환영해요, ${done.nickname}님`} sub="이제 쓸 AI를 골라 나만의 구독을 만들어 보세요.">
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
      {/* Firebase 계정을 만들면 바로 로그인 상태라 따로 로그인할 필요가 없다 */}
      <PrimaryButton className="mt-7" onClick={() => navigate(HOME_PATH)}>구독 구성 시작하기</PrimaryButton>
    </AuthLayout>
  );
}
