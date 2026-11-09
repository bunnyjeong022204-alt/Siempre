// 요청·응답 도우미. 잘못된 본문은 500이 아니라 400(invalid_body)으로 답한다.

import { ApiError, badRequest } from './errors.js';

const MAX_BODY = 64 * 1024;

export async function readJson(req) {
  const len = req.headers['content-length'];
  if (len !== undefined && !/^\d+$/.test(len)) throw badRequest('invalid_body', '요청 형식이 잘못됐어요.');
  if (len !== undefined && Number(len) > MAX_BODY) throw new ApiError(413, 'too_large', '요청이 너무 커요.');
  const chunks = [];
  let size = 0;
  for await (const c of req) {
    size += c.length;
    if (size > MAX_BODY) throw new ApiError(413, 'too_large', '요청이 너무 커요.');
    chunks.push(c);
  }
  let text;
  try {
    text = new TextDecoder('utf-8', { fatal: true }).decode(Buffer.concat(chunks));
  } catch {
    throw badRequest('invalid_body', '요청은 UTF-8이어야 해요.');
  }
  let body;
  try {
    body = text ? JSON.parse(text) : {};
  } catch {
    throw badRequest('invalid_body', 'JSON 형식이 아니에요.');
  }
  if (body === null || typeof body !== 'object' || Array.isArray(body)) throw badRequest('invalid_body', '요청 본문은 JSON 객체여야 해요.');
  return body;
}

export function sendJson(res, status, body, headers = {}) {
  res.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...headers });
  res.end(JSON.stringify(body));
}

export function parseCookies(req) {
  const out = {};
  for (const part of String(req.headers.cookie || '').split(';')) {
    const i = part.indexOf('=');
    if (i > 0) out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim());
  }
  return out;
}

/** 요청 제한용 IP. 프록시 뒤에 두면 TRUST_PROXY=1로 X-Forwarded-For를 쓴다. */
export function clientIp(req) {
  if (process.env.TRUST_PROXY === '1') {
    const fwd = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim();
    if (fwd) return fwd;
  }
  return req.socket.remoteAddress || 'unknown';
}
