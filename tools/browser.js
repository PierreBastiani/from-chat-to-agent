// Shared by the tools that drive the deck in a headless browser.
// DECK_URL: where the deck is served (default: `python3 -m http.server 8000` from the repo root).
// CHROMIUM_PATH: optional browser binary; otherwise Playwright's own Chromium (`npx playwright install chromium`).
// PLAYWRIGHT_PATH: optional path to a Playwright install, if it is not in node_modules.
let pw;
try {
  pw = require('playwright');
} catch {
  pw = require(process.env.PLAYWRIGHT_PATH);
}

const DECK_URL = process.env.DECK_URL || 'http://127.0.0.1:8000/deck/';

async function openDeck() {
  const browser = await pw.chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
  const page = await (await browser.newContext({ viewport: { width: 1920, height: 1080 } })).newPage();
  page.on('pageerror', e => console.log('pageerror', e.message));
  await page.goto(DECK_URL);
  await page.waitForFunction(() => window.Reveal && Reveal.isReady && Reveal.isReady());
  await page.evaluate(() => document.fonts.ready);
  await page.addStyleTag({ content: '.reveal .progress, .reveal .controls { display: none !important; }' });
  return { browser, page };
}

// Jumps every arrival animation of the current slide to its end state.
async function finishAnimations(page) {
  await page.evaluate(() => {
    const s = Reveal.getCurrentSlide();
    s._run = (s._run || 0) + 1; // cancels the running animation
    s.querySelectorAll('.stream').forEach(e => { if (e.dataset.full) e.textContent = e.dataset.full; e.classList.remove('typing'); });
    s.querySelectorAll('.after').forEach(e => e.classList.add('shown'));
  });
}

module.exports = { pw, DECK_URL, openDeck, finishAnimations };
