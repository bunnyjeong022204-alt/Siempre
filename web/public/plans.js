import { api, el, fmt, won } from '/common.js';

const DESC = {
  light: ['여러 AI를 가끔 쓰는 분', '모든 모델 자동 선택'],
  standard: ['매일 글과 이미지를 만드는 분', '고난도 모델 포함'],
  heavy: ['콘텐츠를 대량으로 만드는 분', '고난도 모델 포함, 우선 처리']
};

async function load() {
  const s = await api('/api/state');
  render(s);
}

function render(s) {
  const box = document.getElementById('plans');
  box.replaceChildren(...s.plans.map((p) => {
    const on = p.key === s.plan;
    return el('section', { class: `card plan${on ? ' on' : ''}` },
      el('div', { style: 'display:flex;justify-content:space-between;align-items:center' },
        el('h2', { style: 'font-size:20px' }, p.name),
        on ? el('span', { class: 'chip' }, '사용 중') : null),
      el('p', { class: 'muted small', style: 'margin:0' }, DESC[p.key]?.[0] || ''),
      el('div', {}, el('span', { class: 'big', style: 'font-size:32px' }, won(p.priceKRW)), el('span', { class: 'muted' }, ' /월')),
      el('div', { style: 'background:#F1F2F6;border-radius:10px;padding:12px 14px' },
        el('div', { class: 'muted small' }, '매주 지급'),
        el('b', { style: 'font-size:20px' }, `${fmt(p.weekly)} 크레딧`)),
      el('ul', { class: 'small', style: 'margin:0;padding-left:18px;color:#3A3F4C' },
        el('li', {}, '가벼운 대화 무제한'),
        el('li', {}, `글쓰기 약 ${fmt(Math.floor(p.weekly / 5))}회 또는 이미지 약 ${fmt(Math.floor(p.weekly / 17))}장`),
        el('li', {}, DESC[p.key]?.[1] || '')),
      el('button', {
        type: 'button', class: `btn ${on ? 'btn-primary' : ''}`, disabled: on, style: 'margin-top:auto',
        onclick: async () => {
          const next = await api('/api/plan', { plan: p.key });
          const msg = document.getElementById('msg');
          msg.hidden = false;
          msg.textContent = `${p.name} 요금제로 바꿨어요. 이번 주 크레딧이 ${fmt(next.weekly)}으로 채워졌어요.`;
          render(next);
        }
      }, on ? '사용 중인 요금제' : '이 요금제로 바꾸기'));
  }));

  document.getElementById('rules').replaceChildren(...s.rules.map((r) =>
    el('div', { class: 'kpi' }, el('span', { class: 'muted small' }, r.label), el('b', { style: 'font-size:20px' }, r.credits ? `약 ${r.credits}크레딧` : '무제한'))));
}

load().catch((e) => { document.getElementById('plans').textContent = e.message; });
