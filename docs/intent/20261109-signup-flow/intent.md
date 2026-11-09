# 작업 의도: 회원가입·로그인 (frontend + backend/auth)

- 작성일 / 실제 변경 기간(KST): 2026-11-09 / 2026-11-09
- 상태: 구현·로컬 검증 (PR 미승인, 미병합, 미배포)
- 작성 주체 / 인간 책임자: Claude Code(요청자 김형민의 지시) / 미배정 (backend/README.md의 "백엔드 A" 이름 칸이 비어 있음)
- 기준 문서: [PRD 5-0, 8-1](../../PRD.md) · [backend/README.md](../../../backend/README.md) · [backend/auth/README.md](../../../backend/auth/README.md) · [backend/shared/README.md](../../../backend/shared/README.md) · [frontend/README.md](../../../frontend/README.md)

## 문제와 기대 효과

- PRD 5-0이 회원가입·로그인을 MVP P0로 넣었고, 저장소가 `frontend/`·`backend/<파트>/` 구조로 바뀌었다.
- 같은 브랜치(`feat/signup-flow`)의 첫 구현(`feebc8f`)은 이전 구조(`app/`, `server/`)와 이전 범위(휴대폰 본인인증·간편가입)로 만들어져 새 구조·새 PRD와 맞지 않았다.
- 성공 판단: auth/README.md "끝났는지 확인" 5개가 자동 검사로 통과하고, 화면에서 가입 → 자동 로그인 → 로그아웃 → 로그인이 실제 API로 끝까지 된다. 근거는 [plan.md](plan.md).

## 범위와 비목표

**범위**
- `backend/shared/`: 서버 시작(파트별 라우트 등록 한 줄), 라우터, DB 연결, 오류 형식, 요청 도우미 — auth를 돌리려면 필요해서 함께 올렸다. 규칙 2번상 B 확인이 필요하다.
- `backend/auth/`: README 표의 API 6개, `users`·`sessions`·`withdrawn_members`, `currentUser`·`requireUser`
- `frontend/`: 회원가입 3단계(계정 정보 → 약관 동의 → 완료), 로그인, 로그인 필요 화면 보호(`RequireAuth`), 임시 홈

**이전 구현에서 뺀 것 (PRD 8-1 범위 밖)**
- 휴대폰 본인인증, 소셜 로그인(구글·카카오·네이버) — 이전 커밋 `feebc8f`에 코드가 남아 있다.
- 가입 후 "동의 내용 수정" — auth API 표에 없다.

**비목표**: 비밀번호 찾기 메일, 구독·대화·크레딧 화면(다른 담당), 실제 배포.

## 근거와 결정

- 시작점: `origin/web-structure`(`9a3c838`)를 `feat/signup-flow`에 병합(`dbbbf1d`)한 뒤 새 구조로 다시 구현.
- 백엔드 언어·DB: shared/README.md 1장이 비어 있어 Node.js 내장 `http` + SQLite(`node:sqlite`)로 **제안**했다 (이전에 요청자가 고른 방식). B 확인 전까지 확정 아님.
- 글꼴은 요청대로 Pretendard. `main`의 `Siempre 디자인.md`는 Noto Sans KR로 적혀 있어 다르다 (Figma에서는 Pretendard를 불러올 수 없어 시안은 Noto Sans KR).
- Primary 버튼 글자: 디자인 명세는 흰색이지만 `#F375B4` 위 흰 글자는 대비 2.6:1이라 ink(6.5:1)를 썼다.
- `check-email` 응답의 `nickname?`은 이메일만으로 남의 닉네임이 드러나므로 돌려주지 않는다.

다음: [명세](spec.md) → [계획](plan.md)
