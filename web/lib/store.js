// 데모용 저장소: 사용자 1명의 크레딧, 기록, 통계를 data/state.json에 저장합니다.
// 실제 서비스에서는 DB와 회원 계정으로 바꿔야 합니다.

import fs from 'node:fs';
import path from 'node:path';
import { PLANS, RULES } from './config.js';

const DATA_DIR = path.resolve('data');
const FILE = path.join(DATA_DIR, 'state.json');
const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

// 한국 시간 기준 이번 주 월요일 0시 (UTC 시각으로 반환)
export function weekStartKST(now = new Date()) {
  const kst = new Date(now.getTime() + KST_OFFSET_MS);
  const day = (kst.getUTCDay() + 6) % 7; // 월요일 = 0
  const monday = Date.UTC(kst.getUTCFullYear(), kst.getUTCMonth(), kst.getUTCDate() - day);
  return new Date(monday - KST_OFFSET_MS).toISOString();
}

export function todayKST(now = new Date()) {
  return new Date(now.getTime() + KST_OFFSET_MS).toISOString().slice(0, 10);
}

function fresh() {
  const plan = 'standard';
  return {
    plan,
    balance: PLANS[plan].weekly,
    weekStart: weekStartKST(),
    light: { date: todayKST(), count: 0 },
    lightThisWeek: 0,
    usedThisWeek: {},
    history: [{ at: new Date().toISOString(), kind: 'grant', label: '주간 크레딧 지급', model: '—', credits: PLANS[plan].weekly }],
    stats: { requests: 0, regenerations: 0, estCostKRW: 0, byType: {}, byModel: {}, creditsGranted: PLANS[plan].weekly, creditsUsed: 0 },
    disabledRules: {}
  };
}

let state = load();

function load() {
  try {
    return JSON.parse(fs.readFileSync(FILE, 'utf8'));
  } catch {
    return fresh();
  }
}

function save() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(FILE, JSON.stringify(state, null, 2));
}

// 주가 바뀌었으면 남은 크레딧을 없애고 새 주간 크레딧을 지급 (이월 없음)
function rollWeek() {
  const ws = weekStartKST();
  if (state.weekStart !== ws) {
    const weekly = PLANS[state.plan].weekly;
    state.weekStart = ws;
    state.balance = weekly;
    state.usedThisWeek = {};
    state.lightThisWeek = 0;
    state.stats.creditsGranted += weekly;
    state.history.unshift({ at: new Date().toISOString(), kind: 'grant', label: '주간 크레딧 지급', model: '—', credits: weekly });
  }
  const today = todayKST();
  if (state.light.date !== today) state.light = { date: today, count: 0 };
}

export function getState() {
  rollWeek();
  return state;
}

export function setPlan(planKey) {
  if (!PLANS[planKey]) throw new Error('없는 요금제');
  rollWeek();
  state.plan = planKey;
  // MVP 단순화: 요금제를 바꾸면 이번 주 크레딧을 새 요금제 기준으로 다시 채움
  state.balance = PLANS[planKey].weekly;
  state.stats.creditsGranted += PLANS[planKey].weekly;
  state.history.unshift({ at: new Date().toISOString(), kind: 'grant', label: `${PLANS[planKey].name} 요금제로 변경`, model: '—', credits: PLANS[planKey].weekly });
  save();
  return state;
}

export function toggleRule(type) {
  if (!RULES[type]) throw new Error('없는 규칙');
  state.disabledRules[type] = !state.disabledRules[type];
  save();
  return state;
}

export function recordUse({ type, modelKey, modelLabel, credits, estCostKRW, regenerate }) {
  rollWeek();
  state.balance -= credits;
  state.stats.requests += 1;
  if (regenerate) state.stats.regenerations += 1;
  state.stats.estCostKRW += estCostKRW;
  state.stats.creditsUsed += credits;
  state.stats.byType[type] = (state.stats.byType[type] || 0) + 1;
  state.stats.byModel[modelKey] = (state.stats.byModel[modelKey] || 0) + 1;
  if (type === 'light') {
    state.light.count += 1;
    state.lightThisWeek += 1;
  } else {
    const u = state.usedThisWeek[type] || { count: 0, credits: 0 };
    state.usedThisWeek[type] = { count: u.count + 1, credits: u.credits + credits };
  }
  state.history.unshift({ at: new Date().toISOString(), kind: 'use', label: RULES[type].label, model: modelLabel, credits: -credits });
  state.history = state.history.slice(0, 200);
  save();
}

export function resetState() {
  state = fresh();
  save();
  return state;
}
