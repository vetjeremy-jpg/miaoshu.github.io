import {createMediaSound} from './media-sound.mjs?v=20261031-sound3';
// Short synthesized cues: no downloads, background music or network requests.
export const CUES = {
 click:[[620,.035,0,'sine',500]], move:[[180,.035,0,'triangle',140]],
 push:[[125,.08,0,'triangle',75]], rotate:[[580,.07,0,'sine',820]],
 collect:[[740,.08,0,'sine'],[990,.12,.07,'sine']],
 cat:[[520,.1,0,'triangle',850],[760,.13,.09,'sine',560]],
 tool:[[392,.1,0,'sine'],[523,.1,.08,'sine'],[784,.18,.17,'sine']],
 jump:[[300,.13,0,'triangle',640]], dash:[[480,.09,0,'triangle',120]],
 hurt:[[180,.13,0,'triangle',70]], error:[[135,.09,0,'sine',100]],
 switch:[[440,.06,0,'sine'],[660,.08,.05,'sine']],
 door:[[262,.1,0,'triangle'],[392,.16,.08,'sine']],
 win:[[523,.12,0,'sine'],[659,.12,.1,'sine'],[784,.12,.2,'sine'],[1047,.3,.31,'sine']]
};
const KEY='moonlit-game-sound-v1';
function playback(active){try{if(globalThis.navigator?.audioSession)globalThis.navigator.audioSession.type=active?'playback':'auto';}catch{}}
export function createSound({createContext=()=>{const Audio=globalThis.AudioContext||globalThis.webkitAudioContext;return Audio?new Audio():null;},storage=()=>globalThis.localStorage,hidden=()=>typeof document!=='undefined'&&document.hidden}={}){
 let muted=false,volume=.6,ctx=null,master=null,activated=false,unavailable=false,lastCue=new Map(),resume=null,pendingCue=null;
 const voices=new Set(),listeners=new Set();
 try{const saved=JSON.parse(storage()?.getItem(KEY));if(saved&&typeof saved.muted==='boolean')muted=saved.muted;if(saved&&Number.isFinite(saved.volume))volume=Math.max(0,Math.min(1,saved.volume));}catch{}
 const notify=()=>listeners.forEach(fn=>fn());
 function persist(){try{storage()?.setItem(KEY,JSON.stringify({muted,volume}));}catch{}notify();}
 function stop(){pendingCue=null;for(const v of voices){try{v.osc.stop();}catch{}try{v.osc.disconnect();v.gain.disconnect();}catch{}}voices.clear();}
 function level(){if(master&&ctx){try{master.gain.cancelScheduledValues(ctx.currentTime);master.gain.setValueAtTime(muted?0:volume*.5,ctx.currentTime);}catch{}}}
 function unlock(){if(hidden()||unavailable)return;if(!muted&&volume)playback(true);if(!ctx){try{ctx=createContext();if(!ctx){unavailable=true;notify();return;}master=ctx.createGain();master.connect(ctx.destination);level();activated=true;}catch{unavailable=true;stop();notify();return;}}
  activated=true;if(ctx.state==='suspended'||ctx.state==='interrupted'){if(!resume){try{resume=Promise.resolve(ctx.resume()).then(()=>{resume=null;const cue=pendingCue;pendingCue=null;if(cue)play(cue);},()=>{resume=null;pendingCue=null;});}catch{resume=null;}}}
 }
 function play(name){if(!activated||muted||!volume||hidden()||!ctx)return false;if(ctx.state!=='running'){if(resume&&CUES[name])pendingCue=name;return false;}const notes=CUES[name];if(!notes)return false;const now=ctx.currentTime;if(now-(lastCue.get(name)??-100)<(name==='move'?.09:.045))return false;lastCue.set(name,now);let played=false;
  try{for(const [freq,duration,delay=0,type='sine',to=freq] of notes){if(voices.size>=8)break;const osc=ctx.createOscillator(),gain=ctx.createGain(),start=now+delay,end=start+duration;const voice={osc,gain};voices.add(voice);osc.type=type;osc.frequency.setValueAtTime(freq,start);osc.frequency.exponentialRampToValueAtTime(to,end);gain.gain.setValueAtTime(0,start);gain.gain.linearRampToValueAtTime(.15,start+.008);gain.gain.exponentialRampToValueAtTime(.0001,end);osc.connect(gain);gain.connect(master);osc.onended=()=>{voices.delete(voice);try{osc.disconnect();gain.disconnect();}catch{}};osc.start(start);osc.stop(end+.015);played=true;}}catch{stop();return false;}return played;
 }
 function suspend(){stop();playback(false);if(ctx&&ctx.state==='running')try{Promise.resolve(ctx.suspend()).catch(()=>{});}catch{}}
 return {unlock,play,stop,suspend,test(){stop();lastCue.clear();muted=false;if(volume<.5)volume=.6;level();persist();unlock();return play('win');},get muted(){return muted;},get volume(){return volume;},get unavailable(){return unavailable;},setMuted(value){muted=!!value;if(muted){stop();playback(false);}level();persist();},setVolume(value){if(!Number.isFinite(value))return;volume=Math.max(0,Math.min(1,value));if(!volume)stop();level();persist();},subscribe(fn){listeners.add(fn);return ()=>listeners.delete(fn);}};
}
export const sound=typeof globalThis.Audio==='function'?createMediaSound(CUES):createSound();
function install(){const host=document.querySelector('header');if(!host||document.getElementById('sound-toggle'))return;
 const ui=document.createElement('div');ui.className='game-sound';ui.innerHTML='<button id="sound-toggle" type="button" aria-label="遊戲音效" aria-pressed="true">🔊 音效開</button><button id="sound-test" type="button">測試聲音</button><label class="sound-volume">音量<input id="sound-volume" aria-label="音效音量" type="range" min="0" max="100" step="5"></label>';
 const status=document.createElement('span');status.className='sound-status';status.setAttribute('role','status');ui.append(status);host.append(ui);ui.addEventListener('keydown',e=>e.stopPropagation());const button=ui.querySelector('button'),slider=ui.querySelector('input');const update=()=>{button.textContent=sound.unavailable?'音效不支援':sound.muted?'🔇 音效關':'🔊 音效開';button.setAttribute('aria-pressed',String(!sound.muted));button.disabled=sound.unavailable;ui.querySelector('#sound-test').disabled=sound.unavailable;slider.disabled=sound.unavailable;slider.value=String(Math.round(sound.volume*100));status.textContent=sound.status||'';};sound.subscribe(update);update();
 const style=document.createElement('style');style.textContent='.sound-status{font:11px system-ui;max-width:190px}.game-sound{display:flex;flex-wrap:wrap;align-items:center;gap:8px;margin-left:auto}.game-sound button{font:12px system-ui;white-space:nowrap;min-height:40px;padding:7px 9px}.sound-volume{display:flex;align-items:center;gap:4px;font:11px system-ui;white-space:nowrap}.sound-volume input{width:68px;min-height:30px;accent-color:#d8ad67}header:has(.game-sound){flex-wrap:wrap;height:auto;min-height:54px;gap:8px}.game-sound+*{margin-left:0}@media(max-width:500px){.game-sound{width:100%;justify-content:flex-end;border-top:1px solid #78938a33;padding-top:5px;margin-top:0}.sound-volume input{width:76px}.game-sound button{min-height:36px}.game-sound .sound-volume{font-size:11px}.stage{height:calc(100dvh - 342px)}.platform-wrap{height:calc(100dvh - 390px);min-height:270px}}';document.head.append(style);
 const unlock=e=>{if(e.isTrusted)sound.unlock();};document.addEventListener('pointerdown',unlock,{capture:true,passive:true});document.addEventListener('keydown',unlock,{capture:true});document.addEventListener('touchend',unlock,{capture:true,passive:true});document.addEventListener('click',unlock,{capture:true,passive:true});
 button.onclick=()=>{sound.setMuted(!sound.muted);sound.unlock();if(!sound.muted)sound.play('collect');};ui.querySelector('#sound-test').onclick=()=>{sound.test();ui.querySelector('#sound-test').textContent='再播測試音';};slider.oninput=()=>{sound.unlock();sound.setVolume(Number(slider.value)/100);};slider.onchange=()=>sound.play('click');
 document.addEventListener('visibilitychange',()=>{if(document.hidden)sound.suspend();});window.addEventListener('pagehide',()=>sound.suspend());window.addEventListener('blur',()=>sound.suspend());
 document.addEventListener('click',e=>{const b=e.target.closest('button');if(b&&!b.disabled&&!ui.contains(b)&&!b.closest('#grid')&&!b.matches('[data-move],[data-hold],[data-dir],#act,#jump,#dash'))sound.play('click');});
}
if(typeof document!=='undefined'){if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();}
