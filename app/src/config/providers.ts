// 입점 AI 목록과 요금표. 값의 근거는 docs/pricing.md
// AI를 바꾸거나 가격을 고칠 때는 이 파일만 고친다. (GPT ↔ Claude 결정 전, docs/tasks.md 열린 질문 참고)

import type { Provider, ProviderId } from '../types';

export const PROVIDERS: Provider[] = [
  {
    id: 'claude',
    name: 'Claude',
    description: '글쓰기 · 고난도 추론 · 한국어 정확도',
    tag: '글쓰기 · 코딩에 강함',
    models: { chat: 'Claude Sonnet 5.5', hard: 'Claude Opus 5.5' },
    color: { bg: '#FED9CE', ink: '#9A3B1F' },
    tiers: [
      { name: '라이트', price: 8900, allowance: '대화 150회 · 고난도 5회' },
      { name: '스탠다드', price: 17900, allowance: '대화 300회 · 고난도 10회' },
      { name: '헤비', price: 44900, allowance: '대화 700회 · 고난도 30회' },
    ],
    official: { name: 'Claude Pro', price: 32600 },
  },
  {
    id: 'qwen',
    name: 'Qwen',
    description: 'Qwen3.7-Plus 대화 · Qwen3.7-Max 고난도',
    tag: '가성비 · 다국어',
    models: { chat: 'Qwen3.7-Plus', hard: 'Qwen3.7-Max' },
    color: { bg: '#B8CEFE', ink: '#2B4BA8' },
    tiers: [
      { name: '라이트', price: 2900, allowance: '대화 300회 · 고난도 10회' },
      { name: '스탠다드', price: 7900, allowance: '대화 800회 · 고난도 30회' },
      { name: '헤비', price: 19900, allowance: '대화 2,000회 · 고난도 80회' },
    ],
  },
  {
    id: 'mistral',
    name: 'Mistral',
    description: '가볍고 빠른 대화와 간단한 분석을 가장 저렴하게',
    tag: '가장 저렴',
    models: { chat: 'Mistral Small 4', hard: 'Mistral Large 3' },
    color: { bg: '#B6FDC9', ink: '#1F6B3A' },
    tiers: [
      { name: '라이트', price: 1900, allowance: '대화 500회 · 고난도 20회' },
      { name: '스탠다드', price: 5500, allowance: '대화 1,500회 · 고난도 50회' },
      { name: '헤비', price: 14900, allowance: '대화 4,000회 · 고난도 150회' },
    ],
  },
  {
    id: 'elevenlabs',
    name: 'ElevenLabs',
    description: '자연스러운 음성 · 다국어 내레이션',
    tag: '자연스러운 음성',
    models: { chat: 'ElevenLabs Multilingual' },
    color: { bg: '#D7B5DA', ink: '#6B2F72' },
    tiers: [
      { name: '라이트', price: 9900, allowance: '35,000자 (한국어 약 80분)' },
      { name: '스탠다드', price: 19900, allowance: '70,000자 (한국어 약 155분)' },
      { name: '헤비', price: 39900, allowance: '140,000자 (한국어 약 310분)' },
    ],
    // 공식 Starter(₩9,800, 30,000자)와는 제공량이 달라 가격만 비교하지 않는다
  },
  {
    id: 'nanobanana',
    name: 'Nano Banana',
    description: '포스터 · 썸네일 · 제품 이미지 생성',
    tag: '이미지 생성',
    models: { chat: 'Nano Banana 2.1' },
    color: { bg: '#D5D5D5', ink: '#3F3F46' },
    tiers: [
      { name: '라이트', price: 9900, allowance: '이미지 100장' },
      { name: '스탠다드', price: 19900, allowance: '이미지 200장' },
      { name: '헤비', price: 39900, allowance: '이미지 400장' },
    ],
  },
];

export const PROVIDER_BY_ID = Object.fromEntries(PROVIDERS.map((p) => [p.id, p])) as Record<ProviderId, Provider>;
