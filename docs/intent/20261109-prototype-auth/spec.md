# 작업 명세: 로그인과 서비스 화면 연결

상위: [의도](intent.md)

| 요구 | 동작 | 수용 기준 | 검증 |
| --- | --- | --- | --- |
| PA-1 | 로그인·가입 후 이동 | `/` → 서비스 화면(`/siempre-figma-prototype.html`). 로그인 화면의 `?next=`가 HTML 페이지면 페이지를 새로 연다 | 브라우저 |
| PA-2 | 서비스 화면 로그인 확인 | 확인 중에는 화면을 가림. 로그인 안 했으면 `/login?next=/siempre-figma-prototype.html`, 가입 미완료(`profile_missing`)면 `/signup`, 서버 오류면 `/login` | 브라우저 (로그인 안 한 상태는 사람 확인) |
| PA-3 | 닉네임·로그아웃 | 상단바 `.user`의 "도윤 님"을 실제 닉네임, 아바타는 첫 글자. 로그아웃 버튼(44px) → Firebase `signOut` → `/login`. 다른 탭에서 로그아웃해도 로그인 화면으로 | 브라우저 (로그아웃은 사람 확인) |
| PA-4 | 서비스 화면 파일 | `<head>`에 `<script type="module" src="/src/bridge/prototypeAuth.ts">` 한 줄만 추가 | git diff |
| PA-5 | 빌드 | `vite build`가 `index.html`, `siempre-figma-prototype.html` 두 페이지를 만든다 | `npm run build` |

실행: [계획](plan.md)
