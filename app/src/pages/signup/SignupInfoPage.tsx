import { useEffect, useRef, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { ApiError, signupApi, type EmailCheck } from '../../api/signup';
import { PASSWORD_RULE_LABELS, RETURN_DAYS, SOCIAL_PROVIDERS } from '../../config/signup';
import { SignupLayout } from '../../components/signup/SignupLayout';
import { Field, MiniButton, PrimaryButton, type MessageKind } from '../../components/signup/SignupControls';
import { CheckIcon, EyeIcon } from '../../components/signup/icons';
import { confirmState, isEmail, isNickname, isPassword, passwordRules, type PasswordRule } from '../../lib/signup';
import { useSignup } from '../../state/SignupState';

/** 이메일 확인 상태: idle → invalid → checking → available | returning | rejoin_new | unavailable */
type EmailUi = { status: 'idle' | 'invalid' | 'checking' | EmailCheck['status']; checked: boolean; result: EmailCheck | null };
type NickUi = { status: 'idle' | 'invalid' | 'checking' | 'ok' | 'taken'; reason?: string };

const EMAIL_OK = ['available', 'returning', 'rejoin_new'];

function emailMessage(e: EmailUi): { text: string; kind: MessageKind } | null {
  if (e.status === 'invalid') return { text: '이메일 형식을 확인해 주세요.', kind: 'error' };
  if (!e.checked || !e.result) return null;
  const r = e.result;
  if (r.status === 'available') return { text: '사용할 수 있는 이메일이에요.', kind: 'ok' };
  if (r.status === 'returning') return { text: `탈퇴한 이메일이에요. 탈퇴 후 ${RETURN_DAYS}일이 지나지 않아 기존 회원으로 복귀해요. (${r.daysLeft}일 남음)`, kind: 'ok' };
  if (r.status === 'rejoin_new') return { text: r.reason === 'expired' ? `탈퇴한 이메일이에요. ${RETURN_DAYS}일이 지나 신규 회원으로 가입해요.` : '탈퇴한 이메일이에요. 신규 회원으로 가입해요.', kind: 'ok' };
  return { text: '현재 이 이메일로 가입할 수 없어요. 다른 이메일을 사용해 주세요.', kind: 'error' };
}

/** 3단계: 계정 정보. 간편가입이면 비밀번호 칸을 숨기고 받은 값을 채운다. */
export function SignupInfoPage() {
  const navigate = useNavigate();
  const { verified, social, account, setAccount, result } = useSignup();
  const [email, setEmail] = useState(account?.email ?? social?.email ?? '');
  const [emailUi, setEmailUi] = useState<EmailUi>(account ? { status: account.emailCheck.status, checked: true, result: account.emailCheck } : { status: 'idle', checked: false, result: null });
  const [pw, setPw] = useState(account?.password ?? '');
  const [pw2, setPw2] = useState(account?.password ?? '');
  const [pw2Left, setPw2Left] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [nick, setNick] = useState(account?.nickname ?? social?.nickname ?? '');
  const [nickUi, setNickUi] = useState<NickUi>(account ? { status: 'ok' } : { status: 'idle' });
  const emailToken = useRef(0);
  const nickToken = useRef(0);
  const autoChecked = useRef(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const token = verified?.token ?? '';

  // 간편가입으로 받은 이메일·닉네임은 확인을 자동으로 한 번 돌린다
  useEffect(() => {
    if (!verified || !social || account || autoChecked.current) return;
    autoChecked.current = true;
    if (social.email && isEmail(social.email)) void checkEmail(social.email);
    if (social.nickname && isNickname(social.nickname)) void checkNick(social.nickname);
  }, []);

  if (result) return <Navigate to="/signup/done" replace />;
  if (!verified) return <Navigate to="/signup/verify" replace />;

  function onEmail(v: string) {
    setEmail(v);
    emailToken.current++; // 값이 바뀌면 진행 중인 응답과 확인 완료를 무효화
    setEmailUi((prev) => ({ status: v && !isEmail(v) ? 'invalid' : 'idle', checked: false, result: prev.result }));
  }

  async function checkEmail(value = email) {
    const t = ++emailToken.current;
    setEmailUi((p) => ({ ...p, status: 'checking', checked: false }));
    try {
      const r = await signupApi.checkEmail(value.trim().toLowerCase(), token);
      if (t !== emailToken.current) return; // 오래된 응답은 버린다
      setEmailUi({ status: r.status, checked: true, result: r });
    } catch (e) {
      if (t !== emailToken.current) return;
      if (e instanceof ApiError && e.code === 'VERIFICATION_REQUIRED') return navigate('/signup/verify');
      setEmailUi({ status: 'idle', checked: false, result: null });
      alertMsg(e);
    }
  }

  function onNick(v: string) {
    // 한글 조합 중 값을 바꾸면 입력이 깨지므로 정리하지 않고 검사만 한다
    setNick(v);
    nickToken.current++;
    setNickUi({ status: v && !isNickname(v) ? 'invalid' : 'idle' });
  }

  async function checkNick(value = nick) {
    const t = ++nickToken.current;
    setNickUi({ status: 'checking' });
    try {
      const r = await signupApi.checkNickname(value.trim());
      if (t !== nickToken.current) return;
      setNickUi(r.available ? { status: 'ok' } : { status: 'taken', reason: r.reason });
    } catch (e) {
      if (t !== nickToken.current) return;
      setNickUi({ status: 'idle' });
      alertMsg(e);
    }
  }

  function alertMsg(e: unknown) {
    setApiError(e instanceof ApiError ? e.message : '요청을 처리하지 못했어요.');
  }

  const rules = passwordRules(pw);
  const c2 = confirmState(pw, pw2, pw2Left);
  const emailOk = emailUi.checked && EMAIL_OK.includes(emailUi.status);
  const pwOk = social ? true : isPassword(pw) && pw === pw2;
  const complete = emailOk && pwOk && nickUi.status === 'ok';
  const em = emailMessage(emailUi);
  const socialLabel = social ? SOCIAL_PROVIDERS.find((p) => p.id === social.provider)?.label : null;

  const emailBtnLabel = emailUi.status === 'checking' ? '확인 중' : emailUi.status === 'unavailable' && emailUi.checked ? '다시 입력' : emailUi.checked ? '확인 완료' : emailUi.result ? '다시 확인' : '이메일 확인';

  function next() {
    if (!complete || !emailUi.result) return;
    setAccount({ email: email.trim().toLowerCase(), emailCheck: emailUi.result, nickname: nick.trim(), password: social ? '' : pw });
    navigate('/signup/consent');
  }

  return (
    <SignupLayout step="info" title="계정 정보" sub="로그인에 쓸 이메일과 대화에서 보일 닉네임을 정해 주세요.">
      {socialLabel && (
        <p className="mb-5 rounded-xl bg-page px-4 py-3 text-sm">{socialLabel} 계정으로 가입해요. 비밀번호는 만들지 않아요.</p>
      )}
      {apiError && <p role="alert" className="mb-5 rounded-xl bg-danger-soft px-4 py-3 text-sm font-medium text-danger">{apiError}</p>}

      <Field id="in-email" label="이메일" required type="email" inputMode="email" autoComplete="email" placeholder="name@example.com"
        value={email} onChange={(e) => onEmail(e.target.value)}
        onPaste={(e) => { e.preventDefault(); onEmail(e.clipboardData.getData('text').trim()); }}
        invalid={emailUi.status === 'invalid' || (emailUi.checked && emailUi.status === 'unavailable')}
        action={
          <MiniButton
            done={emailOk}
            disabled={emailUi.status === 'checking' || (!(emailUi.checked && emailUi.status === 'unavailable') && (!isEmail(email) || emailUi.checked))}
            onClick={() => { if (emailUi.checked && emailUi.status === 'unavailable') { onEmail(''); document.getElementById('in-email')?.focus(); } else void checkEmail(); }}
          >
            {emailBtnLabel}
          </MiniButton>
        }
        message={em?.text} messageKind={em?.kind} />

      {!social && (
        <>
          <Field id="in-pw" label="비밀번호" required type={showPw ? 'text' : 'password'} autoComplete="new-password" placeholder="8자 이상"
            value={pw} onChange={(e) => setPw(e.target.value)} maxLength={40}
            trailing={<button type="button" onClick={() => setShowPw((s) => !s)} aria-label={showPw ? '비밀번호 숨기기' : '비밀번호 보기'} className="inline-flex h-11 w-11 items-center justify-center text-ink-sub"><EyeIcon off={showPw} /></button>}
            extra={
              <ul aria-label="비밀번호 규칙" className="mt-2 flex flex-wrap gap-x-3.5 gap-y-1 text-[13px]">
                {(Object.keys(PASSWORD_RULE_LABELS) as PasswordRule[]).map((k) => (
                  <li key={k} className={`inline-flex items-center gap-1 ${rules[k] ? 'font-medium text-success' : 'text-ink-sub'}`}>
                    {rules[k] ? <CheckIcon size={12} /> : <span aria-hidden="true" className="inline-block h-2.5 w-2.5 rounded-full border-[1.5px] border-current" />}
                    {PASSWORD_RULE_LABELS[k]}
                    <span className="sr-only">{rules[k] ? '충족' : '미충족'}</span>
                  </li>
                ))}
              </ul>
            } />
          <Field id="in-pw2" label="비밀번호 확인" required type={showPw ? 'text' : 'password'} autoComplete="new-password"
            value={pw2} onChange={(e) => { setPw2(e.target.value); if (e.target.value.length > pw.length) setPw2Left(true); }}
            onBlur={() => setPw2Left(true)} onFocus={() => setPw2Left(false)} maxLength={40}
            invalid={c2 === 'mismatch'}
            message={c2 === 'match' ? '비밀번호가 일치해요.' : c2 === 'mismatch' ? '비밀번호가 일치하지 않아요.' : null}
            messageKind={c2 === 'match' ? 'ok' : 'error'} />
        </>
      )}

      <Field id="in-nick" label="닉네임" required autoComplete="nickname" placeholder="한글·영문·숫자 2~10자" maxLength={20}
        value={nick} onChange={(e) => onNick(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter' && !e.nativeEvent.isComposing && isNickname(nick) && nickUi.status !== 'ok') void checkNick(); }}
        invalid={nickUi.status === 'invalid' || nickUi.status === 'taken'}
        action={<MiniButton done={nickUi.status === 'ok'} disabled={nickUi.status === 'ok' || nickUi.status === 'checking' || !isNickname(nick)} onClick={() => checkNick()}>
          {nickUi.status === 'ok' ? '확인 완료' : nickUi.status === 'checking' ? '확인 중' : '중복 확인'}
        </MiniButton>}
        message={nickUi.status === 'ok' ? '사용할 수 있는 닉네임이에요.' : nickUi.status === 'invalid' ? '한글·영문·숫자 2~10자로 입력해 주세요.' : nickUi.status === 'taken' ? (nickUi.reason === 'reserved' ? '쓸 수 없는 닉네임이에요.' : '이미 쓰고 있는 닉네임이에요.') : null}
        messageKind={nickUi.status === 'ok' ? 'ok' : 'error'} />

      <PrimaryButton className="mt-2" disabled={!complete} onClick={next}>다음</PrimaryButton>
    </SignupLayout>
  );
}
