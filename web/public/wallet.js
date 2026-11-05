import { api, el, fmt, kstDate } from '/common.js';

async function load() {
  const s = await api('/api/state');
  const $ = (id) => document.getElementById(id);
  $('planLine').textContent = `이번 주 남은 크레딧 · ${s.planName}`;
  $('balance').textContent = fmt(s.balance);
  $('weekly').textContent = `/ ${fmt(s.weekly)}`;
  $('fill').style.width = `${Math.max(0, Math.min(100, (s.balance / s.weekly) * 100))}%`;
  const next = kstDate(s.nextGrantAt, { month: 'long', day: 'numeric', weekday: 'short' });
  $('resetLine').textContent = `남은 크레딧은 다음 지급 직전에 사라지고, ${next}에 ${fmt(s.weekly)}크레딧이 새로 들어와요.`;
  $('light').textContent = `${fmt(s.lightThisWeek)}회`;
  $('lightLine').textContent = `무제한이라 크레딧이 쓰이지 않았어요. 오늘 ${fmt(s.lightToday)} / ${fmt(s.lightLimit)}회 사용.`;

  const used = s.usedThisWeek.reduce((a, u) => a + u.credits, 0);
  $('usageTitle').textContent = `이번 주 사용 내역 · ${fmt(used)}크레딧`;
  $('usage').replaceChildren(...(s.usedThisWeek.length ? s.usedThisWeek.map((u) =>
    el('div', { style: 'display:flex;flex-direction:column;gap:6px' },
      el('div', { style: 'display:flex;justify-content:space-between;font-size:14px' },
        el('span', {}, `${u.label} · ${fmt(u.count)}회`), el('b', {}, fmt(u.credits))),
      el('div', { class: 'bar' }, el('span', { style: `width:${used ? (u.credits / used) * 100 : 0}%` })))) : [el('p', { class: 'muted small', style: 'margin:0' }, '아직 크레딧을 쓴 작업이 없어요.')]));

  $('history').replaceChildren(...s.history.map((h) => el('tr', {},
    el('td', {}, kstDate(h.at, { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })),
    el('td', {}, h.label),
    el('td', {}, h.model),
    el('td', { class: 'num', style: 'font-weight:700' }, h.credits > 0 ? `+${fmt(h.credits)}` : h.credits < 0 ? fmt(h.credits) : '무제한'))));
}

document.getElementById('topup').addEventListener('click', () => {
  alert('추가 충전 결제는 MVP에서 아직 연결되지 않았어요.');
});

load().catch((e) => { document.getElementById('balance').textContent = e.message; });
