# Siempre SEO 실전 체크리스트

사이트: https://siempreboomboom.netlify.app (Netlify)
작업일: 2026-11-12

## 기본 설정

### robots.txt 규칙 확인 — 완료
- [`public/robots.txt`](public/robots.txt)를 새로 만들었어요. 전체 수집을 허용하고, `/api/`만 막고, 사이트맵 주소를 적었어요.
- 약관·가입 완료 화면은 robots.txt로 막지 않고 화면 안에 `noindex`를 넣었어요. robots.txt로 막으면 검색엔진이 `noindex`를 읽지 못해서 주소만 검색에 남을 수 있기 때문이에요.

### sitemap.xml 생성 및 제출 — 생성 완료, 제출은 직접
- [`public/sitemap.xml`](public/sitemap.xml)에 공개할 주소 3개를 넣었어요.

| 주소 | 우선순위 | 이유 |
| --- | --- | --- |
| `/siempre-figma-prototype.html` | 1.0 | 구독·대화·크레딧이 있는 실제 서비스 화면 |
| `/signup` | 0.6 | 가입 시작 화면 |
| `/login` | 0.4 | 기존 회원용 |

- `/`는 서비스 화면으로 넘어가는 주소라 사이트맵에서 뺐어요.
- 원래 `/login`, `/signup`을 직접 열면 Netlify에서 404가 났어요. [`public/_redirects`](public/_redirects)를 추가해서 이 주소들도 열리게 했고, `/`는 서비스 화면으로 영구 이동(301)되게 했어요.

### Google·네이버 도구 등록 — 직접 해야 해요
계정 로그인과 소유 확인이 필요해서 직접 해야 해요. 순서는 이래요.

