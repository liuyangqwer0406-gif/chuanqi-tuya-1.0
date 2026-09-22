import { createRequire } from 'node:module';
import { mkdir, writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';

const { chromium } = createRequire(import.meta.url)(process.env.PLAYWRIGHT_PATH || 'playwright');
const origin = process.env.AUDIT_ORIGIN || 'http://127.0.0.1:4319';
const browser = await chromium.launch({ channel: 'msedge', headless: true });
const report = { checks: [], errors: [], failedResources: [] };
await mkdir('output/qa', { recursive: true });

function watch(page) {
  page.on('pageerror', error => report.errors.push(error.message));
  page.on('response', response => { if (response.status() >= 400) report.failedResources.push(`${response.status()} ${response.url()}`); });
}
async function ready(page) {
  await page.waitForSelector('.synthesis-site.is-loaded');
  await page.waitForFunction(() => !document.documentElement.dataset.routeState || document.documentElement.dataset.routeState === 'idle');
  await page.waitForFunction(() => {
    const loader = document.querySelector('.synthesis-loader');
    return !loader || getComputedStyle(loader).visibility === 'hidden';
  });
}
async function sampleFrames(page, duration = 2000) {
  const frames = page.frames();
  const start = await Promise.all(frames.map(frame => frame.evaluate(() => window.__rafCount || 0)));
  await page.waitForTimeout(duration);
  return Promise.all(frames.map(async (frame, index) => ({
    url: frame.url(), count: await frame.evaluate(() => window.__rafCount || 0) - start[index],
  })));
}
async function overflow(page) {
  return page.evaluate(() => Math.max(document.documentElement.scrollWidth, document.body.scrollWidth) - innerWidth);
}

try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await context.addInitScript(() => {
    window.__rafCount = 0;
    const original = window.requestAnimationFrame;
    window.requestAnimationFrame = callback => original.call(window, time => { window.__rafCount++; callback(time); });
  });
  const page = await context.newPage();
  watch(page);
  await page.goto(`${origin}/synthesis/`, { waitUntil: 'networkidle' });
  await ready(page);
  await page.waitForTimeout(1400);
  await page.locator('.synthesis-hero .liquid-link iframe').waitFor();
  assert.equal(await page.locator('.route-transition__field canvas').count(), 0);
  report.homeIdle = await sampleFrames(page);
  assert.equal(await page.locator('.plant-particle-hero iframe').count(), 1);
  report.checks.push('Plant and particle hero shares one scene; visible liquid buttons start lit and the transition GPU context remains lazy.');
  await page.screenshot({ path: 'output/qa/after-home.png' });

  const cta = page.locator('.synthesis-hero .liquid-link');
  await cta.hover();
  await cta.locator('iframe').waitFor();
  await page.waitForTimeout(700);
  const buttonFrame = await cta.locator('iframe').elementHandle().then(el => el.contentFrame());
  await buttonFrame.evaluate(() => {
    window.__rafCount = 0;
    const original = window.requestAnimationFrame;
    window.requestAnimationFrame = callback => original.call(window, time => { window.__rafCount++; callback(time); });
  });
  const before = await buttonFrame.evaluate(() => window.__rafCount);
  await page.waitForTimeout(500);
  assert.ok(await buttonFrame.evaluate(() => window.__rafCount) > before);
  await page.mouse.move(30, 100);
  await page.waitForTimeout(700);
  const paused = await buttonFrame.evaluate(() => window.__rafCount);
  await page.waitForTimeout(500);
  assert.ok(await buttonFrame.evaluate(() => window.__rafCount) > paused);
  assert.equal(await buttonFrame.evaluate(() => document.body.classList.contains('hot')), true);

  await cta.click();
  await page.waitForTimeout(1200);
  assert.equal(new URL(page.url()).hash, '#work');
  report.workAnchorTop = await page.locator('#work').evaluate(el => el.getBoundingClientRect().top);
  assert.ok(await page.locator('#work').evaluate(el => Math.abs(el.getBoundingClientRect().top - 88)) < 5);
  await page.mouse.move(30, 100);
  await page.waitForTimeout(1200);
  report.workIdle = await sampleFrames(page);
  const offscreenFrames = await buttonFrame.evaluate(() => window.__rafCount);
  await page.waitForTimeout(350);
  assert.equal(await buttonFrame.evaluate(() => window.__rafCount), offscreenFrames);
  report.checks.push('Liquid buttons stay lit after pointer exit and pause rendering offscreen.');
  const projectButtons = page.locator('.synthesis-work__index button');
  await projectButtons.nth(0).focus();
  await page.keyboard.press('ArrowRight');
  assert.equal(await projectButtons.nth(1).getAttribute('aria-pressed'), 'true');
  await page.keyboard.press('End');
  assert.equal(await projectButtons.last().getAttribute('aria-pressed'), 'true');
  await projectButtons.nth(1).click();
  await page.locator('.synthesis-work__image.is-entering').waitFor({ state: 'detached' });
  await page.screenshot({ path: 'output/qa/after-work.png' });
  report.checks.push('Work anchor, project selection and Arrow/Home/End keyboard navigation.');
  const transitionStart = Date.now();
  await page.locator('.synthesis-work__action .liquid-link').click();
  await page.waitForURL(/\/projects\//);
  await ready(page);
  report.caseTransitionMs = Date.now() - transitionStart;
  assert.ok(report.caseTransitionMs < 6000, 'A loaded route must not wait for the recovery timeout.');
  assert.equal(await page.locator('.route-transition').evaluate(el => getComputedStyle(el).visibility), 'hidden');
  const chapterLinks = page.locator('.case-chapter-nav a');
  assert.ok(await chapterLinks.count() >= 2);
  await chapterLinks.last().click();
  await page.waitForTimeout(1300);
  const targetId = (await chapterLinks.last().getAttribute('href')).slice(1);
  assert.equal(await chapterLinks.last().getAttribute('aria-current'), 'location');
  report.chapterTop = await page.locator(`[id="${targetId}"]`).evaluate(el => el.getBoundingClientRect().top);
  assert.ok(await page.locator(`[id="${targetId}"]`).evaluate(el => Math.abs(el.getBoundingClientRect().top - 144)) < 8);
  await page.screenshot({ path: 'output/qa/after-chapters.png' });
  const trigger = page.locator(`#${targetId} .case-figure button`).first();
  await trigger.scrollIntoViewIfNeeded();
  await trigger.click();
  await page.locator('[role="dialog"]').waitFor();
  const firstImage = await page.locator('.case-lightbox img').getAttribute('alt');
  await page.getByRole('button', { name: 'Next image', exact: true }).click();
  assert.notEqual(await page.locator('.case-lightbox img').getAttribute('alt'), firstImage);
  await page.keyboard.press('ArrowLeft');
  assert.equal(await page.locator('.case-lightbox img').getAttribute('alt'), firstImage);
  await page.getByRole('button', { name: 'Close image preview' }).focus();
  await page.keyboard.press('Tab');
  assert.equal(await page.evaluate(() => document.activeElement.getAttribute('aria-label')), 'Previous image');
  await page.screenshot({ path: 'output/qa/after-lightbox.png' });
  await page.keyboard.press('Escape');
  await page.locator('[role="dialog"]').waitFor({ state: 'detached' });
  assert.equal(await trigger.evaluate(el => document.activeElement === el), true);
  assert.equal(await page.evaluate(() => document.body.classList.contains('has-lightbox')), false);
  report.checks.push('Sticky chapters, active section, image browsing, arrow keys, focus trap, Escape and focus restore.');

  await page.locator('.case-navigation a').last().click();
  await ready(page);
  await page.locator('.case-figure').first().scrollIntoViewIfNeeded();
  await page.waitForTimeout(900);
  assert.equal(await page.locator('.case-figure').first().getAttribute('data-motion-reveal'), 'visible');
  assert.equal(await overflow(page), 0);
  report.checks.push('Route changes re-register image reveals; no transition residue or desktop overflow.');

  await page.goto(`${origin}/synthesis/projects/roku-ikition/`, { waitUntil: 'networkidle' });
  await ready(page);
  assert.equal(await page.locator('.motion-poster source').count(), 0);
  await page.locator('.motion-poster').first().scrollIntoViewIfNeeded();
  await page.waitForFunction(() => [...document.querySelectorAll('.motion-poster video')].some(v => !v.paused));
  await page.evaluate(() => scrollTo({ top: 0, behavior: 'instant' }));
  await page.waitForTimeout(1000);
  assert.equal(await page.locator('.motion-poster video').evaluateAll(videos => videos.every(video => video.paused)), true);
  report.checks.push('Motion posters load near the viewport and pause offscreen.');

  const mobileContext = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
  const mobile = await mobileContext.newPage();
  watch(mobile);
  await mobile.goto(`${origin}/synthesis/projects/roku-ikition/`, { waitUntil: 'networkidle' });
  await ready(mobile);
  assert.equal(await mobile.evaluate(() => document.documentElement.classList.contains('lenis')), false);
  assert.equal(await overflow(mobile), 0);
  await mobile.locator('.case-figure button').first().scrollIntoViewIfNeeded();
  await mobile.locator('.case-figure button').first().tap();
  await mobile.waitForTimeout(400);
  const mobileBefore = await mobile.locator('.case-lightbox img').getAttribute('alt');
  await mobile.locator('.case-lightbox__media').dispatchEvent('pointerdown', { pointerType: 'touch', clientX: 300, clientY: 350 });
  await mobile.locator('.case-lightbox__media').dispatchEvent('pointerup', { pointerType: 'touch', clientX: 80, clientY: 355 });
  assert.notEqual(await mobile.locator('.case-lightbox img').getAttribute('alt'), mobileBefore);
  assert.equal(await overflow(mobile), 0);
  await mobile.locator('.case-lightbox img').evaluate(img => img.decode());
  await mobile.waitForTimeout(300);
  await mobile.screenshot({ path: 'output/qa/after-mobile-gallery.png' });
  await mobile.getByRole('button', { name: 'Close image preview' }).tap();
  await mobile.locator('[role="dialog"]').waitFor({ state: 'detached' });
  await mobile.locator('.case-chapter-nav a').first().scrollIntoViewIfNeeded();
  await mobile.screenshot({ path: 'output/qa/after-mobile-chapters.png' });
  await mobile.goto(`${origin}/synthesis/`, { waitUntil: 'networkidle' });
  await ready(mobile);
  assert.equal(await overflow(mobile), 0);
  await mobile.screenshot({ path: 'output/qa/after-mobile-home.png' });
  report.checks.push('390px mobile: native touch scroll, gallery swipe, controls fit, no overflow.');

  const reduced = await browser.newPage({ reducedMotion: 'reduce', viewport: { width: 1280, height: 800 } });
  watch(reduced);
  await reduced.goto(`${origin}/synthesis/projects/roku-ikition/`, { waitUntil: 'networkidle' });
  await ready(reduced);
  await reduced.locator('.motion-poster').first().scrollIntoViewIfNeeded();
  await reduced.waitForTimeout(500);
  assert.equal(await reduced.locator('.motion-poster source').count(), 0);
  assert.equal(await reduced.locator('.liquid-link iframe').count(), 0);
  await reduced.goto(`${origin}/synthesis/`, { waitUntil: 'networkidle' });
  await ready(reduced);
  assert.equal(await reduced.evaluate(() => document.documentElement.classList.contains('lenis')), false);
  report.checks.push('Reduced motion: static content, no autoplay video, no animated buttons, native scroll.');
  assert.deepEqual(report.errors, []);
  assert.deepEqual(report.failedResources, []);
  report.result = 'PASS';
} catch (error) {
  report.result = 'FAIL';
  report.failure = error.stack;
  process.exitCode = 1;
} finally {
  await writeFile('output/qa/motion-audit.json', JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
  await browser.close();
}
