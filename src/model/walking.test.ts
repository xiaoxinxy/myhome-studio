import {expect,it} from 'vitest';
import {makePlan} from './catalog';
import {makeWalkWorld,moveWalker,walkSpawn,walkHeight,walkable,roomAt,maxWalkStep,cameraBoom} from './walking';
import {useHome} from '../store';

it('镜头避开实体墙与大件家具，剖开的矮墙不会挡住跟随镜头',()=>{
 const p=makePlan();p.items=[];const world=makeWalkWorld(p);
 const target={x:7,y:2.6,z:7},eye={x:7,y:2.6,z:4};
 expect(cameraBoom(target,eye,world)).toBeLessThan(1);
 expect(cameraBoom(target,eye,world,'main')).toBe(1);
 const wardrobe=makePlan().items.find(f=>f.type==='wardrobe')!;
 p.items=[{...wardrobe,room:'living',x:11,z:2.4,rotation:0}];
 expect(cameraBoom({x:11,y:2.6,z:4},{x:11,y:2.6,z:1},makeWalkWorld(p),'main')).toBeLessThan(1);
});
it('漫游与退出不改变方案，也不保存按键或角色坐标',()=>{
 const s=useHome.getState(),before=structuredClone(s.current());s.startWalk();
 expect(useHome.getState()).toMatchObject({walking:true,mode:'3d',selected:null,compare:false,interaction:'observe'});
 expect(useHome.getState().current()).toEqual(before);
 const saved=JSON.parse(localStorage.getItem('courtyard-home-studio-v2')!).state;
 expect('walking' in saved).toBe(false);expect('walkRoom' in saved).toBe(false);
 useHome.getState().stopWalk();expect(useHome.getState().walking).toBe(false);expect(useHome.getState().current()).toEqual(before);
});

it('实体墙和窗不能穿过，实际门洞允许双向通过',()=>{
 const p=makePlan();p.items=[];const w=makeWalkWorld(p),d=p.dimensions;
 const wall=moveWalker({x:d.width/2-3,z:d.mainDepth+.6},0,-2,w);expect(wall.z).toBeGreaterThan(d.mainDepth);
 const door=moveWalker({x:d.width/2,z:d.mainDepth+.6},0,-1.2,w);expect(door.z).toBeLessThan(d.mainDepth);
 expect(moveWalker(door,0,1.2,w).z).toBeGreaterThan(d.mainDepth);
 const inner=w.layout.walls.find(a=>!a.exterior)!;
 const z=inner.a[1]+inner.openings[0].start+.45,x=inner.a[0];
 expect(moveWalker({x:x-.6,z},1.2,0,w).x).toBeGreaterThan(x);
});
it('只能沿中央台阶进内院，平台有两段较小的高度变化',()=>{
 const p=makePlan();p.items=[];const w=makeWalkWorld(p),{dividerZ,innerY,terraceY}=w.layout,x=p.dimensions.width/2;
 const before={x,z:dividerZ+1.3},after=moveWalker(before,0,-2,w);expect(after.z).toBeLessThan(dividerZ);expect(walkHeight(after.x,after.z,w)).toBe(innerY);
 const blocked=moveWalker({x:x-3,z:dividerZ+1.3},0,-2,w);expect(blocked.z).toBeGreaterThan(dividerZ);
 const terrace=moveWalker({x,z:p.dimensions.mainDepth+5.3},0,-1,w);expect(walkHeight(terrace.x,terrace.z,w)).toBe(terraceY);
});
it('家具与树坑形成实体阻挡，出生点保持可站立，门外可进入',()=>{
 const p=makePlan(),w=makeWalkWorld(p),spawn=walkSpawn(w);expect(walkable(spawn.x,spawn.z,w)).toBe(true);
 const tree=p.items.find(f=>f.type==='persimmon')!;expect(walkable(tree.x,tree.z,w)).toBe(false);
 const street=moveWalker(spawn,0,6,w);expect(street.z).toBeGreaterThan(p.dimensions.depth+3);
 for(const r of w.layout.rooms){const point=walkSpawn(w,r.id);expect(walkable(point.x,point.z,w),r.name).toBe(true);}
});
it('默认完整家具布局从大门步行可达全部房间和两车棚',()=>{
 const w=makeWalkWorld(makePlan()),step=.075,W=w.plan.dimensions.width,D=w.plan.dimensions.depth;
 const sx=Math.round(walkSpawn(w).x/step),sz=Math.round(walkSpawn(w).z/step),queue:[[number,number]]=[[sx,sz]],visited=new Set<string>([sx+','+sz]),reached=new Set<string>();
 for(let head=0;head<queue.length;head++){const [ix,iz]=queue[head],x=ix*step,z=iz*step;const room=roomAt(x,z,w.layout);if(room)reached.add(room.id);
  for(const [dx,dz] of [[1,0],[-1,0],[0,1],[0,-1]]){const nx=ix+dx,nz=iz+dz,key=nx+','+nz;if(nx<1||nx*step>W-.18||nz<1||nz*step>D+1||visited.has(key))continue;visited.add(key);const wx=nx*step,wz=nz*step;if(walkable(wx,wz,w)&&Math.abs(walkHeight(wx,wz,w)-walkHeight(x,z,w))<=maxWalkStep)queue.push([nx,nz]);}
 }
 const missing=w.layout.rooms.filter(r=>!reached.has(r.id)).map(r=>r.name);expect(missing).toEqual([]);
});
