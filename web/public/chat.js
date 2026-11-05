import { api, el, fmt } from '/common.js';

const thread = document.getElementById('thread');
const form = document.getElementById('composer');
const input = document.getElementById('prompt');
const sendBtn = document.getElementById('sendBtn');
const estimate = document.getElementById('estimate');

// { role: 'user' | 'assistant' | 'notice', content, meta? }
let messages = [];
let busy = false;
let openMenu = null;

async function refreshWallet() {
  try {
    const s = await api('/api/state');
    document.getElementById('meterText').textContent = `${fmt(s.balance)} / ${fmt(s.weekly)}`;
    document.getElementById('meterFill').style.width = `${Math.max(0, Math.min(100, (s.balance / s.weekly) * 100))}%`;
    document.getElementById('sideBalance').textContent = fmt(s.balance);
    document.getElementById('sidePlan').textContent = s.planName;
  } catch {
    // 표시만 못 함
  }
}

function chipClass(meta) {
  if (meta.demo) return 'chip chip-demo';
  if (meta.type === 'light') return 'chip chip-light';
  if (meta.type === 'image') return 'chip chip-image';
  return 'chip';
}

function render() {
  thread.replaceChildren();
  if (!messages.length) {
    thread.append(el('div', { class: 'empty' },
      el('h2', {}, '한 대화에서 모든 AI를'),
      el('p', {}, '글쓰기, 요약, 코딩, 이미지까지. 모델은 자동으로 골라 드려요.')));
  }
  messages.forEach((m, i) => {
    if (m.role === 'user') thread.append(el('div', { class: 'bubble-user' }, m.content));
    else if (m.role === 'notice') thread.append(el('div', { class: 'notice', role: 'status' }, m.content));
    else thread.append(renderReply(m, i));
  });
  if (busy) thread.append(el('div', { class: 'pending' }, '알맞은 모델을 고르고 답을 받는 중…'));
  thread.scrollTop = thread.scrollHeight;
  window.scrollTo(0, document.body.scrollHeight);
}

function renderReply(m, i) {
  const meta = m.meta;
  const creditText = meta.credits ? `${meta.credits}크레딧` : '무제한';
  const wrap = el('div', { class: 'reply' });
  if (meta.image) wrap.append(el('img', { class: 'reply-img', src: meta.image, alt: `생성된 이미지: ${messages[i - 1]?.content || ''}` }));
  if (m.content) wrap.append(el('div', { class: 'reply-card' }, m.content));

  const metaRow = el('div', { class: 'meta' },
    el('span', { class: chipClass(meta) }, meta.modelLabel),
    el('span', {}, `${meta.reason} · ${creditText}${meta.demo ? ' · 데모' : ''}`));
  const btn = el('button', {
    type: 'button', class: 'btn btn-sm', 'aria-expanded': openMenu === i ? 'true' : 'false',
    onclick: () => { openMenu = openMenu === i ? null : i; render(); }
  }, meta.type === 'image' ? '다시 만들기' : '다른 모델로 다시 받기');
  metaRow.append(btn);
  if (openMenu === i) {
    const menu = el('div', { class: 'menu' });
    const options = meta.type === 'image'
      ? [{ key: meta.modelKey, label: `${meta.modelLabel}로 다시`, credits: meta.credits }]
      : meta.alternatives;
    for (const alt of options) {
      menu.append(el('button', { type: 'button', onclick: () => regenerate(i, alt.key) },
        el('span', {}, alt.label), el('span', { class: 'muted' }, alt.credits ? `${alt.credits}크레딧` : '무제한')));
    }
    metaRow.append(menu);
  }
  wrap.append(metaRow);
  return wrap;
}

function history(upTo) {
  return messages.slice(0, upTo)
    .filter((m) => m.role === 'user' || m.role === 'assistant')
    .map((m) => ({ role: m.role, content: m.content || (m.meta?.image ? '[이미지를 생성함]' : '') }));
}

async function ask(context, override) {
  busy = true; sendBtn.disabled = true; render();
  try {
    const r = await api('/api/chat', override ? { messages: context, override } : { messages: context });
    return { role: 'assistant', content: r.text, meta: r };
  } catch (e) {
    return { role: 'notice', content: e.message };
  } finally {
    busy = false; sendBtn.disabled = false;
    refreshWallet();
  }
}

async function send(text) {
  messages.push({ role: 'user', content: text });
  const reply = await ask(history(messages.length));
  messages.push(reply);
  render();
}

async function regenerate(i, modelKey) {
  openMenu = null;
  const reply = await ask(history(i), modelKey);
  if (reply.role === 'assistant') messages[i] = reply;
  else messages.splice(i + 1, 0, reply);
  render();
}

form.addEventListener('submit', (e) => {
  e.preventDefault();
  const text = input.value.trim();
  if (!text || busy) return;
  input.value = '';
  clearTimeout(estTimer);
  estimate.textContent = '자동 선택';
  send(text);
});

input.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) {
    e.preventDefault();
    form.requestSubmit();
  }
});

let estTimer;
input.addEventListener('input', () => {
  clearTimeout(estTimer);
  const text = input.value.trim();
  if (!text) { estimate.textContent = '자동 선택'; return; }
  estTimer = setTimeout(async () => {
    try {
      const r = await api('/api/estimate', { text });
      estimate.textContent = `예상: ${r.label} · ${r.credits ? `${r.credits}크레딧` : '무제한'}`;
    } catch {
      estimate.textContent = '자동 선택';
    }
  }, 250);
});

document.getElementById('newChat').addEventListener('click', () => {
  messages = []; openMenu = null; render(); input.focus();
});

document.addEventListener('click', (e) => {
  if (openMenu !== null && !e.target.closest('.meta')) { openMenu = null; render(); }
});

render();
refreshWallet();
