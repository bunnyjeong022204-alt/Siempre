# credits — 크레딧 (백엔드 B)

PRD 4-1(지급과 소멸), 5-4(크레딧 화면). 크레딧은 매주 월요일 0시(한국 시간)에 채워지고, 남은 크레딧은 이월되지 않아요.

## API

| 메서드 | 주소 | 요청 | 성공 응답 |
| --- | --- | --- | --- |
| GET | `/api/credits` | — | 이번 주 요약 (아래) |
| POST | `/api/credits/topup` | `{ provider, amount? }` | `{ ok: true, amount, summary }` (데모 충전) |

`GET /api/credits` 응답:
```json
{
  "weekStart": "2026-11-08T15:00:00Z",
  "nextGrantAt": "2026-11-15T15:00:00Z",
  "total": { "granted": 658, "used": 81, "left": 577 },
  "providers": [{ "provider": "gpt", "tier": "standard", "granted": 497, "used": 80, "left": 417, "requests": 4 }],
  "daily": [81, 0, 0, 0, 0, 0, 0],
  "lightThisWeek": 12,
  "recent": [{ "createdAt": "...", "type": "writing", "model": "GPT-6 Sol", "credits": -5, "task": "영상 대본 초안" }]
}
```
`daily`는 월요일부터 일요일까지 쓴 크레딧이에요.

## 규칙

- 지급량은 A의 `getSubscription(userId)`로 구성을 받아 PRD 4-1 기준으로 계산해요.
- 주가 바뀐 뒤 첫 요청 때 지난주 잔액을 버리고 새로 채워요 (예약 작업 없이도 동작).
- 차감과 기록은 한 번에 처리(트랜잭션)해서 숫자가 어긋나지 않게 해요.
- 크레딧이 모자라면 차감하지 않고 402 `insufficient_credits` + `{ provider, left, needed }`.
- "다른 모델로 다시 받기"를 해도 앞서 쓴 크레딧은 돌려주지 않아요. 기록에 `regenerate: true`만 남겨요.

## 다루는 테이블

`credit_wallets`, `usage_log`

## 다른 파트에 주는 것

- `onSubscriptionChanged(userId)` — A가 결제 직후 호출
- `spendCredits(userId, provider, amount, log)` — chat이 답변 후 호출

## 다른 파트에서 받는 것

- `requireUser` (auth, A), `getSubscription` (subscription, A)

## 오류 코드

`insufficient_credits`, `not_subscribed`, `login_required`

## 끝났는지 확인

- [ ] 결제 직후 이번 주 크레딧이 채워진다
- [ ] 차감하면 `left`가 줄고 `recent`에 기록이 생긴다
- [ ] 모자라면 402, 크레딧은 그대로
- [ ] 다음 주 월요일 0시(한국 시간)가 지나면 잔액이 새 지급량으로 바뀐다
