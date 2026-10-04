import { chromium } from 'playwright';
import { spawn } from 'child_process';
const mode=process.argv[2]||'stills';
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
const p=await b.newPage({viewport:{width:1080,height:1920}});
await p.goto('file://'+process.cwd()+'/index.html?capture'); await p.evaluate(()=>document.fonts.ready);
if(mode==='stills'){
  for(const t of [1.2,3.0,6.5,10.5,13.5,17.6,19.5,23.5,29]){await p.evaluate(t=>render(t),t);await p.screenshot({path:`/tmp/v_${t}.png`});}
}else{
  const fps=30, n=30*fps;
  const ff=spawn('ffmpeg',['-y','-f','image2pipe','-framerate',String(fps),'-i','-','-c:v','libx264','-pix_fmt','yuv420p','-crf','16','-preset','slow','-movflags','+faststart','Fakka-launch-9x16.mp4'],{stdio:['pipe','ignore','inherit']});
  for(let i=0;i<n;i++){await p.evaluate(t=>render(t),i/fps);const buf=await p.screenshot({type:'jpeg',quality:95});ff.stdin.write(buf);}
  ff.stdin.end(); await new Promise(r=>ff.on('close',r));
}
await b.close();
