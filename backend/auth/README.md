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

## 다루는 테이블

`users`, `sessions`, `withdrawn_members` (소유표: [shared/README.md](../shared/README.md) 4장)

## 다른 파트에 주는 것

- `currentUser(request)`, `requireUser(request)` — 모든 파트가 로그인 확인에 써요. **가장 먼저 올려 주세요.**

## 오류 코드

`invalid_email`, `exists`, `nickname_taken`, `weak_password`, `terms_required`, `invalid_credentials`, `login_required`, `rate_limited`

## 끝났는지 확인

- [ ] 새 이메일 가입 → 로그인 → `/api/auth/me`에 닉네임이 나온다
- [ ] 같은 이메일로 다시 가입하면 `exists`
- [ ] 비밀번호 틀리면 401 `invalid_credentials`
- [ ] DB에 비밀번호가 평문으로 없다
- [ ] 로그아웃 후 `/api/auth/me`가 401
