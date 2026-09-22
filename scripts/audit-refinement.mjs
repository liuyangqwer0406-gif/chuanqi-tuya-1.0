import { createRequire } from 'node:module';
import { mkdir, writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
const { chromium } = createRequire(import.meta.url)(process.env.PLAYWRIGHT_PATH || 'playwright');
const origin = process.env.AUDIT_ORIGIN || 'http://127.0.0.1:4330';
const browser = await chromium.launch({ channel: 'msedge', headless: true });
const report = { checks: [], errors: [], failedResources: [] };
await mkdir('output/qa', { recursive: true });
const ready = async page => {
  await page.waitForSelector('.synthesis-site.is-loaded');
  await page.waitForFunction(() => !document.documentElement.dataset.routeState || document.documentElement.dataset.routeState === 'idle');
  await page.waitForTimeout(800);
};
try {
 for (const width of [1440, 1024, 768, 390, 320]) {
  const context = await browser.newContext({ viewport: { width, height: 1000 }, isMobile: width < 801, hasTouch: width < 801 });
  const page = await context.newPage();
  page.on('pageerror', error => report.errors.push(error.message));
  page.on('response', response => { if(response.status() >= 400) report.failedResources.push(response.url()); });
  await page.goto(`${origin}/synthesis/`, { waitUntil: 'networkidle' });
  await ready(page);
  await page.locator('.synthesis-header a[href="#work"]').click();
  await page.waitForTimeout(1000);
  const buttons = page.locator('.synthesis-work__index button');
  const next = page.getByRole('button', { name: 'Next project', exact: true });
  await next.click();
  await page.waitForTimeout(600);
  assert.equal(await buttons.nth(1).getAttribute('aria-pressed'), 'true');
  assert.equal(await page.locator('.synthesis-work__copy.is-current h3').innerText(), 'PACKAGING DESIGN');
  // Interrupt an unfinished animation repeatedly; only the final project may survive.
  await next.click({clickCount: 1});
  await next.click({clickCount: 1});
  await next.click({clickCount: 1});
  await page.waitForTimeout(700);
  assert.equal(await buttons.nth(4).getAttribute('aria-pressed'), 'true');
  assert.equal(await page.locator('.synthesis-work__image-layer').count(), 1);
  assert.equal(await page.locator('.synthesis-work__copy').count(), 1);
  const image = page.locator('.synthesis-work__image-layer.is-current');
  assert.equal(await image.evaluate(el => Number(getComputedStyle(el).opacity)), 1);
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
  assert.ok(await page.locator('.synthesis-work__thumbnail').first().evaluate(el => el.getBoundingClientRect().height) >= 56);
  if(width === 1440) {
    await buttons.nth(0).focus();
    await page.keyboard.press('End');
    assert.equal(await buttons.nth(6).getAttribute('aria-pressed'), 'true');
    await page.keyboard.press('Home');
    assert.equal(await buttons.nth(0).getAttribute('aria-pressed'), 'true');
    await buttons.nth(1).click();
    await page.waitForTimeout(650);
    await page.mouse.move(1420, 950);
    await page.locator('.synthesis-header a[href="#work"]').click();
    await page.waitForTimeout(1000);
    await page.screenshot({path:'output/qa/refinement-desktop.png'});
    report.checks.push('Keyboard Home/End; click selects correct project; rapid switches leave one visible image and copy.');
  }
  if(width === 390) {
    await page.locator('.synthesis-work__transport').scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
    await page.screenshot({path:'output/qa/refinement-mobile.png'});
    const selected = await buttons.nth(4).boundingBox();
    assert.ok(selected.x >= 0 && selected.x + selected.width <= width);
    const cover = page.locator('.synthesis-work__cover-link');
    await cover.scrollIntoViewIfNeeded();
    const rect = await cover.boundingBox();
    const y = Math.min(rect.y + rect.height / 2, 800);
    const cdp = await context.newCDPSession(page);
    await cdp.send('Input.dispatchTouchEvent', { type:'touchStart', touchPoints:[{x:280,y}] });
    for(const x of [260,220,180,120,80]) {
      await cdp.send('Input.dispatchTouchEvent', { type:'touchMove', touchPoints:[{x,y}] });
      await page.waitForTimeout(25);
    }
    await cdp.send('Input.dispatchTouchEvent', { type:'touchEnd', touchPoints:[] });
    await page.waitForTimeout(650);
    assert.equal(await buttons.nth(5).getAttribute('aria-pressed'), 'true');
    assert.equal(new URL(page.url()).pathname, '/synthesis/');
    await cover.tap();
    await page.waitForURL('**/synthesis/projects/melonpop/');
    await ready(page);
    report.checks.push('Chromium touch input: horizontal swipe advances without navigation, subsequent tap opens the correct case.');
  }
  await page.goto(`${origin}/synthesis/`, { waitUntil:'networkidle' });
  await ready(page);
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.getByRole('button',{name:'Next project',exact:true}).click();
  assert.equal(await page.locator('.synthesis-work__image-layer').count(),1);
  assert.equal(await page.locator('.synthesis-work__image-layer').evaluate(el => getComputedStyle(el).transform),'none');
  report.checks.push(`${width}px: no horizontal page overflow; next/rapid switching; runtime reduced-motion selection.`);
  await context.close();
 }
 assert.deepEqual(report.errors, []);
 assert.deepEqual(report.failedResources, []);
 report.status = 'PASS';
} catch(error) { report.status='FAIL'; report.failure=error.stack; process.exitCode=1; }
await writeFile('output/qa/refinement-report.json', JSON.stringify(report,null,2));
console.log(JSON.stringify(report,null,2));
await browser.close();
