# 디자인 기준

**Figma가 원본이다.** 이 문서와 Figma가 다르면 Figma를 따르고, 이 문서를 고친다.

## Figma 파일

| 파일 | 내용 |
| --- | --- |
| [클로드 simpre](https://www.figma.com/design/3q4gIcPMPS5egzZuSr8WJc) | 구독 선택(장바구니), 대화, 크레딧, 관리자 화면 + 공용 컴포넌트 |
| [피그마 확인 캔버스 · Page 2](https://www.figma.com/design/HpjGEGRrFwSqTpooC3Vbdt) | 크레딧 확인 웹 화면 (핑크 테마) |
| [siempre · 확정용](https://www.figma.com/design/gBNj0gHsS4457DHLWG7N0O) | Color(키 컬러 색상1~4), 회원가입 시안 섹션 + `SU/*` 컴포넌트 |

## 색 (Tailwind 토큰)

코드에서는 hex를 직접 쓰지 않고 토큰 이름을 쓴다. 정의는 `app/tailwind.config.js`.

| 토큰 | 값 | 쓰는 곳 |
| --- | --- | --- |
| `brand` | #F375B4 | 주요 버튼, 강조 카드, 오늘 막대 |
| `brand-soft` | #F7D0E4 | 선택된 메뉴, 안내 띠, 보조 카드 |
| `lavender` | #EDE3ED | 테두리, 막대 배경, 회색 카드 |
| `surface` | #FFFFFF | 카드, 화면 배경 |
| `ink` | #1E1A22 | 본문 글자 |
| `ink-sub` | #5E5563 | 보조 글자 |
| `page` | #F5EDF1 | 페이지 배경 (bg/page) |
| `accent` | #D63F8C | 큰 강조 숫자 (흰 바탕 대비 4.2:1이라 작은 글자에는 쓰지 않음) |
| `line` | #D9DCE3 | 입력칸·보조 버튼 테두리 (border/default) |
| `ink-muted` / `ink-placeholder` | #8A8090 / #B5ADB9 | 캡션 / 입력 안내 글자 |
| `danger` / `danger-soft` | #C92A2A / #FFE3E3 | 오류 글자 / 오류 안내 배경 |
| `success` | #1F6B3A | 확인 완료 글자 |

분홍(`brand`) 바탕 위 글자는 `ink`만 쓴다. 흰 글자(2.6:1)와 `ink-sub`(2.7:1)는 대비가 부족하다.

### AI별 색

밝은 색(`bg`)은 배경·막대에, 진한 색(`ink`)은 그 위의 글자에 쓴다. 밝은 색만으로는 글자가 잘 안 보인다.

| AI | bg | ink |
| --- | --- | --- |
| Claude | #FED9CE | #9A3B1F |
| Qwen | #B8CEFE | #2B4BA8 |
| Mistral | #B6FDC9 | #1F6B3A |
| ElevenLabs | #D7B5DA | #6B2F72 |
| Nano Banana | #D5D5D5 | #3F3F46 |

값은 `app/src/config/providers.ts`에 있다. Figma 최신 시안에서 Nano Banana를 노란색으로 바꿨다면 여기와 설정 파일을 함께 고친다.

## 글자

- 폰트: **Pretendard** (없으면 Noto Sans KR → 시스템 폰트)
- 크기: 제목 32 / 섹션 20 / 카드 제목 17 / 본문 15 / 보조 13 / 캡션 12 (px)

## 컴포넌트 (Figma ↔ 코드)

| Figma 컴포넌트 | 코드 위치 | 설명 |
| --- | --- | --- |
| Plan option | `components/plans/PlanOptionCard.tsx` | 안 씀/라이트/스탠다드/헤비 선택 칸 (꺼짐·켜짐) |
| Model chip | `components/ui/ModelChip.tsx` | 답변 아래 AI 이름 칩 (AI별 색) |
| KPI tile | `components/ui/StatCard.tsx` | 숫자 요약 카드 |
| Side link | `components/layout/AppShell.tsx` | 내비게이션 링크 |
| — | `components/ui/ProgressBar.tsx` | 크레딧 막대 |
| — | `components/plans/CartSummary.tsx` | 장바구니 요약 (항목, 할인, 결제액) |
| — | `components/chat/ReplyMeta.tsx` | 모델 칩 + 이유 + 크레딧 + 다시 받기 |
| — | `components/chat/Composer.tsx` | 입력창 + 예상 크레딧 + 더 꼼꼼하게 |

### 회원가입 (`/signup`, 근거: [intent/20261109-signup-flow](../intent/20261109-signup-flow/spec.md))

| Figma 컴포넌트 | 코드 위치 | 설명 |
| --- | --- | --- |
| SU/Header + SU/Aside | `components/signup/SignupLayout.tsx`, `SignupAside.tsx` | 상단바, 360px 소개 패널(카드 3개 같은 선·같은 색, 단계 표시) |
| SU/Button | `components/signup/SignupControls.tsx` `PrimaryButton` | 분홍 배경 + ink 글자, 비활성은 lavender |
| SU/Mini Button | `SignupControls.tsx` `MiniButton` | 입력칸 옆 확인 버튼 (기본·비활성·완료) |
| SU/Field | `SignupControls.tsx` `Field` | 라벨·입력·옆 버튼·안내 문구 (min-height, 줄바꿈 허용) |
| SU/Checkbox | `SignupControls.tsx` `Checkbox` | 약관 체크 |
| — | `components/signup/SocialIcons.tsx` | 구글·카카오·네이버 로고 (브랜드 가이드 색, 선 아이콘 규칙 예외) |

## 기본 규칙

- 버튼과 누르는 영역은 최소 44px
- 카드 모서리 16~24px, 테두리 1px `lavender`
- 이모지 금지, 아이콘은 선 아이콘 SVG
- 색만으로 뜻을 전하지 않는다 (숫자나 글자를 함께 표시)
