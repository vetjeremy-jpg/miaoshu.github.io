import test from 'node:test';import assert from 'node:assert/strict';
import {newCity,cityAction,cityScore,cityGoals,CITY_PLOTS,validCity,newAdventure,adventureAction,unlocked,LOCATIONS,SOLUTIONS,LIGHT_START,toggleLights,validAdventure} from '../games/islands/model.mjs';
test('twelve-week island campaign can reach every goal without loans or deadlock',()=>{
 let s=newCity();const queue=['forest','school','home','wind','garden','clinic','home','home','market'];let next=0;
 while(!s.ended){if(s.pending){const r=cityAction(s,{kind:'event',index:1});assert.ok(r.ok);s=r.state;}
  while(s.actions){let r;if(next<queue.length){const slot=CITY_PLOTS.find(p=>!s.plots[p.id]);r=cityAction(s,{kind:'build',plot:slot.id,type:queue[next]});if(r.ok)next++;else r=cityAction(s,{kind:'gather'});}else{r=cityAction(s,{kind:'research'});if(!r.ok)r=cityAction(s,{kind:'gather'});}assert.ok(r.ok);s=r.state;assert.ok(validCity(s));}
  const r=cityAction(s,{kind:'advance'});assert.ok(r.ok);s=r.state;
 }
 assert.equal(s.week,12);assert.equal(s.events.length,4);assert.equal(cityGoals(s).filter(g=>g.done).length,6);assert.equal(cityScore(s),100);assert.ok(!cityAction(s,{kind:'gather'}).ok);
});
test('invalid construction, action exhaustion and unaffordable purchases do not mutate progress',()=>{
 const s=newCity(),before=structuredClone(s);assert.ok(!cityAction(s,{kind:'build',plot:'plaza',type:'home'}).ok);assert.deepEqual(s,before);
 let r=cityAction(s,{kind:'gather'});r=cityAction(r.state,{kind:'gather'});r=cityAction(r.state,{kind:'gather'});assert.equal(r.state.actions,0);assert.ok(!cityAction(r.state,{kind:'gather'}).ok);
 const poor={...s,coins:0,wood:0,knowledge:0};assert.ok(!cityAction(poor,{kind:'build',plot:'west',type:'clinic'}).ok);assert.ok(cityAction(poor,{kind:'gather'}).ok);
});
test('events block other actions, always offer a free recovery, and enforce upgrade cap',()=>{
 let s=newCity();s=cityAction(s,{kind:'advance'}).state;s=cityAction(s,{kind:'advance'}).state;assert.equal(s.pending,3);assert.ok(!cityAction(s,{kind:'advance'}).ok);s={...s,coins:0,wood:0,knowledge:0};assert.ok(!cityAction(s,{kind:'event',index:0}).ok);s=cityAction(s,{kind:'event',index:1}).state;assert.equal(s.pending,null);
 s=cityAction(s,{kind:'upgrade',plot:'plaza'}).state;s=cityAction(s,{kind:'upgrade',plot:'plaza'}).state;assert.equal(s.plots.plaza.level,3);assert.ok(!cityAction(s,{kind:'upgrade',plot:'plaza'}).ok);
});
test('all exploration puzzles are solvable; wrong answers and locked travel preserve inventory',()=>{
 let s=newAdventure();assert.ok(!unlocked(s,'lighthouse'));assert.ok(!adventureAction(s,{kind:'travel',id:'workshop'}).ok);s=adventureAction(s,{kind:'inspect'}).state;assert.ok(unlocked(s,'village'));
 for(const id of ['village','garden','workshop','library','observatory','lighthouse']){
  let r=adventureAction(s,{kind:'travel',id});assert.ok(r.ok,id);s=r.state;
  r=adventureAction(s,{kind:'solve',answer:'incorrect'});assert.ok(!r.ok);assert.deepEqual(r.state,s);
  const answer=id==='observatory'?[0,4,8].reduce(toggleLights,LIGHT_START):SOLUTIONS[id];
  r=adventureAction(s,{kind:'solve',answer});assert.ok(r.ok,id);s=r.state;assert.ok(validAdventure(s));
 }
 assert.equal(s.solved.length,6);assert.equal(s.items.length,9);const e=adventureAction(s,{kind:'ending',id:'home'});assert.ok(e.ok);assert.equal(e.state.ending,'home');assert.ok(!adventureAction(e.state,{kind:'ending',id:'voyage'}).ok);
});
test('light puzzle is reversible and restart has clean, independently valid state',()=>{
 for(let i=0;i<9;i++)assert.deepEqual(toggleLights(toggleLights(LIGHT_START,i),i),LIGHT_START);
 assert.ok(validCity(newCity()));assert.ok(validAdventure(newAdventure()));assert.ok(!validCity({version:1}));assert.ok(!validAdventure({version:1}));assert.equal(LOCATIONS.length,7);
});
