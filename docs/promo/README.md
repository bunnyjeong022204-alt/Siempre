# Siempre 홍보 영상 (카드뉴스형)

인스타 릴스·유튜브 쇼츠용 세로 영상이에요. 카드 5장이 넘어가며 메인 문구를 나레이션으로 읽어요.

| 파일 | 내용 |
| --- | --- |
| [`siempre-promo.mp4`](siempre-promo.mp4) | **최종 영상** · 1080×1920 · 30fps · 17.7초 · 나레이션 + 배경음악 |
| [`siempre-promo.html`](siempre-promo.html) | 영상 원본(HTML 애니메이션). 브라우저로 열면 반복 재생 |
| [`나레이션_대본.md`](나레이션_대본.md) | ElevenLabs에 넣은 대본과 추천 설정 (타이밍표는 15초 기획 기준) |
| `voice/anna_kim.mp3` | ElevenLabs 녹음 원본 (Anna Kim · Tender, Calm and Clear) |
| `assets/` | 로고 마크·워드마크 |
| `tools/` | 다시 만들 때 쓰는 스크립트 (렌더링, 배경음악 합성, ElevenLabs 생성) |

## 최종 타이밍

| 카드 | 화면 | 넘어가는 시점 | 나레이션 |
| --- | --- | --- | --- |
| 1 | 문제 제기 · 창 3개 | 0초 | 0.3초 "에이아이 쓸 때마다, 창을 옮겨 다니나요?" |
| 2 | 골라 담기 · 장바구니 | 3.1초 | 3.6초 "쓸 에이아이만, 장바구니처럼 쏙!" |
| 3 | 대화 · 자동 라우팅 | 6.05초 | 6.5초 "한 대화창에서, 알맞은 에이아이가 자동으로." |
| 4 | 크레딧 · 매주 충전 | 9.55초 | 9.95초 "남은 만큼 한눈에, 매주 새로 충전." |
| 5 | 엔딩 · 로고 | 12.75초 | 13.1초 "쓸 에이아이만 골라 담고, 고르는 건 시엠프레가 할게요." (17.0초 끝) |

- 화면 전환 시점은 `siempre-promo.html`의 `const T = [...]`, 전체 길이는 `DURATION`에 있어요.
- 배경음악은 `tools/bgm.js`로 직접 합성한 곡이라 저작권 문제가 없어요. 전환 효과음 시점은 `TRANS`에 있고, HTML의 `T`와 같아야 해요.
- 나레이션이 나올 때 배경음악이 자동으로 작아져요(ffmpeg sidechaincompress).
- 상업 광고로 쓰려면 ElevenLabs 유료 플랜에서 생성한 음성이어야 해요.

## 다시 만들기

Node.js와 Chrome이 필요해요. `tools/` 폴더에서 실행해요.

```bash
npm i puppeteer-core@23.11.1 ffmpeg-static@5.2.0
```

1. 영상(무음) 렌더링: `node render.js ../siempre-promo.html video.mp4`
2. 배경음악 합성: `node bgm.js bgm.wav`
3. 나레이션 배치: 녹음을 문장별로 잘라 각 시작 시점에 놓기 (ffmpeg `atrim` + `adelay`), `loudnorm=I=-16`
4. 믹스: 배경음악 `volume=0.5` → 나레이션으로 `sidechaincompress=threshold=0.03:ratio=6` → 나레이션과 `amix` → `alimiter=limit=0.89`
5. 합치기: `ffmpeg -i video.mp4 -i mix.wav -map 0:v -map 1:a -c:v copy -c:a aac -b:a 192k -shortest out.mp4`

ElevenLabs API로 다시 생성할 때는 `tools/eleven.js`를 써요. API 키는 `%USERPROFILE%\.elevenlabs_key` 파일에서 읽고, 저장소에는 올리지 않아요.
