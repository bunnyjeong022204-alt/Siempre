# 작업 명세: 회원가입 화면과 회원가입 API

상위: [의도](intent.md) · [CLAUDE.md](../../CLAUDE.md)

## 화면 계약

| 요구 ID | 화면·경로 | 수용 기준 | 검증 위치 |
| --- | --- | --- | --- |
| SU-1 | 가입 방식 `/signup` | 이메일 가입 1개 + 간편가입 원형 버튼 3개(aria-label 포함). 간편가입에서 돌아오면 `#social=티켓`을 읽고 주소창에서 바로 지운다. `#social_error=…`는 안내 문구로 보여 준다 | plan: 브라우저 E2E |
| SU-2 | 본인 인증 `/signup/verify` | 이름·휴대폰(자동 하이픈) → 인증번호(6자리, 3분 타이머) → 확인. 틀리면 남은 횟수를 보여 준다. 이미 가입한 휴대폰이면 다음으로 못 간다 | 서버 테스트 + E2E |
| SU-3 | 계정 정보 `/signup/info` | 이메일 상태 `available / returning / rejoin_new / unavailable`. 값이 바뀌면 확인 완료가 풀린다. 오래된 응답은 버린다. 비밀번호 체크리스트(8~20자·영문·숫자·특수문자·공백 없음), 확인칸은 확실히 틀렸을 때만 오류. 닉네임 2~10자, 중복 확인, 한글 조합 중 값을 바꾸지 않음 | E2E |
| SU-4 | 약관 동의 `/signup/consent` | 전체 동의가 필수+선택을 한 번에 토글. 필수 4개(이용약관·개인정보·만 14세·외부 AI 전달)는 분홍 왼쪽 선 + `필수` 배지. 선택은 마케팅(이메일·문자). 필수가 남으면 버튼 비활성 + "필수 동의 N개 남았어요" | E2E |
| SU-5 | 완료 `/signup/done` | 닉네임·이메일·가입 방식·회원 구분(복귀면 처음 가입일)·소식 받기 요약. "동의 내용 수정"으로 돌아가 "변경 내용 저장" 가능 | E2E |
| SU-6 | 공통 | 360px 소개 패널(작은 화면에서는 제목 띠), 누르는 영역 44px 이상, 375px에서 가로 스크롤 없음, 글자 1.35배·다른 글꼴에서도 잘림 없음. 글꼴 Pretendard | E2E 실측 |

## API 계약 (`server/`, Vite가 `/api`를 넘겨 줌)

| 요청 | 성공 응답 | 대표 거부 |
| --- | --- | --- |
| `POST /api/verify/send {name, phone}` | `{requestId, expiresIn, demoCode?}` (`demoCode`는 문자 연동이 없을 때만) | 400 형식, 429 `TOO_SOON`(30초 안 재요청) |
| `POST /api/verify/confirm {requestId, code}` | `{verificationToken, expiresIn, alreadyMember}` | 400 `CODE_MISMATCH`+`attemptsLeft`, 410 만료(3분), 429 5회 초과 |
| `POST /api/email/check {email, verificationToken}` | `{status, daysLeft?, reason?}` | 401 인증 없음 |
| `GET /api/users/check-nickname?nickname=` | `{available, reason?: invalid·reserved·taken}` | — |
| `POST /api/signup {verificationToken, email, nickname, consents, password \| socialTicket}` | 201 `{userId, nickname, email, memberType, firstJoinedAt, socialProvider, consents, consentToken}` | 400 규칙·필수 약관, 401 인증·티켓, 409 이메일·닉네임·휴대폰·간편가입 중복 |
| `POST /api/consents {consentToken, consents}` | `{consents}` (필수 철회 불가) | 400, 401 만료(30분) |
| `GET /api/auth/{google·kakao·naver}/start` → `/callback` | `302 /signup#social=티켓` | `#social_error=denied·state·provider·already` |
| `POST /api/auth/ticket {ticket}` | `{provider, email, nickname}` | 401 사용됨·만료 |

## 모듈과 데이터 경계

- **이메일 상태 판정:** 본인 인증 토큰의 휴대폰과 탈퇴 기록의 휴대폰을 비교한다. 다르면 `rejoin_new`만 주고 사유·남은 일수는 주지 않는다. 가입 제한·이미 가입은 같은 `unavailable`로 답한다. ⚠️ 이메일 소유 확인 전에 탈퇴 이력을 알려 주는 것은 계정 열거 위험이 있어 정책 검토가 필요하다 (코드 주석 `server/lib/signup.js`).
- **가입 트랜잭션:** `BEGIN IMMEDIATE` 안에서 인증 토큰·이메일·닉네임·휴대폰·간편가입 계정을 다시 확인하고, 복귀/신규를 서버가 다시 계산한다. 중복은 DB `UNIQUE`(이메일·닉네임 NOCASE, 휴대폰, 제공사+계정)로도 막는다.
- **개인정보:** 비밀번호는 scrypt 해시, 인증번호·토큰·티켓은 SHA-256 해시만 저장한다. 로그에는 경로와 상태만 남긴다. 프런트는 비밀번호를 메모리에만 두고 가입 후 지운다.
- **간편가입 보안:** state는 서버 메모리 + HttpOnly 쿠키 둘 다 맞아야 통과, 한 번 쓰면 삭제. 티켓은 `#` 뒤로 전달, 1회용, 30분.
- **잘못된 요청:** 객체가 아닌 JSON, UTF-8이 아닌 본문, 숫자가 아닌 `Content-Length`, 중첩 값 타입 오류는 400 (500 아님).
- **값의 위치:** 화면 값은 `app/src/config/signup.ts`, 서버 값은 `server/lib/policy.js`. 두 곳을 같이 고쳐야 한다.
- **DB 이관:** SQLite 스키마는 Postgres로 옮기기 쉽게 관계형 제약만 썼다. 예전 DB 파일은 시작할 때 없는 컬럼을 `ALTER TABLE ADD COLUMN`으로 붙인다.
- **시연 데이터:** `rejoin@siempre.test`(18일 전 탈퇴, 010-1234-5678), `old@siempre.test`(45일 전 탈퇴), `blocked@siempre.test`, 닉네임 `도윤`(가입됨). 실제 회원 정보가 아니다.

## 승인 및 출시 조건

- 팀이 회원가입을 MVP 범위에 넣을지 결정해야 한다 (CLAUDE.md 6장과 충돌).
- 약관 문구는 임시 값이다. 법무 검토 전 공개 금지.
- 실제 문자 발송·OAuth 키 연결, 인증 요청 속도 제한(IP 단위), 로그인은 후속 작업이다.

실행: [계획](plan.md)
