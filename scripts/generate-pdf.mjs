/**
 * ビルド後に out/trips/[tripId]/print/ を Playwright で開き
 * out/pdf/[tripId].pdf を生成するスクリプト。
 *
 * 使い方:
 *   next build
 *   npx serve out -l 4000 &
 *   node scripts/generate-pdf.mjs
 */

import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.resolve(__dirname, '..', 'out');
const pdfDir = path.join(outDir, 'pdf');

const BASE_URL = process.env.BASE_URL ?? 'http://localhost:4000';

// out/trips/ 配下のディレクトリ名を tripId として収集
function getTripIds() {
  const tripsDir = path.join(outDir, 'trips');
  if (!fs.existsSync(tripsDir)) return [];
  return fs.readdirSync(tripsDir).filter((name) =>
    fs.statSync(path.join(tripsDir, name)).isDirectory()
  );
}

async function generatePdf(browser, tripId) {
  const url = `${BASE_URL}/trips/${tripId}/print/`;
  const outPath = path.join(pdfDir, `${tripId}.pdf`);

  console.log(`Generating: ${url} → ${outPath}`);

  const page = await browser.newPage();
  await page.goto(url, { waitUntil: 'networkidle' });

  // Leaflet マップの準備完了を待つ（TripMapInner が window.__mapReady を立てる）
  await page.waitForFunction(() => window.__mapReady === true, { timeout: 30000 }).catch(() => {
    console.warn(`  ⚠ __mapReady timeout for ${tripId}, proceeding anyway.`);
  });

  await page.pdf({
    path: outPath,
    format: 'A4',
    printBackground: true,
  });

  await page.close();
  console.log(`  ✓ ${outPath}`);
}

async function main() {
  const tripIds = getTripIds();
  if (tripIds.length === 0) {
    console.error('No trips found in out/trips/. Run `next build` first.');
    process.exit(1);
  }

  fs.mkdirSync(pdfDir, { recursive: true });

  const browser = await chromium.launch();
  for (const tripId of tripIds) {
    await generatePdf(browser, tripId);
  }
  await browser.close();

  console.log('\nAll PDFs generated successfully.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
