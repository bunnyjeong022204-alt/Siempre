# 실행·검증 기록: 회원가입 화면과 회원가입 API

상위: [의도](intent.md) · [명세](spec.md)

- 시작 SHA / 브랜치: `7129c3f` (`origin/app-structure`) / `feat/signup-flow`
- 변경 모듈: `app/src/{config,lib,api,state}/…signup…`, `app/src/components/signup/`, `app/src/pages/signup/`, `app/src/App.tsx`, `app/tailwind.config.js`, `app/vite.config.ts`, `server/`
- 통합 책임자: 미배정
- 상태: 구현·로컬 검증

| 단계 | 실행 내용·증거 | 결과·시각(KST) |
| --- | --- | --- |
| 구현 | 위 변경 모듈 (`feat/signup-flow` 첫 커밋) | 완료 · 2026-11-09 |
| 서버 검증 | `cd server && npm test` (Node 24.22.1, 매번 임시 DB) — 12개: 인증번호 틀림·5회 잠김·30초 재요청·3분 만료, 이메일 4가지 상태·다른 휴대폰 사유 숨김·인증 없음 401, 닉네임 예약어·중복·형식, 신규 가입·동의 수정·필수 철회 거부·토큰 재사용 거부, 30일 복귀 서버 재판정, 필수 약관·비밀번호·알 수 없는 약관·타입 오류 400, 배열·비JSON·비UTF-8·음수 Content-Length 400, 간편가입 state 쿠키 왕복·티켓 재사용·state 위조 거부 | 12/12 통과 |
| 프런트 빌드 | `cd app && npm run build` (`tsc --noEmit` + `vite build`) | 통과 |
| 브라우저 E2E | `server --db tmp/dev.db` + Vite(`VITE_SIGNUP_API=1`)로 실제 API 연결. 이메일 가입(복귀 회원): 인증번호 오답 → 정답, `blocked` 가입 불가 → "다시 입력", 수정 시 "다시 확인", `rejoin` 복귀 12일, 비밀번호 확인 입력 중 오류 없음, 닉네임 예약어·중복·통과, 필수 4개 남음 → 전체 동의 → 문자 해제 시 전체 동의 해제, 가입 완료(처음 가입일 표시), 동의 내용 수정 저장. 카카오 시연 간편가입: 티켓 주소창 제거, 비밀번호 칸 숨김, 이메일·닉네임 자동 확인, 완료 | 통과 |
| 화면 실측 | 1920×1080: 소개 패널 360×587, 카드 608 너비. 375×812: 가로 스크롤 없음, 글자 1.35배+serif에서도 넘침 0개, 버튼 높이 44·48·52. Pretendard 로드 확인(`document.fonts.check`) | 통과 |
| Figma | `확정용 > 회원가입 시안` 섹션(105:1640): 소개 패널 360px·카드 3개 같은 선/흰색·단계 표시, 상단바 GNB 축약, 카드 656px, 간편가입 로고·메일 아이콘 교체. **글꼴은 Noto Sans KR 유지**: 이 Figma 환경에서 Pretendard를 불러올 수 없음(`loadFontAsync` 실패, 글꼴 목록에 없음) | 일부 완료 · 스크린샷 확인 |
| 승인 | PR·리뷰 | 미승인 |
| 병합 | — | 미병합 |
| 배포 | — | 미배포 |

## 실행 방법

```bash
cd server && npm start                    # http://localhost:8787 (data/siempre.db)
cd app && echo VITE_SIGNUP_API=1 > .env.local && npm run dev   # http://localhost:5173/signup
```

`VITE_SIGNUP_API`를 비우면 서버 없이 화면 안의 가짜 응답으로 동작한다.

## 남은 일

- [ ] 팀 결정: 회원가입을 MVP 범위에 넣을지 (CLAUDE.md 6장) — 담당 미배정
- [ ] 팀 결정: 글꼴(Pretendard vs Noto Sans KR), Primary 버튼 글자색, Figma 원본 파일 — 담당 미배정
- [ ] 약관 문구 법무 검토
- [ ] 실제 문자 발송·OAuth 키 연결, IP 단위 요청 제한, 로그인·세션
- [ ] PR 리뷰·병합 (작성자는 자기 PR을 승인할 수 없음)
