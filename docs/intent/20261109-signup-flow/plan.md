# 실행·검증 기록: 회원가입·로그인

상위: [의도](intent.md) · [명세](spec.md)

- 브랜치: `feat/signup-flow` (PR [#9](https://github.com/gudals4360/Siempre/pull/9))
- 커밋: `feebc8f`(이전 구조 첫 구현) → `dbbbf1d`(web-structure 병합, 이전 코드 정리) → 이 문서가 들어간 커밋(새 구조 재구현)
- 통합 책임자: 미배정
- 상태: 구현·로컬 검증

| 단계 | 실행 내용·증거 | 결과(KST 2026-11-09) |
| --- | --- | --- |
| 구현 | `backend/shared/*`, `backend/auth/*`, `frontend/*` | 완료 |
| 백엔드 검사 | `cd backend && npm test` (Node 24.22.1, 임시 DB) — 9개: 가입→로그인→me→로그아웃, 재가입 `exists`, `invalid_credentials` 같은 응답, 세션 14일 만료, `rejoin`·`invalid_email`, 닉네임 형식·예약어·중복(대소문자), `weak_password`·`terms_required`·`nickname_taken`·`marketing` 타입, 400 `invalid_body` 4종·404, 로그인 요청 제한 429와 해제 | 9/9 통과 |
| 프런트 빌드 | `cd frontend && npm run build` (`tsc --noEmit` + `vite build`) | 통과 |
| 브라우저 | backend(임시 DB) + Vite. `/` → `/login?next=/`; 가입: 형식 오류, `rejoin`, 새 이메일, 비밀번호 규칙, 확인칸 입력 중 오류 없음, 닉네임 예약어·12자 통과, 필수 4개 남음 → 체크, 가입 → 자동 로그인 → 완료 → 홈; 로그아웃 → `/login`; 이미 가입 이메일 → "로그인하러 가기"(이메일 채움); 틀린 비밀번호 → 오류·비밀번호 비움; 로그인 → 홈; 새로고침 후 로그인 유지; `document.cookie`에서 세션 쿠키 안 보임 | 통과 |
| 화면 실측 | 1440×900: 소개 패널 360×519, 카드 608. 375×812: 페이지 가로 스크롤 없음(넘침으로 잡힌 3개는 화면 읽기용 `sr-only` 글자), 글자 1.35배+serif 동일 | 통과 |
| 승인 | — | 미승인 |
| 병합·배포 | — | 미병합·미배포 |

## 남은 일

- [ ] 권희수: shared/ 제안 확인 (언어·DB·포트)
- [x] auth 담당자 배정: 김형민 (web-structure `2a02079`)
- [ ] Figma 회원가입 시안을 3단계 흐름(본인 인증·간편가입 제거)으로 정리
- [ ] 글꼴(Pretendard vs Noto Sans KR)·Primary 버튼 글자색 팀 결정
- [ ] 약관 문구 법무 검토, 운영 `FIREBASE_PROJECT_ID`·`SEED_DEMO=0`, Firebase 승인 도메인에 배포 주소 추가
- [ ] 실제 Firebase로 가입·로그인·로그아웃 확인 (사람)
- [ ] 권희수와 바뀐 auth 계약(토큰 방식, async requireUser) 합의

## Firebase 전환 검증 (2026-11-09)

| 단계 | 실행 내용·증거 | 결과 |
| --- | --- | --- |
| 백엔드 검사 | `cd backend && npm test` — 9개: 토큰 → 가입 전 `profile_missing` → 가입(토큰 이메일 사용) → me, 재가입·다른 uid 같은 이메일 `exists`, 토큰 10종 거부(없음·형식·만료·다른 aud·다른 iss·빈 sub·미래 iat·다른 키 서명·모르는 kid·HS256), 이메일·닉네임 규칙, 약관·마케팅 타입, 400 `invalid_body`·404, 요청 제한 429, `FIREBASE_PROJECT_ID` 없음 503 | 9/9 통과 |
| 공개 인증서 | 구글 `securetoken@system.gserviceaccount.com` 인증서 실제로 받기 | 키 2개 받음 |
| 프런트 빌드 | `npm run build` (firebase 10.14.1 추가) | 통과 |
| 브라우저 | Firebase 값 없이: `/` → `/login?next=/`, 로그인·가입 화면에 설정 안내, 버튼 비활성, 이메일·닉네임 확인은 동작, 새 탭 콘솔 오류 0 | 통과 |
| 실제 Firebase | `.env.local`·`.env` 값을 넣고 가입 → 로그인 → 새로고침 유지 → 로그아웃 | **미실행** (값이 아직 없음, 사람이 확인) |
