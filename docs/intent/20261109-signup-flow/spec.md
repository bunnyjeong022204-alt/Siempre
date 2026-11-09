# 작업 명세: 회원가입·로그인

상위: [의도](intent.md) · API 원본: [backend/auth/README.md](../../../backend/auth/README.md)

## API (backend/auth, 오류는 `{ error: { code, message } }`)

| 요구 | 계약 | 수용 기준 | 검증 |
| --- | --- | --- | --- |
| AU-1 | `POST /api/auth/check-email {email}` → `{status: new·exists·rejoin}` | 형식 오류 400 `invalid_email`, 대소문자 무시, IP당 1분 20회 | `backend/auth/test` |
| AU-2 | `POST /api/auth/check-nickname {nickname}` → `{available}` / `{available:false, reason: invalid·reserved·taken}` | 2~12자 한글·영문·숫자, 예약어·중복 대소문자 무시 | test |
| AU-3 | `POST /api/auth/signup {email, password, nickname, agreeTerms, marketing?}` → 201 `{ok:true}` | `weak_password`(8자+영문+숫자), `terms_required`(true만 통과), 409 `exists`·`nickname_taken`, 400 `invalid_nickname`, `marketing`이 boolean이 아니면 400 | test |
| AU-4 | `POST /api/auth/login {email, password}` → `{user}` + HttpOnly 세션 쿠키 | 없는 이메일·틀린 비밀번호 모두 401 `invalid_credentials`, IP당 1분 10회 | test |
| AU-5 | `POST /api/auth/logout` → `{ok:true}` + 쿠키 삭제 | 이후 `me`가 401 | test |
| AU-6 | `GET /api/auth/me` → `{user, subscribed}` | 로그인 안 했거나 세션 14일 지나면 401 `login_required` | test |
| AU-7 | 공통 | 잘못된 JSON·배열·UTF-8 아님·숫자 아닌 Content-Length는 400 `invalid_body`, 없는 주소 404, 비밀번호는 scrypt 해시만, 로그는 경로·상태만 | test |

## 화면 (frontend)

| 요구 | 경로 | 수용 기준 | 검증 |
| --- | --- | --- | --- |
| FE-1 | `/signup` | 이메일 확인(바뀌면 확인 무효화, 오래된 응답 무시). `exists`면 막지 않고 "로그인하러 가기"(이메일 채워서). 비밀번호 체크리스트, 확인칸은 확실히 틀렸을 때만 오류. 닉네임 중복 확인, 한글 조합 중 값 안 바꿈 | 브라우저 |
| FE-2 | `/signup/terms` | 전체 동의, 필수 4개(분홍 왼쪽 선·`필수`) → `agreeTerms: true`, 선택 소식 받기 → `marketing`. 필수 남으면 버튼 비활성 + "필수 동의 N개 남았어요". 가입 성공 후 바로 로그인 | 브라우저 |
| FE-3 | `/signup/done` | 닉네임·이메일·소식 받기 요약, "구독 구성 시작하기" | 브라우저 |
| FE-4 | `/login` | 실패 시 서버 문구 표시·비밀번호 비움, 성공 시 `?next=`(같은 사이트 경로만) 또는 홈 | 브라우저 |
| FE-5 | 보호 화면 | 로그인 안 하면 `/login?next=…`, 새로고침해도 로그인 유지(`/api/auth/me`) | 브라우저 |
| FE-6 | 공통 | 소개 패널 360px(작은 화면은 제목 띠), 누르는 영역 44px, 375px 가로 스크롤 없음, 글자 1.35배에서도 넘침 없음, Pretendard | 브라우저 실측 |

## 데이터·보안 경계

- 테이블 소유: `users`·`sessions`·`withdrawn_members`는 A(auth) 소유 (shared/README.md 4장). 다른 파트는 `ctx.currentUser/requireUser`로만 회원을 받는다.
- 세션: 원문 토큰은 쿠키로만, DB에는 `SESSION_SECRET` HMAC 해시. `SESSION_SECRET`이 없으면 임시 키(재시작하면 로그아웃).
- ⚠️ `check-email`은 가입 여부를 알려 주므로 계정 열거에 쓰일 수 있다. PRD 5-0이 요구하는 동작이라 유지하고 IP 요청 제한으로 완화했다.
- 시연용 탈퇴 기록 `rejoin@siempre.test`는 실제 회원이 아니다. 운영에서는 `SEED_DEMO=0`.

## 승인·출시 조건

- 권희수가 shared/ 제안(언어·DB·포트)을 확인해야 한다.
- 약관 문구는 임시 값이다. 법무 검토 전 공개 금지.

실행: [계획](plan.md)

## Firebase 전환 후 계약 (2026-11-09, 위 AU-3~AU-6을 대체)

| 요구 | 계약 | 수용 기준 | 검증 |
| --- | --- | --- | --- |
| FB-1 | 로그인 필요 요청은 `Authorization: Bearer <Firebase ID 토큰>` | RS256 서명(구글 공개 인증서), `aud`=`FIREBASE_PROJECT_ID`, `iss`, `exp`·`iat`·`auth_time`, `sub` 확인. 하나라도 틀리면 401 `login_required` | test (가짜 키) |
| FB-2 | `POST /api/auth/signup {nickname, agreeTerms, marketing?}` + 토큰 → 201 `{user}` | 이메일은 토큰 값 사용(본문 무시), 같은 uid·이메일 409 `exists`, 닉네임·약관 규칙은 AU-2·AU-3과 같음 | test |
| FB-3 | `GET /api/auth/me` + 토큰 → `{user, subscribed}` | 가입 전 Firebase 계정은 404 `profile_missing`(+`email`) | test |
| FB-4 | 로그인·로그아웃 | 화면에서 Firebase(`signInWithEmailAndPassword`, `signOut`), 브라우저를 닫아도 로그인 유지 | 사람 확인 필요 |
| FB-5 | 가입 중 백엔드 저장 실패 | 방금 만든 Firebase 계정을 지워서 같은 이메일로 다시 가입 가능 | 사람 확인 필요 |
| FB-6 | 설정 누락 | 화면: "Firebase 설정이 없어요" 안내·버튼 비활성. 백엔드: 503 `auth_not_configured` | 브라우저·test |
