# backend

백엔드는 두 명이 파트를 나눠 만듭니다. **각자 자기 폴더 안에서만 작업**하면 병합할 때 충돌이 거의 나지 않아요.

## 담당 나누기

| 파트 | 폴더 | 담당 | API 주소 | 문서 |
| --- | --- | --- | --- | --- |
| 회원가입·로그인 | `auth/` | 백엔드 A (이름: ____) | `/api/auth/*` | [auth/README.md](auth/README.md) |
| 구독·데모 결제 | `subscription/` | 백엔드 A | `/api/subscription/*`, `/api/config` | [subscription/README.md](subscription/README.md) |
| 대화·자동 라우팅 | `chat/` | 백엔드 B (이름: ____) | `/api/chat/*` | [chat/README.md](chat/README.md) |
| 크레딧 | `credits/` | 백엔드 B | `/api/credits/*` | [credits/README.md](credits/README.md) |
| 공통 약속 | `shared/` | A·B 함께 | — | [shared/README.md](shared/README.md) |

- **A는 "사람과 돈"**: 누가 가입했고 무엇을 구독했는지.
- **B는 "사용"**: 요청을 어느 AI에 보내고 크레딧을 얼마나 빼는지.
- B는 A가 만든 함수 두 개(로그인 사용자 확인, 구독 구성 조회)만 불러 써요. 서로 주고받는 함수는 [shared/README.md](shared/README.md) 3장에 적혀 있어요.

## 폴더 구조 (예정)

```
backend/
├── README.md          ← 지금 이 파일 (분담·병합 규칙)
├── shared/            ← 공통: 서버 시작, DB 연결, 오류 형식, 인증 확인. 둘이 합의해서만 고친다
├── auth/              ← A: 회원가입·로그인 코드 + 이 파트의 DB 테이블
├── subscription/      ← A: 구독·데모 결제 코드 + 이 파트의 DB 테이블
├── chat/              ← B: 대화·라우팅·AI 호출 코드
└── credits/           ← B: 크레딧 지갑 코드 + 이 파트의 DB 테이블
```

각 폴더의 README에 그 파트가 만들 API, 다루는 데이터, 다른 파트와 주고받는 것이 적혀 있어요.

## 병합하기 쉽게 하는 규칙

1. **자기 폴더만 고친다.** 다른 사람 폴더의 파일을 고쳐야 하면 직접 고치지 말고 그 사람에게 요청한다.
2. **`shared/`는 따로 작은 PR로.** 공통 파일을 바꾸는 PR에는 다른 기능을 섞지 않고, 상대방 승인을 받은 뒤 합친다.
3. **DB 테이블은 파트별 소유.** 자기 테이블은 자기 폴더의 스키마 파일에만 정의한다. 소유표는 [shared/README.md](shared/README.md) 4장.
4. **서버에 라우트를 붙이는 곳은 한 줄씩.** 서버 시작 파일(`shared/`)에는 파트별로 "라우트 등록" 한 줄만 둔다. 각자 자기 줄만 건드리니 충돌이 안 난다.
5. **브랜치 이름:** `backend/<파트>-<작업>` (예: `backend/auth-signup`, `backend/chat-routing`).
6. **API 모양을 바꾸면 문서부터.** 요청·응답 형식이 바뀌면 그 파트 README의 표를 먼저 고치고, 프론트엔드 담당에게 알린다.
7. **비밀 값은 올리지 않는다.** API 키는 `.env`에만. 이름은 `.env.example`에 적는다.

## 작업 순서

1. **1일차, 둘이 같이:** `shared/README.md`의 미정 항목(언어·프레임워크, DB 종류)을 정하고, 서버 시작·DB 연결·오류 형식을 `shared/`에 먼저 올린다.
2. **A:** `auth` → `subscription` 순서로. 로그인 사용자 확인 함수와 구독 구성 조회 함수를 일찍 올려 주면 B가 기다리지 않아요.
3. **B:** A의 함수가 오기 전에는 가짜 함수(항상 테스트 사용자, 고정 구독 구성)로 `chat`과 `credits`를 먼저 만든다.
4. **합치기:** 가짜 함수를 A의 진짜 함수로 바꾸고, 가입 → 구독 → 대화 → 크레딧 확인 흐름을 같이 시험한다.

기획 기준은 [`docs/PRD.md`](../docs/PRD.md)예요. 기획과 코드가 다르면 PRD를 따르고, 애매하면 PRD 9장 "열린 질문"에 적어 주세요.
