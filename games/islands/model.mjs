export const BUILDINGS = {
  hall: { name:'月光會所', icon:'☾', cost:[0,0,0], yield:[4,1,1], effect:[1,0,0], description:'居民相聚的起點，每週供應少量資金、木材與知識。' },
  market: { name:'海風市集', icon:'▦', cost:[35,3,0], yield:[18,0,0], effect:[1,-1,-1], description:'穩定收入，但熱鬧的市集也會增加環境與供電負擔。' },
  home: { name:'海景小屋', icon:'⌂', cost:[28,5,0], yield:[3,0,0], effect:[2,-1,-2], description:'每級增加 8 位居民，讓島上逐漸熱鬧。' },
  forest: { name:'永續林場', icon:'♧', cost:[24,2,0], yield:[2,6,0], effect:[0,3,0], description:'每週提供建材，並恢復島嶼的綠意。' },
  wind: { name:'風力工坊', icon:'✣', cost:[32,4,3], yield:[2,0,0], effect:[0,1,7], description:'讓海風化為電力，為更多建設打下基礎。' },
  school: { name:'星光學堂', icon:'▤', cost:[38,5,4], yield:[1,0,6], effect:[3,0,-1], description:'產出知識，也讓居民更願意留在島上。' },
  garden: { name:'月影花園', icon:'✿', cost:[22,3,1], yield:[0,0,1], effect:[4,4,0], description:'給島民一個散步的地方，同時提升幸福與生態。' },
  clinic: { name:'暖心診所', icon:'✚', cost:[42,4,6], yield:[0,0,2], effect:[7,0,-2], description:'照顧島民健康；良好的供電能讓診所穩定運作。' },
  library: { name:'潮汐書屋', icon:'▥', cost:[34,4,5], yield:[5,0,5], effect:[3,1,-1], description:'把故事留在島上，產出知識並吸引旅人。' }
};
export const CITY_PLOTS = [
 ['plaza',5,5,'月光廣場'],['harbor',8,6,'海風港灣'],['west',2,5,'西岸空地'],['hill',3,2,'迎風丘陵'],['north',5,2,'北境草坡'],['east',8,3,'東側海岸'],['grove',2,7,'林間空地'],['bay',5,8,'南灣草地'],['ridge',7,8,'眺海高地'],['lane',4,6,'會所小徑'],['cape',7,1,'晨光岬角'],['meadow',1,3,'綠野草甸']
].map(([id,x,y,name])=>({id,x,y,name}));
export const EVENTS = {
  3:{title:'海風音樂夜',text:'旅人想在海邊辦一場小型音樂會。你希望如何安排？',options:[{label:'搭建節能舞台',cost:[16,2,0],effect:[8,2,0],reward:[4,0,2]},{label:'讓居民在廣場自由演出',cost:[0,0,0],effect:[4,0,0],reward:[3,0,1]}]},
  6:{title:'一場突來的海雨',text:'雨勢很大，居民正在等待你的決定。',options:[{label:'動用木材修整排水',cost:[10,6,0],effect:[5,4,0],reward:[0,0,3]},{label:'組織居民互助，先照顧需要的人',cost:[0,0,0],effect:[2,-3,-4],reward:[0,1,1]}]},
  9:{title:'候鳥歸來',text:'候鳥在東岸築巢，研究員希望島上保留一片安靜。',options:[{label:'設置保護區與觀察站',cost:[20,3,4],effect:[3,9,0],reward:[0,0,5]},{label:'減少夜間照明，留下自然岸線',cost:[0,0,0],effect:[1,5,2],reward:[0,0,1]}]},
  11:{title:'月光祭的邀請',text:'島民準備在第十二週辦月光祭，慶祝你們一起留下的生活。',options:[{label:'用故事與綠能照亮慶典',cost:[25,2,8],effect:[10,4,3],reward:[5,0,2]},{label:'分享家常菜，辦一場小小聚會',cost:[0,0,0],effect:[5,1,0],reward:[0,0,0]}]}
};
const clamp=(n,a=0,b=100)=>Math.max(a,Math.min(b,n));
export function newCity(){return {version:1,week:1,actions:3,coins:120,wood:14,knowledge:8,morale:52,ecology:58,power:42,plots:{plaza:{type:'hall',level:1},harbor:{type:'market',level:1}},events:[],pending:null,ended:false,log:['第一週：你來到月光島。先蓋林場與學堂，替往後的建設累積資源。']};}
export function cityCost(type,level=1){return BUILDINGS[type].cost.map(n=>Math.ceil(n*(level===1?1:level*.75)));}
export function cityProduction(s){const total=[0,0,0],effect=[0,0,0];for(const b of Object.values(s.plots)){BUILDINGS[b.type].yield.forEach((n,i)=>total[i]+=n*b.level);BUILDINGS[b.type].effect.forEach((n,i)=>effect[i]+=n*b.level);}total[0]-=Object.values(s.plots).reduce((n,b)=>n+b.level,0);return {resources:total,effect};}
export function population(s){return 16+Object.values(s.plots).reduce((n,b)=>n+(b.type==='home'?8*b.level:0),0);}
export function cityGoals(s){return [{name:'建成至少 8 處設施',done:Object.keys(s.plots).length>=8},{name:'島民達到 40 人',done:population(s)>=40},{name:'幸福達到 75',done:s.morale>=75},{name:'生態達到 75',done:s.ecology>=75},{name:'電力達到 65',done:s.power>=65},{name:'島上有學堂與診所',done:['school','clinic'].every(t=>Object.values(s.plots).some(b=>b.type===t))}];}
export function cityScore(s){return Math.round(cityGoals(s).filter(g=>g.done).length/6*70+(s.morale+s.ecology+s.power)/10);}
const afford=(s,c)=>s.coins>=c[0]&&s.wood>=c[1]&&s.knowledge>=c[2];
function pay(s,c){s.coins-=c[0];s.wood-=c[1];s.knowledge-=c[2];}
function effects(s,e){['morale','ecology','power'].forEach((k,i)=>s[k]=clamp(s[k]+e[i]));}
function reward(s,e){['coins','wood','knowledge'].forEach((k,i)=>s[k]=Math.max(0,s[k]+e[i]));}
export function cityAction(original,action){const s=structuredClone(original);const fail=message=>({state:original,ok:false,message});if(s.ended)return fail('這座島的十二週旅程已完成，可再開一座新島。');if(s.pending&&action.kind!=='event')return fail('請先替本週事件做決定。');let message='';
 if(action.kind==='build'){
  if(!CITY_PLOTS.some(p=>p.id===action.plot)||s.plots[action.plot]||!BUILDINGS[action.type]||action.type==='hall')return fail('請選擇空地與可建設的設施。');if(s.actions<1)return fail('本週行動已用完，請進入下一週。');const c=cityCost(action.type);if(!afford(s,c))return fail('資源不足。可以先募集物資，或等下週生產。');pay(s,c);s.plots[action.plot]={type:action.type,level:1};s.actions--;message=`${BUILDINGS[action.type].name}落成了。下週開始生產。`;
 }else if(action.kind==='upgrade'){
  const b=s.plots[action.plot];if(!b||b.level>=3)return fail('這座設施已滿級，或尚未建設。');if(s.actions<1)return fail('本週行動已用完。');const c=cityCost(b.type,b.level+1);if(!afford(s,c))return fail('升級資源不足，先募集物資或等待生產。');pay(s,c);b.level++;s.actions--;message=`${BUILDINGS[b.type].name}升至 ${b.level} 級，產出與效果同步增加。`;
 }else if(action.kind==='gather'){
  if(s.actions<1)return fail('本週行動已用完。');s.actions--;reward(s,[24,5,2]);message='與島民一起募集了 24 金幣、5 木材、2 知識。';
 }else if(action.kind==='research'){
  if(s.actions<1)return fail('本週行動已用完。');if(!afford(s,[8,0,4]))return fail('研究需要 8 金幣、4 知識。');s.actions--;pay(s,[8,0,4]);effects(s,[2,3,5]);message='完成節能研究：幸福 +2、生態 +3、電力 +5。';
 }else if(action.kind==='event'){
  const e=EVENTS[s.pending],option=e?.options[action.index];if(!option)return fail('目前沒有需要處理的事件。');if(!afford(s,option.cost))return fail('資源不足，請選擇不需資源的方案。');pay(s,option.cost);effects(s,option.effect);reward(s,option.reward);s.events.push(s.pending);s.pending=null;message=`已決定：${option.label}。`;
 }else if(action.kind==='advance'){
  const p=cityProduction(s);reward(s,p.resources);effects(s,p.effect);if(s.power<20){effects(s,[-6,0,0]);message='供電吃緊，幸福額外下降 6。';}if(s.coins===0){effects(s,[-3,0,0]);message+='資金短缺，幸福下降 3。';}if(s.week===12){s.ended=true;s.actions=0;message=`月光祭開始了！這座島獲得 ${cityScore(s)} 分。`;}else{s.week++;s.actions=3;s.pending=EVENTS[s.week]&&!s.events.includes(s.week)?s.week:null;message=`第 ${s.week} 週開始。資金 ${p.resources[0]>=0?'+':''}${p.resources[0]}、木材 +${p.resources[1]}、知識 +${p.resources[2]}。`+message;}
 }else return fail('無法執行這項行動。');s.log.unshift(message);s.log=s.log.slice(0,36);return {state:s,ok:true,message};}
