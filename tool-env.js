
const fs=require('fs');
function getEnv(){
  const theme=(process.env.THEME||'podcast').toLowerCase();
  const width=parseInt(process.env.WIDTH|| (theme==='infographic'?'1080':'1920'),10);
  const fps=parseInt(process.env.FPS||'30',10);
  const out=process.env.OUT||`video-${theme}.mp4`;
  const start=process.env.START?parseFloat(process.env.START):0;
  const end=process.env.END?parseFloat(process.env.END):null;
  const endPad=process.env.END_PAD?parseFloat(process.env.END_PAD):(fs.existsSync('audio.mp3')||fs.existsSync('audio.wav')?2.0:0.5);
  const audioVol=parseFloat(process.env.AUDIO_VOLUME||'1.0');
  const fade=parseFloat(process.env.AUDIO_FADE_OUT||'0.5');
  return {theme,width,fps,out,start,end,endPad,audioVol,fade};
}
module.exports={getEnv};
