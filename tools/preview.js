// Screenshots every slide in its final state and builds 2x2 contact sheets, for visual review.
// Usage: node tools/preview.js [outdir] [first,last]   (default: build/preview, all slides; indexes from 0)
const fs = require('fs');
const path = require('path');
const { openDeck, finishAnimations } = require('./browser');

const ROOT = path.resolve(__dirname, '..');
const out = path.resolve(process.argv[2] || path.join(ROOT, 'build', 'preview'));
const [from, to] = (process.argv[3] || '0,999').split(',').map(Number);

(async () => {
  fs.mkdirSync(out, { recursive: true });
  const { browser, page } = await openDeck();
  const n = await page.evaluate(() => Reveal.getTotalSlides());
  const shots = [], ids = [];
  for (let i = from; i < Math.min(n, to + 1); i++) {
    await page.evaluate(i => Reveal.slide(i), i);
    await page.waitForTimeout(300);
    await finishAnimations(page);
    await page.waitForTimeout(1600);
    ids.push(await page.evaluate(() => Reveal.getCurrentSlide().id));
    shots.push(await page.screenshot());
  }
  const sheet = await (await browser.newContext({ viewport: { width: 1920, height: 1080 } })).newPage();
  for (let g = 0; g < shots.length; g += 4) {
    const imgs = shots.slice(g, g + 4).map((s, k) => `<div style="position:relative"><img src="data:image/png;base64,${s.toString('base64')}" style="width:956px;height:538px;display:block;border:2px solid #888"><b style="position:absolute;left:8px;top:4px;background:#ff0;font:24px sans-serif">${from + g + k + 1} ${ids[g + k]}</b></div>`).join('');
    await sheet.setContent(`<body style="margin:0;display:grid;grid-template-columns:960px 960px;background:#888">${imgs}</body>`);
    await sheet.screenshot({ path: path.join(out, `sheet-${String(g / 4 + 1).padStart(2, '0')}.png`) });
  }
  console.log('slides', n, '→', out);
  await browser.close();
})();
