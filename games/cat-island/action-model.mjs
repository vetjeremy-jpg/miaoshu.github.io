export const W=1152,H=864;
export const LEVELS=[
 {name:'海風小徑',grass:'#b9d795',sea:'#75c5cd',tool:'輕跑靴',toolHint:'取得輕跑靴，可以短距離衝刺穿過巡邏空隙。',spawn:[144,180],cats:[[288,180],[864,324],[384,708]],chest:[624,132],exit:[1032,744],blocks:[[408,264,72,240],[648,528,240,64],[168,420,112,72]],patrols:[[550,330,150,0,1],[800,660,140,0,1.15]]},
 {name:'迷霧森林',grass:'#89b59a',sea:'#73a9ac',tool:'月光提燈',toolHint:'提燈會照亮下一座島，跟著光找隱藏的朋友。',spawn:[144,180],cats:[[336,300],[840,168],[888,696]],chest:[336,696],exit:[1032,744],blocks:[[528,264,80,160],[528,540,80,180],[216,444,168,64],[768,396,168,64]],patrols:[[310,580,150,0,1.35],[800,300,150,0,1.3],[730,600,0,100,1.1]]},
 {name:'月影遺跡',grass:'#a4abc9',sea:'#7588b0',tool:'星鈴',toolHint:'星鈴響起！最後一隻害羞的貓出現了。',spawn:[144,180],cats:[[360,180],[888,324],[408,708]],chest:[864,696],exit:[1032,744],blocks:[[456,120,64,240],[216,432,360,64],[696,432,240,64],[576,624,64,144]],patrols:[[730,240,130,0,1.6],[350,580,170,0,1.6],[900,600,140,0,1.4]]}
];
export const NAMES=['布丁','芝麻','奶蓋','薄荷','栗子','蜜桃','星糖','烏龍','月餅'];
export function fresh(){return {version:2,level:0,x:144,y:180,cats:[],tools:[],pickups:[],coins:0,hp:3,won:false};}
export function valid(s){return !!s&&s.version===2&&Number.isInteger(s.level)&&s.level>=0&&s.level<3&&['x','y'].every(k=>Number.isFinite(s[k]))&&s.x>=60&&s.x<=W-60&&s.y>=60&&s.y<=H-60&&Array.isArray(s.cats)&&new Set(s.cats).size===s.cats.length&&s.cats.every(i=>Number.isInteger(i)&&i>=0&&i<9)&&Array.isArray(s.tools)&&new Set(s.tools).size===s.tools.length&&s.tools.every(i=>[0,1,2].includes(i))&&Array.isArray(s.pickups)&&s.pickups.every(i=>Number.isInteger(i)&&i>=0&&i<12)&&Number.isInteger(s.coins)&&s.coins>=0&&Number.isInteger(s.hp)&&s.hp>=1&&s.hp<=3&&typeof s.won==='boolean'&&(!s.won||s.cats.length===9&&s.tools.length===3)&&Array.from({length:s.level},(_,z)=>z).every(z=>s.tools.includes(z)&&[0,1,2].every(i=>s.cats.includes(z*3+i)));}
export const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
export function blocked(x,y,level,r=15){return x<60||y<60||x>W-60||y>H-60||LEVELS[level].blocks.some(([a,b,w,h])=>x+r>a&&x-r<a+w&&y+r>b&&y-r<b+h);}
export function move(s,dx,dy){if(!blocked(s.x+dx,s.y,s.level))s.x+=dx;if(!blocked(s.x,s.y+dy,s.level))s.y+=dy;}
export function objects(s){const l=LEVELS[s.level];return [...l.cats.map(([x,y],i)=>({id:s.level*3+i,kind:'cat',x,y,hidden:s.level===2&&i===2&&!s.tools.includes(2)})).filter(o=>!s.cats.includes(o.id)),...(!s.tools.includes(s.level)?[{id:s.level,kind:'chest',x:l.chest[0],y:l.chest[1]}]:[]),{id:s.level,kind:'exit',x:l.exit[0],y:l.exit[1]}];}
export function nearest(s,positions=objects(s)){return positions.filter(o=>!o.hidden).map(o=>({...o,d:distance(s,o)})).sort((a,b)=>a.d-b.d)[0];}
export function interact(s,o){if(!o||distance(s,o)>76)return {ok:false,text:'再靠近一點，就能互動。'};
 if(o.kind==='cat'){if(o.hidden||s.cats.includes(o.id))return {ok:false,text:'這位朋友還在躲藏。'};s.cats.push(o.id);s.coins+=20;return {ok:true,text:`${NAMES[o.id]}跟上你了！貓咪 ${s.cats.length}/9 · +20 金幣`,kind:'cat'};}
 if(o.kind==='chest'){if(s.tools.includes(s.level))return {ok:false,text:'寶箱已打開。'};s.tools.push(s.level);s.coins+=40;return {ok:true,text:`找到${LEVELS[s.level].tool}！${LEVELS[s.level].toolHint}`,kind:'tool'};}
 const complete=[0,1,2].every(i=>s.cats.includes(s.level*3+i))&&s.tools.includes(s.level);if(!complete)return {ok:false,text:'先找齊這區的 3 隻貓與工具寶箱，出口就會打開。'};
 if(s.level===2){s.won=true;return {ok:true,text:'九位夥伴一起回家了！',kind:'win'};}s.level++;[s.x,s.y]=LEVELS[s.level].spawn;s.hp=3;return {ok:true,text:`抵達${LEVELS[s.level].name}。新的路線與巡邏在等你。`,kind:'level'};
}
export function hit(s){s.hp--;if(!s.hp){s.hp=3;[s.x,s.y]=LEVELS[s.level].spawn;return '回到營地休息，已救到的貓與工具都保留。';}return '被巡邏撞到了！閃光期間可以安全離開。';}
export function patrols(level,time){return LEVELS[level].patrols.map(([x,y,rx,ry,speed],i)=>({x:x+Math.sin(time*speed+i)*rx,y:y+Math.sin(time*speed+i)*ry}));}
