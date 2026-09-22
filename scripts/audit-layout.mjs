import {createRequire} from 'node:module';
import {mkdir,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_PATH||'playwright');
const origin=process.env.AUDIT_ORIGIN||'http://127.0.0.1:4333';
const browser=await chromium.launch({channel:'msedge',headless:true});
const report={pages:[],checks:[],errors:[],failedResources:[]};
await mkdir('output/layout-review',{recursive:true});
const slugs=['roku-ikition','packaging-design','runes','jiangkou','melonpop','vitrolume','reverie'];
const checkText=async page=>{
 const issues=await page.locator('main').evaluate(main=>[...main.querySelectorAll('h1,h2,h3,h4,p,dt,dd,figcaption')].flatMap(el=>{
  if(el.closest('[aria-hidden="true"]'))return [];
  let node=el;while(node&&node!==main){const s=getComputedStyle(node);if(s.visibility==='hidden'||s.display==='none'||Number(s.opacity)===0)return [];node=node.parentElement;}
  const r=el.getBoundingClientRect();if(!r.width)return [];
  const range=document.createRange();range.selectNodeContents(el);
  const clipped=[...range.getClientRects()].some(t=>t.width>0&&(t.left < -4 || t.right>innerWidth+4));
  return clipped||el.scrollWidth>el.clientWidth+4?[{text:el.textContent.slice(0,100),tag:el.tagName,width:r.width,scroll:el.scrollWidth}]:[];
 }));
 assert.deepEqual(issues,[],`Text clipping at ${page.url()}: ${JSON.stringify(issues)}`);
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
};
try{
 for(const [width,height] of [[1440,900],[1024,768],[900,700],[768,1024],[390,844],[320,700],[1366,600]]){
  const page=await browser.newPage({viewport:{width,height},isMobile:width<801,hasTouch:width<801});
  page.on('pageerror',e=>report.errors.push(e.message));page.on('response',r=>{if(r.status()>=400)report.failedResources.push(r.url());});
  const routes=['/synthesis/','/synthesis/about/',...([1440,900,320].includes(width)?slugs.map(s=>`/synthesis/projects/${s}/`):[])];
  for(const route of routes){
   await page.goto(origin+route,{waitUntil:'networkidle'});await page.waitForSelector('.synthesis-site.is-loaded');await page.waitForTimeout(550);await checkText(page);
   if(route==='/synthesis/'){
    const flow=width<=800||height<=680;
    if(flow){
     await page.locator('#practice-1').evaluate(el=>window.scrollTo({top:scrollY+el.getBoundingClientRect().top-110,behavior:'instant'}));await page.waitForTimeout(300);
     assert.equal(await page.locator('.evolution-story__nav button').nth(1).getAttribute('aria-current'),'step');
     await page.locator('.evolution-story__nav button').nth(2).click();await page.waitForTimeout(1100);
     const top=await page.locator('#practice-2').evaluate(el=>el.getBoundingClientRect().top);assert.ok(top>=60&&top<180);
     assert.equal(await page.locator('.evolution-story__nav button').nth(2).getAttribute('aria-current'),'step');
    }else{
     await page.locator('#practice').evaluate(el=>window.scrollTo({top:scrollY+el.getBoundingClientRect().top-72+(el.offsetHeight-innerHeight)*.85,behavior:'instant'}));await page.waitForTimeout(650);
     const bounds=await page.locator('.evolution-story__nav').evaluate(el=>({top:el.getBoundingClientRect().top,bottom:el.getBoundingClientRect().bottom}));assert.ok(bounds.top>=72&&bounds.bottom<=height+2);
     await checkText(page);
    }
   }
   if(route==='/synthesis/about/'){
    if(width<=800||height<=680){
     const images=page.locator('#method figure');
     assert.equal(await images.count(),6);
     for(const el of await images.all())assert.equal(await el.evaluate(e=>getComputedStyle(e).opacity),'1');
    }
    await page.locator('#experience').evaluate(el=>window.scrollTo({top:scrollY+el.getBoundingClientRect().top-88,behavior:'instant'}));await page.waitForTimeout(200);await checkText(page);
   }
   report.pages.push({route,width,height});
  }
  await page.close();
 }
 assert.deepEqual(report.errors,[]);assert.deepEqual(report.failedResources,[]);
 report.checks=['No horizontal text clipping or page overflow across 7 viewport sizes.','All 7 project titles checked at 1440px, 900px and 320px.','Desktop practice navigation fits the viewport; mobile/short-screen chapter navigation follows the expanded articles.','Mobile and short-screen About method images remain visible in normal document flow.'];report.result='PASS';
}catch(e){report.result='FAIL';report.failure=e.stack;process.exitCode=1;}
await writeFile('output/layout-review/layout-audit.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));await browser.close();
