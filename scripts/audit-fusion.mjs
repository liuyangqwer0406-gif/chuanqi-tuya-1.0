import { createRequire } from 'node:module';
import { mkdir, writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
const { chromium }=createRequire(import.meta.url)(process.env.PLAYWRIGHT_PATH||'playwright');
const origin=process.env.AUDIT_ORIGIN||'http://127.0.0.1:4333';
const browser=await chromium.launch({channel:'msedge',headless:true});
await mkdir('output/qa',{recursive:true});
const report={checks:[],errors:[],failedResources:[]};
const getFrame=async page=>{
 const handle=await page.locator('.plant-particle-hero iframe').elementHandle();
 const frame=await handle.contentFrame();
 await frame.waitForFunction(()=>window.__fusionState&&window.__ready);
 return frame;
};
try {
 for(const width of [1440,1024,768,390,320]) {
  const page=await browser.newPage({viewport:{width,height:1000},isMobile:width<801,hasTouch:width<801});
  page.on('pageerror',e=>report.errors.push(e.message));
  page.on('console',m=>{if(m.type()==='error')report.errors.push(m.text())});
  page.on('response',r=>{if(r.status()>=400)report.failedResources.push(r.url())});
  await page.goto(`${origin}/synthesis/`,{waitUntil:'networkidle'});
  await page.waitForSelector('.synthesis-site.is-loaded');
  let frame=await getFrame(page);await page.waitForTimeout(4000);
  assert.equal(await frame.locator('canvas#scene').count(),1);
  assert.equal(await page.locator('.evolution-particles--hero').count(),0);
  const initial=await frame.evaluate(()=>window.__fusionState);
  assert.ok(initial.release<0.001,'Particles should begin on the plant, not on a separate sphere');
  assert.equal(initial.depthTest,true);
  assert.equal(initial.count,width<801?1100:2200);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  if(width===1440) {
   await page.mouse.move(1100,230);await page.waitForTimeout(650);
   assert.notEqual((await frame.evaluate(()=>window.__fusionState)).cameraX,initial.cameraX);
   const before=(await frame.evaluate(()=>window.__fusionState)).frames;await page.waitForTimeout(1100);
   const delta=(await frame.evaluate(()=>window.__fusionState)).frames-before;
   assert.ok(delta>10&&delta<=36,`Unexpected frame count: ${delta}`);
   report.renderFramesPer1100ms=delta;
   await page.mouse.move(25,100);await page.screenshot({path:'output/qa/fusion-desktop.png'});
   const travel=await page.locator('#synthesis-hero').evaluate(el=>el.offsetHeight-innerHeight);
   await page.evaluate(y=>window.scrollTo({top:y,behavior:'instant'}),travel*.45);await page.waitForTimeout(900);
   const middle=await frame.evaluate(()=>window.__fusionState);
   assert.ok(middle.release>.05&&middle.release<.75,'Scroll should release particles progressively');
   await page.screenshot({path:'output/qa/fusion-scroll.png'});
   await page.evaluate(y=>window.scrollTo({top:y,behavior:'instant'}),travel);await page.waitForTimeout(900);
   const gathered=await frame.evaluate(()=>window.__fusionState);
   assert.ok(gathered.release>.9,'Particles should gather at the end of the sticky scene');
   assert.equal(await page.locator('.synthesis-hero__copy').evaluate(el=>getComputedStyle(el).opacity),'1','Hero actions must not fade with the title');
   await page.screenshot({path:'output/qa/fusion-gathered.png'});
   let pointerDisplacement=0;
   for(const [x,y] of [[950,280],[1100,450],[850,320],[750,450]]) {
    await page.mouse.move(x,y);await page.waitForTimeout(400);
    pointerDisplacement=Math.max(pointerDisplacement,(await frame.evaluate(()=>window.__fusionState)).pointerDisplacement);
   }
   assert.ok(pointerDisplacement>.5,'Pointer should displace nearby particles, not only move the camera');
   await page.evaluate(()=>window.scrollTo({top:0,behavior:'instant'}));await page.waitForTimeout(900);
   assert.ok((await frame.evaluate(()=>window.__fusionState)).release<.001,'Reverse scroll should return particles to the plants');
   report.phases={initial:initial.release,middle:middle.release,gathered:gathered.release,pointerDisplacement};
   report.checks.push('Particles begin on plant surfaces, release progressively, gather, and return on reverse scroll. Local pointer displacement and the shared camera work; rendering remains within the 30fps cap.');
  }
  if(width===390) {
   await page.screenshot({path:'output/qa/fusion-mobile.png'});
   await page.locator('#synthesis-hero').evaluate(el=>window.scrollTo({top:el.offsetHeight-innerHeight,behavior:'instant'}));
   await page.waitForTimeout(900);
   assert.ok((await frame.evaluate(()=>window.__fusionState)).release>.9);
   await page.screenshot({path:'output/qa/fusion-mobile-gathered.png'});
  }
  await page.locator('.synthesis-header').getByRole('link',{name:'WORK',exact:true}).click();await page.waitForTimeout(1300);
  assert.equal(await page.locator('.plant-particle-hero .sylva-living-world-scene').getAttribute('data-active'),'false');
  const paused=(await frame.evaluate(()=>window.__fusionState)).frames;await page.waitForTimeout(600);
  assert.equal((await frame.evaluate(()=>window.__fusionState)).frames,paused);
  await page.locator('.synthesis-brand').click();await page.waitForTimeout(1100);
  assert.ok((await frame.evaluate(()=>window.__fusionState)).frames>paused);
  await page.emulateMedia({reducedMotion:'reduce'});await page.waitForTimeout(500);
  frame=await getFrame(page);await page.waitForTimeout(400);
  const staticFrames=(await frame.evaluate(()=>window.__fusionState)).frames;await page.waitForTimeout(500);
  assert.equal((await frame.evaluate(()=>window.__fusionState)).frames,staticFrames);
  assert.equal((await frame.evaluate(()=>window.__fusionState)).progress,0);
  report.checks.push(`${width}px: no horizontal overflow; scene pauses offscreen and resumes on return; reduced-motion scene stays static.`);
  await page.close();
 }
 assert.deepEqual(report.errors,[]);assert.deepEqual(report.failedResources,[]);report.status='PASS';
}catch(e){report.status='FAIL';report.failure=e.stack;process.exitCode=1;}
await writeFile('output/qa/fusion-report.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));await browser.close();
