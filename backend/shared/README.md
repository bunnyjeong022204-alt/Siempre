# shared — 공통 약속 (김형민·곽희수 함께)

두 사람이 같이 쓰는 코드와 약속을 두는 폴더예요. **여기 파일은 상대방 승인 없이 고치지 않아요.**

## 1. 정해야 할 것 (1일차에 채우기)

| 항목 | 결정 | 정한 날짜 |
| --- | --- | --- |
| 언어·프레임워크 | **제안:** Node.js 22.13 이상, 내장 `http`만 사용 (설치 패키지 없음) — 곽희수 확인 필요 | 2026-11-09 제안 |
| DB | **제안:** SQLite(`node:sqlite`) → 나중에 PostgreSQL — 곽희수 확인 필요 | 2026-11-09 제안 |
| 로그인 방식 | **Firebase Authentication** (이메일/비밀번호). 화면이 `Authorization: Bearer <Firebase ID 토큰>`을 보내고 auth가 확인 | 2026-11-09 제안 |
| 서버 주소·포트 | `http://localhost:8787` (프런트 Vite가 `/api`를 넘겨 줌) — 곽희수 확인 필요 | 2026-11-09 제안 |

> 위 "제안"은 회원가입 PR(`feat/signup-flow`)에서 auth를 돌리려고 먼저 올린 값이에요. 규칙 2번대로 곽희수가 확인한 뒤 확정해요.

### 지금 올라간 공통 코드

| 파일 | 내용 |
| --- | --- |
| `server.js` | 서버 시작, 파트별 라우트 등록 한 줄씩, 오류를 2장 형식으로 변환, 로그는 경로·상태만 |
| `router.js` | `router.get/post(경로, 처리함수)`. 같은 주소를 두 파트가 붙이면 시작할 때 오류 |
| `db.js` | `DATABASE_URL`로 SQLite 열기, 예전 DB에 없는 컬럼 붙이기 |
| `errors.js` | `ApiError(status, code, message, extra)` → `{ error: { code, message, ... } }` |
| `http.js` | JSON 본문 읽기(잘못된 본문·인코딩·Content-Length는 400 `invalid_body`), 쿠키, 요청 IP |
| `../.env.example`, `../package.json` | 환경 변수 이름, `npm start` / `npm test` |

파트 처리함수는 `{ status?, body, headers? }`를 돌려주면 돼요. 다른 파트에서는 `ctx.requireUser(req)`, `ctx.currentUser(req)`로 로그인 회원을 받아요.

## 2. 응답·오류 형식

모든 API가 같은 모양으로 답해요. 프론트엔드는 `error.code`로 화면을 나눠요.

성공:
```json
{ "user": { "id": 1, "nickname": "편집하는고래" } }
```

실패:
```json
{ "error": { "code": "insufficient_credits", "message": "이번 주 크레딧이 부족해요.", "left": 3, "needed": 5 } }
```

| HTTP | 언제 | 예시 code |
| --- | --- | --- |
| 400 | 입력이 잘못됨 | `invalid_email`, `weak_password`, `min_providers` |
| 401 | 로그인 안 함 / 비밀번호 틀림 | `login_required`, `invalid_credentials` |
| 402 | 크레딧 부족 | `insufficient_credits` |
| 403 | 구독 안 함 | `no_subscription` |
| 409 | 겹침 / 담지 않은 AI | `exists`, `nickname_taken`, `provider_missing` |
| 429 | 요청이 너무 많음 | `rate_limited`, `light_limit` |
| 500·502 | 서버·AI 공급사 오류 | `server_error`, `provider_error` |

- `message`는 사용자에게 그대로 보여 줄 한국어 해요체 문장.
- 새 code를 만들면 자기 파트 README의 "오류 코드" 표에 추가.

## 3. 파트끼리 주고받는 함수

이름은 언어에 맞게 바꿔도 되지만 **입력과 출력은 이대로** 지켜요.

| 함수 | 만드는 사람 | 쓰는 사람 | 입력 → 출력 |
| --- | --- | --- | --- |
| `currentUser(request)` | 김형민 (auth) | 모두 | 요청 → 로그인한 회원 `{ id, email, nickname }` 또는 없음. **async** (`await ctx.currentUser(req)`) |
| `requireUser(request)` | 김형민 (auth) | 모두 | 요청 → 회원. 없으면 401 `login_required`. **async** |
| `getSubscription(userId)` | 곽희수 (subscription) | 곽희수 (chat·credits) | 회원 id → `{ claude: 'standard', qwen: 'free', ... }` 담은 AI와 단계. 구독 안 했으면 없음 |
| `onSubscriptionChanged(userId)` | 곽희수 (credits) | 곽희수 (subscription) | 결제·구성 변경 직후 subscription이 호출 → credits가 이번 주 크레딧을 새 구성으로 채움 |
| `spendCredits(userId, provider, amount, log)` | 곽희수 (credits) | 곽희수 (chat) | 크레딧 차감. 모자라면 402 `insufficient_credits` |

곽희수는 김형민의 함수가 준비되기 전까지 같은 모양의 가짜 함수를 써요. 파트를 넘는 약속은 맨 위 두 줄뿐이고, 나머지는 곽희수 파트 안의 약속이에요.

## 4. DB 테이블 소유표

자기 테이블만 만들고 고쳐요. 남의 테이블은 **읽기만** 하고, 읽을 때도 가능하면 위 3장의 함수를 써요.

| 테이블 | 소유 | 내용 |
| --- | --- | --- |
| `users` | 김형민 | 회원 (Firebase uid, 이메일, 닉네임, 약관·마케팅 동의). 비밀번호는 Firebase가 보관 |
| ~~`sessions`~~ | 김형민 | 쓰지 않음 (로그인 상태는 Firebase가 유지) |
| `withdrawn_members` | 김형민 | 탈퇴 회원 (재가입 안내용) |
| `subscriptions` | 곽희수 | 회원당 구독 1개 (결제 주기, 결제액) |
| `subscription_items` | 곽희수 | 구독에 담은 AI와 단계 |
| `credit_wallets` | 곽희수 | AI별 이번 주 크레딧 (지급·충전·사용) |
| `usage_log` | 곽희수 | 요청 기록 (모델, 차감 크레딧, 시간) |

모든 테이블에서 회원은 `user_id`(= `users.id`)로 가리켜요.

## 5. 공통 규칙

- **시간:** DB에는 UTC로 저장. "이번 주"는 사용자마다 다르다. 결제일과 같은 요일 0시(한국 시간)부터 7일 (PRD 4-1).
- **가격·차감량 같은 숫자:** 코드 곳곳에 쓰지 말고 설정 파일 한 곳에 모아요. 요금은 `subscription/` 설정, 차감량·모델은 `chat/` 설정. PRD가 바뀌면 그 파일만 고쳐요.
- **환경 변수 이름:** 아래를 기준으로 `.env.example`에 적어요.

| 이름 | 쓰는 파트 | 내용 |
| --- | --- | --- |
| `PORT` | 공통 | 서버 포트 |
| `DATABASE_URL` | 공통 | DB 위치 |
| `FIREBASE_PROJECT_ID` | auth | Firebase 프로젝트 ID (토큰 확인). 화면은 `frontend/.env.local`의 `VITE_FIREBASE_*` |
| `OPENAI_API_KEY` 등 AI 키 | chat | 입점 AI별 키 (PRD 3-1의 AI마다 하나) |

## 6. 이 폴더에 올라갈 코드 (예정)

- 서버 시작 파일 (파트별 라우트 등록 한 줄씩)
- DB 연결
- 오류 응답 도우미 (2장 형식)
- `.env.example`
