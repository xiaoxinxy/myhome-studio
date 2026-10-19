import {afterEach,expect,it} from 'vitest';
import {makePlan} from './catalog';
import {makeWalkWorld,walkable,walkHeight,moveWalker} from './walking';
import {stepMotor,findClimb,supportHeight,type Motor} from './characterMotor';
import {facilities,facilityRooms} from './facilities';
import {landmark,landmarkDecks,outerRoads} from './expedition';
import {advanceBus,fastForwardBus,buses,busStops} from './transit';
import {npcReply,setNpcDialogueProvider,type DialogueContext} from './npcRuntime';
import {npcAgents} from './npcRuntime';
import {seatTarget,sitDown} from '../interactions';
import {walkMotion} from '../walkState';
const motor=(x=11,z=28):Motor=>({x,z,y:0,yaw:0,vy:0,grounded:true,jumpRequested:false,climbRequested:false,climb:null});
const emptyWorld=()=>{const p=makePlan();p.items=[];return makeWalkWorld(p,false);};
afterEach(()=>setNpcDialogueProvider(null));
it('跳跃遵守重力、落地和屋顶，空中重复跳跃不增加速度',()=>{
 const w=emptyWorld(),m=motor();m.jumpRequested=true;stepMotor(m,0,0,.01,w);expect(m.grounded).toBe(false);const vy=m.vy;m.jumpRequested=true;stepMotor(m,0,0,.01,w);expect(m.vy).toBeLessThan(vy);
 let peak=m.y;for(let i=0;i<150;i++){stepMotor(m,0,0,.01,w);peak=Math.max(peak,m.y);}expect(peak).toBeGreaterThan(.8);expect(peak).toBeLessThan(1);expect(m.y).toBe(0);expect(m.grounded).toBe(true);
 w.layout.buildings=[{id:'test-ceiling',name:'低顶',x:10,z:27,w:2,d:2,base:0,height:2,roof:'metal',ridge:'x',rise:0}];m.jumpRequested=true;peak=0;for(let i=0;i<150;i++){stepMotor(m,0,0,.01,w);peak=Math.max(peak,m.y);}expect(peak).toBeLessThan(.39);expect(m.grounded).toBe(true);
});
it('低墙可攀越，高墙不可攀；墙体和无编号障碍仍有实体碰撞',()=>{
 const w=emptyWorld(),m=motor();w.segments=[{ax:10,az:27,bx:12,bz:27,radius:.1,height:1.1,base:0}];expect(walkable(11,27,w)).toBe(false);expect(findClimb(m,w)).not.toBeNull();m.climbRequested=true;for(let i=0;i<15;i++)stepMotor(m,0,0,.05,w);expect(m.y).toBeGreaterThan(.6);for(let i=0;i<60;i++)stepMotor(m,0,0,.05,w);expect(m.z).toBeLessThan(27);expect(m.y).toBeCloseTo(1.1);for(let i=0;i<50;i++)stepMotor(m,0,-.02,.02,w);expect(m.y).toBeCloseTo(0);
 const high={...w,segments:[{...w.segments[0],height:3}]};expect(findClimb(motor(),high)).toBeNull();const prop={...w,segments:[],obstacles:[{x:11,z:28,w:1,d:1,cos:1,sin:0,base:0,height:1}]};expect(walkable(11,28,prop)).toBe(false);
});
it('新公共设施有房间、真实门洞和家具，沿门口可以进入',()=>{
 const w=makeWalkWorld(makePlan());for(const f of facilities){const mid=f.x+f.w/2,front=f.z+f.d;expect(w.layout.rooms.find(r=>r.id==='facility-'+f.id)).toBeDefined();expect(walkable(mid,front,w,false),f.name).toBe(true);expect(walkable(f.x,front-1,w,false),f.name).toBe(false);expect(moveWalker({x:mid,z:front+.4},0,-1,w).z,f.name).toBeLessThan(front);}
 expect(facilityRooms.length).toBeGreaterThan(10);
});
it('景点内能进入甬道和展厅，平台有支撑，城楼台阶可以逐级登上',()=>{
 const w=makeWalkWorld(makePlan()),py=landmark('pyramid'),lo=landmark('louvre'),gate=landmark('tiananmen');expect(walkable(py.x,py.z+85,w)).toBe(true);expect(walkable(py.x+8,py.z+85,w)).toBe(false);for(const s of [-1,1])expect(walkable(lo.x+s*143,lo.z+85,w)).toBe(true);
 for(const d of landmarkDecks()){expect(supportHeight(d.x,d.z,d.y,w),d.id).toBeCloseTo(d.y);}
 const from={x:gate.x,z:gate.z+26},to=moveWalker(from,0,-7,w);expect(to.z).toBeLessThan(gate.z+21);expect(walkHeight(to.x,to.z,w)).toBe(1);
 const pisa=landmark('pisa');expect(walkable(pisa.x,pisa.z+6.3,w)).toBe(true);expect(walkable(pisa.x+6.3,pisa.z,w)).toBe(false);const ramp=supportHeight(pisa.x,pisa.z+5.15,0,w);expect(ramp).toBeCloseTo(.18);
 // Tourism roads stay out of the Louvre's three solid wings.
 expect(outerRoads().filter(r=>r.az===r.bz).every(r=>Math.abs(r.az-(lo.z-105))>7)).toBe(true);
});
it('大巴沿路线行驶、靠站停车和等候，快进等车不改变站点数据',()=>{
 const b={...buses[0]},before=JSON.stringify(busStops);fastForwardBus(b,'home');const x=b.x;advanceBus(b,.08);expect(b.x).toBe(x);for(let i=0;i<900&&b.lastStop!=='depot';i++)advanceBus(b,.08);expect(b.lastStop).toBe('depot');expect(b.pause).toBeGreaterThan(0);expect(b.speed).toBe(0);expect(Math.hypot(b.x-busStops[1].x,b.z-busStops[1].z)).toBeCloseTo(1.6);expect(JSON.stringify(busStops)).toBe(before);
});
it('本机对话使用人物身份和上下文，未来提供方可接收历史和取消信号',async()=>{
 const c:DialogueContext={profile:{id:'test-npc',name:'孙医生',occupation:'村医',personality:'耐心细致',home:'村卫生所',appearance:0},activity:'examine',time:10,weather:'clear',history:[],text:'介绍一下你自己'},controller=new AbortController();expect(await npcReply(c,controller.signal)).toContain('孙医生');let seen:DialogueContext|undefined;setNpcDialogueProvider({async reply(context,signal){seen=context;expect(signal).toBe(controller.signal);return '测试响应';}});expect(await npcReply(c,controller.signal)).toBe('测试响应');expect(seen?.profile.id).toBe('test-npc');
});
it('被村民使用的座椅不能再次坐入，空座仍然能坐下和起身',()=>{
 const p=makePlan(),chair=p.items.find(f=>f.type==='garden-chair')!,target=seatTarget(p,chair),start={x:11,z:28,y:0,yaw:0};Object.assign(walkMotion,start);
 npcAgents.set('occupied-seat-test',{profile:{id:'occupied-seat-test',name:'村民',occupation:'休息',home:'本村',personality:'随和',appearance:0},...target,activity:'sit',phase:0,moving:false,pauseUntil:0,destination:'休息'});
 try{expect(sitDown(true,target)).toBe(false);expect(walkMotion.x).toBe(start.x);npcAgents.delete('occupied-seat-test');expect(sitDown(true,target)).toBe(true);expect(walkMotion.sitting).toBe(true);sitDown(false);expect(walkMotion.x).toBe(start.x);}finally{npcAgents.delete('occupied-seat-test');sitDown(false);}
});

