import { credits } from '../../lib/format';
import type { Message } from '../../types';
import { ModelChip } from '../ui/ModelChip';

/** 답변 아래 줄: 모델 칩 + 고른 이유 + 차감 크레딧 + 다른 모델로 다시 받기 */
export function ReplyMeta({ meta, onRegenerate }: { meta: NonNullable<Message['meta']>; onRegenerate?: () => void }) {
  return (
    <div className="flex flex-wrap items-center gap-2 text-xs text-ink-sub">
      <ModelChip provider={meta.provider} label={meta.model} />
      <span>{meta.reason} · {credits(meta.credits)}</span>
      {onRegenerate && meta.type !== 'light' && (
        // TODO(docs/tasks.md): RegenerateSheet로 바꾸기. 다른 모델 목록 + "첫 답 크레딧은 돌려드려요" 안내
        <button type="button" onClick={onRegenerate}
          className="min-h-[32px] rounded-lg border border-lavender bg-surface px-3 font-bold text-ink">
          다른 모델로 다시 받기
        </button>
      )}
    </div>
  );
}