export function validCity(s){return !!s&&s.version===1&&Number.isInteger(s.week)&&s.week>=1&&s.week<=12&&Number.isInteger(s.actions)&&s.actions>=0&&s.actions<=3&&['coins','wood','knowledge','morale','ecology','power'].every(k=>Number.isFinite(s[k])&&s[k]>=0)&&!!s.plots&&Object.entries(s.plots).every(([id,b])=>CITY_PLOTS.some(p=>p.id===id)&&BUILDINGS[b?.type]&&Number.isInteger(b.level)&&b.level>=1&&b.level<=3)&&s.plots.plaza?.type==='hall'&&Array.isArray(s.events)&&(!s.pending||EVENTS[s.pending])&&Array.isArray(s.log)&&s.log.every(x=>typeof x==='string');}

export const LOCATIONS=[
 {id:'dock',x:8,y:6,name:'潮汐碼頭',icon:'⚓',need:[],intro:'霧裡的渡船只送來你一個人。碼頭的老鐘停在兩點，候船亭還留著前任守燈人的手記。',inspect:'你在候船亭找到一張渡船票。手記寫著：「村口的鎖記得四件事：二道潮痕、七隻海鷗、一聲鐘、四盞岸燈。」',item:'ticket'},
 {id:'village',x:6,y:5,name:'無聲村落',icon:'⌂',need:['ticket'],intro:'石門後是一座安靜的村落，郵差的小木箱上有四位數字鎖。渡船票背面寫著：答案在碼頭。',inspect:'木箱裡也許有地圖。碼頭的四個數量，順序是潮痕、海鷗、鐘聲、岸燈。',puzzle:'code'},
 {id:'garden',x:3,y:6,name:'苔光庭園',icon:'♧',need:['map'],intro:'被青苔包圍的棧道通向一間小亭。你站在左下角，必須踏著安全木板走到右上角。',inspect:'地圖邊緣藏著路線：「往北兩步，向東兩步，再北、再東。」走錯會退回起點，不會失去道具。',puzzle:'path'},
 {id:'workshop',x:3,y:3,name:'齒輪工坊',icon:'⚙',need:['brassKey'],intro:'黃銅鑰匙打開了工坊。三層刻度環鎖著透明鏡片，外環、中環、內環各有 0–3 四種位置。',inspect:'庭園的拓印寫著：「外環一刻，中環三刻，內環兩刻。」每按一次轉動一格，四格後回到零。',puzzle:'rings'},
 {id:'library',x:5,y:2,name:'潮聲書屋',icon:'▥',need:['rubbing'],intro:'藏書室的門沒有鎖，桌上放著一本缺頁的航海日誌。四枚字印必須按正確順序蓋回封面。',inspect:'拓印下方的小詩：「先聽潮聲，再穿過森林；抬頭見星，最後把月光帶回來。」',puzzle:'words'},
 {id:'observatory',x:7,y:2,name:'星眠觀測所',icon:'✦',need:['lens','starChart'],intro:'裝上鏡片，九盞星燈亮起。每按一盞，它和上下左右的星燈都會切換。讓所有燈熄滅，稜鏡才會出現。',inspect:'星圖提示：「左上角、正中央、右下角，三個位置相互呼應。」相同的星燈再按一次，就能撤回那一步。',puzzle:'lights'},
 {id:'lighthouse',x:1,y:1,name:'霧海燈塔',icon:'♜',need:['gear','starChart','prism'],intro:'你把齒輪與稜鏡安進燈塔。最後三枚方位印還在等待：有一個家、一段歸途，和遠方的引路者。',inspect:'守燈人的信寫著：「先讓月亮照見家，再由潮水帶船出海，最後循星光抵達遠方。」依序選三枚字印。',puzzle:'beacon'}
];
export const ITEMS={ticket:'渡船票',map:'海島地圖',letter:'守燈人的信',brassKey:'黃銅鑰匙',rubbing:'苔紋拓印',lens:'星光鏡片',gear:'燈塔齒輪',starChart:'航海星圖',prism:'月色稜鏡'};
export const SOLUTIONS={village:'2714',garden:['N','N','E','E','N','E'],workshop:[1,3,2],library:['潮','林','星','月'],lighthouse:['月','潮','星']};
export const LIGHT_START=[1,0,0,0,1,0,0,0,1];
export function newAdventure(){return {version:1,location:'dock',visited:['dock'],inspected:[],solved:[],items:[],drafts:{},journal:['你收到守燈人的邀請：循著潮聲、森林與星光，找回燈塔失去的光。'],hints:0,ending:null};}
export function unlocked(s,id){const l=LOCATIONS.find(l=>l.id===id);return !!l&&l.need.every(i=>s.items.includes(i));}
export function toggleLights(board,index){return board.map((n,i)=>{const r=Math.floor(i/3),c=i%3,rr=Math.floor(index/3),cc=index%3;return Math.abs(r-rr)+Math.abs(c-cc)<=1?1-n:n;});}
export function adventureAction(original,action){const s=structuredClone(original);const fail=message=>({state:original,ok:false,message});const l=LOCATIONS.find(l=>l.id===s.location);if(s.ending&&['solve','ending'].includes(action.kind))return fail('這次旅程已完成。重新探索後，可以收藏另一種結局。');let message='';if(action.kind==='travel'){
  if(!unlocked(s,action.id))return fail('這個地點還未開放。查看地點清單，找出需要的道具。');s.location=action.id;if(!s.visited.includes(action.id))s.visited.push(action.id);message=`抵達${LOCATIONS.find(l=>l.id===action.id).name}。`;
 }else if(action.kind==='inspect'){
  if(!s.inspected.includes(l.id)){s.inspected.push(l.id);s.journal.unshift(l.inspect);if(l.item&&!s.items.includes(l.item))s.items.push(l.item);}message=l.inspect;
 }else if(action.kind==='hint'){
  s.hints++;message=l.inspect;if(!s.journal.includes(l.inspect))s.journal.unshift(l.inspect);
 }else if(action.kind==='solve'){
  if(!l.puzzle)return fail('這裡沒有尚待解開的機關。');if(s.solved.includes(l.id))return fail('這裡的機關已解開。');let correct=false;
  if(l.id==='observatory')correct=Array.isArray(action.answer)&&action.answer.length===9&&action.answer.every(n=>n===0);
  else correct=JSON.stringify(action.answer)===JSON.stringify(SOLUTIONS[l.id]);
  if(!correct)return fail('機關還沒有回應。對照日誌與提示，再試一次；道具不會消失。');
  s.solved.push(l.id);const gifts={village:['map','letter'],garden:['brassKey','rubbing'],workshop:['lens','gear'],library:['starChart'],observatory:['prism'],lighthouse:[]}[l.id];for(const item of gifts)if(!s.items.includes(item))s.items.push(item);message=`${l.name}的機關解開了。`+(gifts.length?'獲得：'+gifts.map(i=>ITEMS[i]).join('、')+'。':'你可以決定這束光的去向。');s.journal.unshift(message);
 }else if(action.kind==='ending'){
  if(!s.solved.includes('lighthouse')||!['home','voyage'].includes(action.id))return fail('請先解開燈塔最後的機關。');s.ending=action.id;message=action.id==='home'?'燈塔再亮起，海上的每一艘船都有了回家的方向。':'你把稜鏡化為一盞航燈，和島民一起把光送往更遠的海岸。';s.journal.unshift(message);
 }else return fail('無法執行這項探索。');s.journal=s.journal.slice(0,40);return {state:s,ok:true,message};}
export function validAdventure(s){return !!s&&s.version===1&&LOCATIONS.some(l=>l.id===s.location)&&['visited','inspected','solved','items','journal'].every(k=>Array.isArray(s[k]))&&s.items.every(i=>Object.hasOwn(ITEMS,i))&&['visited','inspected','solved'].every(k=>s[k].every(id=>LOCATIONS.some(l=>l.id===id)))&&s.journal.every(x=>typeof x==='string')&&Number.isFinite(s.hints)&&s.hints>=0&&(!s.ending||['home','voyage'].includes(s.ending))&&unlocked(s,s.location);}
