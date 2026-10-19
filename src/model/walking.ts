import {personImpacts} from './impacts';
import {naturalPlaces,forestTree} from './nature';
import {nearbyAgents} from './npcRuntime';
import {facilities,facilityWallPieces,facilityItems,facilityRooms,facilityLayout} from './facilities';
import {terrainHeight} from './countryside';
import {trafficActors,nearbyTraffic} from './traffic';
import {landmarks,landmark,landmarkSolids,landmarkDecks} from './expedition';
import {buildLayout,elevation,roomInnerRect} from './layout';
import {neighborhood,neighborHouse,streetBounds,ruralPlots} from './neighborhood';
import {village,villageRoomAt} from './village';
import {villageRoads,onRoad,utilityPoles,streetEdges} from './roads';
import {vehicles} from './vehicle';
import {southYard} from './southYard';
import {wallBuilding} from './visibility';
import {itemDefFor} from './catalog';
import type {Layout,Plan,Room} from './types';

export const personRadius=.14;
export const maxWalkStep=.235;
export type Segment={ax:number;az:number;bx:number;bz:number;radius:number;height:number;base:number;building?:string};
export type Obstacle={itemId?:string;x:number;z:number;w:number;d:number;cos:number;sin:number;base:number;height:number};
export type WalkWorld={plan:Plan;layout:Layout;segments:Segment[];obstacles:Obstacle[];street:boolean;actorY?:number;airborne?:boolean;dynamicObstacles?:Obstacle[];ignoredObstacle?:string;doorSteps:{x:number;w:number}[]};
export type WalkPoint={x:number;z:number};
const decoration=new Set(['rug','stone','cat-black','cat-bluewhite','pendant','curtain','curtain-kang','art','mirror','flowers','tea','kitchenware','bowl','petbed','pergola','umbrella']);
export function makeWalkWorld(plan:Plan,street=true,closedDoors:string[]=[]):WalkWorld {
 const layout=buildLayout(plan.dimensions),segments:Segment[]=[],obstacles:Obstacle[]=[];
 for(const w of layout.walls){
  const dx=w.b[0]-w.a[0],dz=w.b[1]-w.a[1],length=Math.hypot(dx,dz);
  const building=wallBuilding(w,layout),base=w.boundary?0:layout.buildings.find(b=>b.id===building)?.base??0;
  const add=(start:number,end:number)=>{if(end<=start)return;segments.push({ax:w.a[0]+dx*start/length,az:w.a[1]+dz*start/length,bx:w.a[0]+dx*end/length,bz:w.a[1]+dz*end/length,radius:w.thickness/2,height:w.height,base,building});};
  let cursor=0;
  for(const o of w.openings.filter((o,i)=>(o.kind==='door'||o.kind==='gate')&&!closedDoors.includes(w.id+':'+i)).sort((a,b)=>a.start-b.start)){add(cursor,o.start);cursor=o.start+o.width;}
  add(cursor,length);
 }
 for(const f of plan.items){const c=itemDefFor(f,layout);if(!c||c.h<.3||decoration.has(c.model))continue;
  const runtime=vehicles.get(f.id),angle=runtime?-runtime.yaw:f.rotation*Math.PI/180;
  const tree=c.model==='tree',w=tree?(f.type==='pomegranate'?3.25:1.65):c.w,d=tree?(f.type==='pomegranate'?1.25:1.65):c.d;
  const room=layout.rooms.find(r=>r.id===f.room);obstacles.push({itemId:f.id,x:runtime?.x??f.x,z:runtime?.z??f.z,w:w*f.scale,d:d*f.scale,cos:Math.cos(angle),sin:Math.sin(angle),base:room?elevation(room,layout):0,height:tree?c.h:c.h*f.scale});
 }
 if(street)for(const home of village(plan.dimensions)){
 const n=home.n,gate=n.z+n.depth,add=(ax:number,az:number,bx:number,bz:number,height=1.8,base=.08)=>segments.push({ax,az,bx,bz,radius:.1,base,height});
 if(n.style<12){add(n.x,n.z,n.x,gate);add(n.x+n.w,n.z,n.x+n.w,gate);add(n.x,gate,n.x+n.w*.42,gate);add(n.x+n.w*.58,gate,n.x+n.w,gate);}add(n.x,n.z,n.x+n.w,n.z);
 for(const wall of home.layout.walls){const dx=wall.b[0]-wall.a[0],dz=wall.b[1]-wall.a[1],len=Math.hypot(dx,dz);let cursor=0;const piece=(start:number,end:number)=>{if(end>start)add(wall.a[0]+dx*start/len,wall.a[1]+dz*start/len,wall.a[0]+dx*end/len,wall.a[1]+dz*end/len,wall.height,.12);};for(const o of wall.openings.filter((o,i)=>o.kind==='door'&&!closedDoors.includes(wall.id+':'+i)).sort((a,b)=>a.start-b.start)){piece(cursor,o.start);cursor=o.start+o.width;}piece(cursor,len);}
 for(const f of home.plan.items){const c=itemDefFor(f,home.layout);if(!c||decoration.has(c.model)||c.h<.3)continue;const angle=f.rotation*Math.PI/180;obstacles.push({itemId:f.id,x:f.x,z:f.z,w:c.w,d:c.d,cos:Math.cos(angle),sin:Math.sin(angle),base:.12,height:c.h});}
 }
 if(street){const D=plan.dimensions.depth;for(const offset of [0,62]){for(let i=0;i<12;i++)obstacles.push({x:-78+i*16,z:D+12.9+offset,w:1.2,d:1.2,cos:1,sin:0,base:0,height:4});}for(const p of utilityPoles(plan.dimensions))obstacles.push({...p,w:.2,d:.2,cos:1,sin:0,base:0,height:6.8});for(const x of [-3,plan.dimensions.width+3])obstacles.push({x,z:D+1.7,w:.76,d:.76,cos:1,sin:0,base:0,height:1.2});}
 if(street){for(const plot of ruralPlots(plan.dimensions)){
  if(plot.id==='field')for(let i=0;i<8;i++)obstacles.push({x:plot.x+3+(i<4?i*4.5:i*4.5+5),z:plot.z+plot.d/2,w:3,d:plot.d-6,cos:1,sin:0,base:0,height:.5});
  else for(let i=0;i<24;i++)obstacles.push({x:plot.x+4+i%6*9+(i%6>2?1:0),z:plot.z+6+Math.floor(i/6)*6,w:.4,d:.4,cos:1,sin:0,base:0,height:3.8});
 }
 const y=southYard(plan.dimensions),c=y.coop;const fence=(ax:number,az:number,bx:number,bz:number,height=1.35)=>segments.push({ax,az,bx,bz,radius:.11,base:0,height});
 fence(0,y.z,0,y.z+y.d);fence(y.w,y.z,y.w,y.z+y.d);fence(0,y.z+y.d,y.w,y.z+y.d);fence(0,y.z,y.w/2-1.2,y.z);fence(y.w/2+1.2,y.z,y.w,y.z);
 fence(c.x,c.z+.2,c.x+c.w,c.z+.2,2.4);fence(c.x+c.w-.14,c.z,c.x+c.w-.14,c.z+c.d,2.4);fence(c.x,c.z+c.d,c.x+c.w,c.z+c.d,1.05);
 for(const b of y.beds)obstacles.push({x:b.x+b.w/2,z:b.z+b.d/2,w:b.w,d:b.d,cos:1,sin:0,base:0,height:.4});
 }
 if(street)for(let i=0;i<400;i++){const t=forestTree(i);if(!t.skip)obstacles.push({itemId:'forest-tree-'+i,x:t.x,z:t.z,w:.35,d:.35,cos:1,sin:0,base:0,height:t.h});}
 if(street){layout.buildings.push(...village(plan.dimensions).flatMap(h=>h.layout.buildings));for(const b of landmarkSolids())obstacles.push({itemId:b.id,x:b.x,z:b.z,w:b.w,d:b.d,cos:1,sin:0,base:b.base||0,height:b.h});}
 if(street){for(const f of facilities)for(const s of facilityWallPieces(f))segments.push({...s,radius:.1,base:.08,height:3.25,building:f.id});for(const f of facilityItems()){const c=itemDefFor(f,layout);if(!c||decoration.has(c.model)||c.h<.3)continue;const runtime=vehicles.get(f.id),a=runtime?-runtime.yaw:f.rotation*Math.PI/180;obstacles.push({itemId:f.id,x:runtime?.x??f.x,z:runtime?.z??f.z,w:c.w,d:c.d,cos:Math.cos(a),sin:Math.sin(a),base:.08,height:c.h});}layout.buildings.push(...facilityLayout().buildings);layout.rooms.push(...facilityRooms);}
 if(street){
  const pisa=landmark('pisa');for(let i=0;i<48;i++){const a=.28+i*(Math.PI*2-.56)/48,b=.28+(i+1)*(Math.PI*2-.56)/48;segments.push({ax:pisa.x+Math.sin(a)*6.3,az:pisa.z+Math.cos(a)*6.3,bx:pisa.x+Math.sin(b)*6.3,bz:pisa.z+Math.cos(b)*6.3,radius:.08,base:0,height:3.8,building:'pisa'});}
  for(const d of landmarkDecks()){if(d.id==='gate-gallery')continue;if(d.id==='pisa-top'){for(let i=0;i<48;i++){const a=i/48*Math.PI*2,b=(i+1)/48*Math.PI*2,ax=d.x+Math.cos(.069)*Math.sin(a)*5.4,az=d.z+Math.cos(a)*5.4,bx=d.x+Math.cos(.069)*Math.sin(b)*5.4,bz=d.z+Math.cos(b)*5.4;segments.push({ax,az,bx,bz,radius:.035,base:d.y-(Math.max(ax,bx)-d.x)*Math.tan(.069),height:1.05});}continue;}const x0=d.x-d.w/2+.5,x1=d.x+d.w/2-.5,z0=d.z-d.d/2+.5,z1=d.z+d.d/2-.5;for(const [ax,az,bx,bz] of [[x0,z0,x1,z0],[x0,z1,x1,z1],[x0,z0,x0,z1],[x1,z0,x1,z1]])segments.push({ax,az,bx,bz,radius:.05,base:d.y,height:1.05});}
  const rooms:Room[]=[];const addTourRoom=(id:string,name:string,x:number,z:number,w:number,d:number,height:number)=>{rooms.push({id,name,x,z,w,d,building:id,kind:'room',confidence:'estimated',note:'景点内可步行参观的游戏展厅'});layout.buildings.push({id,name,x,z,w,d,base:0,height,roof:'tile',ridge:'x',rise:0});};
  const py=landmark('pyramid');addTourRoom('pyramid-corridor','金字塔甬道',py.x-3,py.z+11,6,104,3.78);addTourRoom('pyramid-chamber','金字塔石室',py.x-9.7,py.z-10.8,19.4,21.8,4.02);obstacles.push({itemId:'pyramid-sarcophagus',x:py.x,z:py.z,w:3.1,d:5.1,base:0,height:1.57,cos:1,sin:0});
  const lo=landmark('louvre');for(const side of [-1,1])addTourRoom('louvre-gallery-'+side,'卢浮宫艺术展厅',lo.x+side*153-9,lo.z-98,18,204,6.41);
  layout.rooms.push(...rooms);
 }
 const doorSteps=layout.walls.filter(w=>w.building==='main'&&w.exterior&&w.facing==='south').flatMap(w=>w.openings.filter(o=>o.kind==='door').map(o=>({x:w.a[0]+o.start+o.width/2,w:o.width>1.5?2.6:o.width+.3})));return{plan,layout,segments,obstacles,street,doorSteps};
}
export function distanceToSegment(x:number,z:number,s:Segment){const dx=s.bx-s.ax,dz=s.bz-s.az,t=Math.max(0,Math.min(1,((x-s.ax)*dx+(z-s.az)*dz)/(dx*dx+dz*dz)));return Math.hypot(x-s.ax-dx*t,z-s.az-dz*t);}
export function roomAt(x:number,z:number,l:Layout):Room|undefined {
 let found:Room|undefined;for(const r of l.rooms)if(x>=r.x&&x<=r.x+r.w&&z>=r.z&&z<=r.z+r.d&&(!found||r.w*r.d<found.w*found.d))found=r;return found;
}
export function walkHeight(x:number,z:number,world:WalkWorld):number {
 const {layout:l,plan}=world,{width:W,mainDepth:M,wingWidth:S,depth:D}=plan.dimensions,Z=M+l.terraceDepth;
 if(world.street){const lo=landmark('louvre');if(Math.abs(z-lo.z)<108&&Math.abs(Math.abs(x-lo.x)-153)<9.5)return .08;const gate=landmark('tiananmen'),gx=x-gate.x,gz=Math.abs(z-gate.z);if(Math.abs(gx)<43&&gz<=22.5)return 1;if(gz>22.5&&gz<25.21&&[-28,-14,0,14,28].some(c=>Math.abs(gx-c)<3.1))return Math.min(1,Math.ceil((25.21-gz)/.6)*.2);if(facilityRooms.some(r=>x>=r.x&&x<=r.x+r.w&&z>=r.z&&z<=r.z+r.d))return .08;if(villageRoomAt(x,z,plan.dimensions))return .12;const yard=neighborhood(plan.dimensions).find(n=>x>=n.x&&x<=n.x+n.w&&z>=n.z&&z<=n.z+n.depth);if(yard)return .08;}
 if(world.street&&z>D){let height=0;const roads=villageRoads(plan.dimensions);if(roads.some(r=>onRoad(x,z,r)))return 0;for(const e of streetEdges(plan.dimensions)){const curbDistance=e.horizontal?Math.abs(z-(e.z-e.side*.64)):Math.abs(x-(e.x-e.side*.64));if(e.curb&&curbDistance<.075&&Math.abs(e.horizontal?x-e.x:z-e.z)<e.length/2){height=.19;break;}if(Math.abs(x-e.x)<(e.horizontal?e.length/2:.625)&&Math.abs(z-e.z)<(e.horizontal?.625:e.length/2)){const edgeDistance=e.horizontal?Math.abs(z-(e.z-e.side*.64)):Math.abs(x-(e.x-e.side*.64));height=e.curb&&edgeDistance<.075?.19:.09;break;}}if(Math.abs(x-W/2)<2&&z<D+1.45)height=Math.max(height,.19);return Math.max(height,terrainHeight(x,z));}
 if(z>=M&&z<M+.36&&world.doorSteps.some(s=>Math.abs(x-s.x)<s.w/2))return 1.14;
 if(Math.abs(x-W/2)<2.06&&z>=l.dividerZ&&z<l.dividerZ+1.12)return l.innerY*Math.min(4,Math.ceil((l.dividerZ+1.12-z)/.28))/4;
 if(x>S&&x<W-S&&z>=Z&&z<Z+.32)return (l.innerY+l.terraceY)/2;
 const r=roomAt(x,z,l);return r?elevation(r,l):terrainHeight(x,z);
}
export function walkable(x:number,z:number,world:WalkWorld,withFurniture=true):boolean {
 const {width:W,depth:D}=world.plan.dimensions,r=personRadius;
 if(world.actorY!==undefined&&world.actorY>3.8){const p=landmark("pisa"),dx=(x-p.x)*Math.cos(.069)-world.actorY*Math.sin(.069),dz=z-p.z;if(Math.hypot(x-p.x,z-p.z)<14&&Math.hypot(dx,dz)>6.15&&world.actorY<54)return false;}
 // The street is entered through the real gate; yard perimeter remains closed.
 const bounds=streetBounds(world.plan.dimensions);if(world.street?(z<r||z>bounds.maxZ||x<bounds.minX||x>bounds.maxX):(z<r||z>D-r||x<r||x>W-r))return false;
 for(const s of nearbySegments(world,x,z,1))if((world.actorY===undefined||world.actorY<s.base+s.height-.015&&world.actorY+1.6>s.base)&&distanceToSegment(x,z,s)<s.radius+r-.001)return false;
 if(withFurniture)for(const o of nearbyObstacles(world,x,z,1)){if(!!world.ignoredObstacle&&o.itemId===world.ignoredObstacle||world.actorY!==undefined&&(world.actorY>=o.base+o.height-.015||world.actorY+1.6<=o.base))continue;const dx=x-o.x,dz=z-o.z,lx=dx*o.cos+dz*o.sin,lz=-dx*o.sin+dz*o.cos;const ox=Math.max(0,Math.abs(lx)-o.w/2),oz=Math.max(0,Math.abs(lz)-o.d/2);if(ox*ox+oz*oz<r*r)return false;}
 return true;
}
export function moveWalker(p:WalkPoint,dx:number,dz:number,world:WalkWorld):WalkPoint {
 if(Math.abs(dx)+Math.abs(dz)<1e-9)return p;
 let x=p.x,z=p.z;const steps=Math.max(1,Math.ceil(Math.hypot(dx,dz)/.05));
 const can=(nx:number,nz:number)=>walkable(nx,nz,world)&&(world.airborne||world.actorY!==undefined&&world.actorY>walkHeight(x,z,world)+.25||Math.abs(walkHeight(nx,nz,world)-walkHeight(x,z,world))<=maxWalkStep);
 for(let i=0;i<steps;i++){const nx=x+dx/steps,nz=z+dz/steps;
  if(can(nx,nz)){x=nx;z=nz;}else if(Math.abs(dx)>Math.abs(dz)){if(can(nx,z))x=nx;if(can(x,nz))z=nz;}else{if(can(x,nz))z=nz;if(can(nx,z))x=nx;}
 }
 return{x,z};
}
export function walkSpawn(world:WalkWorld,roomId?:string|null):WalkPoint&{yaw?:number;pitch?:number} {
 const nature=world.street&&naturalPlaces.find(p=>p.id===roomId);if(nature)return{x:nature.x,z:nature.z,yaw:Math.PI,pitch:nature.mountain?-.2:.06};
 const landmark=world.street&&landmarks.find(l=>l.id===roomId);if(landmark)return {...landmark.arrival};
 const fac=world.street&&facilities.find(f=>f.id===roomId);if(fac)return{x:fac.x+fac.w/2,z:fac.z+fac.d+2};
 const home=world.street?village(world.plan.dimensions).find(h=>h.n.id===roomId):undefined;if(home)return{x:home.n.x+home.n.w/2,z:home.n.z+home.n.depth-1.3};
 const plot=world.street?ruralPlots(world.plan.dimensions).find(p=>p.id===roomId):undefined;if(plot)return{x:plot.x+plot.w/2,z:plot.z+2};
 if(roomId==='southyard'&&world.street){const y=southYard(world.plan.dimensions);return{x:y.w/2-.5,z:y.z+.8};}
 const {width,depth}=world.plan.dimensions,room=world.layout.rooms.find(r=>r.id===roomId);
 const target=room?{x:room.x+room.w/2,z:room.z+room.d/2}:{x:width/2,z:depth-1.7};
 if(walkable(target.x,target.z,world))return target;
 if(room){const rect=roomInnerRect(room,world.layout),candidates:WalkPoint[]=[];
  for(let x=rect.x+.25;x<rect.x+rect.w-.2;x+=.2)for(let z=rect.z+.25;z<rect.z+rect.d-.2;z+=.2)if(walkable(x,z,world))candidates.push({x,z});
  candidates.sort((a,b)=>Math.hypot(a.x-target.x,a.z-target.z)-Math.hypot(b.x-target.x,b.z-target.z));if(candidates[0])return candidates[0];
 }
 return{x:width/2,z:depth-1.7};
}

