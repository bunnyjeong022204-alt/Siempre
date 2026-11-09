// 시연용 가짜 데이터. 유튜버 시나리오(대본 → 다듬기 → 가벼운 대화) 기준.

import type { Message, ProviderId, RequestType } from '../types';

export const SAMPLE_MESSAGES: Message[] = [
  { id: 'u1', role: 'user', text: '월급 300만 원으로 1년에 1,000만 원 모으는 법, 8분 유튜브 대본 써줘. 도입 30초가 제일 중요해' },
  {
    id: 'a1', role: 'assistant',
    text: '[도입 0:00~0:30]\n"월급 300만 원, 1년에 1,000만 원. 불가능해 보이죠? 오늘은 통장을 세 개로 나누는 것만으로 이걸 해낸 방법을 알려드릴게요."',
    meta: { type: 'write', provider: 'claude', model: 'Claude Sonnet 5.5', reason: '글쓰기 요청이라 자동 선택', credits: 5 },
  },
  { id: 'u2', role: 'user', text: '도입부 영어로 번역해줘' },
  {
    id: 'a2', role: 'assistant',
    text: '"₩3 million a month, ₩10 million saved in a year. Sounds impossible? Today I\'ll show you how splitting your money into three accounts made it happen."',
    meta: { type: 'translate', provider: 'qwen', model: 'Qwen3.7-Plus', reason: '번역·요약 요청이라 자동 선택', credits: 1 },
  },
  { id: 'u3', role: 'user', text: '좋다 고마워!' },
  {
    id: 'a3', role: 'assistant',
    text: '마음에 드셨다니 다행이에요. 내레이션 음성이나 썸네일이 필요하면 말씀해 주세요.',
    meta: { type: 'light', provider: 'mistral', model: 'Mistral Small 4', reason: '가벼운 대화', credits: 0 },
  },
];

export interface HistoryRow {
  at: string;
  provider: ProviderId | null;
  type: RequestType | 'grant';
  task: string;
  credits: number;
}

export const SAMPLE_HISTORY: HistoryRow[] = [
  { at: '오늘 13:42', provider: 'qwen', type: 'translate', task: '도입부 영어 번역', credits: -1 },
  { at: '오늘 13:41', provider: 'mistral', type: 'light', task: '가벼운 대화', credits: 0 },
  { at: '오늘 13:40', provider: 'claude', type: 'write', task: '8분 유튜브 대본 작성', credits: -5 },
  { at: '월 09:00', provider: null, type: 'grant', task: '주간 크레딧 지급', credits: 658 },
];
