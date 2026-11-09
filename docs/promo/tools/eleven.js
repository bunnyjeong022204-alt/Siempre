// usage:
//   node eleven.js voices                 -> list voices on the account
//   node eleven.js tts <voiceId> [speed]  -> writes vo/e1..e5.mp3
// API key is read from %USERPROFILE%\.elevenlabs_key (never printed)
const fs = require('fs');
const path = require('path');
const os = require('os');
const KEY = fs.readFileSync(path.join(os.homedir(), '.elevenlabs_key'), 'utf8').trim();
const API = 'https://api.elevenlabs.io';
const LINES = [
  'AI 쓸 때마다, 창을 옮겨 다니나요?',
  '쓸 AI만, 장바구니처럼 쏙!',
  '한 대화창에서, 알맞은 AI가 자동으로.',
  '남은 만큼 한눈에, 매주 새로 충전.',
  '쓸 AI만 골라 담고, 고르는 건 시엠프레가 할게요.',
];

(async () => {
  const [cmd, voiceId, speed = '1.1'] = process.argv.slice(2);
  if (cmd === 'voices') {
    const r = await fetch(`${API}/v2/voices?page_size=100`, { headers: { 'xi-api-key': KEY } });
    if (!r.ok) throw new Error(`voices ${r.status}: ${await r.text()}`);
    const j = await r.json();
    for (const v of j.voices) {
      const l = v.labels || {};
      console.log([v.voice_id, v.name, l.gender, l.age, l.accent, l.language, l.descriptive || l.description, v.category].filter(Boolean).join(' | '));
    }
    return;
  }
  if (cmd === 'tts') {
    fs.mkdirSync('vo', { recursive: true });
    for (let i = 0; i < LINES.length; i++) {
      const r = await fetch(`${API}/v1/text-to-speech/${voiceId}?output_format=mp3_44100_192`, {
        method: 'POST',
        headers: { 'xi-api-key': KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: LINES[i],
          model_id: 'eleven_multilingual_v2',
          language_code: 'ko',
          previous_text: LINES[i - 1],
          next_text: LINES[i + 1],
          voice_settings: { stability: 0.45, similarity_boost: 0.8, style: 0.25, use_speaker_boost: true, speed: +speed },
        }),
      });
      if (!r.ok) throw new Error(`tts line ${i + 1} ${r.status}: ${await r.text()}`);
      fs.writeFileSync(`vo/e${i + 1}.mp3`, Buffer.from(await r.arrayBuffer()));
      console.log('ok line', i + 1);
    }
  }
})().catch(e => { console.error(String(e.message || e).replace(KEY, '***')); process.exit(1); });
