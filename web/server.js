// Siempre MVP 서버: 설치할 패키지 없이 Node.js 18 이상에서 실행됩니다.
//   npm start  →  http://localhost:3000

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

loadEnv();

const { MODELS, RULES, PLANS, LIGHT_DAILY_LIMIT, hasKey, ruleForModel } = await import('./lib/config.js');
const { classify, classifyHeuristic } = await import('./lib/router.js');
const { callModel } = await import('./lib/providers.js');
const store = await import('./lib/store.js');

const PORT = Number(process.env.PORT || 3000);
const PUBLIC = path.resolve('public');
const PAGES = { '/': 'index.html', '/plans': 'plans.html', '/wallet': 'wallet.html', '/admin': 'admin.html' };
const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.svg': 'image/svg+xml' };

function loadEnv() {
  try {
    const text = fs.readFileSync(path.resolve('.env'), 'utf8');
    for (const line of text.split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m && !line.trim().startsWith('#') && process.env[m[1]] === undefined) {
        process.env[m[1]] = m[2].replace(/^['"]|['"]$/g, '');
      }
    }
  } catch {
    // .env가 없으면 데모 모드
  }
}

function send(res, status, body, type = 'application/json; charset=utf-8') {
  res.writeHead(status, { 'content-type': type, 'cache-control': 'no-store' });
  res.end(typeof body === 'string' || Buffer.isBuffer(body) ? body : JSON.stringify(body));
}

async function readBody(req) {
  let size = 0;
  const chunks = [];
  for await (const c of req) {
    size += c.length;
    if (size > 1_000_000) throw Object.assign(new Error('요청이 너무 커요'), { status: 413 });
    chunks.push(c);
  }
  if (!chunks.length) return {};
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch {
    throw Object.assign(new Error('JSON 형식이 아니에요'), { status: 400 });
  }
}

function publicState() {
  const s = store.getState();
  const plan = PLANS[s.plan];
  const next = new Date(new Date(s.weekStart).getTime() + 7 * 24 * 3600 * 1000);
  return {
    plan: s.plan,
    planName: plan.name,
    weekly: plan.weekly,
    balance: s.balance,
    nextGrantAt: next.toISOString(),
    lightToday: s.light.count,
    lightLimit: LIGHT_DAILY_LIMIT,
    lightThisWeek: s.lightThisWeek,
    usedThisWeek: Object.entries(s.usedThisWeek).map(([type, u]) => ({ type, label: RULES[type].label, ...u })),
    history: s.history.slice(0, 30),
    plans: Object.entries(PLANS).map(([key, p]) => ({ key, ...p })),
    rules: Object.entries(RULES).map(([type, r]) => ({ type, label: r.label, credits: r.credits }))
  };
}

function pickModels(rule) {
  const order = [rule.main, rule.fallback].filter(Boolean);
  const withKey = order.filter((k) => hasKey(MODELS[k].provider));
  return withKey.length ? withKey : [order[0]]; // 키가 하나도 없으면 데모 응답
}

async function handleChat(req, res) {
  const body = await readBody(req);
  const messages = Array.isArray(body.messages) ? body.messages.slice(-50) : [];
  const clean = messages
    .filter((m) => (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string' && m.content.trim())
    .map((m) => ({ role: m.role, content: m.content.slice(0, 20000) }));
  if (!clean.length || clean[clean.length - 1].role !== 'user') return send(res, 400, { error: '마지막 메시지는 사용자 메시지여야 해요.' });

  const s = store.getState();
  const last = clean[clean.length - 1].content;
  let type;
  let candidates;
  let reason;
  const override = typeof body.override === 'string' ? body.override : null;

  if (override) {
    if (!MODELS[override]) return send(res, 400, { error: '없는 모델이에요.' });
    type = ruleForModel(override);
    candidates = [override];
    reason = '직접 고른 모델';
  } else {
    type = await classify(last);
    if (s.disabledRules[type]) type = s.disabledRules.write ? 'light' : 'write';
    candidates = pickModels(RULES[type]);
    reason = RULES[type].reason;
  }

  const rule = RULES[type];
  const credits = rule.credits;
  if (type === 'light' && s.light.count >= LIGHT_DAILY_LIMIT) {
    return send(res, 429, { error: `가벼운 대화는 하루 ${LIGHT_DAILY_LIMIT}회까지예요. 내일 다시 쓸 수 있어요.` });
  }
  if (credits > 0 && s.balance < credits) {
    return send(res, 402, { error: `크레딧이 부족해요. 이 요청에는 ${credits}크레딧이 필요해요.` });
  }

  // 이미지 요청은 대화 맥락 없이 마지막 요청만 보냄
  const context = type === 'image' ? [clean[clean.length - 1]] : clean;
  let lastError;
  for (const modelKey of candidates) {
    try {
      const out = await callModel(modelKey, context);
      const model = MODELS[modelKey];
      store.recordUse({ type, modelKey, modelLabel: model.label, credits, estCostKRW: out.demo ? 0 : model.estCostKRW, regenerate: Boolean(override) });
      return send(res, 200, {
        text: out.text,
        image: out.image || null,
        demo: out.demo,
        type,
        typeLabel: rule.label,
        modelKey,
        modelLabel: model.label,
        credits,
        reason: modelKey === rule.main || override ? reason : `${model.label}로 대체`,
        balance: store.getState().balance,
        alternatives: Object.entries(MODELS)
          .filter(([k, m]) => k !== modelKey && (type === 'image' ? m.provider === 'google-image' : m.provider !== 'google-image'))
          .map(([k, m]) => ({ key: k, label: m.label, credits: RULES[ruleForModel(k)].credits }))
      });
    } catch (e) {
      lastError = e;
    }
  }
  return send(res, 502, { error: `모델 호출에 실패했어요: ${lastError?.message || '알 수 없는 오류'}` });
}

function adminData() {
  const s = store.getState();
  const st = s.stats;
  return {
    providers: {
      anthropic: hasKey('anthropic'),
      openai: hasKey('openai'),
      google: hasKey('google')
    },
    kpis: {
      requests: st.requests,
      regenRate: st.requests ? st.regenerations / st.requests : null,
      creditUseRate: st.creditsGranted ? st.creditsUsed / st.creditsGranted : null,
      estCostKRW: Math.round(st.estCostKRW)
    },
    byType: Object.entries(RULES).map(([type, r]) => ({ type, label: r.label, count: st.byType[type] || 0 })),
    rules: Object.entries(RULES).map(([type, r]) => ({
      type,
      label: r.label,
      main: MODELS[r.main].label,
      fallback: r.fallback ? MODELS[r.fallback].label : '—',
      credits: r.credits,
      enabled: !s.disabledRules[type]
    }))
  };
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://localhost');
    const p = url.pathname;

    if (req.method === 'GET' && PAGES[p]) {
      return send(res, 200, fs.readFileSync(path.join(PUBLIC, PAGES[p])), TYPES['.html']);
    }
    if (req.method === 'GET' && p === '/api/state') return send(res, 200, publicState());
    if (req.method === 'POST' && p === '/api/estimate') {
      const body = await readBody(req);
      const type = classifyHeuristic(String(body.text || ''));
      return send(res, 200, { type, label: RULES[type].label, credits: RULES[type].credits });
    }
    if (req.method === 'POST' && p === '/api/chat') return await handleChat(req, res);
    if (req.method === 'POST' && p === '/api/plan') {
      const body = await readBody(req);
      store.setPlan(String(body.plan || ''));
      return send(res, 200, publicState());
    }
    if (req.method === 'GET' && p === '/api/admin') return send(res, 200, adminData());
    if (req.method === 'POST' && p === '/api/admin/rules') {
      const body = await readBody(req);
      store.toggleRule(String(body.type || ''));
      return send(res, 200, adminData());
    }
    if (req.method === 'POST' && p === '/api/reset') {
      store.resetState();
      return send(res, 200, publicState());
    }

    // 정적 파일 (public 폴더 밖은 막음)
    if (req.method === 'GET') {
      const file = path.normalize(path.join(PUBLIC, p));
      if (file.startsWith(PUBLIC + path.sep) && fs.existsSync(file) && fs.statSync(file).isFile()) {
        return send(res, 200, fs.readFileSync(file), TYPES[path.extname(file)] || 'application/octet-stream');
      }
    }
    send(res, 404, { error: '찾을 수 없어요.' });
  } catch (e) {
    send(res, e.status || 500, { error: e.message || '서버 오류' });
  }
});

server.listen(PORT, () => {
  const mode = ['anthropic', 'openai', 'google'].filter(hasKey);
  console.log(`Siempre MVP: http://localhost:${PORT}`);
  console.log(mode.length ? `연결된 공급사: ${mode.join(', ')}` : '데모 모드 (API 키 없음): .env.example을 .env로 복사하고 키를 넣으세요.');
});
