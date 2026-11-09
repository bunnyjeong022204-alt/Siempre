# Siempre

쓸 AI만 골라 담고, 한 대화에서 요청마다 알맞은 AI가 자동으로 답하는 AI 통합 구독 서비스.

## 바로 시작하기

```bash
cd app
npm install
npm run dev   # http://localhost:5173
```

회원가입 화면(`/signup`)을 실제 API로 확인하려면 서버를 함께 띄운다 (외부 패키지 없음, Node.js 22.13 이상).

```bash
cd server
npm start          # http://localhost:8787, 테스트는 npm test
# 다른 터미널에서
cd app
echo VITE_SIGNUP_API=1 > .env.local
npm run dev        # http://localhost:5173/signup
```

`VITE_SIGNUP_API`를 비워 두면 서버 없이 가짜 응답으로 동작한다. 자세한 내용: [`intent/20261109-signup-flow`](intent/20261109-signup-flow/intent.md)

AI 코딩 도구로 작업한다면 [`CLAUDE.md`](CLAUDE.md)를 먼저 읽게 해 주세요. 폴더 구조, 규칙, 작업 순서가 모두 들어 있습니다.

## 문서

| 문서 | 내용 |
| --- | --- |
| [PRD/PRD.md](PRD/PRD.md) | 제품 요구사항 |
| [SWOT.md](SWOT.md) | 강점·약점·기회·위협 |
| [docs/design.md](docs/design.md) | 색, 폰트, 컴포넌트, Figma 링크 |
| [docs/pricing.md](docs/pricing.md) | 요금표와 크레딧 계산식 |
| [docs/routing.md](docs/routing.md) | 요청 유형별 모델과 차감 크레딧 |
| [docs/tasks.md](docs/tasks.md) | 작업 목록과 열린 질문 |

## 폴더

- `app/` 메인 프런트엔드 (React + TypeScript + Tailwind)
- `server/` 회원가입 API (Node 내장 http + SQLite)
- `intent/` 작업별 의도·명세·검증 기록
- `web/` 이전 프로토타입 (참고용)
- `PRD/`, `docs/` 기획·설계 문서
