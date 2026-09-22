import { createRequire } from 'node:module';
import { readdir, readFile, access, writeFile } from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';

const { chromium } = createRequire(import.meta.url)(process.env.PLAYWRIGHT_PATH || 'playwright');
const origin = process.env.AUDIT_ORIGIN || 'http://127.0.0.1:4319';
const basePath = new URL(origin).pathname.replace(/\/$/, '');
const root = path.resolve('out');
const report = { htmlPages: 0, localReferences: 0, pages: [], errors: [], failedResources: [] };
async function checkHtml(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) { await checkHtml(file); continue; }
    if (!entry.name.endsWith('.html')) continue;
    const html = await readFile(file, 'utf8');
    if (!html.includes('id="__next') && !html.includes('/_next/static/')) continue;
    report.htmlPages++;
    const references = new Set([...html.matchAll(/(?:src|href|srcSet)="([^"]+)"/g)]
      .flatMap(match => match[1].split(',').map(item => item.trim().split(/\s+/)[0]))
      .map(url => basePath && url.startsWith(`${basePath}/`) ? url.slice(basePath.length) : url)
      .filter(url => url.startsWith('/_next/static/') || url.startsWith('/portfolio-optimized/')));
    for (const url of references) {
      await access(path.join(root, decodeURIComponent(url.split('?')[0])));
      report.localReferences++;
    }
  }
}
await checkHtml(root);
const browser = await chromium.launch({ channel: 'msedge', headless: true });
try {
  const page = await browser.newPage({ reducedMotion: 'reduce', viewport: { width: 1440, height: 900 } });
  page.on('pageerror', error => report.errors.push(error.message));
  page.on('response', response => { if (response.status() >= 400) report.failedResources.push(`${response.status()} ${response.url()}`); });
  const slugs = await readdir(path.join(root, 'synthesis/projects'), { withFileTypes: true });
  const routes = ['/synthesis/', '/synthesis/about/', ...slugs.filter(entry => entry.isDirectory()).map(entry => `/synthesis/projects/${entry.name}/`)];
  for (const route of routes) {
    await page.goto(`${origin}${route}`, { waitUntil: 'networkidle' });
    await page.waitForSelector('.synthesis-site.is-loaded');
    const images = await page.locator('#content img').evaluateAll(async images => {
      images.forEach(img => { img.loading = 'eager'; });
      await Promise.all(images.map(img => img.decode()));
      return images.map(img => ({ src: img.currentSrc, width: img.naturalWidth }));
    });
    assert.ok(images.every(img => img.width > 0));
    assert.equal(await page.evaluate(() => Math.max(document.documentElement.scrollWidth, document.body.scrollWidth) > innerWidth), false);
    report.pages.push({ route, decodedImages: images.length });
  }
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.waitForFunction(() => document.documentElement.classList.contains('lenis'));
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.waitForFunction(() => !document.documentElement.classList.contains('lenis'));
  assert.deepEqual(report.errors, []);
  assert.deepEqual(report.failedResources, []);
  report.result = 'PASS';
} catch (error) {
  report.result = 'FAIL';
  report.failure = error.stack;
  process.exitCode = 1;
} finally {
  await browser.close();
  await writeFile('output/qa/export-audit.json', JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
}
