# subscription — 구독·데모 결제 (권희수)

PRD 5장(요금), 7-1(장바구니), 7-2(결제). 실제 결제는 MVP 범위 밖이라 **데모 결제**만 만들어요.

## API

| 메서드 | 주소 | 로그인 | 요청 | 성공 응답 |
| --- | --- | --- | --- | --- |
| GET | `/api/config` | 필요 없음 | — | 입점 AI 목록, 단계별 가격·이용량, 묶음 할인율 |
| POST | `/api/subscription/quote` | 필요 없음 | `{ cart, billing }` | 금액 계산 결과 (저장 안 함) |
| GET | `/api/subscription` | 필요 | — | `{ subscription: { cart, billing, monthly, charge } \| null }` |
| POST | `/api/subscription/checkout` | 필요 | `{ cart, billing, paymentMethod }` | `{ ok: true, quote }` |

- `cart` 예: `{ "claude": "standard", "qwen": "light", "mistral": "standard", "nanobanana": "free" }` (담지 않은 AI는 빼요)
- `billing`: `"monthly"` 또는 `"annual"`
- `paymentMethod`: `"naverpay"` 또는 `"card"` (데모, 실제 결제 없음). 무료 단계만 담았으면 생략

`quote` 응답:
```json
{
  "lines": [{ "provider": "claude", "tier": "standard", "price": 17900 }],
  "subtotal": 26300, "bundleRate": 0.1, "bundleDiscount": 2630,
  "monthly": 23670, "charge": 23670, "weeklyCredits": 658, "canStart": true
}
```

## 규칙

- 가격·이용량·묶음 할인율은 **설정 파일 한 곳**에 두고 PRD 5-1, 5-3 값을 그대로 옮겨요. 프론트엔드는 `/api/config`로 받아 써요.
- 금액 계산은 화면이 아니라 서버에서. PRD 5-4 예시(₩26,300 → ₩23,670)가 그대로 나와야 해요.
- 결제(`checkout`)가 끝나면 credits의 `onSubscriptionChanged(userId)`를 호출해 이번 주 크레딧을 채워요.
- 구성을 바꿔 다시 결제하면 기존 구독을 덮어써요 (회원당 구독 1개).

## 다루는 테이블

`subscriptions`, `subscription_items`

## 다른 파트에 주는 것

- `getSubscription(userId)` — chat·credits가 "담은 AI인지", "몇 크레딧을 줄지" 판단할 때 써요.

## 다른 파트에서 받는 것

- `requireUser` (auth), `onSubscriptionChanged` (credits)

## 오류 코드

`bad_tier`, `bad_billing`, `min_providers`, `login_required`

## 끝났는지 확인

- [ ] PRD 5-4 예시 구성의 견적이 ₩23,670
- [ ] 2개 담으면 5%, 3개 담으면 10% 할인
- [ ] 결제 후 `/api/subscription`에 구성이 나온다
- [ ] 결제 후 `/api/credits`에 이번 주 크레딧이 채워져 있다 (credits와 합친 뒤)
