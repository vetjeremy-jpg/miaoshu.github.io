export const ITEMS={key:'小鑰匙',magnet:'磁鐵',string:'細繩',hook:'磁力吊繩',fuse:'保險絲',note:'維修筆記',wire:'電線',brass:'駕駛室鑰匙',lever:'煞車手柄'};
export const freshTrain=()=>({version:1,room:0,items:[],flags:[],switches:[0,0,0],glyphs:[],brakes:0,ending:null});
const has=(s,f)=>s.flags.includes(f);const flag=(s,f)=>{if(!has(s,f))s.flags.push(f);};const give=(s,i)=>{if(!s.items.includes(i))s.items.push(i);};
export function trainGoal(s){if(s.ending)return '列車已平安停靠。你可以重新開始，尋找另一個結局。';if(!s.items.includes('key'))return '先檢查掛在座位旁的外套。';if(!has(s,'case'))return '選背包裡的小鑰匙，再點行李箱。';if(!s.items.includes('hook'))return '找細繩，把它和磁鐵組合，勾出座位下的東西。';if(!s.items.includes('fuse'))return '選磁力吊繩，再檢查座位底下。';if(!has(s,'fuse'))return '把保險絲裝進右側電箱。';if(!has(s,'power'))return '對照維修筆記，調整三個電源開關。';if(!s.items.includes('brass'))return '去餐車，從桌上圖案找出保險櫃的開鎖順序。';if(!has(s,'cabin'))return '用駕駛室鑰匙打開前方的門。';if(!s.items.includes('lever'))return '搜索駕駛室工具櫃，找回煞車手柄。';if(!has(s,'lever'))return '把煞車手柄裝到控制台。';return '調整煞車壓力，依序鎖定三段安全區。';}
export function trainAct(original,a){const s=structuredClone(original),fail=text=>({state:original,ok:false,text});let text='',puzzle=null;if(s.ending)return fail('這趟列車已完成，重新開始能找另一個結局。');
 if(a.kind==='room'){if(![0,1,2].includes(a.id))return fail('沒有這節車廂。');if(a.id>0&&!has(s,'power'))return fail('車門沒有電。先修復座位旁的電箱。');if(a.id===2&&!has(s,'cabin'))return fail('駕駛室門鎖著。先去餐車找鑰匙。');s.room=a.id;text=['回到座位車廂。','走進餐車。','抵達駕駛室。'][a.id];}
 else if(a.kind==='combine'){if([a.a,a.b].includes('magnet')&&[a.a,a.b].includes('string')&&s.items.includes('magnet')&&s.items.includes('string')){give(s,'hook');text='磁鐵綁上細繩，做成磁力吊繩。可以伸到座位底下了。';}else return fail('這兩樣物品暫時沒有合適的組合。');}
 else if(a.kind==='inspect'){const id=a.id,inventory=a.item&&s.items.includes(a.item)?a.item:null;
 const rooms={coat:0,rack:0,case:0,seat:0,panel:0,table:1,safe:1,toolbox:1,alarm:1,door:1,cabinet:2,console:2,window:2};if(rooms[id]!==s.room)return fail('請先走到物品所在的車廂。');
 if(id==='coat'){give(s,'key');text='外套口袋裡有一把小鑰匙。點背包選它，再去開行李箱。';}
 if(id==='rack'){give(s,'string');text='行李架上垂著一條結實的細繩，已收進背包。';}
 if(id==='case'){if(inventory==='key'||has(s,'case')){flag(s,'case');give(s,'magnet');give(s,'note');text='行李箱打開了！找到磁鐵和維修筆記：電源要「亮、暗、亮」。';}else return fail('行李箱上有個小鎖孔。先選背包裡的鑰匙，再點箱子。');}
 if(id==='seat'){if(inventory==='hook'||s.items.includes('fuse')){give(s,'fuse');text='吊繩勾出一枚保險絲，正好能裝進電箱。';}else return fail('座位下有個金屬零件，手伸不到。需要能吊起它的工具。');}
 if(id==='panel'){if(inventory==='fuse')flag(s,'fuse');if(!has(s,'fuse'))return fail('電箱少了一枚保險絲。');puzzle='switches';text='依照維修筆記調整開關。左、右要亮，中間要暗。';}
 if(id==='table')text='餐桌上的乘車紀念卡畫著：「先月亮，再星星，最後海浪。」☾ → ★ → ≋';
 if(id==='safe'){puzzle='glyphs';text='三枚圖案鎖，線索就在餐桌上。';}
 if(id==='toolbox'){give(s,'wire');text='工具箱裡留著一段電線，或許能修復乘客警鈴。';}
 if(id==='alarm'){if(inventory==='wire'){flag(s,'alarm');text='警鈴修好了！睡著的乘客醒來，開始協助疏散。';}else text=has(s,'alarm')?'乘客已準備好安全下車。':'警鈴斷了一截線，修好它能先叫醒所有乘客。';}
 if(id==='door'){if(inventory==='brass'||has(s,'cabin')){flag(s,'cabin');s.room=2;text='駕駛室的門打開了。';}else return fail('需要駕駛室鑰匙。餐車的保險櫃可能藏著它。');}
 if(id==='cabinet'){give(s,'lever');text='在工具櫃找到了拆下來的煞車手柄！';}
 if(id==='console'){if(inventory==='lever')flag(s,'lever');if(!has(s,'lever'))return fail('控制台少了煞車手柄。看看旁邊的工具櫃。');puzzle='brakes';text='調整壓力到金色安全區，再按「鎖定」。需要完成三段。';}
 if(id==='window')text='遠方月台的燈亮著。先停車，再讓所有人安全下車。';
 }
 else if(a.kind==='switch'){if(s.room!==0||!has(s,'fuse')||![0,1,2].includes(a.id))return fail('先裝好保險絲。');s.switches[a.id]=1-s.switches[a.id];if(JSON.stringify(s.switches)==='[1,0,1]'){flag(s,'power');text='電力恢復！通往餐車的門開了。';}else{text='開關已切換。目標：亮、暗、亮。';puzzle='switches';}}
 else if(a.kind==='glyph'){if(s.room!==1||!['☾','★','≋'].includes(a.word))return fail('先找到保險櫃。');s.glyphs.push(a.word);if(s.glyphs.length===3){if(s.glyphs.join('')==='☾★≋'){give(s,'brass');text='保險櫃開了！拿到駕駛室鑰匙。';}else{s.glyphs=[];text='圖案順序不對。去餐桌看看紀念卡，再試一次。';puzzle='glyphs';}}else{text='目前順序：'+s.glyphs.join(' → ');puzzle='glyphs';}}
 else if(a.kind==='brake'){if(s.room!==2||!has(s,'lever')||s.brakes>=3)return fail('先修好煞車控制台。');const centers=[28,70,50],v=Number(a.value);if(!Number.isFinite(v)||Math.abs(v-centers[s.brakes])>6)return fail('壓力不在安全區，再調整一點。');s.brakes++;if(s.brakes===3){s.ending=has(s,'alarm')?'together':'alone';text=has(s,'alarm')?'全員平安：列車停在月台，乘客一起協助下車。':'寂靜月台：你停住列車，回頭叫醒了仍在熟睡的乘客。';}else{text='這一段已鎖定，繼續調整下一段壓力。';puzzle='brakes';}}
 else return fail('沒有這個操作。');return {state:s,ok:true,text,puzzle};}
export function validTrain(s){return !!s&&s.version===1&&[0,1,2].includes(s.room)&&Array.isArray(s.items)&&s.items.every(i=>Object.hasOwn(ITEMS,i))&&Array.isArray(s.flags)&&s.flags.every(f=>['case','fuse','power','alarm','cabin','lever'].includes(f))&&Array.isArray(s.switches)&&s.switches.length===3&&s.switches.every(n=>n===0||n===1)&&Array.isArray(s.glyphs)&&s.glyphs.length<=3&&s.glyphs.every(w=>['☾','★','≋'].includes(w))&&Number.isInteger(s.brakes)&&s.brakes>=0&&s.brakes<=3&&(!s.ending||['together','alone'].includes(s.ending));}
