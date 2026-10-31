// PCM clips use Safari's media playback path, independently of AudioContext.
export function cueWav(notes, encode=globalThis.btoa){
 const rate=22050,length=Math.ceil((Math.max(0,...notes.map(n=>(n[2]||0)+n[1]))+.03)*rate);
 const bytes=new Uint8Array(44+length*2),v=new DataView(bytes.buffer);
 const word=(at,s)=>{for(let i=0;i<s.length;i++)bytes[at+i]=s.charCodeAt(i);};
 word(0,'RIFF');v.setUint32(4,36+length*2,true);word(8,'WAVE');word(12,'fmt ');v.setUint32(16,16,true);v.setUint16(20,1,true);v.setUint16(22,1,true);v.setUint32(24,rate,true);v.setUint32(28,rate*2,true);v.setUint16(32,2,true);v.setUint16(34,16,true);word(36,'data');v.setUint32(40,length*2,true);
 const samples=new Float32Array(length);
 for(const [freq,duration,delay=0,type='sine',to=freq] of notes){let phase=0;const start=Math.floor(delay*rate),count=Math.ceil(duration*rate);for(let i=0;i<count;i++){const t=i/rate,p=t/duration;phase+=2*Math.PI*freq*Math.pow(to/freq,p)/rate;const wave=type==='triangle'?2/Math.PI*Math.asin(Math.sin(phase)):Math.sin(phase);const envelope=Math.min(1,t/.008)*Math.pow(Math.max(0,1-p),1.6);samples[start+i]+=wave*envelope*.55;}}
 for(let i=0;i<length;i++)v.setInt16(44+i*2,Math.round(Math.max(-.95,Math.min(.95,samples[i]))*32767),true);
 let binary='';for(let i=0;i<bytes.length;i+=8192)binary+=String.fromCharCode(...bytes.subarray(i,i+8192));
 return 'data:audio/wav;base64,'+encode(binary);
}
export function createMediaSound(cues,{createAudio=()=>new globalThis.Audio(),storage=()=>globalThis.localStorage,hidden=()=>globalThis.document?.hidden,now=()=>Date.now()}={}){
 const key='moonlit-game-sound-v1',clips=new Map(),listeners=new Set(),last=new Map();
 let muted=false,volume=.6,active=false,unavailable=false,status='',serial=0,cursor=0;
 const pool=[];try{const saved=JSON.parse(storage()?.getItem(key));if(typeof saved?.muted==='boolean')muted=saved.muted;if(Number.isFinite(saved?.volume))volume=Math.max(0,Math.min(1,saved.volume));}catch{}
 const notify=()=>listeners.forEach(fn=>fn());
 const persist=()=>{try{storage()?.setItem(key,JSON.stringify({muted,volume}));}catch{}notify();};
 const clip=name=>{if(!clips.has(name))clips.set(name,cueWav(cues[name]));return clips.get(name);};
 function route(value){try{if(globalThis.navigator?.audioSession)globalThis.navigator.audioSession.type=value?'playback':'auto';}catch{}}
 function stop(){serial++;for(const a of pool){try{a.pause();a.currentTime=0;}catch{}}}
 function unlock(){if(hidden()||unavailable)return;active=true;if(!muted&&volume)route(true);if(pool.length)return;
  try{for(let i=0;i<1;i++){const a=createAudio();a.preload='auto';a.setAttribute?.('playsinline','');pool.push(a);if(!muted&&volume){a.src=cueWav([]);a.volume=volume;Promise.resolve(a.play()).catch(()=>{});}}}catch{unavailable=true;status='無法建立播放器';notify();}
 }
 function play(name,testing=false){if(!active||muted||!volume||hidden()||unavailable||!cues[name]||!pool.length)return false;
  const time=now();if(time-(last.get(name)??-Infinity)<(name==='move'?90:45))return false;last.set(name,time);
  const a=pool[cursor++%pool.length],ticket=serial;
  try{a.pause();a.src=clip(name);a.volume=volume;a.muted=false;const result=a.play();
   Promise.resolve(result).then(()=>{if(testing&&ticket===serial){status='播放器已啟動，是否聽見測試音？';notify();}},()=>{if(ticket===serial){status='播放被阻擋，請再點一次測試聲音';notify();}});return true;
  }catch{status='播放失敗，請再點一次測試聲音';notify();return false;}
 }
 return {unlock,play,stop,suspend(){stop();route(false);},test(){stop();last.clear();muted=false;volume=Math.max(.6,volume);status='正在播放測試音…';persist();unlock();return play('win',true);},get muted(){return muted;},get volume(){return volume;},get status(){return status;},get unavailable(){return unavailable;},setMuted(value){muted=!!value;if(muted){stop();route(false);}persist();},setVolume(value){if(!Number.isFinite(value))return;volume=Math.max(0,Math.min(1,value));for(const a of pool)a.volume=volume;if(!volume)stop();persist();},subscribe(fn){listeners.add(fn);return()=>listeners.delete(fn);}};
}
