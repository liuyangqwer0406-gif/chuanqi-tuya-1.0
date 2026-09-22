import {createRequire} from 'node:module';
import {mkdirSync} from 'node:fs';
const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_PATH || 'playwright');
import assert from 'node:assert/strict';
mkdirSync('output/qa', {recursive:true});
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});
 try {
  const page=await browser.newPage({viewport:{width:1081,height:945}});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto((process.env.AUDIT_ORIGIN || 'http://127.0.0.1:4333') + '/synthesis/',{waitUntil:'networkidle'});
  await page.waitForSelector('.is-loaded');await page.waitForTimeout(1000);
  const button=page.locator('.synthesis-hero .liquid-link');
  await button.hover();await page.waitForTimeout(250);
  for(const [x,y] of [[180,270],[350,330],[800,200],[980,40],[300,450]]){
   await page.mouse.move(x,y,{steps:8});await page.waitForTimeout(250);
   const state=await page.locator('.syn-instrument-cursor').evaluate(el=>{const r=el.getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2,visible:el.classList.contains('is-visible'),mode:el.dataset.mode};});
   console.log({target:[x,y],...state});
   assert.ok(Math.hypot(state.x-x,state.y-y)<3,'Cursor did not follow across iframe boundary');
   assert.equal(state.visible,true);
  }
  await page.mouse.down();await page.mouse.move(600,390,{steps:5});await page.mouse.up();
  await page.waitForTimeout(200);
  assert.equal(await page.locator('.syn-instrument-cursor').evaluate(el=>el.classList.contains('is-pressed')),false);
  await page.keyboard.press('Tab');await page.waitForTimeout(150);
  assert.equal(await page.locator('.syn-instrument-cursor').evaluate(el=>el.classList.contains('is-visible')),false);
  await page.mouse.move(500,280);await page.waitForTimeout(250);
  assert.equal(await page.locator('.syn-instrument-cursor').evaluate(el=>el.classList.contains('is-visible')),true);
  await page.evaluate(()=>{window.__cursorTrace=[]; for(const name of ['blur','synthesis:scene-pointer','scroll']) window.addEventListener(name,e=>window.__cursorTrace.push({name,detail:e.detail,hit:document.elementFromPoint(500,280)?.outerHTML.slice(0,180)}));document.addEventListener('mouseleave',()=>window.__cursorTrace.push('mouseleave'));});
  await page.mouse.wheel(0,140);await page.waitForTimeout(1100);
  console.log(await page.evaluate(()=>({trace:window.__cursorTrace,cls:document.querySelector('.syn-instrument-cursor').className,mode:document.querySelector('.syn-instrument-cursor').dataset.mode})));
  assert.equal(await page.locator('.syn-instrument-cursor').evaluate(el=>el.classList.contains('is-visible')),true,'Scene scroll hid the cursor');
  const scene=await (await page.locator('.plant-particle-hero iframe').elementHandle()).contentFrame();
  assert.equal(await scene.locator('#scene').evaluate(el=>getComputedStyle(el).cursor),'none');
  await page.mouse.move(280,320);await page.waitForTimeout(250);
  await page.screenshot({path:'output/qa/cursor-follow-fixed.png'});
  await page.mouse.click(270,310);
  await page.keyboard.press('Tab');await page.waitForTimeout(150);
  assert.equal(await page.locator('.syn-instrument-cursor').evaluate(el=>el.classList.contains('is-visible')),false);
  await page.mouse.move(510,350);await page.waitForTimeout(250);
  assert.equal(await page.locator('.syn-instrument-cursor').evaluate(el=>el.classList.contains('is-visible')),true);
  const mobile=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
  await mobile.goto((process.env.AUDIT_ORIGIN || 'http://127.0.0.1:4333') + '/synthesis/',{waitUntil:'networkidle'});
  await mobile.waitForSelector('.is-loaded');
  assert.equal(await mobile.evaluate(()=>document.documentElement.classList.contains('has-syn-instrument-cursor')),false);
  const mobileScene=await (await mobile.locator('.plant-particle-hero iframe').elementHandle()).contentFrame();
  assert.equal(await mobileScene.evaluate(()=>document.documentElement.classList.contains('has-synthesis-cursor')),false);
  await mobile.close();
  assert.deepEqual(errors,[]);
  console.log('PASS');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
