export const STAGES=[{name:'風起草原',width:2400,sky:'#729ca9'},{name:'浮動工坊',width:2500,sky:'#7285a3'},{name:'暮色高塔',width:2600,sky:'#696d95'},{name:'守星者',width:2800,sky:'#455978'}];
export const platformFresh=level=>({level,x:70,y:472,vx:0,vy:0,hp:3,stars:[],coins:0,checkpoint:70,boss:3,won:false,grounded:true,jumps:0,coyote:.1,buffer:0,invuln:0,dash:0,cool:0,time:0});
export function platforms(s){const w=STAGES[s.level].width;return [[0,520,560,100],[680,520,520,100],[1360,520,540,100],[2040,520,w-2040,100],[260,410,90,18],[790,405,120,18],[1010,335,100,18],[1510,410,120,18],[1740,330,100,18],...(s.level>0?[[1240+Math.sin(s.time*1.5)*70,425,110,18],[1930+Math.sin(s.time*1.2)*55,400,100,18]]:[])];}
export const starPositions=level=>[[180,480],[300,375],[740,480],[840,370],[1060,300],[1430,480],[1560,375],[1790,295],[2120,480],[2300,480],...(level===3?[[2600,480]]:[])];
export const spikes=s=>[[440,500,42,20],[1080,500,48+s.level*8,20],[1640,500,46+s.level*7,20]];
export const enemies=s=>[{id:0,x:820+Math.sin(s.time*1.5)*65,y:492,w:30,h:28},{id:1,x:1500+Math.sin(s.time*(1.4+s.level*.15))*100,y:492,w:30,h:28},...(s.level===3&&s.boss>0?[{id:2,x:2470+Math.sin(s.time)*70,y:420,w:100,h:100,boss:true,open:s.time%3.6>1.6}]:[])];
const overlap=(a,b)=>a.x<b.x+b.w&&a.x+28>b.x&&a.y<b.y+b.h&&a.y+44>b.y;
function damage(s){if(s.invuln>0)return;s.hp--;s.invuln=1.6;s.x=s.checkpoint;s.y=440;s.vy=0;s.dash=0;if(s.hp<=0)s.hp=3;}
export function platformTick(s,input,dt){if(s.won)return;dt=Math.min(.025,Math.max(0,dt));s.time+=dt;s.invuln=Math.max(0,s.invuln-dt);s.cool=Math.max(0,s.cool-dt);s.dash=Math.max(0,s.dash-dt);s.buffer=Math.max(0,s.buffer-dt);if(input.jump){s.buffer=.13;input.jump=false;}if(input.dash&&s.cool<=0){s.dash=.18;s.cool=1.25;input.dash=false;}if(s.grounded){s.coyote=.1;s.jumps=0;}else s.coyote=Math.max(0,s.coyote-dt);
 if(s.buffer>0&&(s.coyote>0||s.level>0&&s.jumps<2)){s.vy=-540;s.jumps++;s.grounded=false;s.coyote=0;s.buffer=0;}
 s.vx=(input.right?1:0)-(input.left?1:0);s.vx*=s.dash>0?540:235;const old={x:s.x,y:s.y};s.x=Math.max(0,Math.min(STAGES[s.level].width-28,s.x+s.vx*dt));s.vy+=1300*dt;s.y+=s.vy*dt;s.grounded=false;
 for(const [x,y,w,h] of platforms(s)){if(s.x+28>x&&s.x<x+w&&s.y+44>y&&s.y<y+h){if(old.y+44<=y+3&&s.vy>=0){s.y=y-44;s.vy=0;s.grounded=true;}else if(old.y>=y+h-2&&s.vy<0){s.y=y+h;s.vy=0;}else if(old.x+28<=x){s.x=x-28;}else if(old.x>=x+w){s.x=x+w;}}}
 if(s.y>700)damage(s);for(const [x,y,w,h] of spikes(s))if(overlap(s,{x,y,w,h}))damage(s);
 for(const e of enemies(s)){if(overlap(s,e)){if(s.vy>0&&old.y+44<=e.y+14&&(!e.boss||e.open)){s.vy=-490;s.y=e.y-45;if(e.boss){s.boss--;s.invuln=.45;}else{s.coins+=10;/* A stomp bounces over patrols; they keep roaming. */}}else damage(s);}}
 starPositions(s.level).forEach(([x,y],i)=>{if(!s.stars.includes(i)&&Math.hypot(s.x+14-x,s.y+22-y)<31){s.stars.push(i);s.coins+=5;}});
 if(s.grounded&&s.x>900&&s.x<1100)s.checkpoint=900;if(s.grounded&&s.x>1740&&s.x<1850)s.checkpoint=1740;
 if(s.x>STAGES[s.level].width-100&&s.stars.length>=3&&(s.level!==3||s.boss===0))s.won=true;
}
export function validPlatform(s){return !!s&&Number.isInteger(s.level)&&s.level>=0&&s.level<4&&['x','y','vx','vy','coins','checkpoint','boss','time','cool','dash','invuln','jumps','coyote','buffer'].every(k=>Number.isFinite(s[k]))&&s.x>=0&&s.x<=STAGES[s.level].width&&s.y>=-500&&s.y<=700&&Number.isInteger(s.hp)&&s.hp>=1&&s.hp<=3&&Array.isArray(s.stars)&&new Set(s.stars).size===s.stars.length&&s.stars.every(i=>Number.isInteger(i)&&i>=0&&i<starPositions(s.level).length)&&s.boss>=0&&s.boss<=3&&typeof s.won==='boolean';}
