# chat — 대화·자동 라우팅 (백엔드 B)

PRD 4-2(요청 유형별 차감), 4-3(비용 안전장치), 5-3(대화). 한 대화창에서 요청을 분류하고 알맞은 AI에 보내요.

## API

| 메서드 | 주소 | 요청 | 성공 응답 |
| --- | --- | --- | --- |
| POST | `/api/chat/estimate` | `{ text }` | `{ type, label, provider, model, credits }` 보내기 전 예상치 |
| POST | `/api/chat` | `{ messages, override? }` | 답변 + 메타 정보 (아래) |

- `messages`: 지금까지의 대화 `[{ role: "user" \| "assistant", content }]`. 마지막은 사용자 메시지.
- `override`: "다른 모델로 다시 받기" 때 `{ provider, model }`.

`POST /api/chat` 응답:
```json
{
  "text": "좋아요. 도입 15초는 질문으로 시작해 볼게요…",
  "meta": { "type": "writing", "label": "글쓰기", "provider": "gpt", "model": "GPT-6 Sol",
            "reason": "글쓰기 요청이라 자동 선택", "credits": 5 },
  "balance": { "provider": "gpt", "left": 412 },
  "alternatives": [{ "provider": "qwen", "model": "Qwen3.7-Plus", "credits": 1 }]
}
```

## 처리 순서

1. `requireUser` → `getSubscription`. 구독이 없으면 403 `no_subscription`.
2. 마지막 메시지를 요청 유형으로 분류 (PRD 4-2 표). 처음엔 규칙(키워드)으로, 나중에 Mistral Small 4 분류로 바꿔도 돼요.
3. 기본 모델의 AI를 담았으면 기본 모델, 아니면 대체 모델. 둘 다 없으면 409 `provider_missing` + `{ provider }`.
4. 차감량 확인. 모자라면 402 `insufficient_credits` (AI 호출 전에 막아요).
5. AI 공급사 API 호출. 앞 대화(`messages`)를 같이 보내 맥락을 이어요.
6. 성공하면 `spendCredits` → 응답. 실패하면 차감하지 않고 502 `provider_error`.

## 규칙

- 유형·모델·차감량 표는 **설정 파일 한 곳**에 PRD 4-2 그대로 옮겨요.
- 가벼운 대화는 차감 없이 하루 300회까지 (`light_limit`).
- 요청 1건 원가 ₩500 상한, 사용자 하루 원가 ₩3,000 알림 (PRD 4-3).
- AI 키는 서버 `.env`에만. 키가 없을 때는 가짜 답변을 돌려주는 데모 모드가 있으면 프론트엔드가 키 없이도 화면을 만들 수 있어요.
- 공급사별 호출 코드는 AI마다 파일 하나로 나눠요 (예: `providers/gpt`, `providers/qwen`, `providers/mistral`). AI가 바뀌어도 그 파일만 고치면 돼요.

## 다른 파트에서 받는 것

- `requireUser` (auth, A), `getSubscription` (subscription, A), `spendCredits` (credits, 같은 B)

## 오류 코드

`no_subscription`, `bad_messages`, `provider_missing`, `insufficient_credits`, `light_limit`, `provider_error`, `login_required`

## 끝났는지 확인

- [ ] "블로그 글 써줘" → 글쓰기 유형, 기본 모델
- [ ] 기본 모델 AI를 안 담았으면 대체 모델로 답한다
- [ ] 둘 다 안 담았으면 409 `provider_missing`
- [ ] 다시 받기(`override`)는 새로 차감되고 앞 차감은 그대로
- [ ] 공급사 오류 시 크레딧이 빠지지 않는다
