'use strict';
/*
 * Renders index-<theme>.html frame by frame with Playwright (Chromium) and pipes JPEG frames to FFmpeg.
 * Env: THEME (infographic|podcast, default podcast), WIDTH, FPS (30), OUT, START, END, AUDIO_VOLUME (1.0)
 */
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const { once } = require('events');
const { chromium } = require('playwright');

const ROOT = __dirname;
const THEMES = {
  infographic: { file: 'index-infographic.html', w: 1080, h: 1920 },
  podcast: { file: 'index-podcast.html', w: 1920, h: 1080 }
};
const THEME = (process.env.THEME || 'podcast').toLowerCase();
if (!THEMES[THEME]) { console.error('THEME must be infographic or podcast, got: ' + THEME); process.exit(1); }
const T = THEMES[THEME];
const WIDTH = parseInt(process.env.WIDTH || T.w, 10);
const FPS = parseInt(process.env.FPS || '30', 10);
const OUT = process.env.OUT || path.join('out', 'video-' + THEME + '.mp4');
const AUDIO_VOLUME = parseFloat(process.env.AUDIO_VOLUME || '1.0');
const SCALE = WIDTH / T.w;
const OUT_W = Math.round(T.w * SCALE / 2) * 2;
const OUT_H = Math.round(T.h * SCALE / 2) * 2;

function findFile(dir, base, exts) {
  for (const e of exts) {
    const p = path.join(ROOT, dir, base + '.' + e);
    if (fs.existsSync(p)) return p;
  }
  return null;
}
const rel = p => p ? path.relative(ROOT, p).split(path.sep).join('/') : null;

/* decode audio -> mono 22050 Hz s16le -> one RMS value per video frame (0..1, smoothed) */
async function analyzeAudio(file, fps) {
  const SR = 22050;
  const ff = spawn('ffmpeg', ['-v', 'error', '-i', file, '-ac', '1', '-ar', String(SR), '-f', 's16le', '-'], { stdio: ['ignore', 'pipe', 'inherit'] });
  const chunks = [];
  ff.stdout.on('data', c => chunks.push(c));
  const [code] = await once(ff, 'close');
  if (code !== 0) throw new Error('ffmpeg audio decode failed (' + code + ')');
  const buf = Buffer.concat(chunks);
  const n = Math.floor(buf.length / 2);
  const spf = SR / fps;
  const frames = Math.max(1, Math.floor(n / spf));
  const rms = new Float64Array(frames);
  for (let f = 0; f < frames; f++) {
    const a = Math.floor(f * spf), b = Math.min(n, Math.floor((f + 1) * spf));
    let s = 0;
    for (let i = a; i < b; i++) { const v = buf.readInt16LE(i * 2) / 32768; s += v * v; }
    rms[f] = Math.sqrt(s / Math.max(1, b - a));
  }
  const sorted = Array.from(rms).sort((x, y) => x - y);
  const p95 = sorted[Math.min(frames - 1, Math.floor(frames * 0.95))] || 1e-6;
  const env = new Array(frames);
  let y = 0;
  for (let f = 0; f < frames; f++) {
    const x = Math.min(1, rms[f] / Math.max(p95, 1e-6));
    y = y + (x - y) * (x > y ? 0.6 : 0.18);
    env[f] = Math.round(y * 1000) / 1000;
  }
  return env;
}

