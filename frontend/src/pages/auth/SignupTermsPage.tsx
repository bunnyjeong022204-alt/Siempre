import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { ApiError, authApi } from '../../api/auth';
import { MARKETING_LABEL, REQUIRED_TERMS, type RequiredTermKey } from '../../config/auth';
import { AuthLayout } from '../../components/auth/AuthLayout';
import { Alert, Checkbox, PrimaryButton } from '../../components/auth/Controls';
import { ChevronIcon } from '../../components/auth/icons';
import { firebaseCode, firebaseErrorMessage } from '../../lib/firebase';
import { useAuth, useSignup } from '../../state/AuthState';

const NONE = Object.fromEntries(REQUIRED_TERMS.map((t) => [t.key, false])) as Record<RequiredTermKey, boolean>;

/** 2단계: 약관 동의 → 가입 → 바로 로그인 */
export function SignupTermsPage() {
  const navigate = useNavigate();
  const { createAccount, refresh, firebaseReady } = useAuth();
  const { draft, setDraft, setDone } = useSignup();
  const [req, setReq] = useState(NONE);
  const [marketing, setMarketing] = useState(false);
  const [open, setOpen] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<{ text: string; back?: boolean } | null>(null);

  if (!draft) return <Navigate to="/signup" replace />;

  const left = REQUIRED_TERMS.filter((t) => !req[t.key]).length;
  const every = left === 0 && marketing;
  const setAll = (on: boolean) => { setReq(Object.fromEntries(REQUIRED_TERMS.map((t) => [t.key, on])) as typeof req); setMarketing(on); };

  async function submit() {
    if (!draft || left > 0) return;
    setBusy(true);
    setError(null);
    // 1) Firebase 계정 만들기 (이어서 가입이면 이미 로그인된 계정을 쓴다) → 2) Siempre 회원 정보 만들기
    let created: Awaited<ReturnType<typeof createAccount>> | null = null;
    try {
      if (draft.emailStatus !== 'resume') created = await createAccount(draft.email, draft.password);
    } catch (e) {
      const f = firebaseErrorMessage(firebaseCode(e));
      setError({ text: f.message, back: f.kind === 'exists' || firebaseCode(e) === 'auth/weak-password' });
      setBusy(false);
      return;
    }
    try {
      await authApi.signup({ nickname: draft.nickname, agreeTerms: true, marketing });
      await refresh();
      setDone({ email: draft.email, nickname: draft.nickname, marketing });
      setDraft(null); // 비밀번호를 메모리에서도 지운다
      navigate('/signup/done', { replace: true });
    } catch (e) {
      // 방금 만든 Firebase 계정은 지워서, 닉네임을 고친 뒤 같은 이메일로 다시 가입할 수 있게 한다
      if (created) await created.delete().catch(() => {});
      if (!(e instanceof ApiError)) setError({ text: '가입하지 못했어요. 잠시 후 다시 시도해 주세요.' });
      else if (['exists', 'nickname_taken', 'invalid_email', 'invalid_nickname'].includes(e.code)) setError({ text: e.message, back: true });
      else setError({ text: e.message });
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthLayout step="terms" title="약관 동의" sub="필수 항목에 동의하면 가입이 끝나요." back>
      <div className={`mb-4 rounded-2xl border-[1.5px] border-brand px-[18px] ${every ? 'bg-brand-soft' : 'bg-surface'}`}>
        <Checkbox checked={every} onChange={setAll} className="min-h-[60px] text-base font-black"
          label={<>전체 동의 <span className="text-[13px] font-medium text-ink-sub">(선택 포함)</span></>} />
      </div>

      <ul className="flex flex-col gap-2">
        {REQUIRED_TERMS.map((t) => (
          <li key={t.key} className={`overflow-hidden rounded-2xl border-[1.5px] border-lavender border-l-4 border-l-brand ${req[t.key] ? 'bg-page' : 'bg-surface'}`}>
            <div className="flex items-center gap-2 pl-3.5 pr-1">
              <Checkbox checked={req[t.key]} onChange={(v) => setReq({ ...req, [t.key]: v })} className="flex-1 text-sm"
                label={<><span className="rounded-md bg-brand-soft px-2 py-px text-[11px] font-black">필수</span>{t.label}</>} />
              {'detail' in t && (
                <button type="button" onClick={() => setOpen(open === t.key ? null : t.key)} aria-expanded={open === t.key} aria-controls={`term-${t.key}`}
                  className="inline-flex min-h-tap min-w-tap items-center justify-center gap-0.5 text-[13px] text-ink-sub">
                  {open === t.key ? '접기' : '보기'}<ChevronIcon open={open === t.key} />
                </button>
              )}
            </div>
            {'detail' in t && open === t.key && <p id={`term-${t.key}`} className="px-4 pb-3.5 pl-[50px] text-[13px] leading-relaxed text-ink-sub">{t.detail}</p>}
          </li>
        ))}
        <li className="rounded-2xl border-[1.5px] border-lavender bg-page/60 pl-3.5 pr-3">
          <Checkbox checked={marketing} onChange={setMarketing} className="text-sm"
            label={<><span className="rounded-md bg-lavender px-2 py-px text-[11px] font-black text-ink-sub">선택</span>{MARKETING_LABEL}</>} />
        </li>
      </ul>

      <p aria-live="polite" className="mt-3 min-h-[1.5rem] text-center text-[13px] font-bold">{left > 0 ? `필수 동의 ${left}개 남았어요` : ''}</p>
      {error && (
        <Alert>
          {error.text}
          {error.back && <button type="button" onClick={() => navigate('/signup')} className="ml-2 min-h-tap font-bold underline">고치러 가기</button>}
        </Alert>
      )}
      <PrimaryButton disabled={busy || left > 0 || !firebaseReady} onClick={submit}>{busy ? '가입 처리 중' : '동의하고 가입하기'}</PrimaryButton>
    </AuthLayout>
  );
}