**Google Search Console** (https://search.google.com/search-console)
1. 속성 추가 → **URL 접두어** 선택 → `https://siempreboomboom.netlify.app/` 입력
2. 소유 확인 방법: **Google 애널리틱스** 선택. 배포된 사이트에는 이미 GA 태그(`G-24Y9P122NV`)가 있어서 바로 확인돼요. 안 되면 **HTML 태그**를 골라 `<meta name="google-site-verification" ...>` 한 줄을 받아 주세요.
3. 왼쪽 **Sitemaps** → `sitemap.xml` 입력 → 제출
4. **URL 검사**에 서비스 화면 주소를 넣고 **색인 생성 요청**

**네이버 서치어드바이저** (https://searchadvisor.naver.com)
1. 웹마스터 도구 → 사이트 등록 → `https://siempreboomboom.netlify.app` 입력
2. 소유 확인: **HTML 태그** 선택 → `<meta name="naver-site-verification" ...>` 한 줄을 받아 주세요.
3. 받은 태그를 [`siempre-figma-prototype.html`](siempre-figma-prototype.html)과 [`index.html`](index.html)의 `<head>`에 넣고 다시 배포한 뒤 **소유확인** 누르기
4. 요청 → **사이트맵 제출** → `https://siempreboomboom.netlify.app/sitemap.xml`
5. 요청 → **웹 페이지 수집**에 서비스 화면 주소 넣기

> HTML 태그를 받으면 알려 주세요. 넣는 작업은 바로 해 드릴게요.

## 콘텐츠

### 페이지별 핵심 검색어 선정 — 완료

| 화면 | 핵심 검색어 | 보조 검색어 |
| --- | --- | --- |
| 서비스 화면 (구독·대화) | **AI 통합 구독** | AI 구독 서비스, Claude 구독, 여러 AI 한 번에 |
| 회원가입 | **Siempre 회원가입** | Siempre 가입 |
| 로그인 | **Siempre 로그인** | — |

화면마다 검색어가 겹치지 않게 나눴어요. 새로 생긴 서비스라 "Siempre"만으로는 찾는 사람이 거의 없어서, 메인은 사람들이 실제로 찾는 일반어("AI 통합 구독")로 잡았어요.

### 제목과 본문에 검색어 반영 — 완료
- 서비스 화면 첫 문단 맨 앞에 "Siempre는 필요한 AI만 묶어 쓰는 **AI 통합 구독** 서비스예요."를 넣었어요.
- `h1`("쓸 AI만 골라 담으세요")은 디자인 문구라 그대로 두었어요. 바꾸고 싶으면 예: "쓸 AI만 골라 담는 AI 통합 구독"

### 메타 제목·설명 검토 — 완료

| 화면 | 메타 제목 | 메타 설명 |
| --- | --- | --- |
| 서비스 화면 | AI 통합 구독 Siempre \| 쓸 AI만 골라 담기 | Siempre는 Claude·Qwen·Mistral·ElevenLabs·Nano Banana 중 쓸 AI만 골라 담는 AI 통합 구독 서비스예요. 대본·번역·음성·이미지 작업을 한 대화창에서 하면 요청마다 알맞은 AI가 자동으로 답해요. 사용량은 크레딧 지갑 하나로 관리하고, 결제 없이 무료로 먼저 써 볼 수 있어요. (178자) |
| 회원가입 | Siempre 회원가입 \| 쓸 AI만 골라 담는 구독 | Siempre 회원가입. 이메일과 닉네임만 정하면 1분 만에 가입이 끝나요. 가입하면 Claude·Qwen·Mistral·ElevenLabs·Nano Banana 중 쓸 AI만 골라 담고, 한 대화창에서 대본·번역·음성·이미지 작업을 크레딧 하나로 이어갈 수 있어요. 무료 사용량으로 먼저 써 보세요. (168자) |
| 로그인 | Siempre 로그인 \| AI 통합 구독 | Siempre 로그인. 가입한 이메일과 비밀번호로 로그인하면 담아 둔 AI와 이번 주 남은 크레딧을 바로 확인하고 대화를 이어갈 수 있어요. 크레딧은 매주 결제일과 같은 요일에 채워져요. 아직 계정이 없다면 이메일과 닉네임만으로 1분 만에 회원가입하세요. (142자) |
| 회원가입·로그인 기본값 (`index.html`) | Siempre 회원가입·로그인 \| AI 통합 구독 | Siempre 회원가입·로그인. 쓸 AI만 골라 담는 AI 통합 구독 서비스예요. 이메일로 1분 만에 가입하고 Claude·Qwen·Mistral·ElevenLabs·Nano Banana를 한 대화창에서 크레딧 하나로 쓰세요. 요청마다 알맞은 AI가 자동으로 답하고, 무료로 먼저 써 볼 수 있어요. (167자) |
| 약관 동의·가입 완료 | (검색 제외 `noindex`) | 검색에는 안 나오지만 설명은 채워 뒀어요. |

- 설명은 검색엔진이 읽는 만큼 최대한 채웠어요. 검색 결과에서는 PC 기준 앞쪽 80~90자 정도만 보이고 뒤는 "…"로 잘려서, **핵심 검색어와 담을 수 있는 AI 이름을 맨 앞에** 두었어요.

- 예전 서비스 화면 제목은 "Siempre · 피그마 프로토타입"이라 검색 결과에 그대로 보였을 거예요.
- 공유했을 때 미리보기가 나오도록 Open Graph 태그(제목·설명·로고 이미지)도 넣었어요.
- 화면별 제목·설명은 [`src/config/auth.ts`](src/config/auth.ts)의 `PAGE_META`에서 고칠 수 있어요.

## 기술

### 로딩 속도 측정 및 개선 — 개선 완료, 측정은 배포 뒤에
- 서비스 화면 HTML 안에 썸네일 이미지 3장이 글자로 바뀌어 통째로 들어 있었어요(약 585KB). 이 이미지를 [`public/demo/`](public/demo/) 파일로 빼서 **HTML이 672KB에서 90KB로** 줄었어요(gzip 32KB). 이미지는 대화에서 썸네일을 보여줄 때만 받아요(`loading="lazy"`).
- 회원가입·로그인 화면에 글꼴 서버 미리 연결(`preconnect`)을 넣었어요.
- 배포한 뒤 https://pagespeed.web.dev 에 서비스 화면 주소를 넣고 LCP 2.5초 이하, CLS 0.1 이하인지 확인해 주세요.

### 모바일 반응형 확인 — 문제 없음
- 두 페이지 모두 `viewport` 메타 태그가 있고, 휴대폰 앱 화면(PWA)까지 이미 작업돼 있어요.

### 이미지 대체 텍스트 점검 — 완료
- 로고: 심볼은 `alt=""`(장식), 워드마크는 `alt="Siempre"`라 그대로 맞아요.
- 썸네일: "썸네일 시안 A" → "AI가 만든 유튜브 썸네일 시안 A"로 내용을 더 구체적으로 바꿨어요.

## 배포할 때 주의

지금 배포된 사이트는 예전 빌드라 `manifest.webmanifest`도 404예요. 이번 변경은 `frontend/`에서 `npm run build`를 하고 **`dist/` 폴더 전체**를 Netlify에 올려야 반영돼요. `_redirects`, `robots.txt`, `sitemap.xml`, `demo/`가 `dist/` 안에 같이 들어가야 해요.
