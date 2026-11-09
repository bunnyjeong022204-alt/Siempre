import { useState, type FormEvent, type KeyboardEvent } from 'react';
import { PROVIDER_BY_ID } from '../../config/providers';
import { credits } from '../../lib/format';
import { route } from '../../lib/router';
import { useAppState } from '../../state/AppState';

interface Props {
  disabled?: boolean;
  onSend: (text: string, thorough: boolean) => void;
}

/** 입력창: 보내기 전 예상 모델·크레딧 미리 보기 + "더 꼼꼼하게" 토글 */
export function Composer({ disabled, onSend }: Props) {
  const { cart } = useAppState();
  const [text, setText] = useState('');
  const [thorough, setThorough] = useState(false);
  const preview = text.trim() ? route(text, cart, { thorough }) : null;

  function submit(e?: FormEvent) {
    e?.preventDefault();
    const t = text.trim();
    if (!t || disabled) return;
    onSend(t, thorough);
    setText('');
  }
  function onKey(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); submit(); }
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-2.5 rounded-2xl border border-lavender bg-surface p-3 shadow-sm">
      <label htmlFor="prompt" className="text-xs text-ink-sub">무엇이든 적으면 알맞은 AI가 답해요 · Enter로 보내기</label>
      <textarea id="prompt" rows={2} value={text} onChange={(e) => setText(e.target.value)} onKeyDown={onKey}
        placeholder="예) 이 대본 차분한 남자 목소리로 읽어줘"
        className="resize-none bg-transparent text-[15px] leading-relaxed outline-none" />
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-lavender px-3 py-1.5 text-xs font-bold">
            {preview
              ? `예상: ${PROVIDER_BY_ID[preview.provider].name} · ${preview.rule.label} · ${credits(preview.rule.credits)}${preview.rule.unit ? ` / ${preview.rule.unit}` : ''}`
              : '자동 선택'}
          </span>
          <label className="flex min-h-tap cursor-pointer items-center gap-2 text-xs font-semibold text-ink-sub">
            <input type="checkbox" checked={thorough} onChange={(e) => setThorough(e.target.checked)} className="h-4 w-4 accent-brand" />
            더 꼼꼼하게
          </label>
        </div>
        <button type="submit" disabled={disabled || !text.trim()}
          className="min-h-tap rounded-xl bg-brand px-5 text-sm font-bold text-ink disabled:opacity-50">
          보내기
        </button>
      </div>
    </form>
  );
}
