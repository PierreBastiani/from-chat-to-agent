// Renders a real session log (JSON spec) as a terminal capture PNG, for the deck.
// Usage: node tools/render_capture.js tools/captures/ollama-raw.json deck/img/ollama-raw-completion.png
// spec = { "title": "…", "width": 1600, "lines": [ { "t": "text", "c": "class" }, … ] }
// Classes: prompt, model, harness, tool, result, deny, dim, ok. Text is escaped, never interpreted.
const { pw } = require('./browser');
const fs = require('fs');
const path = require('path');

const [specPath, out] = process.argv.slice(2);
const spec = JSON.parse(fs.readFileSync(specPath, 'utf8'));
const fonts = path.resolve(__dirname, '../deck/fonts');
const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
// A line is { t, c } or { s: [ { t, c }, … ] } for several colours on one line.
const body = l => l.s ? l.s.map(x => `<span class="${x.c || ''}">${esc(x.t)}</span>`).join('') : esc(l.t || '');
const lines = spec.lines.map(l => `<div class="l ${l.c || ''}">${body(l) || '&#160;'}</div>`).join('');
const html = `<!doctype html><meta charset="utf-8"><style>
@font-face{font-family:G;src:url(file://${fonts}/geist-mono-latin-wght-normal.woff2);font-weight:100 900}
body{margin:0;background:#141e32}
.win{width:${spec.width || 1600}px;background:#141e32;color:#ebe6dc;font:400 26px/1.7 G,monospace}
.bar{display:flex;justify-content:space-between;padding:16px 40px;background:#0e1524;color:#96969a;font-size:22px;letter-spacing:2px;text-transform:uppercase;border-bottom:1px solid #2c3850}
.body{padding:40px 48px 44px}
.l{white-space:pre-wrap;word-break:break-word}
.prompt{color:#ebe6dc;font-weight:600}.model{color:#e08a62}.harness{color:#86aee0}
.tool{color:#ebe6dc;font-weight:600}.result{color:#aab4be}.deny{color:#e08a62}.dim{color:#96969a}.ok{color:#a3c48a}
</style><div class="win"><div class="bar"><span>${esc(spec.title)}</span><span>${esc(spec.right || '')}</span></div><div class="body">${lines}</div></div>`;

(async () => {
  const b = await pw.chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
  const p = await (await b.newContext({ deviceScaleFactor: 2, viewport: { width: spec.width || 1600, height: 400 } })).newPage();
  await p.setContent(html);
  await p.evaluate(() => document.fonts.ready);
  await (await p.$('.win')).screenshot({ path: out });
  await b.close();
})();
