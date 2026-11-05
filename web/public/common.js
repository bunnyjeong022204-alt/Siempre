// 화면 공통 도우미. 모델 답변은 textContent로만 넣어서 HTML이 실행되지 않게 합니다.

export async function api(path, body) {
  const res = await fetch(path, body === undefined
    ? { cache: 'no-store' }
    : { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `요청 실패 (${res.status})`);
  return data;
}

export const fmt = (n) => Number(n).toLocaleString('ko-KR');
export const won = (n) => `₩${fmt(Math.round(n))}`;

export function kstDate(iso, opts = {}) {
  return new Date(iso).toLocaleString('ko-KR', { timeZone: 'Asia/Seoul', ...opts });
}

// el('div', { class: 'x', onclick: fn }, '텍스트', childNode)
export function el(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v === undefined || v === null || v === false) continue;
    if (k.startsWith('on')) node.addEventListener(k.slice(2), v);
    else if (k === 'class') node.className = v;
    else if (k === 'style') node.style.cssText = v;
    else node.setAttribute(k, v === true ? '' : v);
  }
  for (const c of children.flat()) {
    if (c === null || c === undefined || c === false) continue;
    node.append(c instanceof Node ? c : document.createTextNode(String(c)));
  }
  return node;
}
