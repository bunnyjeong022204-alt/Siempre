// Synthesizes an original 15s upbeat pop loop (120 BPM, C–G–Am–F) + transition whooshes. usage: node bgm.js out.wav
const fs = require('fs');
const SR = 44100, DUR = 17.7, N = Math.round(SR * DUR);
const L = new Float32Array(N), R = new Float32Array(N);
const TRANS = [3.1, 6.05, 9.55, 12.75];
const mf = m => 440 * Math.pow(2, (m - 69) / 12);
let seed = 7; const rnd = () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296 * 2 - 1;
const TAU = Math.PI * 2;

function add(t0, len, fn, gain = 1, pan = 0) {
  const s0 = Math.floor(t0 * SR), n = Math.floor(len * SR);
  const gl = gain * Math.cos((pan + 1) * Math.PI / 4), gr = gain * Math.sin((pan + 1) * Math.PI / 4);
  for (let i = 0; i < n; i++) {
    const k = s0 + i; if (k < 0 || k >= N) continue;
    const v = fn(i / SR); L[k] += v * gl; R[k] += v * gr;
  }
}
const BEAT = 0.5;
// chord roots (midi, octave 4) per 2s bar; last section resolves to C
const bars = [[60, 'C'], [55, 'G'], [57, 'Am'], [53, 'F'], [60, 'C'], [55, 'G'], [53, 'F']];
const triad = (root, name) => name.endsWith('m') ? [root, root + 3, root + 7] : [root, root + 4, root + 7];
function chordAt(t) {
  if (t >= 14) return triad(60, 'C');
  const [r, nm] = bars[Math.floor(t / 2)]; return triad(r, nm);
}

// pad
for (let b = 0; b < 8; b++) {
  const t0 = b * 2, len = b === 7 ? DUR - 14 : 2;
  const ch = chordAt(t0 + 0.01);
  ch.forEach((m, j) => {
    const f = mf(m);
    add(t0, len + 0.3, t => {
      const env = Math.min(1, t / 0.25) * Math.min(1, Math.max(0, (len + 0.3 - t) / 0.4));
      return env * (Math.sin(TAU * f * t) + 0.5 * Math.sin(TAU * f * 1.003 * 2 * t) + 0.3 * Math.sin(TAU * f * 0.997 * t));
    }, 0.035, j - 1);
  });
}
// pluck arpeggio on 8ths
for (let s = 0; s < 80; s++) {
  const t0 = s * BEAT / 2; if (t0 >= 15.5) break;
  const ch = chordAt(t0 + 0.01); const pat = [0, 1, 2, 1, 2, 0, 1, 2];
  const f = mf(ch[pat[s % 8]] + 12);
  add(t0, 0.35, t => {
    let v = 0; for (let k = 1; k <= 6; k++) v += Math.sin(TAU * f * k * t) / k * Math.exp(-t * (6 + k * 4));
    return v * Math.min(1, t / 0.004);
  }, 0.09, s % 2 ? 0.35 : -0.35);
}
// bass
for (let s = 0; s < 40; s++) {
  const t0 = s * BEAT; if (t0 >= 16) break;
  const f = mf(chordAt(t0 + 0.01)[0] - 24);
  [0, 0.25].forEach((o, j) => {
    if (j === 1 && s % 2 === 0) return;
    add(t0 + o, 0.4, t => (Math.sin(TAU * f * t) + 0.35 * Math.sin(TAU * 2 * f * t)) * Math.exp(-t * 5) * Math.min(1, t / 0.005), 0.28);
  });
}
// drums
for (let s = 0; s < 40; s++) {
  const t0 = s * BEAT; if (t0 >= 15.9) break;
  const intro = t0 < 2;
  // kick
  if (!intro || s % 2 === 0) {
    let ph = 0;
    add(t0, 0.35, t => { const f = 48 + 110 * Math.exp(-t * 28); ph += TAU * f / SR; return Math.sin(ph) * Math.exp(-t * 9); }, 0.55);
  }
  // clap on 2 & 4
  if (!intro && s % 2 === 1) {
    let prev = 0;
    add(t0, 0.25, t => { const x = rnd(); const hp = x - prev; prev = x; const burst = t < 0.03 ? (Math.floor(t / 0.01) % 2 ? 0.6 : 1) : 1; return hp * Math.exp(-t * 16) * burst; }, 0.13);
  }
  // hats on offbeats
  let p2 = 0;
  add(t0 + 0.25, 0.08, t => { const x = rnd(); const hp = x - p2; p2 = x; return hp * Math.exp(-t * 55); }, intro ? 0.03 : 0.05, 0.2);
}
// bell melody (bars 3–6)
const mel = [[4, 76], [4.5, 72], [5, 76], [5.5, 79], [6, 77], [6.5, 76], [7, 72], [7.5, 69],
             [8, 76], [8.5, 72], [9, 76], [9.5, 79], [10, 79], [10.5, 77], [11, 74], [11.5, 71]];
mel.forEach(([t0, m]) => {
  const f = mf(m);
  add(t0, 0.9, t => (Math.sin(TAU * f * t) + 0.35 * Math.sin(TAU * 2 * f * t) + 0.15 * Math.sin(TAU * 3.01 * f * t)) * Math.exp(-t * 3.2) * Math.min(1, t / 0.006), 0.11, 0.15);
});
// ending chime arpeggio when the logo appears
[84, 88, 91, 96].forEach((m, i) => {
  const f = mf(m);
  add(TRANS[3] + 0.1 + i * 0.11, 2.5, t => (Math.sin(TAU * f * t) + 0.25 * Math.sin(TAU * 2.76 * f * t) * Math.exp(-t * 6)) * Math.exp(-t * 1.6) * Math.min(1, t / 0.004), 0.1, (i - 1.5) * 0.3);
});
// whooshes on card transitions
TRANS.forEach(T => {
  let y = 0;
  add(T - 0.15, 0.6, t => {
    const p = t / 0.6, cut = 0.02 + 0.25 * Math.sin(Math.PI * p);
    y += cut * (rnd() - y);
    return y * Math.pow(Math.sin(Math.PI * p), 2);
  }, 0.5);
});

// master: fade in/out, soft clip, normalize
let peak = 0;
for (let i = 0; i < N; i++) {
  const t = i / SR, g = Math.min(1, t / 0.05) * Math.min(1, (DUR - t) / 1.2);
  L[i] = Math.tanh(L[i] * 1.2 * g); R[i] = Math.tanh(R[i] * 1.2 * g);
  peak = Math.max(peak, Math.abs(L[i]), Math.abs(R[i]));
}
const norm = 0.89 / peak;
const buf = Buffer.alloc(44 + N * 4);
buf.write('RIFF', 0); buf.writeUInt32LE(36 + N * 4, 4); buf.write('WAVEfmt ', 8);
buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(2, 22); buf.writeUInt32LE(SR, 24);
buf.writeUInt32LE(SR * 4, 28); buf.writeUInt16LE(4, 32); buf.writeUInt16LE(16, 34); buf.write('data', 36); buf.writeUInt32LE(N * 4, 40);
for (let i = 0; i < N; i++) {
  buf.writeInt16LE(Math.round(L[i] * norm * 32767), 44 + i * 4);
  buf.writeInt16LE(Math.round(R[i] * norm * 32767), 46 + i * 4);
}
fs.writeFileSync(process.argv[2], buf);
console.log('wrote', process.argv[2], 'peak', peak.toFixed(3));
