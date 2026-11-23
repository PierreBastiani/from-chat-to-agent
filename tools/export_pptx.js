// Exports the deck to PowerPoint: one full-slide image per slide, in its final state (animations
// finished), with the speaker notes from <aside class="notes">.
// Usage: node tools/export_pptx.js [out.pptx]      (default: build/from-chat-to-agent.pptx)
const fs = require('fs');
const path = require('path');
const pptxgen = require('pptxgenjs');
const { openDeck, finishAnimations } = require('./browser');

const ROOT = path.resolve(__dirname, '..');
const out = path.resolve(process.argv[2] || path.join(ROOT, 'build', 'from-chat-to-agent.pptx'));
const imgDir = path.join(path.dirname(out), 'slides-png');

(async () => {
  fs.mkdirSync(imgDir, { recursive: true });
  for (const f of fs.readdirSync(imgDir)) if (f.endsWith('.png')) fs.unlinkSync(path.join(imgDir, f));
  const { browser, page } = await openDeck();
  const n = await page.evaluate(() => Reveal.getTotalSlides());

  const pres = new pptxgen();
  pres.layout = 'LAYOUT_16x9';
  pres.title = await page.evaluate(() => document.title);
  pres.author = 'Pierre Bastiani';

  for (let i = 0; i < n; i++) {
    await page.evaluate(i => Reveal.slide(i), i);
    await page.waitForTimeout(300);
    await finishAnimations(page);
    const info = await page.evaluate(() => {
      const s = Reveal.getCurrentSlide();
      const t = s.querySelector('h1, h2, .statement');
      const notes = s.querySelector('aside.notes');
      return { id: s.id, title: t ? t.innerText.trim() : s.id, notes: notes ? notes.textContent.trim().replace(/\s+/g, ' ') : '' };
    });
    await page.waitForTimeout(1600); // CSS transitions settle
    const png = path.join(imgDir, `${String(i + 1).padStart(2, '0')}-${info.id}.png`);
    await page.screenshot({ path: png });
    const slide = pres.addSlide();
    slide.addImage({ path: png, x: 0, y: 0, w: 10, h: 5.625, altText: info.title });
    if (info.notes) slide.addNotes(info.notes);
    console.log(i + 1, info.id);
  }
  await browser.close();
  await pres.writeFile({ fileName: out });
  console.log('wrote', out);
})();
