// usage: node render.js <html> <out.mp4> [stillsDir]
const puppeteer = require('puppeteer-core');
const ffmpeg = require('ffmpeg-static');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const { pathToFileURL } = require('url');

const [html, out, stills] = process.argv.slice(2);
const FPS = 30;

(async () => {
  const browser = await puppeteer.launch({
    executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    headless: true,
    args: ['--allow-file-access-from-files', '--force-color-profile=srgb'],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1080, height: 1920, deviceScaleFactor: 1 });
  await page.goto(pathToFileURL(path.resolve(html)).href + '?render', { waitUntil: 'networkidle0' });
  await page.evaluate(() => document.fonts.ready);
  const fontOk = await page.evaluate(() => document.fonts.check('900 40px "Pretendard Variable"'));
  console.log('Pretendard loaded:', fontOk);
  const dur = await page.evaluate(() => window.DURATION);
  const total = Math.round(dur * FPS);

  if (stills) {
    fs.mkdirSync(stills, { recursive: true });
    for (const t of [1.9, 4.9, 9.2, 11.8, 14.5]) {
      await page.evaluate(t => render(t), t);
      await page.screenshot({ path: path.join(stills, `t${t}.png`) });
    }
    console.log('stills done');
    if (!out) { await browser.close(); return; }
  }

  const ff = spawn(ffmpeg, ['-y', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-',
    '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-preset', 'slow', '-crf', '18', '-movflags', '+faststart', out],
    { stdio: ['pipe', 'ignore', 'inherit'] });
  for (let f = 0; f < total; f++) {
    await page.evaluate(t => render(t), f / FPS);
    const buf = await page.screenshot({ type: 'jpeg', quality: 95 });
    if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
    if (f % 90 === 0) console.log(`frame ${f}/${total}`);
  }
  ff.stdin.end();
  await new Promise(r => ff.on('close', r));
  await browser.close();
  console.log('done', out);
})().catch(e => { console.error(e); process.exit(1); });
