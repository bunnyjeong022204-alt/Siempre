import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ApiError, demoSocialTicket, signupApi } from '../../api/signup';
import { SOCIAL_ERRORS, SOCIAL_PROVIDERS, type SocialProvider } from '../../config/signup';
import { SignupLayout } from '../../components/signup/SignupLayout';
import { PrimaryButton } from '../../components/signup/SignupControls';
import { SocialLogo } from '../../components/signup/SocialIcons';
import { MailIcon } from '../../components/signup/icons';
import { useSignup } from '../../state/SignupState';

/** 1단계: 가입 방식 선택. 간편가입에서 돌아오면 #social=티켓을 읽어 다음 단계로 보낸다. */
export function SignupEntryPage() {
  const navigate = useNavigate();
  const { setSocial, social } = useSignup();
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState<SocialProvider | null>(null);

  useEffect(() => {
    const hash = new URLSearchParams(window.location.hash.slice(1));
    const ticket = hash.get('social');
    const err = hash.get('social_error');
    if (!ticket && !err) return;
    // 티켓은 읽자마자 주소창에서 지운다
    window.history.replaceState(window.history.state, '', window.location.pathname);
    if (err) {
      setNotice(SOCIAL_ERRORS[err] ?? SOCIAL_ERRORS.provider);
      return;
    }
    if (ticket) void readSocialTicket(ticket);
  }, []);

  async function readSocialTicket(ticket: string) {
    try {
      const profile = await signupApi.readTicket(ticket);
      setSocial({ ...profile, ticket });
      navigate('/signup/verify');
    } catch (e) {
      setNotice(e instanceof ApiError ? e.message : SOCIAL_ERRORS.provider);
    }
  }

  function startSocial(provider: SocialProvider) {
    setBusy(provider);
    const url = signupApi.socialStartUrl(provider);
    if (url) window.location.assign(url);
    else void readSocialTicket(demoSocialTicket(provider)).finally(() => setBusy(null));
  }

  function startEmail() {
    if (social) setSocial(null); // 간편가입 중 돌아와 일반 가입을 고르면 간편가입 모드 해제
    navigate('/signup/verify');
  }

  return (
    <SignupLayout step="entry" title="Siempre 시작하기" sub="가입 방식을 골라 주세요. 1분이면 끝나요.">
      {notice && (
        <p role="alert" className="mb-5 rounded-xl bg-danger-soft px-4 py-3 text-sm font-medium text-danger">{notice}</p>
      )}
      <div className="rounded-2xl border-[1.5px] border-brand bg-brand-soft px-[18px] py-3.5">
        <div className="flex items-center gap-3.5">
          <span aria-hidden="true" className="inline-flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-xl bg-surface"><MailIcon /></span>
          <span className="min-w-0">
            <b className="block text-base">이메일로 가입</b>
            <span className="block text-[13px] text-ink-sub">이메일과 비밀번호로 로그인해요</span>
          </span>
        </div>
      </div>
      <div className="mt-6">
        <PrimaryButton onClick={startEmail}>이메일로 계속하기</PrimaryButton>
        <p className="mt-2.5 text-center text-[13px] text-ink-sub">가입 후 첫 구독 구성 전까지는 요금이 나가지 않아요.</p>
      </div>

      <div className="mb-4 mt-8 flex items-center gap-3 text-[13px] text-ink-sub before:h-px before:flex-1 before:bg-lavender after:h-px after:flex-1 after:bg-lavender">
        간편가입
      </div>
      <div className="flex justify-center gap-7">
        {SOCIAL_PROVIDERS.map((p) => (
          <button
            key={p.id}
            type="button"
            disabled={busy !== null}
            onClick={() => startSocial(p.id)}
            aria-label={`${p.label} 계정으로 가입하기`}
            className="group flex min-w-tap flex-col items-center gap-1.5 text-[13px] text-ink-sub disabled:opacity-60"
          >
            <SocialLogo provider={p.id} />
            <span aria-hidden="true">{busy === p.id ? '연결 중' : p.label}</span>
          </button>
        ))}
      </div>
    </SignupLayout>
  );
}
