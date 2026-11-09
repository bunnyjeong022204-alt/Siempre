# 작업 목록

맡을 작업의 "담당"에 이름을 적고 시작한다. 끝나면 상태를 "완료"로 바꾸고 PR 링크를 적는다.
상태: `대기` · `진행 중` · `완료`

## 가장 먼저 할 일

| 작업 | 담당 | 상태 |
| --- | --- | --- |
| `cd app && npm install && npm run build`로 빌드 확인. 뼈대는 패키지 설치 없이 문법·계산만 검사한 상태라, 빌드 오류가 나면 먼저 고치기 | | 대기 |

## P0 — 시연에 꼭 필요

| 화면 | 작업 | 관련 파일 | 담당 | 상태 |
| --- | --- | --- | --- | --- |
| 구독 선택 | AI 5종 카드, 단계 선택, 장바구니 요약 (뼈대 있음, Figma와 맞추기) | `pages/PlansPage.tsx`, `components/plans/*` | | 대기 |
| 구독 선택 | 월간/연간 전환 토글 (연간 15%, 뼈대 있음) | `components/plans/BillingToggle.tsx` | | 대기 |
| 구독 선택 | 공식 구독 대비 절약액 표시 | `config/providers.ts`의 `official` | | 대기 |
| 결제 | 데모 결제 → 결제 완료 상태 → 대화로 이동 | `pages/PlansPage.tsx`, `state/` | | 대기 |
| 대화 | 답변별 모델 칩 · 이유 · 크레딧 (뼈대 있음) | `components/chat/ReplyMeta.tsx` | | 대기 |
| 대화 | 입력창 예상 크레딧 · 더 꼼꼼하게 토글 (뼈대 있음) | `components/chat/Composer.tsx` | | 대기 |
| 대화 | 다른 모델로 다시 받기 시트 + 첫 답 크레딧 환급 | `components/chat/RegenerateSheet.tsx` | | 대기 |
| 대화 | 음성 플레이어 답변 카드 (재생, MP3 다운로드, 목소리 칩 3개) | `components/chat/VoiceReply.tsx` | | 대기 |
| 대화 | 이미지 답변 카드 (3장 바둑판, 다운로드, 변형 더 받기) | `components/chat/ImageReply.tsx` | | 대기 |
| 대화 | 담지 않은 AI 요청 안내 카드 | `components/chat/MissingProviderCard.tsx` | | 대기 |
| 크레딧 | 남은 크레딧 · AI별 사용량 · 최근 기록 (뼈대 있음, Figma와 맞추기) | `pages/CreditsPage.tsx` | | 대기 |

## P1 — 있으면 좋음

| 화면 | 작업 | 담당 | 상태 |
| --- | --- | --- | --- |
| 대화 | 빈 대화 첫 화면 (예시 버튼 3개) | | 대기 |
| 크레딧 | 요일별 사용량 차트 | | 대기 |
| 공통 | 크레딧 부족 안내 + 추가 충전 버튼 | | 대기 |
| 백엔드 | `api/client.ts`를 실제 서버로 연결 (`web/server.js` 참고) | | 대기 |

## 범위 밖 요청으로 진행한 작업

| 작업 | 관련 파일 | 담당 | 상태 |
| --- | --- | --- | --- |
| 회원가입 5단계 화면 + 회원가입 API + 간편가입(시연 모드) | `app/src/pages/signup/*`, `server/`, [intent](../intent/20261109-signup-flow/intent.md) | 미배정 | 진행 중 (로컬 검증, PR 미승인) |

## 열린 질문

- [ ] **회원가입을 MVP에 넣을까?** CLAUDE.md 6장은 "회원가입·로그인은 안 만든다"인데 요청에 따라 `feat/signup-flow`에서 만들었다. 넣는다면 CLAUDE.md 6장을 고치고, 아니면 PR을 보류한다. 근거: [intent/20261109-signup-flow](../intent/20261109-signup-flow/intent.md)
- [ ] **글꼴:** `main`의 `Siempre 디자인.md`는 Noto Sans KR로 통일, `app/`과 이 문서는 Pretendard. 회원가입은 요청대로 Pretendard를 썼다. 하나로 정하기.
- [ ] **Primary 버튼 글자색:** 디자인 명세는 흰 글자인데 `#F375B4` 위 흰 글자는 대비 2.6:1. 회원가입은 `ink` 글자(6.5:1)를 썼다. 다른 화면도 맞출지 정하기.
- [ ] **Figma 원본 파일:** 디자인 명세는 `AubCFTLtVsf5tR5X50jjvt`, 회원가입 시안은 `gBNj0gHsS4457DHLWG7N0O`(확정용), 이 문서는 `3q4gIcPMPS5egzZuSr8WJc`를 가리킨다. 원본 하나를 정하기.

- [ ] **입점 AI: GPT인가 Claude인가?** PRD02는 GPT, 최근 Figma 시안은 Claude. 정해지면 `config/providers.ts`와 `config/routing.ts`만 고치면 된다.
- [ ] **Nano Banana 색:** 크레딧 화면은 회색, 최신 장바구니 시안은 노란색. Figma 기준으로 하나로 정하기.
- [ ] **음성·이미지 차감 크레딧:** 1,000자당 30, 1장당 11은 API 단가로 계산한 값. PRD03에 확정하기.
- [ ] **서비스 이름 표기:** Siempre로 확정인지.
