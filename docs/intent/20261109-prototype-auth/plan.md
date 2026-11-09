# 실행·검증 기록: 로그인과 서비스 화면 연결

상위: [의도](intent.md) · [명세](spec.md)

- 브랜치: `feat/auth-prototype-bridge` (시작: `origin/web-structure` `d41a37e`, 권희수 님 최신 프로토타입 포함)
- 상태: 구현·로컬 검증

| 단계 | 실행 내용·증거 | 결과(KST 2026-11-09) |
| --- | --- | --- |
| 구현 | `frontend/src/bridge/prototypeAuth.ts`(새 파일), `siempre-figma-prototype.html` 한 줄, `vite.config.ts` 페이지 2개, `config/auth.ts` `SERVICE_PAGE`, `pages/GoToServicePage.tsx`, `LoginPage` HTML 페이지 이동, 임시 `HomePage` 삭제 | 완료 |
| 빌드 | `cd frontend && npm run build` → `dist/index.html`, `dist/siempre-figma-prototype.html` | 통과 |
| 브라우저 | 이미 로그인된 브라우저(요청자가 만든 계정)에서: `/` → 서비스 화면, 상단바에 실제 닉네임·첫 글자 아바타·로그아웃 버튼(71×44), "도윤" 문구 없음, 1440px에서 상단바 높이 67px 유지, 콘솔 오류 0 | 통과 |
| 미실행 | 로그인 안 한 상태로 서비스 화면 접근 → 로그인 이동, 로그아웃 버튼 → 로그인 화면 (요청자 계정의 로그인 상태를 지우지 않으려고 사람이 확인) | 미실행 |
| 승인·병합 | PR, 권희수 님 확인 (그 파일에 한 줄 추가) | 미승인 |

## 남은 일

- [ ] 로그아웃 → 로그인 화면, 로그인 안 한 상태로 서비스 화면 접근 확인 (사람)
- [ ] 권희수 님: HTML 한 줄 추가 확인
- [ ] 좁은 화면(768px 이하)에서는 권희수 님 CSS가 이름을 숨기고 사용자 영역이 둘째 줄로 내려간다 (기존 동작). 로그아웃 버튼 위치를 원하면 권희수 님과 맞춘다
