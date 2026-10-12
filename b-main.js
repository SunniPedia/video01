
window.PV=window.PV||{};
window.init=function(rawText, opts){
  opts=opts||{};PV.opts=opts;PV.lang=(opts.project&&opts.project.language)||'bn';
  var scenes=PV.parseTimestamps(rawText);PV.scenes=scenes;
  var audioDur=opts.audioDuration||0;var endPad=opts.tailPad!=null?opts.tailPad:(audioDur>0?2.0:0.5);
  var total=PV.computeTotal(scenes,audioDur,endPad);PV.total=total;PV.timeline={total:total};
  var container=document.getElementById('app');container.innerHTML='';
  var stage=document.createElement('div');stage.className='stage';
  var left=document.createElement('div');left.className='left';left.innerHTML=PV.getHostSVG();
  var right=document.createElement('div');right.className='right';
  var screen=document.createElement('div');screen.className='screen';screen.id='visualArea';
  var captionPanel=document.createElement('div');captionPanel.className='caption-panel';captionPanel.id='captionPanel';
  var progress=document.createElement('div');progress.className='progress';progress.id='progress';
  right.appendChild(screen);right.appendChild(captionPanel);right.appendChild(progress);
  stage.appendChild(left);stage.appendChild(right);container.appendChild(stage);
  scenes.forEach(function(sc,i){
    var type=PV.classify(sc,i,scenes.length, opts.project&&opts.project.brandName);sc._type=type;
    var vis=PV.buildSceneVisual(sc,type,opts);vis.id='scene-'+i;screen.appendChild(vis);
    var cap=PV.buildCaption(sc.text);cap.id='cap-'+i;cap.style.display='none';captionPanel.appendChild(cap);
  });
  return total;
};
window.fit=function(){PV.fitCaptions();PV.fitScenes();return {ok:true};};
window.seek=function(t){
  var total=PV.total||10;var progEl=document.getElementById('progress');if(progEl)progEl.style.width=(t/total*100)+'%';
  var scenes=PV.scenes||[];var activeIdx=-1;for(var i=0;i<scenes.length;i++){var sc=scenes[i];var s=sc.start,e=(i===scenes.length-1)?total:sc.end;if(t>=s-0.01&&t<e+0.01)activeIdx=i;}
  var isSpeaking=false;
  scenes.forEach(function(sc,i){
    var vis=document.getElementById('scene-'+i);var cap=document.getElementById('cap-'+i);if(!vis||!cap)return;
    var s=sc.start,e=(i===scenes.length-1)?total:sc.end;var dur=e-s;var enterDur=Math.min(0.45,0.4*dur);var pEnter=PV.clamp((t-s)/enterDur,0,1);var prog=PV.easeOut(pEnter);
    if(i===activeIdx){vis.style.opacity=1;vis.style.transform='translateY('+(30*(1-prog))+'px)';cap.style.display='block';isSpeaking=true;}
    else{vis.style.opacity=0;cap.style.display='none';}
  });
  if(activeIdx===scenes.length-1){var lv=document.getElementById('scene-'+activeIdx);if(lv){lv.style.opacity=1;lv.style.transform='translateY(0)';}var lc=document.getElementById('cap-'+activeIdx);if(lc)lc.style.display='block';}
  PV.animateHost(t,isSpeaking);
};
window.setAudio=function(env,fps){PV.setAudio(env,fps);};
