#!/usr/bin/env node
// ROB-11 verification: drive the live preview, click Download for every
// preset × ratio, capture the produced PNG, and write it to disk.
// Run with the preview server already up (port 4174).

import { mkdir, writeFile, stat } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(HERE, '..', 'verification', 'export-samples');
const URL = process.env.ROB11_URL ?? 'http://127.0.0.1:4174/';

const PRESETS = ['editorial', 'monolith', 'salon', 'vapor'];
const ASPECTS = [
  { id: 'square', ratio: '1x1', expected: { w: 2160, h: 2160 } },
  { id: 'portrait', ratio: '4x5', expected: { w: 2160, h: 2700 } },
  { id: 'story', ratio: '9x16', expected: { w: 2160, h: 3840 } },
];

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  const browser = await chromium.launch();
  const ctx = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
    acceptDownloads: true,
  });
  const page = await ctx.newPage();
  await page.goto(URL, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);

  const summary = [];

  for (const preset of PRESETS) {
    for (const aspect of ASPECTS) {
      // Select preset + aspect through the UI. The preset radio's accessible
      // name includes the tagline (concat of all child text), so match the
      // preset name as a prefix rather than the full string.
      await page.getByRole('radio', { name: new RegExp(`^${labelFor(preset)}\\b`, 'i') }).click();
      await page.getByRole('radio', { name: new RegExp(`^${escapeRe(aspectLabel(aspect.id))}\\b`) }).click();
      // Give the layout one paint to settle.
      await page.waitForTimeout(120);
      await page.evaluate(() => document.fonts.ready);

      const downloadPromise = page.waitForEvent('download');
      await page.getByRole('button', { name: /^Download$/ }).click();
      const download = await downloadPromise;
      const filename = download.suggestedFilename();
      const outPath = join(OUT_DIR, filename);
      await download.saveAs(outPath);

      const dims = await pngDimensions(outPath);
      const ok =
        dims.w === aspect.expected.w &&
        dims.h === aspect.expected.h &&
        /^robware-(editorial|monolith|salon|vapor)-(1x1|4x5|9x16)-\d{8}-\d{4}\.png$/.test(filename);

      summary.push({ preset, ratio: aspect.ratio, filename, dims, ok });
      console.log(
        `${ok ? '✓' : '✗'} ${filename}  ${dims.w}x${dims.h}`,
      );

      // Wait for the success toast to clear before the next iteration so the
      // state machine starts clean.
      await page.waitForFunction(
        () => document.querySelector('.export-toast[data-visible="true"]') === null,
        { timeout: 4000 },
      );
    }
  }

  await browser.close();

  const failed = summary.filter((s) => !s.ok);
  console.log('');
  console.log(`Wrote ${summary.length} files to ${OUT_DIR}`);
  if (failed.length) {
    console.error(`FAILED: ${failed.length}/${summary.length}`);
    for (const f of failed) console.error(' ', f);
    process.exit(1);
  }
  console.log('All 12 PNGs match the schema + expected dimensions.');
}

function labelFor(presetId) {
  return presetId[0].toUpperCase() + presetId.slice(1);
}

function aspectLabel(id) {
  if (id === 'square') return '1:1';
  if (id === 'portrait') return '4:5';
  if (id === 'story') return '9:16';
  throw new Error('unknown aspect ' + id);
}

function escapeRe(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

async function pngDimensions(path) {
  const { readFile } = await import('node:fs/promises');
  const buf = await readFile(path);
  // PNG width/height live at bytes 16..24, big-endian.
  if (buf[0] !== 0x89 || buf[1] !== 0x50) throw new Error('not a PNG: ' + path);
  const w = buf.readUInt32BE(16);
  const h = buf.readUInt32BE(20);
  await stat(path);
  return { w, h };
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
