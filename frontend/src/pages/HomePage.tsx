import { useNavigate } from 'react-router-dom';
import { PrimaryButton } from '../components/auth/Controls';
import { useAuth } from '../state/AuthState';

/**
 * 임시 홈. 구독 선택·대화·크레딧 화면이 생기면 그 화면으로 바꾼다 (frontend/README.md "만들 화면").
 * 로그인 확인(RequireAuth)과 로그아웃이 동작하는지 보여 주는 용도.
 */
export function HomePage() {
  const navigate = useNavigate();
  const { user, subscribed, logout } = useAuth();
  return (
    <div className="flex min-h-screen items-center justify-center bg-page px-4 text-ink">
      <section className="w-full max-w-[440px] rounded-xl2 border border-lavender bg-surface p-8">
        <h1 className="text-2xl font-black">{user?.nickname}님, 반가워요</h1>
        <p className="mt-2 text-[15px] text-ink-sub">{user?.email} · {subscribed ? '구독 중' : '아직 구독 전'}</p>
        <p className="mt-6 rounded-xl bg-page px-4 py-3 text-sm text-ink-sub">구독 선택·대화·크레딧 화면은 아직 만들고 있어요.</p>
        <PrimaryButton className="mt-6" onClick={async () => { await logout(); navigate('/login'); }}>로그아웃</PrimaryButton>
      </section>
    </div>
  );
}
