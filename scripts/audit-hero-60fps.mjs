import { createRequire } from 'node:module';
import { mkdir, writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';

const { chromium } = createRequire(import.meta.url)(process.env.PLAYWRIGHT_PATH || 'playwright');
const origin = process.env.AUDIT_ORIGIN || 'http://127.0.0.1:4348';
const browser = await chromium.launch({ channel: 'msedge', headless: true });
const report = { origin, viewports: [], errors: [], failedResources: [] };
await mkdir('output/qa', { recursive: true });

const percentile = (values, fraction) => {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.min(sorted.length - 1, Math.ceil(sorted.length * fraction) - 1)];
};

const getFrame = async page => {
  const handle = await page.locator('.plant-particle-hero iframe').elementHandle();
  const frame = await handle.contentFrame();
  await frame.waitForFunction(() => window.__fusionState && window.__ready);
  return frame;
};

const installLongTaskObserver = async target => target.evaluate(() => {
  window.__heroAuditLongTasks = [];
  if (!('PerformanceObserver' in window)) return false;
  const observer = new PerformanceObserver(list => {
    for (const entry of list.getEntries()) window.__heroAuditLongTasks.push(entry.duration);
  });
  try { observer.observe({ type: 'longtask', buffered: false }); } catch { return false; }
  window.__heroAuditLongTaskObserver = observer;
  return true;
});

const measureScene = async (page, frame, duration = 4000) => {
  await installLongTaskObserver(page);
  await installLongTaskObserver(frame);
  await page.evaluate(measurementDuration => {
    const iframe = document.querySelector('.plant-particle-hero iframe');
    const hero = document.querySelector('#synthesis-hero');
    const frameDocument = iframe.contentDocument;
    const travel = Math.max(0, hero.offsetHeight - innerHeight);
    const startedAt = performance.now();
    const animate = now => {
      const elapsed = now - startedAt;
      if (elapsed >= measurementDuration) return;
      const phase = elapsed / 720;
      const x = iframe.clientWidth * (0.56 + Math.sin(phase) * 0.24);
      const y = iframe.clientHeight * (0.38 + Math.cos(phase * 0.83) * 0.20);
      frameDocument.dispatchEvent(new PointerEvent('pointermove', {
        bubbles: true,
        clientX: x,
        clientY: y,
        pointerType: 'mouse',
      }));
      window.scrollTo({ top: travel * (0.13 + (Math.sin(phase * 0.34) + 1) * 0.06), behavior: 'instant' });
      requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, duration);

  const timing = await frame.evaluate(measurementDuration => new Promise(resolve => {
    const intervals = [];
    const startedAt = performance.now();
    let lastRenderedAt = startedAt;
    let previousFrames = window.__fusionState.frames;
    const firstFrame = previousFrames;
    const sample = now => {
      const currentFrames = window.__fusionState.frames;
      if (currentFrames !== previousFrames) {
        const advanced = Math.max(1, currentFrames - previousFrames);
        const interval = (now - lastRenderedAt) / advanced;
        for (let i = 0; i < advanced; i++) intervals.push(interval);
        lastRenderedAt = now;
        previousFrames = currentFrames;
      }
      if (now - startedAt >= measurementDuration) {
        resolve({
          elapsed: now - startedAt,
          frameDelta: currentFrames - firstFrame,
          intervals,
        });
      } else requestAnimationFrame(sample);
    };
    requestAnimationFrame(sample);
  }), duration);

  const [topLongTasks, frameLongTasks] = await Promise.all([
    page.evaluate(() => window.__heroAuditLongTasks || []),
    frame.evaluate(() => window.__heroAuditLongTasks || []),
  ]);
  return {
    averageFps: timing.frameDelta * 1000 / timing.elapsed,
    p95FrameInterval: percentile(timing.intervals, 0.95),
    frames: timing.frameDelta,
    samples: timing.intervals.length,
    longTasks: [...topLongTasks, ...frameLongTasks],
  };
};

try {
  for (const viewport of [
    { width: 1440, height: 900 },
    { width: 1024, height: 768 },
    { width: 390, height: 844 },
  ]) {
    const mobile = viewport.width < 801;
    const page = await browser.newPage({ viewport, isMobile: mobile, hasTouch: mobile });
    page.on('pageerror', error => report.errors.push(`${viewport.width}px: ${error.message}`));
    page.on('console', message => {
      if (message.type() === 'error') report.errors.push(`${viewport.width}px: ${message.text()}`);
    });
    page.on('response', response => {
      if (response.status() >= 400) report.failedResources.push(`${response.status()} ${response.url()}`);
    });
    await page.goto(`${origin}/synthesis/`, { waitUntil: 'networkidle' });
    await page.waitForSelector('.synthesis-site.is-loaded');
    const frame = await getFrame(page);
    await page.waitForTimeout(3000);

    const metrics = await measureScene(page, frame);
    const minimumFps = mobile ? 55 : 58;
    assert.ok(metrics.averageFps >= minimumFps, `${viewport.width}px average ${metrics.averageFps.toFixed(2)}fps is below ${minimumFps}fps`);
    assert.ok(metrics.p95FrameInterval < 22, `${viewport.width}px p95 interval ${metrics.p95FrameInterval.toFixed(2)}ms exceeds 22ms`);
    assert.deepEqual(metrics.longTasks.filter(duration => duration >= 50), [], `${viewport.width}px produced a long task`);

    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
    await page.waitForTimeout(500);
    await page.locator('.synthesis-header').getByRole('link', { name: 'WORK', exact: true }).click();
    await page.waitForTimeout(1300);
    const pausedAt = (await frame.evaluate(() => window.__fusionState)).frames;
    await page.waitForTimeout(600);
    assert.equal((await frame.evaluate(() => window.__fusionState)).frames, pausedAt, `${viewport.width}px scene did not pause offscreen`);
    await page.locator('.synthesis-brand').click();
    await page.waitForTimeout(1100);
    assert.ok((await frame.evaluate(() => window.__fusionState)).frames > pausedAt, `${viewport.width}px scene did not resume`);

    const screenshot = `output/qa/hero-60fps-${viewport.width}.png`;
    await page.screenshot({ path: screenshot });
    report.viewports.push({ ...viewport, ...metrics, screenshot });
    await page.close();
  }

  const reducedPage = await browser.newPage({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
  reducedPage.on('pageerror', error => report.errors.push(`reduced: ${error.message}`));
  reducedPage.on('console', message => {
    if (message.type() === 'error') report.errors.push(`reduced: ${message.text()}`);
  });
  await reducedPage.goto(`${origin}/synthesis/`, { waitUntil: 'networkidle' });
  const reducedFrame = await getFrame(reducedPage);
  const staticAt = (await reducedFrame.evaluate(() => window.__fusionState)).frames;
  await reducedPage.waitForTimeout(600);
  assert.equal((await reducedFrame.evaluate(() => window.__fusionState)).frames, staticAt, 'Reduced-motion scene has an autonomous render loop');
  assert.equal((await reducedFrame.evaluate(() => window.__fusionState)).progress, 0);
  await reducedPage.close();

  assert.deepEqual(report.errors, []);
  assert.deepEqual(report.failedResources, []);
  report.status = 'PASS';
} catch (error) {
  report.status = 'FAIL';
  report.failure = error.stack;
  process.exitCode = 1;
} finally {
  await writeFile('output/qa/hero-60fps-report.json', JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
  await browser.close();
}
