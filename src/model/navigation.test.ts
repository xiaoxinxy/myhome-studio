import {afterEach,expect,it} from 'vitest';
import {useHome} from '../store';
import {buildLayout,initialDimensions} from './layout';
import {wallBuilding,wallBaseSpans} from './visibility';

afterEach(()=>useHome.getState().resetView());
it('外墙基座和绿色饰带在门洞处断开',()=>{
 for(const w of buildLayout(initialDimensions).walls.filter(w=>w.exterior&&!w.boundary)){
  for(const door of w.openings.filter(o=>o.kind==='door'))for(const span of wallBaseSpans(w))
   expect(Math.min(span.start+span.width,door.start+door.width)-Math.max(span.start,door.start)).toBeLessThanOrEqual(.001);
 }
});
it('进入房间默认完整室内观察，不污染全院图层',()=>{
 const s=useHome.getState();s.resetView();
 const layers={...useHome.getState().layers};
 s.selectRoom('living');expect(useHome.getState()).toMatchObject({interior:true,roomView:'inside',camera:'eye'});
 expect(useHome.getState().layers).toEqual(layers);
 s.selectRoom('courtyard');expect(useHome.getState().interior).toBe(false);
 expect(useHome.getState().layers).toEqual(layers);
});
it('恢复全院同时恢复隐藏物件、屋顶与墙体，并允许重复复位',()=>{
 useHome.setState({room:'guest',selected:'test',interior:true,compare:true,layers:{...useHome.getState().layers,roofs:false,walls:false,plants:false,objects:false}});
 const revision=useHome.getState().viewRevision;
 useHome.getState().resetView();const s=useHome.getState();
 expect([s.room,s.selected,s.interior,s.compare]).toEqual([null,null,false,false]);
 expect(s.layers).toMatchObject({roofs:true,walls:true,plants:true,objects:true});
 expect(s.viewRevision).toBe(revision+1);s.resetView();expect(useHome.getState().viewRevision).toBe(revision+2);
});
it('隔墙归属正确，东厢剖视不会截断正房和西厢',()=>{
 const l=buildLayout(initialDimensions);
 for(const id of ['main','west','east']){
  const walls=l.walls.filter(w=>wallBuilding(w,l)===id);
  expect(walls.length).toBeGreaterThanOrEqual(4);
  for(const w of walls){if(w.building)expect(w.building).toBe(id);}
 }
 expect(l.walls.filter(w=>!w.exterior&&wallBuilding(w,l)==='east')).toHaveLength(2);
 expect(l.walls.filter(w=>w.boundary).every(w=>!wallBuilding(w,l))).toBe(true);
});

it('正房前三处室内连通门居中，小房间门按最新说明朝南靠西',()=>{const l=buildLayout(initialDimensions);for(const w of l.walls.filter(w=>!w.exterior&&w.building==='main'&&w.a[0]===w.b[0]&&w.openings.length)){const o=w.openings[0];expect(o.start+o.width/2).toBeCloseTo(initialDimensions.mainDepth/2);}const wall=l.walls.find(w=>!w.exterior&&w.building==='main'&&w.a[1]===w.b[1])!;expect(wall.openings[0].start).toBeCloseTo(.12);});
