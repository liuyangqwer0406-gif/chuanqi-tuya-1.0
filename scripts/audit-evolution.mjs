import { createRequire } from 'node:module';
import { mkdir, writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
const { chromium } = createRequire(import.meta.url)(process.env.PLAYWRIGHT_PATH || 'playwright');
const origin=process.env.AUDIT_ORIGIN || 'http://127.0.0.1:4332';
const browser=await chromium.launch({channel:'msedge',headless:true});
await mkdir('output/qa',{recursive:true});
const report={checks:[],errors:[],resources:[]};
const watch=page=>{page.on('pageerror',e=>report.errors.push(e.message));page.on('response',r=>{if(r.status()>=400)report.resources.push(r.url())});};
const ready=async page=>{await page.waitForSelector('.synthesis-site.is-loaded');await page.waitForFunction(()=>!document.documentElement.dataset.routeState||document.documentElement.dataset.routeState==='idle');await page.waitForTimeout(1200);};
const pixelHash=canvas=>canvas.evaluate(el=>{const c=el.getContext('2d');const pixels=c.getImageData(0,0,el.width,el.height).data;let hash=0;for(let i=0;i<pixels.length;i+=97)hash=(hash*31+pixels[i])|0;return hash;});
try {
 const page=await browser.newPage({viewport:{width:1440,height:1000}});watch(page);
 await page.goto(`${origin}/synthesis/`,{waitUntil:'networkidle'});await ready(page);
 const hero=page.locator('.evolution-particles--hero');
 await hero.waitFor();assert.equal(await hero.getAttribute('data-rendered'),'true');
 const initial=await pixelHash(hero);await page.mouse.move(1080,350);await page.waitForTimeout(300);assert.notEqual(await pixelHash(hero),initial);
 await page.mouse.move(20,950);await page.waitForTimeout(300);
 await page.screenshot({path:'output/qa/evolution-hero.png'});
 report.checks.push('Hero particles render actual pixels and change with pointer movement.');
 const bounds=await page.locator('#practice').evaluate(el=>({top:el.getBoundingClientRect().top+scrollY,travel:el.offsetHeight-innerHeight}));
 const field=page.locator('.evolution-particles--practice');const hashes=[];
 for(let i=0;i<3;i++) {
   await page.evaluate(({top,travel,i})=>window.scrollTo({top:top-72+travel*(i/3+.12),behavior:'instant'}),{...bounds,i});
   await page.waitForTimeout(800);
   assert.equal(await page.locator('.evolution-story__chapter.is-current').getAttribute('id'),`practice-${i}`);
   hashes.push(await pixelHash(field));
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
   await page.screenshot({path:`output/qa/evolution-practice-${i+1}.png`});
 }
 assert.equal(new Set(hashes).size,3);
 const draws=await field.getAttribute('data-draws');await page.waitForTimeout(900);assert.equal(await field.getAttribute('data-draws'),draws);
 report.checks.push('Scroll selects all three chapters; canvas pixels differ for all forms; particle drawing stops at idle.');
 await page.locator('.evolution-story__nav button').first().click();await page.waitForTimeout(1300);
 assert.equal(await page.locator('.evolution-story__chapter.is-current').getAttribute('id'),'practice-0');
 await page.locator('.evolution-story__nav button').last().focus();await page.keyboard.press('Enter');await page.waitForTimeout(1300);
 assert.equal(await page.locator('.evolution-story__chapter.is-current').getAttribute('id'),'practice-2');
 report.checks.push('Chapter controls navigate by pointer and keyboard.');
 await page.emulateMedia({reducedMotion:'reduce'});await page.waitForTimeout(300);
 for(const item of await page.locator('.evolution-story__chapter').all())assert.equal(await item.evaluate(el=>getComputedStyle(el).visibility),'visible');
 assert.equal(await page.locator('.evolution-story__sticky').evaluate(el=>getComputedStyle(el).position),'relative');
 await page.locator('.evolution-story__nav button').nth(1).click();await page.waitForTimeout(250);
 assert.ok(await page.locator('#practice-1').evaluate(el=>Math.abs(el.getBoundingClientRect().top-100)<20));
 report.checks.push('Runtime reduced motion removes pinning and exposes every chapter; direct chapter navigation works.');
 await page.locator('.synthesis-header').getByRole('link',{name:'ABOUT',exact:true}).click();await page.waitForURL(/\/synthesis\/about\/?$/);await ready(page);
 await page.locator('.synthesis-header').getByRole('link',{name:'WORK',exact:true}).click();await page.waitForURL(/\/synthesis\/?#work$/);await ready(page);
 await page.locator('.synthesis-brand').click();await page.waitForTimeout(300);
 assert.equal(await page.locator('.evolution-particles--hero').getAttribute('data-rendered'),'true');
 report.checks.push('Navigation to About and back restores the particle hero.');
 await page.close();
 for(const width of [1024,768,390,320]) {
  const page=await browser.newPage({viewport:{width,height:900},isMobile:width<=800,hasTouch:width<=800});watch(page);
  await page.goto(`${origin}/synthesis/`,{waitUntil:'networkidle'});await ready(page);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  await page.locator('a[href="#practice"]').click();await page.waitForTimeout(1300);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  if(width<=800) {
   for(const item of await page.locator('.evolution-story__chapter').all())assert.equal(await item.evaluate(el=>getComputedStyle(el).visibility),'visible');
   await page.locator('.evolution-story__nav button').nth(1).click();await page.waitForTimeout(1200);
   assert.ok(await page.locator('#practice-1').evaluate(el=>Math.abs(el.getBoundingClientRect().top-88)<10));
  }
  if(width===390){await page.locator('a[href="#practice"]').click();await page.waitForTimeout(1000);await page.screenshot({path:'output/qa/evolution-mobile.png'});}
  report.checks.push(`${width}px: hero and practice fit without overflow; chapters stay accessible.`);await page.close();
 }
 assert.deepEqual(report.errors,[]);assert.deepEqual(report.resources,[]);report.status='PASS';
} catch(e){report.status='FAIL';report.failure=e.stack;process.exitCode=1;}
await writeFile('output/qa/evolution-report.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));await browser.close();
