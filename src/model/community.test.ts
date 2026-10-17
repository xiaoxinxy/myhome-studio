import {it,expect} from 'vitest';
import {makePlan,catalog} from './catalog';
import {buildLayout} from './layout';
import {vehicleState,vehicles,driveStep} from './vehicle';
import {makeWalkWorld,moveWalker,walkable,distanceToSegment,walkSpawn,nearbySegments,nearbyObstacles,personRadius} from './walking';
import {publicPlaces,ruralPlots,streetBounds} from './neighborhood';
import {village} from './village';
import {useCommunity,buyGoods,harvest,pickFruit} from '../community';
it('汽车三轮电动车在各朝向前进时右键向右，倒车时车头反向偏转',()=>{
 const p=makePlan(),base=makeWalkWorld(p),w={...base,segments:[],obstacles:[]};
 for(const type of ['car','trike','ebike'])for(const yaw of [0,Math.PI/2,Math.PI,-Math.PI/2])for(const speed of [2,-2]){
  vehicles.clear();const f=p.items.find(f=>f.type===type)!,v=vehicleState(f),def=catalog.find(c=>c.id===type)!;Object.assign(v,{x:90,z:100,yaw,speed});
  driveStep(v,0,1,.05,def,w);expect((v.yaw-yaw)*speed,type).toBeLessThan(0);const rightX=-Math.cos(yaw),rightZ=Math.sin(yaw);expect((v.x-90)*rightX+(v.z-100)*rightZ,type).toBeGreaterThan(0);
 }vehicles.clear();
});
it('东卧室与南小屋的新门可双向通行，门两边仍是实体墙',()=>{
 const p=makePlan();p.items=[];const l=buildLayout(p.dimensions),room=l.rooms.find(r=>r.id==='small-south')!,wall=l.walls.find(w=>!w.exterior&&Math.abs(w.a[0]-room.x)<.01&&w.a[1]===0)!,o=wall.openings[0],x=room.x,z=o.start+o.width/2,w=makeWalkWorld(p);
 expect(moveWalker({x:x-.5,z},1,0,w).x).toBeGreaterThan(x+.4);expect(moveWalker({x:x+.5,z},-1,0,w).x).toBeLessThan(x-.4);
 expect(moveWalker({x:x-.5,z:.4},1,0,w).x).toBeLessThan(x);const closed=makeWalkWorld(p,true,[wall.id+':0']);expect(moveWalker({x:x-.5,z},1,0,closed).x).toBeLessThan(x);
});
it('公共建筑布局不同、各有完整内饰，农田果园和公共院门出生点安全',()=>{
 const p=makePlan(),w=makeWalkWorld(p),places=publicPlaces(p.dimensions);expect(places).toHaveLength(4);const homes=village(p.dimensions).filter(h=>h.n.style>=12);expect(homes.flatMap(h=>h.layout.rooms.map(r=>r.name)).join()).toContain('诊疗');
 for(const h of homes){expect(h.layout.rooms.filter(r=>r.kind==='room').length).toBeGreaterThanOrEqual(2);expect(h.plan.items.length).toBeGreaterThan(7);const pos=walkSpawn(w,h.n.id);expect(walkable(pos.x,pos.z,w)).toBe(true);expect(streetBounds(p.dimensions).maxZ).toBeGreaterThan(h.n.z+h.n.depth);}
 for(const r of ruralPlots(p.dimensions)){const pos=walkSpawn(w,r.id);expect(walkable(pos.x,pos.z,w)).toBe(true);}
});
it('空间索引与全量碰撞检查在全村随机采样一致，查询不含远处所有墙',()=>{
 const w=makeWalkWorld(makePlan());let seed=777;const rand=()=>((seed=seed*16807%2147483647)/2147483647);
 for(let i=0;i<3000;i++){const x=-100+rand()*220,z=.2+rand()*180,r=personRadius;const bounds=streetBounds(w.plan.dimensions);let free=x>=bounds.minX&&x<=bounds.maxX&&z>=r&&z<=bounds.maxZ;
  if(w.segments.some(s=>distanceToSegment(x,z,s)<s.radius+r-.001))free=false;
  if(w.obstacles.some(o=>{const dx=x-o.x,dz=z-o.z,ox=Math.max(0,Math.abs(dx*o.cos+dz*o.sin)-o.w/2),oz=Math.max(0,Math.abs(-dx*o.sin+dz*o.cos)-o.d/2);return ox*ox+oz*oz<r*r;}))free=false;
  expect(walkable(x,z,w),x+','+z).toBe(free);
 }
 expect(nearbySegments(w,11,28,2).length).toBeLessThan(w.segments.length/10);expect(nearbyObstacles(w,11,28,2).length).toBeLessThan(w.obstacles.length/10);
});
it('取货采收有库存与前置条件，不允许重复领取，游玩不会改动装修数据',()=>{
 const p=makePlan(),before=JSON.stringify(p);useCommunity.setState({stock:2,bag:0,watered:false,harvested:false,vegetables:0,picked:false,fruit:0});expect(buyGoods()).toBe(true);expect(buyGoods()).toBe(true);expect(buyGoods()).toBe(false);expect(useCommunity.getState().bag).toBe(2);expect(harvest()).toBe(false);useCommunity.setState({watered:true});expect(harvest()).toBe(true);expect(harvest()).toBe(false);expect(pickFruit()).toBe(true);expect(pickFruit()).toBe(false);expect(useCommunity.getState().vegetables).toBe(6);expect(JSON.stringify(p)).toBe(before);
});
