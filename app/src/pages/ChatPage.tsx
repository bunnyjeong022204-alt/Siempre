import { useState } from 'react';
import { sendChat } from '../api/client';
import { Composer } from '../components/chat/Composer';
import { ReplyMeta } from '../components/chat/ReplyMeta';
import { PROVIDER_BY_ID } from '../config/providers';
import { SAMPLE_MESSAGES } from '../data/mock';
import { route } from '../lib/router';
import { useAppState } from '../state/AppState';
import type { Message } from '../types';

export function ChatPage() {
  const { cart, balance, subscribed, spend } = useAppState();
  const [messages, setMessages] = useState<Message[]>(SAMPLE_MESSAGES);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSend(text: string, thorough: boolean) {
    setNotice(null);
    const decision = route(text, cart, { thorough });
    const user: Message = { id: crypto.randomUUID(), role: 'user', text };

    if (decision.missingProvider) {
      // TODO(docs/tasks.md): MissingProviderCard로 바꾸기 — [이번만 크레딧으로 쓰기] / [구독에 담기]
      setMessages((m) => [...m, user]);
      setNotice(`이 요청은 ${PROVIDER_BY_ID[decision.provider].name}가 필요해요. 구독 구성에서 담을 수 있어요.`);
      return;
    }
    const cost = decision.rule.credits;
    if (subscribed && cost > balance) {
      setNotice('이번 주 크레딧이 부족해요. 추가 충전하거나 구성을 바꿔 주세요.');
      return;
    }

    const history = [...messages, user];
    setMessages(history);
    setBusy(true);
    try {
      const res = await sendChat(history, decision);
      // TODO(docs/tasks.md): res.audioUrl → VoiceReply, res.imageUrls → ImageReply 카드로 보여 주기
      const reply: Message = {
        id: crypto.randomUUID(), role: 'assistant', text: res.text,
        meta: {
          type: decision.rule.type, provider: decision.provider, model: decision.model,
          reason: decision.usedFallback ? `${decision.model}로 대체` : decision.rule.reason,
          credits: cost,
        },
      };
      setMessages((m) => [...m, reply]);
      if (subscribed) spend(cost);
    } catch (e) {
      setNotice(e instanceof Error ? e.message : '답변을 받지 못했어요.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-[calc(100vh-65px)] max-w-3xl flex-col px-5">
      {!subscribed && (
        <p className="mt-4 rounded-xl bg-brand-soft px-4 py-3 text-sm">데모 모드예요. 구독 구성에서 결제하면 크레딧이 차감돼요.</p>
      )}
      <section aria-live="polite" className="flex flex-1 flex-col gap-6 py-7">
        {messages.map((m) =>
          m.role === 'user' ? (
            <p key={m.id} className="max-w-[80%] self-end whitespace-pre-wrap rounded-2xl rounded-br-md bg-ink px-4 py-3 text-[15px] leading-relaxed text-surface">{m.text}</p>
          ) : (
            <div key={m.id} className="flex flex-col gap-2.5">
              <p className="whitespace-pre-wrap rounded-2xl border border-lavender bg-surface px-[18px] py-4 text-[15px] leading-relaxed">{m.text}</p>
              {m.meta && <ReplyMeta meta={m.meta} onRegenerate={() => setNotice('다른 모델로 다시 받기는 아직 준비 중이에요.')} />}
            </div>
          ),
        )}
        {busy && <p className="text-sm text-ink-sub">알맞은 AI를 고르고 답을 받는 중…</p>}
        {notice && <p role="status" className="self-center rounded-xl bg-lavender px-4 py-2.5 text-[13px]">{notice}</p>}
      </section>
      <div className="sticky bottom-0 bg-surface pb-6 pt-3">
        <Composer disabled={busy} onSend={handleSend} />
      </div>
    </main>
  );
}
