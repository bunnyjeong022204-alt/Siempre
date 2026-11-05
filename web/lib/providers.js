// 각 공급사 API 호출. 키가 없으면 데모 응답을 돌려줍니다.

import { MODELS, hasKey } from './config.js';

const SYSTEM = '당신은 한국어로 친절하고 간결하게 답하는 어시스턴트입니다. 사용자가 다른 언어로 물으면 그 언어로 답하세요.';
const MAX_TOKENS = 1024;

export async function callModel(modelKey, messages) {
  const model = MODELS[modelKey];
  if (!model) throw new Error(`알 수 없는 모델: ${modelKey}`);
  if (!hasKey(model.provider)) return demo(model, messages);

  if (model.provider === 'anthropic') return callAnthropic(model, messages);
  if (model.provider === 'openai') return callOpenAI(model, messages);
  if (model.provider === 'google') return callGemini(model, messages);
  if (model.provider === 'google-image') return callGeminiImage(model, messages);
  throw new Error(`지원하지 않는 공급사: ${model.provider}`);
}

async function postJSON(url, headers, body) {
  const res = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json', ...headers }, body: JSON.stringify(body) });
  const text = await res.text();
  if (!res.ok) throw new Error(`${res.status} ${text.slice(0, 300)}`);
  return JSON.parse(text);
}

async function callAnthropic(model, messages) {
  const data = await postJSON('https://api.anthropic.com/v1/messages', {
    'x-api-key': process.env.ANTHROPIC_API_KEY,
    'anthropic-version': '2023-06-01'
  }, {
    model: model.id,
    max_tokens: MAX_TOKENS,
    system: SYSTEM,
    messages: messages.map((m) => ({ role: m.role, content: m.content }))
  });
  const text = (data.content || []).filter((b) => b.type === 'text').map((b) => b.text).join('\n');
  return { text, demo: false };
}

async function callOpenAI(model, messages) {
  const data = await postJSON('https://api.openai.com/v1/chat/completions', {
    authorization: `Bearer ${process.env.OPENAI_API_KEY}`
  }, {
    model: model.id,
    max_completion_tokens: MAX_TOKENS,
    messages: [{ role: 'system', content: SYSTEM }, ...messages.map((m) => ({ role: m.role, content: m.content }))]
  });
  return { text: data.choices?.[0]?.message?.content || '', demo: false };
}

function geminiContents(messages) {
  return messages.map((m) => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] }));
}

async function callGemini(model, messages) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model.id)}:generateContent`;
  const data = await postJSON(url, { 'x-goog-api-key': process.env.GEMINI_API_KEY }, {
    systemInstruction: { parts: [{ text: SYSTEM }] },
    contents: geminiContents(messages),
    generationConfig: { maxOutputTokens: MAX_TOKENS }
  });
  const parts = data.candidates?.[0]?.content?.parts || [];
  return { text: parts.map((p) => p.text || '').join(''), demo: false };
}

async function callGeminiImage(model, messages) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model.id)}:generateContent`;
  const last = messages[messages.length - 1];
  const data = await postJSON(url, { 'x-goog-api-key': process.env.GEMINI_API_KEY }, {
    contents: [{ role: 'user', parts: [{ text: last.content }] }],
    generationConfig: { responseModalities: ['TEXT', 'IMAGE'] }
  });
  const parts = data.candidates?.[0]?.content?.parts || [];
  const img = parts.find((p) => p.inlineData);
  const text = parts.map((p) => p.text || '').join('').trim();
  return {
    text: text || '이미지를 만들었어요.',
    image: img ? `data:${img.inlineData.mimeType};base64,${img.inlineData.data}` : null,
    demo: false
  };
}

function demo(model, messages) {
  const last = messages[messages.length - 1]?.content || '';
  if (model.provider === 'google-image') {
    const label = escapeXml(last.slice(0, 40));
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512"><rect width="512" height="512" rx="24" fill="#ECEEF3"/><rect x="40" y="40" width="432" height="432" rx="16" fill="none" stroke="#A9B0C2" stroke-dasharray="8 8"/><text x="256" y="240" font-family="sans-serif" font-size="22" text-anchor="middle" fill="#4A4F5C">데모 이미지</text><text x="256" y="276" font-family="sans-serif" font-size="16" text-anchor="middle" fill="#5B6070">${label}</text></svg>`;
    return { text: '[데모] GEMINI_API_KEY를 넣으면 실제 이미지가 생성돼요.', image: `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`, demo: true };
  }
  return {
    text: `[데모 응답] 이 요청은 ${model.label}가 답하도록 골랐어요.\n.env에 ${keyName(model.provider)}를 넣으면 실제 답변이 나와요.\n\n받은 요청: "${last.slice(0, 120)}"`,
    demo: true
  };
}

function keyName(provider) {
  if (provider === 'anthropic') return 'ANTHROPIC_API_KEY';
  if (provider === 'openai') return 'OPENAI_API_KEY';
  return 'GEMINI_API_KEY';
}

function escapeXml(s) {
  return s.replace(/[<>&"']/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;' }[c]));
}
