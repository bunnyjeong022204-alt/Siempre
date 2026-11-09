# 작업 명세: MVP에서 구독 화면부터 보여 주기

상위: [의도](intent.md)

| 요구 | 동작 | 수용 기준 | 검증 |
| --- | --- | --- | --- |
| GF-1 | 첫 화면 | `/`는 로그인 여부와 상관없이 서비스 화면으로, 구독 선택이 보인다 | 브라우저 (로그인 안 한 상태) |
| GF-2 | 상단바 | 로그인 전: "로그인"(→ `/login?next=…`) · "회원가입"(→ `/signup`), 이름·아바타 숨김. 로그인 후: 닉네임·아바타·로그아웃(로그아웃해도 구독 화면에 남음) | 브라우저 |
| GF-3 | 시작할 때 로그인 | 로그인 전 `#start`, `#startFree`, 대화·크레딧 이동(`data-go`), 시연 E1·E2를 누르면 그 클릭을 막고 `/login?next=/siempre-figma-prototype.html` | 브라우저 |
| GF-4 | 구성 유지 | 위에서 막을 때 `{ action, state: { sel, cycle } }`를 sessionStorage `siempre:pending-start`에 저장(30분). 로그인 후 돌아오면 되살리고 동작을 이어서 실행, 저장값은 지움 | 브라우저 |
| GF-5 | 가입 미완료 | Firebase 계정만 있고 Siempre 가입을 안 끝냈으면 `/signup` | 이전 작업과 같음 |
| GF-6 | 화면 구조가 바뀌면 | `S`·`renderSub`가 없으면 구성 복원만 건너뛰고 오류 없이 동작 | 코드 (try/catch) |

실행: [계획](plan.md)
