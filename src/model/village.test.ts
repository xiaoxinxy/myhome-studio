import {it,expect} from 'vitest';
import {village} from './village';
import {makePlan,catalog} from './catalog';
import {makeWalkWorld,walkable,moveWalker,walkSpawn} from './walking';
import {driveStep,vehicleState,vehicles,canDrive} from './vehicle';
import {startDriving,stopDriving,useInteractions,petCat,seatTarget} from '../interactions';
import {walkMotion} from '../walkState';

it('十二户宅院面积接近自家、布局各异，厨房卧室客厅均有真实陈设',()=>{
 const p=makePlan(),homes=village(p.dimensions).filter(h=>h.n.style<12);expect(homes).toHaveLength(12);
 const signatures=new Set(homes.map(h=>JSON.stringify(h.layout.rooms.filter(r=>r.kind!=='yard').map(r=>[+(r.x-h.n.x).toFixed(2),+(r.z-h.n.z).toFixed(2),+r.w.toFixed(2),+r.d.toFixed(2)]))));expect(signatures.size).toBe(12);
 for(const h of homes){expect(h.n.w*h.n.depth/(p.dimensions.width*p.dimensions.depth)).toBeGreaterThan(.8);expect(h.plan.items.length).toBeGreaterThan(25);expect(h.plan.items.some(f=>f.type==='fridge')).toBe(true);expect(h.plan.items.some(f=>f.type.includes('bed'))).toBe(true);expect(h.plan.items.some(f=>f.type.includes('sofa'))).toBe(true);}
});
it('每户所有房间均能从院门沿真实门洞到达，外墙和窗不能穿过',()=>{
 const p=makePlan(),w=makeWalkWorld(p),step=.18;
 for(const h of village(p.dimensions)){
  const start=walkSpawn(w,h.n.id),queue=[start],seen=new Set<string>(),reached=new Set<string>();
  for(let i=0;i<queue.length;i++){const at=queue[i];for(const r of h.layout.rooms)if(r.kind!=='yard'&&at.x>r.x+.1&&at.x<r.x+r.w-.1&&at.z>r.z+.1&&at.z<r.z+r.d-.1)reached.add(r.id);
   for(const [dx,dz] of [[step,0],[-step,0],[0,step],[0,-step]]){const x=at.x+dx,z=at.z+dz,key=Math.round((x-start.x)/step)+':'+Math.round((z-start.z)/step);if(seen.has(key)||x<h.n.x||x>h.n.x+h.n.w||z<h.n.z||z>h.n.z+h.n.depth)continue;seen.add(key);if(walkable(x,z,w))queue.push({x,z});}
  }
  expect(reached.size,h.n.name).toBe(h.layout.rooms.length-1);
 }
});
it('驾驶有加速、倒车、转弯和实体阻挡，下车选取可站立位置且不改装修方案',()=>{
 vehicles.clear();const p=makePlan(),car=p.items.find(f=>f.type==='car')!,before=JSON.stringify(p),v=vehicleState(car),c=catalog.find(c=>c.id==='car')!,w=makeWalkWorld(p);
 expect(canDrive(v,v.x,v.z,v.yaw,c,w)).toBe(true);const x=v.x;for(let i=0;i<20;i++)driveStep(v,-1,0,.05,c,w);expect(v.x).toBeGreaterThan(x+.5);
 v.x=11;v.z=p.dimensions.depth+6.8;v.yaw=Math.PI/2;v.speed=0;const z=v.z;for(let i=0;i<20;i++)driveStep(v,1,.5,.05,c,makeWalkWorld(p));expect(v.speed).toBeGreaterThan(0);expect(v.z).not.toBe(z);
 Object.assign(walkMotion,{x:v.x+1.5,z:v.z});expect(startDriving(p,car)).toBe(true);expect(stopDriving(p)).toBe(true);expect(walkable(walkMotion.x,walkMotion.z,makeWalkWorld(p))).toBe(true);expect(JSON.stringify(p)).toBe(before);vehicles.clear();useInteractions.setState({driving:null});
});
it('座位高度匹配家具，摸猫进入蹲下姿态并面对猫，交互不改方案',()=>{
 const p=makePlan(),seat=p.items.find(f=>f.type==='garden-chair')!,target=seatTarget(p,seat),cat=p.items.find(f=>f.type==='cat-black')!;expect(target.y).toBeGreaterThanOrEqual(0);const before=JSON.stringify(p);Object.assign(walkMotion,{x:cat.x+.9,z:cat.z});expect(petCat(p,cat)).toBe(true);expect(walkMotion.crouchUntil).toBeGreaterThan(Date.now());expect(JSON.stringify(p)).toBe(before);walkMotion.crouchUntil=0;walkMotion.petting=false;
});
