
const fs=require('fs');const {spawnSync}=require('child_process');
function probeDuration(file){if(!file||!fs.existsSync(file))return 0;const r=spawnSync('ffprobe',['-v','error','-show_entries','format=duration','-of','default=noprint_wrappers=1:nokey=1',file],{encoding:'utf-8'});if(r.status===0){const d=parseFloat(r.stdout.trim());return isNaN(d)?0:d;}return 0;}
module.exports={probeDuration};
