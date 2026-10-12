
const fs=require('fs');const {getEnv}=require('./tool-env.js');const {scan}=require('./tool-assets.js');const {probeDuration}=require('./tool-audio.js');const {renderFrames}=require('./tool-browser.js');const {encodeVideo,muxWithAudio}=require('./tool-encoder.js');
async function main(){
  const env=getEnv();console.log('env',env);const assets=scan();console.log('assets',assets);
  const audioFile=assets.audio||null;const audioDuration=audioFile?probeDuration(audioFile):0;console.log('audioDuration',audioDuration);
  const project=JSON.parse(fs.readFileSync('project.json','utf-8'));const timestampsRaw=fs.readFileSync('timestamps.txt','utf-8');
  const tmpVideo='tmp_video.mp4';const result=await renderFrames({...env,audioDuration},project,timestampsRaw,assets);
  await encodeVideo(result.frames,env.fps,tmpVideo,result.total);
  await muxWithAudio(tmpVideo,audioFile,env.out,result.total,audioDuration,env.audioVol,env.fade);
  try{fs.unlinkSync(tmpVideo);}catch(e){}
  console.log('Done',env.out);
}
main().catch(e=>{console.error(e);process.exit(1);});
