
const {spawn}=require('child_process');const fs=require('fs');
function encodeVideo(frames,fps,outPath,total){
  return new Promise((resolve,reject)=>{
    const args=['-y','-f','image2pipe','-r',String(fps),'-i','pipe:0','-c:v','libx264','-crf','18','-preset','medium','-pix_fmt','yuv420p','-movflags','+faststart','-r',String(fps),'-t',String(total),outPath];
    const ff=spawn('ffmpeg',args);let stderr='';ff.stderr.on('data',d=>stderr+=d.toString());ff.on('error',reject);
    (async()=>{for(const b of frames){const ok=ff.stdin.write(b);if(!ok)await new Promise(r=>ff.stdin.once('drain',r));}ff.stdin.end();})();
    ff.on('close',c=>{if(c===0)resolve();else reject(new Error('ffmpeg '+c+' '+stderr.slice(-1000)));});
  });
}
function muxWithAudio(videoPath,audioPath,outPath,videoDuration,audioDuration,audioVol,fade){
  return new Promise((resolve,reject)=>{
    if(!audioPath||!fs.existsSync(audioPath)){try{fs.renameSync(videoPath,outPath);}catch(e){}return resolve();}
    const args=['-y','-i',videoPath,'-i',audioPath,'-filter_complex',`[1:a]volume=${audioVol},afade=t=out:st=${Math.max(0,audioDuration-fade)}:d=${fade}[a];[a]apad[a2]`, '-map','0:v','-map','[a2]','-c:v','copy','-shortest','-t',String(videoDuration),outPath];
    const ff=spawn('ffmpeg',args);let stderr='';ff.stderr.on('data',d=>stderr+=d.toString());ff.on('close',c=>{if(c===0)resolve();else reject(new Error('mux '+c+' '+stderr.slice(-2000)));});
  });
}
module.exports={encodeVideo,muxWithAudio};
