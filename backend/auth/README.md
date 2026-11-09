# auth — 회원가입·로그인 (백엔드 A)

PRD 5-0. 이메일과 비밀번호로 가입하고 로그인해요. 소셜 로그인, 비밀번호 찾기 메일은 MVP 범위 밖이에요 (PRD 8-1).

## API

| 메서드 | 주소 | 요청 | 성공 응답 |
| --- | --- | --- | --- |
| POST | `/api/auth/check-email` | `{ email }` | `{ status: "new" \| "exists" \| "rejoin", nickname? }` |
| POST | `/api/auth/check-nickname` | `{ nickname }` | `{ available: true }` 또는 `{ available: false, reason }` |
| POST | `/api/auth/signup` | `{ email, password, nickname, agreeTerms, marketing? }` | 201 `{ ok: true }` |
| POST | `/api/auth/login` | `{ email, password }` | `{ user }` + 세션 쿠키 |
| POST | `/api/auth/logout` | — | `{ ok: true }` + 쿠키 삭제 |
| GET | `/api/auth/me` | — | `{ user, subscribed }` (로그인 안 했으면 401) |

`user` = `{ id, email, nickname }`. 비밀번호 해시는 절대 응답에 넣지 않아요.

## 규칙

| 항목 | 규칙 |
| --- | --- |
| 이메일 | 앞뒤 공백 제거, 소문자로 저장. 형식이 틀리면 `invalid_email` |
| 닉네임 | 2~12자, 한글·영문·숫자만. 대소문자 구분 없이 하나만. 예약어(admin, 운영자 등) 불가 |
| 비밀번호 | 8자 이상, 영문·숫자 포함. 해시(bcrypt·scrypt 등)로만 저장 |
| 약관 | 필수 약관 동의가 없으면 `terms_required` |
| 이미 가입된 이메일 | 막지 않고 로그인 화면으로 안내 (`exists`) |
| 요청 제한 | `check-email`, `login`에 IP당 횟수 제한 (`rate_limited`) |
| 로그 | 요청 본문(비밀번호)을 로그에 남기지 않음 |

## 구현 메모 (2026-11-09, `feat/signup-flow`)

| 파일 | 내용 |
| --- | --- |
| `config.js` | 위 규칙 값 (닉네임 2~12자, 비밀번호 8~64자, 예약어, 세션 14일, 요청 제한) |
| `schema.js` | `users`, `sessions`, `withdrawn_members` 만들기 + 시연용 탈퇴 기록(`rejoin@siempre.test`, `SEED_DEMO=0`이면 안 넣음) |
| `validate.js` | 입력 검증 (저장할 형태로 정리: 이메일 소문자·공백 제거, 닉네임 공백 제거) |
| `service.js` | 가입·로그인 규칙. 비밀번호 scrypt, 세션 토큰은 `SESSION_SECRET`으로 HMAC 해시만 DB에 저장 |
| `routes.js` | 위 API 6개 등록, `currentUser`·`requireUser` 제공 |
| `test/auth.test.js` | "끝났는지 확인" 5개 + 입력 규칙·잘못된 요청·요청 제한 (`cd backend && npm test`) |

- `check-email`의 `nickname?`은 돌려주지 않아요. 이메일만으로 남의 닉네임을 알 수 있게 되기 때문이에요.
- 닉네임 형식이 틀리면 `check-nickname`은 `{ available: false, reason: "invalid" }`, `signup`은 400 `invalid_nickname`(새 코드)이에요. 예약어·중복은 `reason: "reserved" | "taken"`, 가입 때는 409 `nickname_taken`.
- 없는 이메일과 틀린 비밀번호는 같은 401 `invalid_credentials`로 답하고, 응답 시간도 비슷하게 맞춰요.
- 요청 제한(IP당 1분): `check-email` 20회, `login` 10회, `signup` 10회. 프록시 뒤에서는 `TRUST_PROXY=1`.
- `/api/auth/me`의 `subscribed`는 subscription 파트가 생기기 전까지 항상 `false`예요 (`shared/server.js`의 `getSubscription`).

## 다루는 테이블

`users`, `sessions`, `withdrawn_members` (소유표: [shared/README.md](../shared/README.md) 4장)

## 다른 파트에 주는 것

- `currentUser(request)`, `requireUser(request)` — 모든 파트가 로그인 확인에 써요. **가장 먼저 올려 주세요.**

## 오류 코드

`invalid_email`, `invalid_nickname`, `exists`, `nickname_taken`, `weak_password`, `terms_required`, `invalid_credentials`, `login_required`, `rate_limited` (+ 공통 `invalid_body`)

## 끝났는지 확인

- [ ] 새 이메일 가입 → 로그인 → `/api/auth/me`에 닉네임이 나온다
- [ ] 같은 이메일로 다시 가입하면 `exists`
- [ ] 비밀번호 틀리면 401 `invalid_credentials`
- [ ] DB에 비밀번호가 평문으로 없다
- [ ] 로그아웃 후 `/api/auth/me`가 401
