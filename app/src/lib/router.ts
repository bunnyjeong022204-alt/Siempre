// 프롬프트를 요청 유형으로 분류한다.
// MVP는 규칙 기반이고, 나중에 백엔드에서 Mistral Small 4로 분류하도록 바꾼다(docs/routing.md).

import { ROUTING, UPGRADE } from '../config/routing';
import type { Cart, RequestType, RoutingRule } from '../types';

const VOICE = /(음성|목소리|내레이션|읽어\s*줘|낭독|TTS|voice|narrat)/i;
const IMAGE_NOUN = /(이미지|그림|사진|썸네일|포스터|일러스트|로고|배너|image|thumbnail|poster)/i;
const IMAGE_VERB = /(만들|그려|생성|뽑아|시안|create|generate|draw|make)/i;
const TRANSLATE = /(번역|영어로|일본어로|중국어로|요약|정리해|translate|summari[sz]e)/i;
const HARD = /(코드|코딩|버그|디버그|알고리즘|증명|전략|설계|분석해|비교 분석|debug|algorithm|refactor)/i;
const BULK = /(대량|100개|목록 전체|일괄|csv|엑셀)/i;
const LIGHT = /^(고마워|감사|ㅎㅎ|ㅋㅋ|좋아|좋다|오케이|안녕|ok|thanks|hi|hello)/i;
/** 무언가를 해 달라는 요청인지 (짧아도 가벼운 대화로 보지 않음) */
const REQUEST = /(줘|해|써|만들|알려|정리|바꿔|추천)/;

export function classify(text: string): RequestType {
  const t = text.trim();
  if (VOICE.test(t)) return 'voice';
  if (IMAGE_NOUN.test(t) && IMAGE_VERB.test(t)) return 'image';
  if (TRANSLATE.test(t)) return 'translate';
  if (BULK.test(t)) return 'bulk';
  if (HARD.test(t) || t.length > 600) return 'hard';
  if (LIGHT.test(t) || (t.length <= 10 && !REQUEST.test(t))) return 'light';
  return 'write';
}

export interface RouteDecision {
  rule: RoutingRule;
  /** 사용자가 이 유형에 필요한 AI를 담지 않았고, 대체 모델도 없을 때 true */
  missingProvider: boolean;
  /** 대체 모델로 보냈을 때 true */
  usedFallback: boolean;
  provider: RoutingRule['provider'];
  model: string;
}

export function route(text: string, cart: Cart, opts: { thorough?: boolean } = {}): RouteDecision {
  let type = classify(text);
  if (opts.thorough && UPGRADE[type]) type = UPGRADE[type]!;
  const rule = ROUTING[type];
  if (cart[rule.provider] > 0) {
    return { rule, missingProvider: false, usedFallback: false, provider: rule.provider, model: rule.model };
  }
  if (rule.fallback && cart[rule.fallback.provider] > 0) {
    return { rule, missingProvider: false, usedFallback: true, provider: rule.fallback.provider, model: rule.fallback.model };
  }
  return { rule, missingProvider: true, usedFallback: false, provider: rule.provider, model: rule.model };
}