// Test the short camera boom against walls and the roofs of other buildings.
export function cameraBoom(target:{x:number;y:number;z:number},eye:{x:number;y:number;z:number},world:WalkWorld,cutBuilding?:string):number {
 const distance=Math.hypot(eye.x-target.x,eye.y-target.y,eye.z-target.z),steps=Math.ceil(distance/.12),cx=(eye.x+target.x)/2,cz=(eye.z+target.z)/2,segments=nearbySegments(world,cx,cz,distance/2+1),obstacles=nearbyObstacles(world,cx,cz,distance/2+1,false),buildings=world.layout.buildings.filter(b=>b.x<cx+distance/2+1&&b.x+b.w>cx-distance/2-1&&b.z<cz+distance/2+1&&b.z+b.d>cz-distance/2-1);
 for(let i=1;i<=steps;i++){const t=i/steps,x=target.x+(eye.x-target.x)*t,y=target.y+(eye.y-target.y)*t,z=target.z+(eye.z-target.z)*t;
  const wall=segments.some(s=>y>s.base+.05&&y<s.base+(s.building===cutBuilding?.75:s.height)+.12&&distanceToSegment(x,z,s)<s.radius+.12);
  const roof=buildings.some(b=>b.id!==cutBuilding&&x>b.x-.25&&x<b.x+b.w+.25&&z>b.z-.25&&z<b.z+b.d+.25&&y>b.base+b.height-.15&&y<b.base+b.height+b.rise+.3);
  const object=obstacles.some(o=>{if(!!world.ignoredObstacle&&o.itemId===world.ignoredObstacle)return false;if(y<o.base+.05||y>o.base+o.height+.1)return false;const dx=x-o.x,dz=z-o.z;return Math.abs(dx*o.cos+dz*o.sin)<o.w/2+.1&&Math.abs(-dx*o.sin+dz*o.cos)<o.d/2+.1;});
  const ground=world.street&&z>world.plan.dimensions.depth&&y<terrainHeight(x,z)+.2;
  if(wall||roof||object||ground)return Math.max(.08,(i-1)/steps);
 }
 return 1;
}

