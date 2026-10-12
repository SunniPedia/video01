
const fs=require('fs');const path=require('path');
const RESERVED=new Set(['index-infographic.html','index-podcast.html','render.js','package.json','timestamps.txt','project.json','scenes.json','tool-env.js','tool-browser.js','tool-encoder.js','tool-audio.js','tool-assets.js','tool-fonts.js','tool-check-repo.js','tool-test-seek.js','tool-test-duration.js','common-tokens.css','common-easing.js','common-detect.js','common-palette.js','common-parse.js','common-timeline.js','common-text-segment.js','common-numbers.js','common-numbers-lang.js','common-keywords.js','common-classify.js','common-icons-core.js','common-icons-topic.js','common-icon-map.js','common-icon-assign.js','common-audio-level.js','common-background.js','common-caption.js','common-logo.js','common-store-badge.js','common-scenes.js','common-layout-fit.js','a-layout.css','a-logo-motion.js','a-main.js','b-layout.css','b-studio.js','b-logo-motion.js','b-main.js','b-host-config.js','b-host-svg.js','b-host-anim.js','README.md']);
function scan(){
  const files=fs.readdirSync('.');let logo=null,badge=null,audio=null;
  for(const f of files){
    if(RESERVED.has(f))continue;if(f.startsWith('.'))continue;
    const low=f.toLowerCase();
    if(!logo&&(low.includes('logo')&&(low.endsWith('.png')||low.endsWith('.jpg'))))logo=f;
    if(!badge&&(low.includes('google')||low.includes('play')||low.includes('badge'))&&low.endsWith('.png'))badge=f;
    if(!audio&&(low.endsWith('.mp3')||low.endsWith('.wav')||low.endsWith('.m4a')))audio=f;
  }
  if(!logo&&fs.existsSync('logo.png'))logo='logo.png';
  if(!badge&&fs.existsSync('google-play-badge.png'))badge='google-play-badge.png';
  let logoData=null;if(logo&&fs.existsSync(logo)){const buf=fs.readFileSync(logo);logoData=`data:image/png;base64,${buf.toString('base64')}`;}
  return {logo,badge,audio,logoData};
}
module.exports={scan};
