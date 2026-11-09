import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { ApiError, signupApi } from '../../api/signup';
import { MARKETING_CHANNELS, MARKETING_LABEL, REQUIRED_TERMS } from '../../config/signup';
import { SignupLayout } from '../../components/signup/SignupLayout';
import { Checkbox, PrimaryButton } from '../../components/signup/SignupControls';
import { ChevronIcon } from '../../components/signup/icons';
import { allAgreed, marketingOn, requiredLeft, setAll, type Consents } from '../../lib/signup';
import { useSignup } from '../../state/SignupState';

/** 4단계: 약관 동의 → 가입. 가입 후 "동의 내용 수정"으로 돌아오면 변경 내용만 저장한다. */
export function SignupConsentPage() {
  const navigate = useNavigate();
  const { verified, account, social, consents, setConsents, result, setResult } = useSignup();
  const [c, setC] = useState<Consents>(result?.consents ?? consents);
  const [open, setOpen] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<{ text: string; back?: string } | null>(null);
  const [saved, setSaved] = useState(false);

  if (!result && (!verified || !account)) return <Navigate to={verified ? '/signup/info' : '/signup/verify'} replace />;

  const update = (next: Consents) => { setC(next); setSaved(false); };
  const left = requiredLeft(c);
  const every = allAgreed(c);

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      if (result) {
        const r = await signupApi.updateConsents(result.consentToken, c);
        setResult({ ...result, consents: r.consents });
        setSaved(true);
        navigate('/signup/done');
        return;
      }
      if (!verified || !account) return;
      const r = await signupApi.signup({
        verificationToken: verified.token,
        email: account.email,
        nickname: account.nickname,
        consents: c,
        ...(social ? { socialTicket: social.ticket } : { password: account.password }),
      });
      setConsents(c);
      setResult(r);
      navigate('/signup/done', { replace: true });
    } catch (e) {
      if (!(e instanceof ApiError)) setError({ text: '가입하지 못했어요. 잠시 후 다시 시도해 주세요.' });
      else if (['EMAIL_UNAVAILABLE', 'NICKNAME_UNAVAILABLE', 'DUPLICATE'].includes(e.code)) setError({ text: e.message, back: '/signup/info' });
      else if (['VERIFICATION_REQUIRED', 'PHONE_IN_USE'].includes(e.code)) setError({ text: e.message, back: '/signup/verify' });
      else if (e.code === 'TICKET_INVALID') setError({ text: e.message, back: '/signup' });
      else setError({ text: e.message });
    } finally {
      setBusy(false); // 가입이 끝나도 잠금을 풀어야 "동의 내용 수정"을 저장할 수 있다
    }
  }

  const label = busy ? (result ? '저장 중' : '가입 처리 중') : result ? '변경 내용 저장' : '동의하고 가입하기';

  return (
    <SignupLayout step="consent" title={result ? '동의 내용 수정' : '약관 동의'} sub={result ? '선택 항목은 언제든 바꿀 수 있어요.' : '필수 항목에 동의하면 가입이 끝나요.'}>
      <div className={`mb-4 rounded-2xl border-[1.5px] border-brand px-[18px] ${every ? 'bg-brand-soft' : 'bg-surface'}`}>
        <Checkbox checked={every} onChange={(v) => update(setAll(v))} className="min-h-[60px] text-base font-black"
          label={<>전체 동의 <span className="text-[13px] font-medium text-ink-sub">(선택 포함)</span></>} />
      </div>

      <ul className="flex flex-col gap-2">
        {REQUIRED_TERMS.map((t) => (
          <li key={t.key} className={`overflow-hidden rounded-2xl border-[1.5px] border-lavender border-l-4 border-l-brand ${c[t.key] ? 'bg-page' : 'bg-surface'}`}>
            <div className="flex items-center gap-2 pl-3.5 pr-1">
              <Checkbox checked={c[t.key]} onChange={(v) => update({ ...c, [t.key]: v })} className="flex-1 text-sm"
                disabled={Boolean(result)}
                label={<><span className="rounded-md bg-brand-soft px-2 py-px text-[11px] font-black">필수</span>{t.label}</>} />
              {t.detail && (
                <button type="button" onClick={() => setOpen(open === t.key ? null : t.key)} aria-expanded={open === t.key} aria-controls={`term-${t.key}`}
                  className="inline-flex min-h-tap min-w-tap items-center justify-center gap-0.5 text-[13px] text-ink-sub">
                  {open === t.key ? '접기' : '보기'}<ChevronIcon open={open === t.key} />
                </button>
              )}
            </div>
            {t.detail && open === t.key && <p id={`term-${t.key}`} className="px-4 pb-3.5 pl-[50px] text-[13px] leading-relaxed text-ink-sub">{t.detail}</p>}
          </li>
        ))}
        <li className="rounded-2xl border-[1.5px] border-lavender bg-page/60 pb-2">
          <div className="pl-3.5 pr-3">
            <Checkbox checked={marketingOn(c)} onChange={(v) => update({ ...c, ...Object.fromEntries(MARKETING_CHANNELS.map((m) => [m.key, v])) })} className="text-sm"
              label={<><span className="rounded-md bg-lavender px-2 py-px text-[11px] font-black text-ink-sub">선택</span>{MARKETING_LABEL}</>} />
          </div>
          <div role="group" aria-label="소식 받을 방법" className="flex flex-wrap gap-x-5 pl-[46px]">
            {MARKETING_CHANNELS.map((m) => (
              <Checkbox key={m.key} checked={c[m.key]} onChange={(v) => update({ ...c, [m.key]: v })} className="text-[13px]" label={m.label} />
            ))}
          </div>
        </li>
      </ul>

      <p aria-live="polite" className="mt-3 min-h-[1.5rem] text-center text-[13px] font-bold text-ink">
        {left > 0 ? `필수 동의 ${left}개 남았어요` : saved ? '저장했어요.' : ''}
      </p>
      {error && (
        <p role="alert" className="mb-3 rounded-xl bg-danger-soft px-4 py-3 text-sm font-medium text-danger">
          {error.text}
          {error.back && <button type="button" onClick={() => navigate(error.back!)} className="ml-2 min-h-tap font-bold underline">고치러 가기</button>}
        </p>
      )}
      <PrimaryButton disabled={busy || left > 0} onClick={submit}>{label}</PrimaryButton>
    </SignupLayout>
  );
}
