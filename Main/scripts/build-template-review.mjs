import { mkdir, writeFile, readFile, stat } from "node:fs/promises";
import sharp from "sharp";
import { curatedTemplates, CURATED_CATEGORIES } from "../src/lib/templates/curated-catalog.js";

const root = "public/template-review";
const acceptance = JSON.parse(await readFile("docs/template-review/browser-acceptance.json", "utf8"));
if (acceptance.rows.length !== curatedTemplates.length || acceptance.rows.some(r => r.result !== "PASS"))
  throw new Error("Run the complete browser acceptance fixture successfully before building review artifacts.");
for (const t of curatedTemplates)
  if (!acceptance.rows.some(r => r.id === t.id)) throw new Error(`Missing browser result: ${t.id}`);
await mkdir(root, { recursive: true });
const sheets = [];
function escape(value) {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
}
for (let batch = 0; batch < 10; batch++) {
  const items = curatedTemplates.slice(batch * 10, batch * 10 + 10), layers = [];
  for (let n = 0; n < items.length; n++) {
    const t = items[n], x = (n % 5) * 320, y = Math.floor(n / 5) * 590;
    const thumb = await sharp(`public/images/templates/${t.id}.webp`)
      .resize({ width: 292, height: 510, fit: "contain", background: "#e9e6df" }).png().toBuffer();
    layers.push({ input: thumb, left: x + 14, top: y + 16 });
    const label = `${String(batch * 10 + n + 1).padStart(3, "0")} · ${t.name}`;
    layers.push({
      input: Buffer.from(`<svg width="310" height="50"><text x="14" y="25" font-family="Arial" font-size="13" font-weight="bold" fill="#222">${escape(label)}</text><text x="14" y="45" font-family="Arial" font-size="11" fill="#666">${escape(t.style)} / ${t.ratio}</text></svg>`),
      left: x, top: y + 526,
    });
  }
  const name = `contact-${String(batch + 1).padStart(2, "0")}.webp`;
  await sharp({ create: { width: 1600, height: 1180, channels: 3, background: "#f7f5ef" } })
    .composite(layers).webp({ quality: 90 }).toFile(`${root}/${name}`);
  sheets.push(name);
}
const sizes = await Promise.all(curatedTemplates.map(async t => ({
  id: t.id, bytes: (await stat(`public/images/templates/${t.id}.webp`)).size,
})));
const count = acceptance.rows.length;
const summary = {
  date: "2026-11-12", uniqueCompositions: count,
  categories: CURATED_CATEGORIES.map(([id, name]) => ({ id, name, count: curatedTemplates.filter(t => t.category === id).length })),
  browser: acceptance.browser, rendered: count, savedAndReopened: count, editedUndoRedo: count,
  pngExports: count, jpgExports: count, issues: 0,
  thumbnails: { totalBytes: sizes.reduce((n, t) => n + t.bytes, 0), maxBytes: Math.max(...sizes.map(t => t.bytes)), sizes },
  contactSheets: sheets,
};
await writeFile("docs/template-review/validation-summary.json", JSON.stringify(summary, null, 2) + "\n");
await writeFile(`${root}/index.html`, `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Comvexa — 100 original template compositions</title>
<style>body{margin:0;background:#f7f5ef;color:#242333;font:14px Arial,sans-serif}header{padding:45px 5vw;border-bottom:1px solid #ddd}h1{font:48px Georgia;margin:15px 0}p{max-width:800px;line-height:1.7;color:#555}a{color:#7045bf}nav{display:flex;gap:15px;flex-wrap:wrap;padding:20px 5vw}section{padding:25px 3vw;border-bottom:1px solid #ddd}img{width:100%;max-width:1600px;height:auto;display:block;margin:auto}h2{margin:0 2vw 20px;font-size:18px}.counts{display:flex;gap:15px;flex-wrap:wrap}.counts span{background:white;border:1px solid #ddd;border-radius:15px;padding:10px;font-size:12px}</style>
<header><small>COMVEXA / THE COLLECTION / VOLUME 01</small><h1>100 ideas. Ready to become yours.</h1><p>Every composition below is an actual editable Comvexa document, rendered through the same PNG exporter used by the editor. Each passed editing, undo/redo, save/reopen, fitting, bounds and PNG/JPG checks. Photographs and geometric artwork are original. Existing user projects remain independent of library updates.</p><a href="/dashboard/templates">Open the interactive template gallery →</a><div class="counts">${CURATED_CATEGORIES.map(([, name, count]) => `<span>${escape(name)}: ${count}</span>`).join("")}</div></header>
<nav>${sheets.map((_, i) => `<a href="#batch-${i + 1}">Designs ${i * 10 + 1}–${i * 10 + 10}</a>`).join("")}</nav>
${sheets.map((file, i) => `<section id="batch-${i + 1}"><h2>Designs ${i * 10 + 1}–${i * 10 + 10}</h2><a href="${file}" target="_blank" rel="noopener"><img src="${file}" width="1600" height="1180" loading="lazy" alt="Contact sheet showing designs ${i * 10 + 1} through ${i * 10 + 10}"></a></section>`).join("")}</html>`);
console.log({ templates: count, contactSheets: sheets.length, thumbnailBytes: summary.thumbnails.totalBytes, maxThumbnailBytes: summary.thumbnails.maxBytes });