it('斜塔钟楼支撑跟随倾角，矩形包围盒外角不能当作悬空地板',()=>{const w=makeWalkWorld(makePlan()),d=landmarkDecks().find(d=>d.id==='pisa-top')!;expect(supportHeight(d.x+2,d.z,d.y,w)).toBeCloseTo(d.y-2*Math.tan(.069));expect(supportHeight(d.x+4.8,d.z+4.8,d.y,w)).toBeLessThan(d.y-1);});

it('室内攀爬也要留出头部空间，不能把人送进天花板',()=>{const w=emptyWorld();w.segments=[{ax:10,az:27,bx:12,bz:27,radius:.1,height:1.1,base:0}];w.layout.buildings=[{id:'low-room',name:'低顶屋',x:10,z:26,w:2,d:3,base:0,height:2.35,roof:'metal',ridge:'x',rise:0}];expect(findClimb(motor(),w)).toBeNull();});

 it('长距离遮挡查询保持正确结果，远离村庄不会扫描数十万空网格',async()=>{
 const {nearbySegments}=await import('./walking');const w=makeWalkWorld(makePlan());
 for(const [x,z,r] of [[-300,830,900],[1500,1600,2100],[11,25,2]]){
 const actual=nearbySegments(w,x,z,r),expected=w.segments.filter(s=>Math.max(s.ax,s.bx)+s.radius>=x-r&&Math.min(s.ax,s.bx)-s.radius<=x+r&&Math.max(s.az,s.bz)+s.radius>=z-r&&Math.min(s.az,s.bz)-s.radius<=z+r);
 for(const s of expected)expect(actual).toContain(s);
 }
 const start=performance.now();for(let i=0;i<100;i++)nearbySegments(w,-300,830,900);expect(performance.now()-start).toBeLessThan(500);
 });
 it('不同座高的坐姿用腿长支撑双脚，儿童高座允许自然悬腿',async()=>{
 const {seatedLegAngle}=await import('./humanPose');for(const seat of [.4,.45,.505,.555]){const root=seat+.012-.655*.9,angle=seatedLegAngle(root,.9),foot=root+.9*(.73-.29*Math.cos(angle)-.445);expect(foot).toBeCloseTo(0,5);}
 const childRoot=.505+.012-.655*.61,angle=seatedLegAngle(childRoot,.61);expect(childRoot+.61*(.73-.29*Math.cos(angle)-.445)).toBeGreaterThan(0);
 });

 it('自然景观有三座不同山体，地形支撑与渲染三角形一致，入口和道路保持平地',async()=>{const {mountains,naturalPlaces,naturalHeight,mountainSample,mountainHeight,natureGrid}=await import('./nature');expect(mountains).toHaveLength(3);for(const m of mountains){const step=m.r*2/natureGrid,x=m.x-m.r+step*24,z=m.z-m.r+step*24;expect(mountainHeight(m,x,z)).toBeCloseTo(mountainSample(m,x,z));expect(naturalHeight(m.x,m.z)).toBeGreaterThan(100);expect(naturalHeight(m.x+m.r+1,m.z)).toBe(0);}for(const p of naturalPlaces)expect(naturalHeight(p.x,p.z),p.id).toBe(0);expect(naturalHeight(-700,3060)).toBe(0);});

 it('轻量光照保留贴图、实例配色、透明度和夜间发光，导出使用原材质',async()=>{const THREE=await import('three'),{diffuseMaterial}=await import('../render/MaterialBudget');const map=new THREE.Texture(),s=new THREE.MeshStandardMaterial({map,color:'#ab8267',vertexColors:true,transparent:true,opacity:.35,depthWrite:false,side:THREE.DoubleSide,emissive:'#ffaa33',emissiveIntensity:1.5}),m=diffuseMaterial(s);expect(m.isMeshLambertMaterial).toBe(true);expect(m.map).toBe(map);expect(m.color.equals(s.color)).toBe(true);expect(m.vertexColors).toBe(true);expect(m.opacity).toBe(.35);expect(m.depthWrite).toBe(false);expect(m.side).toBe(THREE.DoubleSide);expect(m.emissive.equals(s.emissive)).toBe(true);expect(m.emissiveIntensity).toBe(1.5);m.dispose();s.dispose();map.dispose();});

 it('自然景区入口和接驳公路不被旧山坡覆盖',async()=>{const {naturalPlaces}=await import('./nature'),{terrainHeight}=await import('./countryside'),w=makeWalkWorld(makePlan());for(const p of naturalPlaces){expect(terrainHeight(p.x,p.z),p.id).toBe(0);expect(walkHeight(p.x,p.z,w),p.id).toBe(0);}for(const r of outerRoads().filter(r=>/scenic|snow-entry/.test(r.id)))for(let i=0;i<=20;i++)expect(terrainHeight(r.ax+(r.bx-r.ax)*i/20,r.az+(r.bz-r.az)*i/20),r.id).toBe(0);});

 it('车辆只碰撞自身高度范围内的物体，可从高架观景台下方驶过',async()=>{const {canDrive}=await import('./vehicle'),{catalog}=await import('./catalog'),c=catalog.find(c=>c.id==='car')!,v={id:'test-car-height',type:'car',x:500,z:100,y:0,yaw:0,speed:0,wheel:0,originX:500,originZ:100,originRotation:0},w=makeWalkWorld(makePlan());w.obstacles=[];w.segments=[{ax:498,az:100,bx:502,bz:100,radius:.1,height:1,base:12}];expect(canDrive(v,500,100,0,c,w)).toBe(true);w.segments=[{...w.segments[0],base:0}];expect(canDrive(v,500,100,0,c,w)).toBe(false);w.segments=[];w.obstacles=[{x:500,z:100,w:2,d:2,height:1,base:12,cos:1,sin:0}];expect(canDrive(v,500,100,0,c,w)).toBe(true);});

 it('火山湖位于平坦火口底部，不被山体坡面盖住',async()=>{const {mountains,mountainHeight}=await import('./nature'),m=mountains.find(m=>m.id==='volcano')!;for(const d of [0,.02,.03])expect(mountainHeight(m,m.x+m.r*d,m.z)).toBeCloseTo(m.h*.56,4);});
