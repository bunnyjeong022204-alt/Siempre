import { api, el, fmt, won } from '/common.js';

const pct = (v) => (v === null || v === undefined ? '—' : `${(v * 100).toFixed(1)}%`);

function render(d) {
  const names = { anthropic: 'Anthropic (Claude)', openai: 'OpenAI (GPT)', google: 'Google (Gemini·이미지)' };
  document.getElementById('providers').replaceChildren(...Object.entries(d.providers).map(([k, on]) =>
    el('span', { class: on ? 'chip chip-light' : 'chip chip-demo' }, `${names[k]} · ${on ? '연결됨' : '데모'}`)));

  const kpis = [
    ['다른 모델로 다시 받기 비율', pct(d.kpis.regenRate), '목표 10% 이하', '자동 라우팅을 믿는지'],
    ['크레딧 사용률', pct(d.kpis.creditUseRate), '목표 50~70%', '지급한 크레딧 중 쓴 비율'],
    ['누적 요청 수', fmt(d.kpis.requests), '—', '데모 사용자 1명 기준'],
    ['누적 예상 API 원가', won(d.kpis.estCostKRW), '유료 1인 월 ₩13,000 이하', '데모 응답은 0원으로 계산'],
    ['4주 차 재방문율', '—', '목표 30% 이상', '회원 기능 연결 후 측정'],
    ['무료→유료 전환율', '—', '목표 5%', '결제 연결 후 측정']
  ];
  document.getElementById('kpis').replaceChildren(...kpis.map(([label, value, target, why]) =>
    el('section', { class: 'kpi' }, el('span', { class: 'muted small' }, label), el('b', {}, value),
      el('span', { class: 'target' }, target), el('span', { class: 'muted', style: 'font-size:12px' }, why))));

  const counts = Object.fromEntries(d.byType.map((t) => [t.type, t.count]));
  document.getElementById('rules').replaceChildren(...d.rules.map((r) => el('tr', {},
    el('td', { style: 'font-weight:700' }, r.label),
    el('td', {}, r.main),
    el('td', { class: 'muted' }, r.fallback),
    el('td', { class: 'num' }, r.credits ? fmt(r.credits) : '무제한'),
    el('td', { class: 'num' }, fmt(counts[r.type] || 0)),
    el('td', {}, el('button', {
      type: 'button', class: `btn btn-sm ${r.enabled ? 'pill-on' : 'pill-off'}`, 'aria-pressed': r.enabled ? 'true' : 'false',
      onclick: async () => render(await api('/api/admin/rules', { type: r.type }))
    }, r.enabled ? '켜짐' : '꺼짐')))));
}

document.getElementById('reset').addEventListener('click', async () => {
  if (!confirm('데모 사용자의 크레딧, 기록, 통계를 처음 상태로 되돌릴까요?')) return;
  await api('/api/reset', {});
  render(await api('/api/admin'));
});

api('/api/admin').then(render).catch((e) => { document.getElementById('kpis').textContent = e.message; });
