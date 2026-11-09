// 백엔드 호출. VITE_API_BASE_URL이 비어 있으면 가짜 응답(데모)을 돌려준다.
// 실제 연결은 docs/tasks.md P1 "백엔드" 작업. 요청·응답 형식은 web/server.js의 /api/chat을 참고.

import type { Message } from '../types';
import type { RouteDecision } from '../lib/router';

const BASE = import.meta.env.VITE_API_BASE_URL as string | undefined;

export interface ChatResult {
  text: string;
  /** 음성 답변이면 오디오 URL, 이미지 답변이면 이미지 URL 목록 */
  audioUrl?: string;
  imageUrls?: string[];
}

export async function sendChat(history: Message[], decision: RouteDecision): Promise<ChatResult> {
  if (BASE) {
    const res = await fetch(`${BASE}/api/chat`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        messages: history.map((m) => ({ role: m.role, content: m.text })),
        type: decision.rule.type,
        model: decision.model,
      }),
    });
    if (!res.ok) throw new Error(`요청 실패 (${res.status})`);
    return res.json();
  }
  await new Promise((r) => setTimeout(r, 500));
  return demoReply(decision);
}

function demoReply(d: RouteDecision): ChatResult {
  switch (d.rule.type) {
    case 'voice': return { text: '[데모] 대본을 음성으로 만들었어요.' };
    case 'image': return { text: '[데모] 썸네일 시안 3장을 만들었어요.', imageUrls: [] };
    case 'light': return { text: '[데모] 언제든 편하게 말씀해 주세요.' };
    default: return { text: `[데모] ${d.model}가 답했어요. 백엔드를 연결하면 실제 답변이 나와요.` };
  }
}
