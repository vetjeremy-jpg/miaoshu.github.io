export const VAULTS=[
 ['#######','#..o..#','#.....#','#..$..#','#.....#','#..@.E#','#######'],
 ['########','#.o..o.#','#......#','#.$..$.#','#..##..#','#.@...E#','########'],
 ['#########','#...o...#','#..$....#','#..##...#','#...$o..#','#.#.....#','#.@....E#','#########'],
 ['#########','#.o...o.#','#.......#','#.$.#.$.#','#...#...#','#.......#','#..@..E.#','#########'],
 ['#########','#..o.o..#','#.......#','#..$.$..#','#.#...#.#','#...$...#','#...o...#','#.@....E#','#########'],
 ['##########','#.o....o.#','#........#','#.$.##.$.#','#........#','#..$..$..#','#..o..o..#','#.@.....E#','##########']
];
export function vaultStart(level){const rows=VAULTS[level],s={level,x:0,y:0,boxes:[],steps:0};rows.forEach((r,y)=>[...r].forEach((c,x)=>{if(c==='@'){s.x=x;s.y=y;}if(c==='$')s.boxes.push([x,y]);}));return s;}
export const vaultOpen=s=>VAULTS[s.level].every((r,y)=>[...r].every((c,x)=>c!=='o'||s.boxes.some(b=>b[0]===x&&b[1]===y)));
export const vaultWon=s=>VAULTS[s.level][s.y][s.x]==='E'&&vaultOpen(s);
export function vaultMove(s,dx,dy){if(Math.abs(dx)+Math.abs(dy)!==1)return s;const x=s.x+dx,y=s.y+dy,rows=VAULTS[s.level],c=rows[y]?.[x];if(!c||c==='#'||c==='E'&&!vaultOpen(s))return s;const box=s.boxes.findIndex(b=>b[0]===x&&b[1]===y),next=structuredClone(s);if(box>=0){const xx=x+dx,yy=y+dy,t=rows[yy]?.[xx];if(!t||t==='#'||t==='E'||s.boxes.some(b=>b[0]===xx&&b[1]===yy))return s;next.boxes[box]=[xx,yy];}next.x=x;next.y=y;next.steps++;return next;}
export function solveVault(start,max=250000){const hash=s=>s.x+','+s.y+'|'+s.boxes.map(b=>b.join(',')).sort().join(';'),q=[{s:start,path:''}],seen=new Set([hash(start)]);for(let i=0;i<q.length&&i<max;i++){const {s,path}=q[i];if(vaultWon(s))return path;for(const [dx,dy,k] of [[0,-1,'U'],[1,0,'R'],[0,1,'D'],[-1,0,'L']]){const n=vaultMove(s,dx,dy),h=hash(n);if(n!==s&&!seen.has(h)){seen.add(h);q.push({s:n,path:path+k});}}}return null;}
const B=(name,sources,targets,mirrors,walls=[],portals=[],split=[])=>({name,size:9,sources,targets,mirrors,walls,portals,split});
export const BEAMS=[
 B('第一束光',[[0,4,1,'gold']],[[8,1,'gold']],[[3,4,0],[3,1,0]],[[6,4]]),
 B('彎過兩個角',[[0,2,1,'gold']],[[8,1,'gold']],[[2,2,1],[2,7,1],[6,7,0],[6,1,0]],[[5,2]]),
 B('雙色花園',[[0,1,1,'gold'],[0,7,1,'blue']],[[8,3,'gold'],[8,5,'blue']],[[2,1,1],[2,3,1],[4,7,0],[4,5,0]],[[7,1],[7,7]]),
 B('長夜折返',[[0,4,1,'gold']],[[8,6,'gold']],[[2,4,0],[2,1,0],[6,1,1],[6,6,1]],[[4,4],[7,1]]),
 B('穿越星門',[[0,2,1,'gold'],[0,7,1,'blue']],[[8,1,'gold'],[8,4,'blue']],[[7,6,0],[7,1,0],[2,7,0],[2,4,0]],[[5,2]],[[3,2,5,6]]),
 B('分光之心',[[0,4,1,'gold']],[[8,1,'gold'],[8,7,'gold']],[[6,4,0],[6,1,0],[2,1,0],[4,1,1],[4,7,1]],[[8,4]],[],[[2,4]])
];
export const beamStart=level=>({level,turns:0,angles:BEAMS[level].mirrors.map((m,i)=>i%2?m[2]:1-m[2])});
const D=[[0,-1],[1,0],[0,1],[-1,0]];
export function traceBeam(s){const b=BEAMS[s.level],rays=b.sources.map(([x,y,d,color])=>({x,y,d,color})),lines=[],lit=new Set(),seen=new Set();for(let k=0;k<rays.length&&k<2000;k++){let {x,y,d,color}=rays[k];const h=[x,y,d,color].join(',');if(seen.has(h))continue;seen.add(h);const [dx,dy]=D[d],xx=x+dx,yy=y+dy;if(xx<0||yy<0||xx>=b.size||yy>=b.size)continue;lines.push([x,y,xx,yy,color]);x=xx;y=yy;if(b.walls.some(p=>p[0]===x&&p[1]===y))continue;const target=b.targets.findIndex(t=>t[0]===x&&t[1]===y&&t[2]===color);if(target>=0)lit.add(target);const mi=b.mirrors.findIndex(m=>m[0]===x&&m[1]===y);if(mi>=0)d=s.angles[mi]?[3,2,1,0][d]:[1,0,3,2][d];const portal=b.portals.find(p=>p[0]===x&&p[1]===y||p[2]===x&&p[3]===y);if(portal){[x,y]=portal[0]===x&&portal[1]===y?portal.slice(2):portal.slice(0,2);}if(b.split.some(p=>p[0]===x&&p[1]===y)){rays.push({x,y,d:(d+1)%4,color},{x,y,d:(d+3)%4,color});}rays.push({x,y,d,color});}return {lines,lit:[...lit],won:lit.size===b.targets.length};}
export function rotateBeam(s,i){if(!Number.isInteger(i)||i<0||i>=s.angles.length)return s;return {...s,turns:s.turns+1,angles:s.angles.map((a,j)=>j===i?1-a:a)};}