// Static broadphase: index each wall/prop once, query only cells near the walker.
// Arrays remain authoritative, including closed-door rebuilds and parked vehicles.
const spatial=new WeakMap<object,Map<string,number[]>>();
function candidates<T>(items:T[],x:number,z:number,r:number,rect:(item:T)=>[number,number,number,number]):T[]{
 let grid=spatial.get(items);if(!grid){grid=new Map();items.forEach((item,i)=>{const [x0,z0,x1,z1]=rect(item);for(let a=Math.floor(x0/4);a<=Math.floor(x1/4);a++)for(let b=Math.floor(z0/4);b<=Math.floor(z1/4);b++){const key=a+':'+b;if(!grid!.has(key))grid!.set(key,[]);grid!.get(key)!.push(i);}});spatial.set(items,grid);}
 // Long visibility rays must not scan millions of empty 4m grid cells.
 const cells=(Math.floor((x+r)/4)-Math.floor((x-r)/4)+1)*(Math.floor((z+r)/4)-Math.floor((z-r)/4)+1);
 if(cells>Math.max(64,items.length*2))return items.filter(item=>{const [x0,z0,x1,z1]=rect(item);return x1>=x-r&&x0<=x+r&&z1>=z-r&&z0<=z+r;});
 const found=new Set<number>();for(let a=Math.floor((x-r)/4);a<=Math.floor((x+r)/4);a++)for(let b=Math.floor((z-r)/4);b<=Math.floor((z+r)/4);b++)for(const i of grid.get(a+':'+b)||[])found.add(i);return [...found].map(i=>items[i]);
}
export function nearbySegments(w:WalkWorld,x:number,z:number,r:number){return candidates(w.segments,x,z,r,s=>[Math.min(s.ax,s.bx)-s.radius,Math.min(s.az,s.bz)-s.radius,Math.max(s.ax,s.bx)+s.radius,Math.max(s.az,s.bz)+s.radius]);}
export function nearbyObstacles(w:WalkWorld,x:number,z:number,r:number,people=true){return [...candidates(w.obstacles,x,z,r,o=>{const radius=Math.hypot(o.w,o.d)/2;return[o.x-radius,o.z-radius,o.x+radius,o.z+radius];}),...(w.dynamicObstacles||[]),...(people?nearbyAgents(x,z,r).filter(a=>!trafficActors.has(a.profile.id)&&!personImpacts.has(a.profile.id)).map(a=>({itemId:a.profile.id,x:a.x,z:a.z,w:.36,d:.36,cos:1,sin:0,base:Math.max(0,a.y),height:1.5})):[]),...(w.street?nearbyTraffic(x,z,r).filter(a=>(people||a.kind!=="person")&&!personImpacts.has(a.id)&&Math.abs(a.x-x)<r+Math.hypot(a.w,a.d)/2&&Math.abs(a.z-z)<r+Math.hypot(a.w,a.d)/2).map(a=>({itemId:a.id,x:a.x,z:a.z,w:a.w,d:a.d,cos:Math.cos(-a.yaw),sin:Math.sin(-a.yaw),base:0,height:a.height??(a.kind==="person"?1.4:a.kind==="van"?2.1:1.5)})):[])];}
