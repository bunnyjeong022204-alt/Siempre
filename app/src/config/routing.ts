// 요청 유형별 모델과 차감 크레딧. 근거는 docs/routing.md

import type { RequestType, RoutingRule } from '../types';

export const ROUTING: Record<RequestType, RoutingRule> = {
  light: {
    type: 'light', label: '가벼운 대화', reason: '가벼운 대화',
    provider: 'mistral', model: 'Mistral Small 4',
    fallback: { provider: 'qwen', model: 'Qwen3.7-Plus' }, credits: 0,
  },
  translate: {
    type: 'translate', label: '요약·번역', reason: '번역·요약 요청이라 자동 선택',
    provider: 'qwen', model: 'Qwen3.7-Plus',
    fallback: { provider: 'mistral', model: 'Mistral Small 4' }, credits: 1,
  },
  bulk: {
    type: 'bulk', label: '가성비 고난도', reason: '대량 처리 요청이라 자동 선택',
    provider: 'mistral', model: 'Mistral Large 3',
    fallback: { provider: 'qwen', model: 'Qwen3.7-Max' }, credits: 2,
  },
  write: {
    type: 'write', label: '글쓰기', reason: '글쓰기 요청이라 자동 선택',
    provider: 'claude', model: 'Claude Sonnet 5.5',
    fallback: { provider: 'qwen', model: 'Qwen3.7-Plus' }, credits: 5,
  },
  hard: {
    type: 'hard', label: '고난도 추론', reason: '고난도 요청이라 자동 선택',
    provider: 'claude', model: 'Claude Opus 5.5',
    fallback: { provider: 'qwen', model: 'Qwen3.7-Max' }, credits: 19,
  },
  voice: {
    type: 'voice', label: '음성 생성', reason: '음성 요청이라 자동 선택',
    provider: 'elevenlabs', model: 'ElevenLabs Multilingual', credits: 30, unit: '1,000자',
  },
  image: {
    type: 'image', label: '이미지 생성', reason: '이미지 요청이라 자동 선택',
    provider: 'nanobanana', model: 'Nano Banana 2.1', credits: 11, unit: '장',
  },
};

/** "더 꼼꼼하게"를 켰을 때 올라가는 유형 */
export const UPGRADE: Partial<Record<RequestType, RequestType>> = {
  light: 'write',
  translate: 'write',
  bulk: 'hard',
  write: 'hard',
};
