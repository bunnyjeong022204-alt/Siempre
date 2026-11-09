import { useState, type FormEvent } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { ApiError } from '../../api/auth';
import { HOME_PATH } from '../../config/auth';
import { AuthLayout } from '../../components/auth/AuthLayout';
import { Alert, Field, PasswordToggle, PrimaryButton } from '../../components/auth/Controls';
import { isEmail, safeNext } from '../../lib/auth';
import { useAuth } from '../../state/AuthState';

/** 로그인. 성공하면 원래 가려던 화면(?next=)이나 홈으로 */
export function LoginPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { user, login } = useAuth();
  const [email, setEmail] = useState(params.get('email') ?? '');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const next = safeNext(params.get('next'), HOME_PATH);

  if (user) return <Navigate to={next} replace />;

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!isEmail(email) || !password) return;
    setBusy(true);
    setError(null);
    try {
      await login(email.trim(), password);
      navigate(next, { replace: true });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : '로그인하지 못했어요.');
      setPassword('');
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthLayout title="로그인" sub="가입한 이메일과 비밀번호를 입력해 주세요.">
      {error && <Alert>{error}</Alert>}
      <form onSubmit={submit} noValidate>
        <Field id="li-email" label="이메일" type="email" inputMode="email" autoComplete="email" placeholder="name@example.com"
          value={email} onChange={(e) => setEmail(e.target.value)} autoFocus={!email}
          invalid={email.length > 0 && !isEmail(email)} message={email.length > 0 && !isEmail(email) ? '이메일 형식을 확인해 주세요.' : null} messageKind="error" />
        <Field id="li-pw" label="비밀번호" type={show ? 'text' : 'password'} autoComplete="current-password" autoFocus={Boolean(email)}
          value={password} onChange={(e) => setPassword(e.target.value)}
          trailing={<PasswordToggle shown={show} onToggle={() => setShow((s) => !s)} />} />
        <PrimaryButton type="submit" className="mt-2" disabled={busy || !isEmail(email) || !password}>{busy ? '로그인 중' : '로그인'}</PrimaryButton>
      </form>
      <p className="mt-4 text-center text-sm text-ink-sub">
        처음이세요? <Link to="/signup" className="inline-flex min-h-tap items-center font-bold text-ink underline underline-offset-2">회원가입</Link>
      </p>
    </AuthLayout>
  );
}
