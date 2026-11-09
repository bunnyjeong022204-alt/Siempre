# CLAUDE.md — Siempre 작업 안내서

이 파일은 Claude(또는 다른 AI 코딩 도구)가 이 저장소에서 작업할 때 가장 먼저 읽는 안내서입니다.
사람도 같은 규칙을 따릅니다. 작업을 시작하기 전에 끝까지 읽어 주세요.

## 1. 서비스 한 줄 요약

Siempre는 쓸 AI만 장바구니처럼 골라 담고, 한 대화창에서 요청마다 알맞은 AI가 자동으로 답하는 AI 통합 구독 서비스다.
담은 사용량은 하나의 크레딧 지갑으로 합쳐지고, 크레딧은 매주 월요일에 채워지며 이월되지 않는다.

- 제품 요구사항: [`PRD/PRD.md`](PRD/PRD.md)
- 사용 시나리오: [`Siempre 유튜버 사용 시나리오 · MVP 화면 범위 (초안).md`](./Siempre%20유튜버%20사용%20시나리오%20·%20MVP%20화면%20범위%20(초안).md)
- 강점·약점: [`SWOT.md`](SWOT.md)

## 2. 폴더 구조

```
Siempre/
├── CLAUDE.md              ← 지금 이 파일 (작업 규칙)
├── README.md              ← 사람용 소개와 실행 방법
├── PRD/PRD.md             ← 제품 요구사항 (기획 문서, 코드보다 우선)
├── docs/
│   ├── design.md          ← 색, 폰트, 컴포넌트, Figma 링크
│   ├── pricing.md         ← 요금표, 묶음·연간 할인, 크레딧 계산식
│   ├── routing.md         ← 요청 유형별 모델과 차감 크레딧
│   └── tasks.md           ← 작업 목록 (담당자, 진행 상태)
├── app/                   ← ★ 메인 프런트엔드 (React + TypeScript + Tailwind)
│   └── src/
│       ├── config/        ← 바뀔 수 있는 값은 전부 여기 (AI 목록, 요금, 라우팅, 정책)
│       ├── lib/           ← 계산 로직 (화면과 분리된 순수 함수)
│       ├── state/         ← 앱 전체에서 쓰는 상태 (장바구니, 크레딧)
│       ├── components/    ← 재사용 UI 조각 (ui/, layout/, chat/, plans/, credits/)
│       ├── pages/         ← 화면 단위 (Chat, Plans, Credits)
│       ├── data/          ← 시연용 가짜 데이터
│       ├── api/           ← 백엔드 호출 (지금은 가짜 응답)
│       └── types.ts       ← 공통 타입
└── web/                   ← 이전 프로토타입 (참고용, 새 기능 넣지 않음)
```

## 3. 기술 스택

| 영역 | 사용 기술 |
| --- | --- |
| 화면 | React 18, TypeScript (strict), Vite |
| 스타일 | Tailwind CSS (색·간격은 `app/tailwind.config.js`의 토큰만 사용) |
| 화면 이동 | React Router |
| 상태 | React Context + hooks (Redux 등 추가 금지) |
| 백엔드 | MVP에서는 가짜 응답 (`app/src/api/`). 실제 API 키는 프런트에 절대 넣지 않음 |

## 4. 실행 방법

```bash
cd app
npm install
npm run dev        # http://localhost:5173
npm run build      # 배포용 빌드 + 타입 검사
npm run typecheck  # 타입 검사만
```

## 5. 작업 규칙 (꼭 지킬 것)

1. **값을 코드에 박지 않는다.** AI 이름, 가격, 차감 크레딧, 할인율, 색은 `app/src/config/`와 `tailwind.config.js`에만 둔다. 화면 코드는 그 값을 불러다 쓴다.
2. **계산은 `lib/`에서 한다.** 장바구니 금액, 할인, 주간 크레딧, 요청 분류는 `lib/`의 순수 함수로 만들고 화면에서는 호출만 한다.
3. **컴포넌트는 Figma 컴포넌트와 1:1로 맞춘다.** 이름도 맞춘다 (`PlanOptionCard`, `ModelChip`, `KpiTile` 등). 목록은 `docs/design.md`.
4. **기획과 코드가 다르면 기획(PRD)이 우선이다.** 다르다는 걸 발견하면 코드를 고치지 말고 `docs/tasks.md`의 "열린 질문"에 적는다.
5. **한 번에 한 화면, 한 작업만.** PR 하나에 여러 화면을 섞지 않는다.
6. **문구는 한국어, 해요체.** 버튼은 동사로 끝낸다 ("결제하기", "다시 받기").
7. **접근성 기본:** 클릭되는 것은 `<button>`이나 `<a>`, 누르는 영역 최소 44px, 아이콘만 있는 버튼에는 `aria-label`.
8. **이모지 금지.** 아이콘은 단순한 선 아이콘(SVG)만 쓴다.

## 6. MVP 범위

**만든다:** 구독 선택(장바구니), 데모 결제, 대화(자동 라우팅·모델 칩·예상 크레딧·다른 모델로 다시 받기), 크레딧 확인.
**안 만든다:** 회원가입·로그인, 실제 결제, 대화 검색, 설정, 팀 요금제, 모바일 앱, 관리자 화면 개편.
대화 화면 안에 음성 플레이어와 이미지 카드를 **답변 형태로** 넣는다. 새 화면을 만들지 않는다.

## 7. 새 작업을 시작할 때 순서

1. `docs/tasks.md`에서 맡은 작업을 찾고, 담당자에 이름을 적는다.
2. `main`에서 브랜치를 만든다: `feat/<화면>-<작업>` (예: `feat/chat-voice-player`)
3. 관련 문서(`docs/design.md`, `docs/pricing.md`, `docs/routing.md`)를 읽는다.
4. 바뀌는 값이 있으면 `config/`부터 고치고, 그다음 화면을 만든다.
5. `npm run build`가 통과하면 PR을 연다. PR 템플릿의 체크리스트를 채운다.

## 8. Claude에게 요청할 때 예시

> "https://github.com/gudals4360/Siempre 의 CLAUDE.md 규칙대로, docs/tasks.md의 '대화 · 음성 플레이어 답변 카드'를 만들어줘. 브랜치는 feat/chat-voice-player."

## 9. 아직 결정되지 않은 것

`docs/tasks.md`의 "열린 질문"을 확인한다. 특히 **입점 AI가 GPT인지 Claude인지**는 아직 확정되지 않았다.
지금 코드는 `app/src/config/providers.ts` 한 곳에서 바꿀 수 있게 되어 있다.
