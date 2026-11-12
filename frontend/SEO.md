# Siempre SEO 작업 정리

- 배포 사이트: https://startling-bavarois-ac36bd.netlify.app
- 작업일: 2026-11-12
- 기준: SEO 실전 체크리스트 (기본 설정 · 콘텐츠 · 기술, 9개 항목)

| 영역 | 항목 | 상태 |
| --- | --- | --- |
| 기본 설정 | robots.txt 규칙 확인 | 완료 |
| | sitemap.xml 생성 및 제출 | 생성 완료, 제출은 직접 |
| | Google·네이버 도구 등록 | 직접 해야 함 ([7장](#7-직접-해야-할-일)) |
| 콘텐츠 | 페이지별 핵심 검색어 선정 | 완료 |
| | 제목과 본문에 검색어 반영 | 완료 |
| | 메타 제목·설명 검토 | 완료 |
| 기술 | 로딩 속도 측정 및 개선 | 개선 완료, 측정은 배포 뒤에 |
| | 모바일 반응형 확인 | 문제 없음 |
| | 이미지 대체 텍스트 점검 | 완료 |

---

## 1. robots.txt: 검색엔진에게 주는 출입 안내문

파일: [`public/robots.txt`](public/robots.txt)

**하는 일**
Google이나 네이버의 검색 로봇은 사이트에 오면 먼저 `/robots.txt`를 열어 봐요. 이 파일에는 어디까지 둘러봐도 되는지, 사이트 지도는 어디 있는지가 적혀 있어요. 원래 이 파일이 없어서 404가 났어요.

**넣은 내용**
```
User-agent: *          ← 모든 검색 로봇에게 하는 말
Allow: /               ← 사이트 전체를 둘러봐도 돼요
Disallow: /api/        ← 서버 통신 주소는 볼 필요 없어요
Sitemap: https://startling-bavarois-ac36bd.netlify.app/sitemap.xml   ← 사이트 지도 위치
```

**약관·가입 완료 화면을 여기서 막지 않은 이유**
robots.txt로 막으면 로봇이 그 화면에 아예 들어가지 않아요. 그러면 화면 안에 넣어 둔 "검색에 띄우지 마세요(`noindex`)" 표시도 읽지 못해서, 주소만 검색 결과에 남을 수 있어요. 그래서 이 두 화면은 화면 안에 `noindex`를 넣는 방식으로 처리했어요.

---

## 2. sitemap.xml: 검색엔진에게 주는 사이트 지도

파일: [`public/sitemap.xml`](public/sitemap.xml)

**하는 일**
"우리 사이트에서 검색에 올릴 페이지는 이거예요" 하고 목록을 알려 주는 파일이에요. 로봇이 링크를 따라다니며 찾지 않아도 바로 알 수 있어요.

**넣은 주소**

| 주소 | 중요도 | 이유 |
| --- | --- | --- |
| `/` | 1.0 (가장 높음) | 첫 화면. 소개 랜딩 페이지(`landing.html`)를 보여 줘요 |
| `/siempre-figma-prototype.html` | 0.8 | 구독·대화·크레딧이 있는 실제 서비스 화면 |
| `/signup` | 0.6 | 새로 오는 사람이 가입을 시작하는 곳 |
| `/login` | 0.4 | 기존 회원용 |

`landing.html`과 휴대폰용 `landing-app.html`은 대표 주소(canonical)를 `/`로 두어서 따로 넣지 않았어요. 화면을 새로 만들거나 크게 바꾸면 이 파일에 주소를 더하고 `lastmod` 날짜를 바꿔 주세요.

---

## 3. _redirects: 404 오류 해결

파일: [`public/_redirects`](public/_redirects)

**문제**
배포된 사이트에서 `/login`, `/signup`을 직접 입력하면 **404 오류**가 났어요. 검색 결과에서 눌러 들어온 사람도 오류 화면을 보게 되는 상황이었어요.

**해결**
Netlify 주소 규칙 파일을 추가했어요.
- `/login`, `/signup` 같은 주소를 직접 열어도 화면이 정상으로 떠요.
- `/`로 들어오면 주소는 그대로 두고 소개 랜딩 페이지(`landing.html`)를 보여 줘요. 휴대폰이면 랜딩 안의 스크립트가 앱 버전(`/landing-app.html`)으로 보내요. 규칙 끝의 `!`가 있어야 Netlify가 `index.html`보다 이 규칙을 먼저 써요.

---

## 4. 핵심 검색어

화면마다 검색어가 겹치지 않게 하나씩 정했어요.

| 화면 | 핵심 검색어 | 보조 검색어 |
| --- | --- | --- |
| 서비스 화면 | **AI 통합 구독** | AI 구독 서비스, Claude 구독, 여러 AI 한 번에 |
| 회원가입 | **Siempre 회원가입** | Siempre 가입 |
| 로그인 | **Siempre 로그인** | — |

Siempre는 새 서비스라 이름으로 검색하는 사람이 아직 거의 없어요. 그래서 메인 화면은 사람들이 실제로 찾는 일반적인 말("AI 통합 구독")로 정했어요.

**본문에도 반영했어요.** 서비스 화면 첫 문단 맨 앞에 이 문장을 넣었어요.
> Siempre는 필요한 AI만 묶어 쓰는 AI 통합 구독 서비스예요.

큰 제목(`h1`, "쓸 AI만 골라 담으세요")은 디자인 문구라서 그대로 뒀어요. 바꾼다면 예: "쓸 AI만 골라 담는 AI 통합 구독"

---

## 5. 메타 제목·설명: 검색 결과에 보이는 글

**하는 일**
검색 결과에 파란 글씨로 뜨는 게 **메타 제목**이고, 그 아래 회색 두세 줄이 **메타 설명**이에요.

| 화면 | 바꾸기 전 제목 | 바꾼 제목 |
| --- | --- | --- |
| 서비스 화면 | Siempre · 피그마 프로토타입 | AI 통합 구독 Siempre \| 쓸 AI만 골라 담기 |
| 회원가입 | Siempre 시작하기 · Siempre | Siempre 회원가입 \| 쓸 AI만 골라 담는 구독 |
| 로그인 | 로그인 · Siempre | Siempre 로그인 \| AI 통합 구독 |

**메타 설명 (140~180자)**

| 화면 | 설명 |
| --- | --- |
| 서비스 화면 | Siempre는 Claude·Qwen·Mistral·ElevenLabs·Nano Banana 중 쓸 AI만 골라 담는 AI 통합 구독 서비스예요. 대본·번역·음성·이미지 작업을 한 대화창에서 하면 요청마다 알맞은 AI가 자동으로 답해요. 사용량은 크레딧 지갑 하나로 관리하고, 결제 없이 무료로 먼저 써 볼 수 있어요. |
| 회원가입 | Siempre 회원가입. 이메일과 닉네임만 정하면 1분 만에 가입이 끝나요. 가입하면 Claude·Qwen·Mistral·ElevenLabs·Nano Banana 중 쓸 AI만 골라 담고, 한 대화창에서 대본·번역·음성·이미지 작업을 크레딧 하나로 이어갈 수 있어요. 무료 사용량으로 먼저 써 보세요. |
| 로그인 | Siempre 로그인. 가입한 이메일과 비밀번호로 로그인하면 담아 둔 AI와 이번 주 남은 크레딧을 바로 확인하고 대화를 이어갈 수 있어요. 크레딧은 매주 결제일과 같은 요일에 채워져요. 아직 계정이 없다면 이메일과 닉네임만으로 1분 만에 회원가입하세요. |

PC 검색 결과에서는 앞쪽 80~90자 정도만 보이고 나머지는 "…"로 잘려요. 그래서 핵심 검색어와 AI 이름을 문장 맨 앞에 두었어요. 잘린 뒷부분도 검색엔진은 읽어요.

**함께 넣은 것**
- **공유 미리보기(Open Graph)**: 카톡이나 SNS에 링크를 보내면 제목·설명·이미지가 카드로 보여요. 이미지는 1200×630 크기의 [`public/brand/og-image.png`](public/brand/og-image.png)(70KB)예요.
- **대표 주소(canonical)**: 같은 화면이 여러 주소로 열려도 검색엔진이 하나로 묶어서 보게 해요.
- **검색 제외(noindex)**: 약관 동의, 가입 완료 화면은 검색 결과에 안 나오게 했어요.

**검색엔진용 서비스 정보 (구조화 데이터)**
서비스 화면 `<head>`에 화면에는 안 보이는 JSON-LD 코드를 넣었어요. 사이트 이름(Siempre, 시엠프레), 로고, 서비스 설명, 무료로 써 볼 수 있다는 정보를 검색엔진이 정해진 형식으로 읽어요. Google 검색 결과에 사이트 이름과 로고가 제대로 나오는 데 도움이 돼요. 배포 후 https://search.google.com/test/rich-results 에 서비스 화면 주소를 넣으면 잘 읽히는지 확인할 수 있어요.

**고치는 곳**
- 회원가입·로그인 화면: [`src/config/auth.ts`](src/config/auth.ts)의 `PAGE_META`
- 서비스 화면: [`siempre-figma-prototype.html`](siempre-figma-prototype.html) 맨 위 `<head>`
- 기본값 (JavaScript를 읽지 않는 검색엔진용): [`index.html`](index.html)의 `<head>`

---

## 6. 기술 점검

| 항목 | 결과 |
| --- | --- |
| **로딩 속도** | 서비스 화면 코드 안에 썸네일 이미지 3장이 통째로 들어 있었어요. 이걸 [`public/demo/`](public/demo/) 파일로 빼서 **672KB → 90KB**로 줄었어요(약 7분의 1). 이미지는 실제로 보여줄 때만 받아요(`loading="lazy"`). 회원가입·로그인 화면에는 글꼴 서버 미리 연결(`preconnect`)도 넣었어요. |
| **모바일 반응형** | 휴대폰 화면 설정(`viewport`)과 앱 설치(PWA)가 이미 돼 있어서 고칠 게 없었어요. |
| **이미지 대체 텍스트** | 썸네일 설명을 "썸네일 시안 A"에서 "AI가 만든 유튜브 썸네일 시안 A"로 구체적으로 바꿨어요. 로고(심볼은 `alt=""`, 워드마크는 `alt="Siempre"`)는 원래 맞게 돼 있었어요. |

---

## 7. 직접 해야 할 일

### 배포
`frontend` 폴더에서 `npm run build`를 하고 `dist/` 폴더 전체를 Netlify에 올려요. 그 안에 `_redirects`, `robots.txt`, `sitemap.xml`, `demo/`가 같이 들어가야 해요.

배포한 뒤 확인할 것:

| 주소 | 정상이면 |
| --- | --- |
| `/robots.txt` | 위 1장의 4줄이 보여요 |
| `/sitemap.xml` | 주소 3개가 담긴 목록이 보여요 |
| `/login`, `/signup` | 404가 아니라 화면이 떠요 |
| `/` | 서비스 화면으로 바로 넘어가요 |

### Google Search Console (https://search.google.com/search-console)
1. 속성 추가 → **URL 접두어** 선택 → `https://startling-bavarois-ac36bd.netlify.app/` 입력
2. 소유 확인: **Google 애널리틱스** 선택. 배포된 사이트에 이미 GA 태그가 있어서 바로 확인돼요. 안 되면 **HTML 태그**를 골라 `<meta name="google-site-verification" ...>` 한 줄을 받아요.
3. 왼쪽 **Sitemaps** → `sitemap.xml` 입력 → 제출
4. **URL 검사**에 서비스 화면 주소를 넣고 **색인 생성 요청**

### 네이버 서치어드바이저 (https://searchadvisor.naver.com)
1. 웹마스터 도구 → 사이트 등록 → `https://startling-bavarois-ac36bd.netlify.app` 입력
2. 소유 확인: **HTML 태그** 선택 → `<meta name="naver-site-verification" ...>` 한 줄을 받아요.
3. 받은 태그를 [`siempre-figma-prototype.html`](siempre-figma-prototype.html)과 [`index.html`](index.html)의 `<head>`에 넣고 다시 배포한 뒤 **소유확인**
4. 요청 → **사이트맵 제출** → `https://startling-bavarois-ac36bd.netlify.app/sitemap.xml`
5. 요청 → **웹 페이지 수집**에 서비스 화면 주소 넣기

### 속도 측정
배포한 뒤 https://pagespeed.web.dev 에 서비스 화면 주소를 넣고 LCP 2.5초 이하, CLS 0.1 이하인지 확인해요.

---

## 바뀐 파일

| 파일 | 내용 |
| --- | --- |
| `public/robots.txt` | 새 파일. 검색 로봇 안내문 |
| `public/sitemap.xml` | 새 파일. 사이트 지도 |
| `public/_redirects` | 새 파일. 404 해결, `/` → 서비스 화면 301 |
| `public/demo/thumbnail-a·b·c.webp` | 새 파일. 서비스 화면에서 빼낸 썸네일 이미지 |
| `index.html` | 기본 메타 제목·설명, 공유 미리보기, 글꼴 미리 연결 |
| `siempre-figma-prototype.html` | 메타 제목·설명, 공유 미리보기, 첫 문단 검색어, 썸네일 파일 분리, alt |
| `src/config/auth.ts` | 화면별 제목·설명 목록(`PAGE_META`) |
| `src/components/auth/AuthLayout.tsx` | 화면이 바뀔 때 제목·설명·대표 주소·noindex를 바꿔 주는 코드 |