async function main() {
  const tsPath = path.join(ROOT, process.env.TIMESTAMPS || 'timestamps.txt');
  if (!fs.existsSync(tsPath)) throw new Error('timestamps.txt not found');
  const raw = fs.readFileSync(tsPath, 'utf8');

  const logo = findFile('assets', 'logo', ['png', 'jpg', 'jpeg', 'webp', 'svg']);
  const badge = findFile('assets', 'google-play-badge', ['png', 'webp', 'svg', 'jpg', 'jpeg']);
  const audio = findFile('.', 'audio', ['mp3', 'wav', 'm4a', 'aac']);
  if (!logo) console.warn('WARNING: assets/logo.* not found');
  console.log('theme=' + THEME + ' size=' + OUT_W + 'x' + OUT_H + ' fps=' + FPS + ' logo=' + rel(logo) + ' badge=' + rel(badge) + ' audio=' + rel(audio));

  const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
  try {
    const ctx = await browser.newContext({ viewport: { width: T.w, height: T.h }, deviceScaleFactor: SCALE });
    const page = await ctx.newPage();
    page.on('pageerror', e => console.error('PAGE ERROR:', e.message));
    page.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') console.log('[page ' + m.type() + ']', m.text(), m.location().url || ''); });
    await page.goto('file://' + path.join(ROOT, T.file));

    /* if the Bold TTF is missing, let weight 700 use the Regular file (synthetic bold) */
    const fdir = path.join(ROOT, 'assets', 'fonts');
    if (!fs.existsSync(path.join(fdir, 'SolaimanLipi-Bold.ttf')) && fs.existsSync(path.join(fdir, 'SolaimanLipi-Regular.ttf'))) {
      console.warn('WARNING: SolaimanLipi-Bold.ttf missing - using the Regular file for bold text');
      await page.addStyleTag({ content: "@font-face{font-family:'SolaimanLipi';src:url('assets/fonts/SolaimanLipi-Regular.ttf') format('truetype');font-weight:700;font-display:block}" });
    }

    const duration = await page.evaluate(([r, o]) => window.init(r, o), [raw, { logo: rel(logo), badge: rel(badge) }]);
    console.log('duration (page) = ' + duration + ' s');

    /* fonts */
    const fontReport = await page.evaluate(async () => {
      const fams = ['SolaimanLipi', 'Noto Serif', 'Noto Naskh Arabic', 'Noto Color Emoji'];
      for (const f of fams) {
        try { await document.fonts.load('40px "' + f + '"', 'আ A ع 😀'); await document.fonts.load('700 40px "' + f + '"', 'আ A ع 😀'); } catch (e) { /* ignore */ }
      }
      await document.fonts.ready;
      const faces = [];
      document.fonts.forEach(ff => faces.push(ff.family.replace(/["']/g, '') + ' ' + ff.weight + ' = ' + ff.status));
      return faces;
    });
    console.log('@font-face fonts: ' + (fontReport.join(' | ') || '(none)'));
    if (!fontReport.some(f => /^SolaimanLipi.*= loaded/.test(f))) {
      console.warn('WARNING: SolaimanLipi did NOT load (assets/fonts/SolaimanLipi-Regular.ttf missing?). Bengali text falls back to Noto Serif/Sans Bengali.');
    }
    /* images */
    await page.evaluate(async () => {
      await Promise.all(Array.from(document.images).map(im => im.complete && im.naturalWidth ? 0 : new Promise(res => { im.onload = im.onerror = res; })));
      await Promise.all(Array.from(document.images).map(im => im.decode ? im.decode().catch(() => { }) : 0));
    });
    const bad = await page.evaluate(() => Array.from(document.images).filter(im => !im.naturalWidth).map(im => im.getAttribute('src')));
    if (bad.length) console.warn('WARNING: images failed to load: ' + bad.join(', '));

    const sizes = await page.evaluate(() => window.fit());
    console.log('fit(): captions=' + JSON.stringify(sizes.captions) + ' arabic=' + JSON.stringify(sizes.arabic));

    /* audio envelope */
    if (audio) {
      const env = await analyzeAudio(audio, FPS);
      await page.evaluate(([e, f]) => window.setAudio(e, f), [env, FPS]);
      console.log('audio envelope: ' + env.length + ' frames from ' + rel(audio));
    } else console.log('no audio file found -> silent video');

    const START = parseFloat(process.env.START || '0');
    const END = Math.min(parseFloat(process.env.END || String(duration)), duration);
    const dur = END - START;
    if (!(dur > 0)) throw new Error('empty range START=' + START + ' END=' + END);
    const frames = Math.round(dur * FPS);

    fs.mkdirSync(path.dirname(path.resolve(OUT)), { recursive: true });
    const args = ['-y', '-v', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-'];
    if (audio) args.push('-stream_loop', '-1', '-ss', String(START), '-i', audio);
    args.push('-map', '0:v');
    if (audio) {
      const af = [];
      if (START === 0) af.push('afade=t=in:st=0:d=1.5');
      af.push('afade=t=out:st=' + Math.max(0, dur - 2).toFixed(3) + ':d=2', 'volume=' + AUDIO_VOLUME);
      args.push('-map', '1:a', '-af', af.join(','), '-c:a', 'aac', '-b:a', '192k');
    }
    args.push('-vf', 'scale=trunc(iw/2)*2:trunc(ih/2)*2', '-c:v', 'libx264', '-crf', '18', '-preset', 'medium', '-pix_fmt', 'yuv420p',
      '-movflags', '+faststart', '-r', String(FPS), '-t', dur.toFixed(3), OUT);
    const ff = spawn('ffmpeg', args, { stdio: ['pipe', 'inherit', 'inherit'] });
    let ffErr = null;
    ff.stdin.on('error', e => { ffErr = e; });
    const closed = once(ff, 'close');

    console.log('rendering ' + frames + ' frames (' + dur.toFixed(2) + ' s) ...');
    for (let i = 0; i < frames; i++) {
      const t = START + i / FPS;
      await page.evaluate(tt => window.seek(tt), t);
      const buf = await page.screenshot({ type: 'jpeg', quality: 95 });
      if (ffErr) break;
      if (!ff.stdin.write(buf)) await once(ff.stdin, 'drain');
      if (i % 60 === 0) console.log('frame ' + i + '/' + frames + '  t=' + t.toFixed(2) + 's');
    }
    ff.stdin.end();
    const [code] = await closed;
    if (code !== 0 || ffErr) throw new Error('ffmpeg failed (exit ' + code + (ffErr ? ', ' + ffErr.message : '') + ')');
    console.log('done -> ' + OUT + (audio ? ' (with audio)' : ' (silent)'));
  } finally {
    await browser.close();
  }
}

main().catch(e => { console.error('RENDER FAILED:', e && e.stack || e); process.exit(1); });
