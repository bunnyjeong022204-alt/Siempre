import { PROVIDER_BY_ID } from '../../config/providers';
import type { ProviderId } from '../../types';

/** Figma "Model chip": 답변 아래 AI 이름 칩. 색은 config/providers.ts에서 가져온다. */
export function ModelChip({ provider, label }: { provider: ProviderId; label?: string }) {
  const p = PROVIDER_BY_ID[provider];
  return (
    <span
      className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold"
      style={{ backgroundColor: p.color.bg, color: p.color.ink }}
    >
      {label ?? p.name}
    </span>
  );
}

/** AI 첫 글자 아이콘 (로고 대신) */
export function ProviderIcon({ provider, size = 44 }: { provider: ProviderId; size?: number }) {
  const p = PROVIDER_BY_ID[provider];
  return (
    <span
      aria-hidden="true"
      className="inline-flex shrink-0 items-center justify-center rounded-xl font-bold"
      style={{ width: size, height: size, backgroundColor: p.color.bg, color: p.color.ink }}
    >
      {p.name[0]}
    </span>
  );
}
