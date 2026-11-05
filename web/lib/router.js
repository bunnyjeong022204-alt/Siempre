// 프롬프트를 보고 요청 유형을 고르는 라우터.
// 기본은 규칙 기반이고, ROUTER_MODE=llm 이면 Claude Haiku로 분류합니다(실패하면 규칙 기반으로 돌아감).

import { RULES, hasKey, MODELS } from './config.js';

const IMAGE_WORDS = /(이미지|그림|사진|일러스트|썸네일|로고|포스터|배너|image|picture|illustration|logo|thumbnail)/i;
const IMAGE_VERBS = /(만들|그려|생성|뽑아|디자인|create|generate|draw|make)/i;
const HARD_WORDS = /(증명|알고리즘|디버그|버그|코드|코딩|프로그램|전략|설계|아키텍처|수학|최적화|분석해|비교 분석|proof|debug|algorithm|architecture|refactor)/i;
const BULK_WORDS = /(요약|번역|정리해|줄여|translate|summari[sz]e|tl;?dr)/i;
const LIGHT_WORDS = /^(고마워|감사|땡큐|안녕|좋아|좋다|ㅎㅎ|ㅋㅋ|오케이|ok|okay|thanks|thank you|hi|hello)/i;

export function classifyHeuristic(text) {
  const t = (text || '').trim();
  if (IMAGE_WORDS.test(t) && IMAGE_VERBS.test(t)) return 'image';
  if (BULK_WORDS.test(t) || t.length > 2000) return 'bulk';
  if (HARD_WORDS.test(t) || t.length > 600) return 'hard';
  if (LIGHT_WORDS.test(t) || t.length <= 12) return 'light';
  return 'write';
}

export async function classify(text) {
  if (process.env.ROUTER_MODE === 'llm' && hasKey('anthropic')) {
    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-api-key': process.env.ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: MODELS['claude-haiku'].id,
          max_tokens: 5,
          system: 'Classify the user request into exactly one label: light (greeting, thanks, tiny chat), write (writing, general questions), bulk (summarize, translate, long text), hard (reasoning, coding, analysis, strategy), image (create an image). Reply with the label only.',
          messages: [{ role: 'user', content: text.slice(0, 4000) }]
        })
      });
      if (res.ok) {
        const data = await res.json();
        const label = (data.content?.[0]?.text || '').trim().toLowerCase();
        if (RULES[label]) return label;
      }
    } catch {
      // 규칙 기반으로 돌아감
    }
  }
  return classifyHeuristic(text);
}
