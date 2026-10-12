
const {chromium}=require('playwright');const fs=require('fs');
async function renderFrames(opts, project, timestampsRaw, assets){
  const theme=opts.theme;const htmlFile=theme==='infographic'?'index-infographic.html':'index-podcast.html';
  const designW=theme==='infographic'?1080:1920;const designH=theme==='infographic'?1920:1080;
  const scale=opts.width/designW;
  const browser=await chromium.launch({args:['--no-sandbox']});
  const context=await browser.newContext({viewport:{width:designW,height:designH},deviceScaleFactor:scale||1});
  const page=await context.newPage();
  page.on('console', m=>console.log('[page]',m.text()));
  const fileUrl='file://'+process.cwd()+'/'+htmlFile;
  await page.goto(fileUrl,{waitUntil:'load'});await page.waitForTimeout(500);
  const audioDuration=opts.audioDuration||0;
  const total=await page.evaluate(async (raw, proj, assetOpts, audDur, tail)=>{
    const o={project:proj, badge:assetOpts.badge||null, logo:assetOpts.logo||null, logoData:assetOpts.logoData||null, audioDuration:audDur, tailPad:tail};
    const t=window.init(raw,o);window.fit();return t;
  }, timestampsRaw, project, assets, audioDuration, opts.endPad);
  console.log('Total',total);
  const fps=opts.fps;const start=opts.start||0;const end=opts.end!=null?opts.end:total;
  const frameCount=Math.ceil((end-start)*fps);
  console.log(`Frames ${frameCount}`);
  const frames=[];
  for(let i=0;i<frameCount;i++){const t=start+i/fps;await page.evaluate(tt=>window.seek(tt),t);const buf=await page.screenshot({type:'jpeg',quality:95});frames.push(buf);if(i%60===0)console.log(`frame ${i}/${frameCount}`);}
  await browser.close();return {total,frameCount,frames};
}
module.exports={renderFrames};
