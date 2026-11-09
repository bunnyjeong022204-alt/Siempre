import { useEffect, useRef, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { ApiError, SIGNUP_API_LIVE, signupApi } from '../../api/signup';
import { CODE_LENGTH, SOCIAL_PROVIDERS } from '../../config/signup';
import { SignupLayout } from '../../components/signup/SignupLayout';
import { Field, MiniButton, PrimaryButton, type MessageKind } from '../../components/signup/SignupControls';
import { formatPhone, formatTimer, isName, isPhone } from '../../lib/signup';
import { useSignup } from '../../state/SignupState';

type Msg = { text: string; kind: MessageKind } | null;

/** 2단계: 휴대폰 본인 인증. 이메일 복귀 판정에 쓰이므로 정보 입력보다 앞에 둔다. */
export function SignupVerifyPage() {
  const navigate = useNavigate();
  const { verified, setVerified, social, result } = useSignup();
  const [name, setName] = useState(verified?.name ?? '');
  const [phone, setPhone] = useState(verified?.phone ?? '');
  const [requestId, setRequestId] = useState<string | null>(null);
  const [demoCode, setDemoCode] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [left, setLeft] = useState(0);
  const [sending, setSending] = useState(false);
  const [checking, setChecking] = useState(false);
  const [phoneMsg, setPhoneMsg] = useState<Msg>(null);
  const [codeMsg, setCodeMsg] = useState<Msg>(verified ? { text: '본인 인증이 끝났어요.', kind: 'ok' } : null);
  const [ok, setOk] = useState(Boolean(verified));
  const codeRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (left <= 0) return;
    const t = setTimeout(() => setLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [left]);

  if (result) return <Navigate to="/signup/done" replace />;

  function edit(setter: (v: string) => void, v: string) {
    setter(v);
    if (ok) { setOk(false); setVerified(null); setCodeMsg(null); setRequestId(null); setCode(''); }
  }

  async function send() {
    setSending(true);
    setPhoneMsg(null);
    try {
      const r = await signupApi.sendCode(name.trim(), phone);
      setRequestId(r.requestId);
      setDemoCode(r.demoCode ?? null);
      setLeft(r.expiresIn);
      setCode('');
      setCodeMsg(null);
      setPhoneMsg({ text: '인증번호를 보냈어요.', kind: 'ok' });
      setTimeout(() => codeRef.current?.focus(), 0);
    } catch (e) {
      const retry = e instanceof ApiError && typeof e.extra.retryAfter === 'number' ? ` (${e.extra.retryAfter}초 후)` : '';
      setPhoneMsg({ text: (e instanceof ApiError ? e.message : '인증번호를 보내지 못했어요.') + retry, kind: 'error' });
    } finally {
      setSending(false);
    }
  }

  async function confirm() {
    if (!requestId) return;
    setChecking(true);
    try {
      const r = await signupApi.confirmCode(requestId, code);
      if (r.alreadyMember) {
        setCodeMsg({ text: '이미 가입한 휴대폰 번호예요. 기존 계정으로 로그인해 주세요.', kind: 'error' });
        return;
      }
      setOk(true);
      setLeft(0);
      setVerified({ name: name.trim(), phone, token: r.verificationToken });
      setCodeMsg({ text: '본인 인증이 끝났어요.', kind: 'ok' });
    } catch (e) {
      const leftTry = e instanceof ApiError && typeof e.extra.attemptsLeft === 'number' ? ` (남은 횟수 ${e.extra.attemptsLeft}번)` : '';
      setCodeMsg({ text: (e instanceof ApiError ? e.message : '인증하지 못했어요.') + leftTry, kind: 'error' });
    } finally {
      setChecking(false);
    }
  }

  const socialLabel = social ? SOCIAL_PROVIDERS.find((p) => p.id === social.provider)?.label : null;
  const expired = requestId && !ok && left <= 0;

  return (
    <SignupLayout step="verify" title="휴대폰 본인 인증" sub="한 사람이 계정을 여러 개 만들지 않도록 한 번만 확인해요.">
      {socialLabel && <p className="mb-5 rounded-xl bg-page px-4 py-3 text-sm">{socialLabel} 계정 정보를 받았어요. 본인 인증을 이어서 해 주세요.</p>}
      {!SIGNUP_API_LIVE && (
        <p className="mb-5 inline-block rounded-lg border border-dashed border-brand bg-page px-2.5 py-1 text-xs font-bold text-ink">
          시연용 화면 · 실제 문자는 보내지 않아요
        </p>
      )}
      <Field id="vf-name" label="이름" required autoComplete="name" placeholder="홍길동" maxLength={20}
        value={name} onChange={(e) => edit(setName, e.target.value)}
        invalid={name.length > 0 && !isName(name)} message={name.length > 0 && !isName(name) ? '이름은 한글·영문으로 입력해 주세요.' : null} messageKind="error" />
      <Field id="vf-phone" label="휴대폰 번호" required inputMode="numeric" autoComplete="tel" placeholder="010-0000-0000" maxLength={13}
        value={phone} onChange={(e) => edit(setPhone, formatPhone(e.target.value))}
        action={<MiniButton disabled={!isName(name) || !isPhone(phone) || sending || ok} onClick={send}>{sending ? '보내는 중' : requestId ? '다시 받기' : '인증번호 받기'}</MiniButton>}
        message={phoneMsg?.text} messageKind={phoneMsg?.kind} />
      {(requestId || ok) && (
        <Field ref={codeRef} id="vf-code" label={`인증번호 ${CODE_LENGTH}자리`} inputMode="numeric" autoComplete="one-time-code" placeholder="숫자 6자리"
          maxLength={CODE_LENGTH} value={ok ? '••••••' : code} readOnly={ok}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, CODE_LENGTH))}
          onKeyDown={(e) => { if (e.key === 'Enter' && code.length === CODE_LENGTH && !ok) void confirm(); }}
          trailing={!ok && left > 0 ? <span className="pr-3 text-[13px] font-bold tabular-nums text-danger" aria-label={`남은 시간 ${formatTimer(left)}`}>{formatTimer(left)}</span> : undefined}
          action={<MiniButton done={ok} disabled={ok || checking || code.length !== CODE_LENGTH || Boolean(expired)} onClick={confirm}>{ok ? '확인 완료' : checking ? '확인 중' : '확인'}</MiniButton>}
          extra={demoCode && !ok ? <p className="mt-1.5 text-[13px] text-ink-sub">시연용 인증번호: <b className="tracking-widest text-ink">{demoCode}</b></p> : null}
          message={expired ? '인증 시간이 지났어요. 인증번호를 다시 받아 주세요.' : codeMsg?.text}
          messageKind={expired ? 'error' : codeMsg?.kind} />
      )}
      <PrimaryButton className="mt-2" disabled={!ok} onClick={() => navigate('/signup/info')}>다음</PrimaryButton>
    </SignupLayout>
  );
}
