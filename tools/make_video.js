// Films the deck slide by slide in real time, each slide held for its narration, with its arrival
// animations, then muxes the narration into an MP4.
// Usage: node tools/make_video.js [out.mp4] [--only id1,id2]   (default: build/from-chat-to-agent.mp4)
// Needs: build/audio/en/<id>.wav + durations.json (tools/narrate.py), ffmpeg on the PATH.
// Frames come from Chrome's screencast (JPEG, sent only when the page changes), resampled to 30 fps
// as symlinks in seq/; every slide lasts HOLD_BEFORE + narration + HOLD_AFTER seconds.
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const { openDeck } = require('./browser');

const ROOT = path.resolve(__dirname, '..');
const args = process.argv.slice(2);
const onlyAt = args.indexOf('--only');
const only = onlyAt >= 0 ? args[onlyAt + 1].split(',') : null;
const outFile = path.resolve(args[0] && !args[0].startsWith('--') ? args[0] : path.join(ROOT, 'build', 'from-chat-to-agent.mp4'));
const AUDIO = path.join(ROOT, 'build', 'audio', 'en');
const WORK = path.join(ROOT, 'build', 'video');
const HOLD_BEFORE = 0.6, HOLD_AFTER = 1.0, SILENT = 6.0, FPS = 30;
const sleep = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  fs.rmSync(WORK, { recursive: true, force: true });
  fs.mkdirSync(path.join(WORK, 'frames'), { recursive: true });
  fs.mkdirSync(path.join(WORK, 'seq'), { recursive: true });
  const durations = JSON.parse(fs.readFileSync(path.join(AUDIO, 'durations.json')));
  const order = JSON.parse(fs.readFileSync(path.join(ROOT, 'deck', 'slides', 'order.json')));
  const { browser, page } = await openDeck();

  const cdp = await page.context().newCDPSession(page);
  let frames = [], n = 0, seq = 0;
  cdp.on('Page.screencastFrame', async ({ data, metadata, sessionId }) => {
    const file = path.join(WORK, 'frames', `f${String(n++).padStart(6, '0')}.jpg`);
    fs.writeFileSync(file, Buffer.from(data, 'base64'));
    frames.push({ file, t: metadata.timestamp });
    cdp.send('Page.screencastFrameAck', { sessionId }).catch(() => {});
  });

  const audio = [];
  for (const id of only ? order.filter(x => only.includes(x)) : order) {
    const i = order.indexOf(id);
    const voice = durations[id] || 0;
    const dur = Math.round((voice > 0 ? HOLD_BEFORE + voice + HOLD_AFTER : SILENT) * FPS) / FPS;
    // Park on a neighbour first so arriving on the slide replays its animations
    await page.evaluate(i => Reveal.slide(i === 0 ? 1 : i - 1), i);
    await sleep(400);
    await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 92, maxWidth: 1920, maxHeight: 1080, everyNthFrame: 1 });
    await sleep(150);         // the first frame is the neighbour slide: drop it
    frames = [];
    const t0 = Date.now() / 1000;
    await page.evaluate(i => Reveal.slide(i), i);
    await sleep(dur * 1000);
    await cdp.send('Page.stopScreencast');
    const kept = frames.filter(f => f.t >= t0 - 0.05);
    if (!kept.length) {       // static page, no frame sent: take one
      const file = path.join(WORK, 'frames', `f${String(n++).padStart(6, '0')}.jpg`);
      await page.screenshot({ path: file, type: 'jpeg', quality: 92 });
      kept.push({ file, t: t0 });
    }
    kept[0].t = t0;
    // Output frame j links to the latest screencast frame at or before j/30 s, so each slide lasts
    // exactly dur * 30 frames and the picture cannot drift from the voice.
    let k = 0;
    for (let j = 0; j < Math.round(dur * FPS); j++) {
      while (k + 1 < kept.length && kept[k + 1].t - t0 <= j / FPS) k++;
      fs.symlinkSync(kept[k].file, path.join(WORK, 'seq', `${String(seq++).padStart(6, '0')}.jpg`));
    }
    audio.push({ file: voice > 0 ? path.join(AUDIO, `${id}.wav`) : null, dur });
    console.log(id, dur.toFixed(1), 's,', kept.length, 'frames');
  }
  await browser.close();

  // Narration track: each slide's WAV delayed by HOLD_BEFORE and padded to the slide's length
  const parts = audio.map(({ file, dur }, k) => {
    const dest = path.join(WORK, `a${String(k).padStart(3, '0')}.wav`);
    const input = file
      ? ['-i', file, '-af', `adelay=${HOLD_BEFORE * 1000}:all=1,apad,atrim=0:${dur.toFixed(3)}`]
      : ['-f', 'lavfi', '-i', 'anullsrc=r=24000:cl=mono', '-t', dur.toFixed(3)];
    execFileSync('ffmpeg', ['-v', 'error', '-y', ...input, '-ar', '48000', '-ac', '1', dest]);
    return `file '${dest}'`;
  });
  fs.writeFileSync(path.join(WORK, 'audio.txt'), parts.join('\n') + '\n');
  execFileSync('ffmpeg', ['-v', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', path.join(WORK, 'audio.txt'), path.join(WORK, 'narration.wav')]);
  execFileSync('ffmpeg', ['-v', 'error', '-y', '-framerate', String(FPS), '-i', path.join(WORK, 'seq', '%06d.jpg'),
    '-i', path.join(WORK, 'narration.wav'), '-vf', 'format=yuv420p', '-c:v', 'libx264', '-preset', 'slow',
    '-crf', '18', '-tune', 'stillimage', '-c:a', 'aac', '-b:a', '192k', '-movflags', '+faststart', '-shortest', outFile]);
  console.log('wrote', outFile);
})();
