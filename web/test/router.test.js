import test from 'node:test';
import assert from 'node:assert/strict';
import { classifyHeuristic } from '../lib/router.js';
import { weekStartKST } from '../lib/store.js';

test('요청 유형 분류', () => {
  assert.equal(classifyHeuristic('고마워!'), 'light');
  assert.equal(classifyHeuristic('1번 게시글에 쓸 정사각형 이미지 만들어줘'), 'image');
  assert.equal(classifyHeuristic('이 기사 세 줄로 요약해줘'), 'bulk');
  assert.equal(classifyHeuristic('이 파이썬 코드에서 버그 찾아줘'), 'hard');
  assert.equal(classifyHeuristic('다음 주 출시할 포카치아 인스타 게시글 3개 써줘'), 'write');
});

test('주간 크레딧 기준일은 한국 시간 월요일 0시', () => {
  // 2026-11-05(목) 13:00 KST → 2026-11-02(월) 00:00 KST = 2026-11-01T15:00Z
  assert.equal(weekStartKST(new Date('2026-11-05T04:00:00Z')), '2026-11-01T15:00:00.000Z');
  // 2026-11-09(월) 00:30 KST는 새 주
  assert.equal(weekStartKST(new Date('2026-11-08T15:30:00Z')), '2026-11-08T15:00:00.000Z');
});
