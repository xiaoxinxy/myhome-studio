import {naturalPlaces} from '../model/nature';
import {facilities} from '../model/facilities';
import {useTourism} from '../tourism';
import {buses,busStops} from '../model/transit';
import {useNpcChat} from '../npcChat';
import {Human,humanLook} from './Human';
import {MovingBatch} from './MovingBatch';
import {HUMAN_SCALE,stepMotor} from '../model/characterMotor';
import {villageRoomAt} from '../model/village';
import {vehicles,driveStep} from '../model/vehicle';
import {catalog} from '../model/catalog';
import {stopDriving,worldTargets} from '../interactions';
import {southYardLocation} from '../model/southYard';
import {useEffect,useMemo,useRef} from 'react';
import {useFrame,useThree} from '@react-three/fiber';
import * as THREE from 'three';
import {Box,Cylinder,Sphere} from './Primitives';
import {useInteractions} from '../interactions';
import {useHome} from '../store';
import {walkMotion as m,useWalkStatus,clearWalkInput} from '../walkState';
import {makeWalkWorld,moveWalker,roomAt,walkHeight,walkSpawn,cameraBoom} from '../model/walking';
import type {Plan} from '../model/types';

import {useCommunity} from '../community';
import {landmarkAt} from '../model/expedition';
import {encounter} from '../model/encounters';
function Avatar(){const root=useRef<THREE.Group>(null),hair=useCommunity(s=>s.hair);useFrame(()=>{if(!root.current)return;root.current.position.set(m.x,m.y,m.z);root.current.rotation.y=m.bodyYaw;root.current.visible=useHome.getState().walkView==='follow'&&m.avatarVisible;});return <MovingBatch key={hair}><group ref={root} name="漫游小人" userData={{trafficId:'player-avatar'}} scale={HUMAN_SCALE}><Human look={{...humanLook(2),hair}} motion={()=>({phase:m.phase,floorOffset:m.sitting?m.y-m.seatFloor:undefined,pose:m.climb?'climb':!m.grounded?'jump':Date.now()<encounter.punchUntil?'punch':m.pose==='lie'?'lie':m.sitting||!!useInteractions.getState().driving?'sit':Date.now()<m.crouchUntil?'crouch':m.moving?'walk':'stand'})}/></group></MovingBatch>;}

export function Walker({plan}:{plan:Plan}){
 const epoch=useInteractions(s=>s.vehicleEpoch),doors=useInteractions(s=>s.doors),view=useHome(s=>s.walkView),street=useHome(s=>s.street),world=useMemo(()=>makeWalkWorld(plan,street,Object.keys(doors).filter(id=>!doors[id])),[plan,street,doors,epoch]),{camera,size,setEvents}=useThree();
 useEffect(()=>{setEvents({enabled:false});return()=>{setEvents({enabled:true});};},[setEvents]);
 useEffect(()=>{const c=camera as THREE.PerspectiveCamera,previous=c.fov;return()=>{c.fov=previous;c.updateProjectionMatrix();};},[camera]);
 useEffect(()=>{const c=camera as THREE.PerspectiveCamera;if(view==='follow')m.pitch=Math.max(-1.02,Math.min(1.02,m.pitch));c.fov=view==='first'?(size.width/size.height<.8?75:65):(size.width/size.height<.8?65:55);c.updateProjectionMatrix();},[camera,view,size.width,size.height]);
 const drivingView=useRef({id:'',lastYaw:0}),warp=useRef(-1),snap=useRef(true),blocked=useRef(false),eye=useMemo(()=>new THREE.Vector3(),[]),target=useMemo(()=>new THREE.Vector3(),[]);
 useEffect(()=>{
  m.ready=false;warp.current=-1;snap.current=true;
  return()=>{useNpcChat.getState().close();useTourism.setState({active:null,riding:null});clearWalkInput();stopDriving(plan,true);m.crouchUntil=0;m.petting=false;m.ready=false;};
 },[]);
 useEffect(()=>{
  const publish=()=>{if(!m.ready)return;const r=roomAt(m.x,m.z,world.layout)||villageRoomAt(m.x,m.z,plan.dimensions),room=r?.id||null;
   if(useHome.getState().walkRoom!==room)useHome.setState({walkRoom:room});
   useWalkStatus.setState({x:m.x,z:m.z,y:m.y,room:r?.name||southYardLocation(m.x,m.z,plan.dimensions)||facilities.find(f=>Math.hypot(Math.max(f.x-m.x,0,m.x-f.x-f.w),Math.max(f.z-m.z,0,m.z-f.z-f.d))<5)?.name||naturalPlaces.find(p=>Math.hypot(p.x-m.x,p.z-m.z)<90)?.name||landmarkAt(m.x,m.z)?.name||(m.z>200||m.x>130?'环游公路 · 地标公园':'门外街道'),blocked:blocked.current,speed:Math.round(Math.abs(vehicles.get(useInteractions.getState().driving||'')?.speed||buses.find(b=>b.id===useTourism.getState().riding)?.speed||0)*36)/10,posture:useTourism.getState().riding?'乘车':useInteractions.getState().driving?'驾驶':m.sitting?(m.pose==='lie'?'躺下':'坐下'):Date.now()<m.crouchUntil?'蹲下摸猫':'步行'});
  };
  const timer=setInterval(publish,120);return()=>clearInterval(timer);
 },[world]);
 useFrame((_,delta)=>{
  if(!m.ready||warp.current!==m.warp){
   const spawn=walkSpawn(world,m.destination);m.x=spawn.x;m.z=spawn.z;m.y=walkHeight(m.x,m.z,world);m.yaw=spawn.yaw??0;m.bodyYaw=m.yaw;m.pitch=spawn.pitch??.38;m.phase=0;m.vy=0;m.grounded=true;m.climb=null;if(m.pendingPoint){Object.assign(m,m.pendingPoint);m.pendingPoint=null;}m.ready=true;warp.current=m.warp;snap.current=true;
  }
  const dt=Math.min(delta,.05),keys=m.keys;if(m.sitting||Date.now()<m.crouchUntil||useHome.getState().selected||useCommunity.getState().active||useNpcChat.getState().active||useTourism.getState().active){m.stickX=0;m.stickY=0;keys.clear();m.jumpRequested=false;m.climbRequested=false;}
  if(keys.has('KeyQ'))m.yaw+=dt*1.8;if(keys.has('KeyE'))m.yaw-=dt*1.8;
  let right=(Math.abs(m.stickX)<.12?0:m.stickX)+(keys.has('KeyD')||keys.has('ArrowRight')?1:0)-(keys.has('KeyA')||keys.has('ArrowLeft')?1:0);
  let forward=-(Math.abs(m.stickY)<.12?0:m.stickY)+(keys.has('KeyW')||keys.has('ArrowUp')?1:0)-(keys.has('KeyS')||keys.has('ArrowDown')?1:0);
  const length=Math.hypot(right,forward);if(length>1){right/=length;forward/=length;}
  const riding=useTourism.getState().riding;const bus=buses.find(b=>b.id===riding);if(bus){m.x=bus.x;m.z=bus.z;m.y=0;m.avatarVisible=false;m.moving=false;target.set(bus.x,2.1+Math.max(0,-m.pitch)*5,bus.z);eye.set(bus.x+Math.sin(m.yaw)*11,Math.max(3,6+m.pitch*3),bus.z+Math.cos(m.yaw)*11);camera.position.lerp(eye,1-Math.exp(-dt*7));camera.lookAt(target);return;}
  const driver=useInteractions.getState().driving;
  if(driver){const v=vehicles.get(driver)!,f=plan.items.find(f=>f.id===driver),def=catalog.find(c=>c.id===(f?.type||v.type))!;const actors=[...worldTargets.entries()].filter(([id])=>id.startsWith('neighbor-')||/^community-\d+$/.test(id)||id.startsWith('passer-')||id.startsWith('animal-')).map(([id,t])=>{const p=t.point();return{itemId:id,x:p.x,z:p.z,w:.45,d:.45,cos:1,sin:0,base:0,height:1.5};});blocked.current=driveStep(v,forward,right,dt,{...def,w:def.w*(f?.scale||1),d:def.d*(f?.scale||1)},{...world,dynamicObstacles:actors});v.y+=(walkHeight(v.x,v.z,world)-v.y)*(1-Math.exp(-dt*12));m.x=v.x;m.z=v.z;m.y=v.y;m.bodyYaw=v.yaw+Math.PI;if(drivingView.current.id!==driver){m.yaw=m.bodyYaw;drivingView.current={id:driver,lastYaw:v.yaw};}else{m.yaw+=Math.atan2(Math.sin(v.yaw-drivingView.current.lastYaw),Math.cos(v.yaw-drivingView.current.lastYaw));drivingView.current.lastYaw=v.yaw;}m.moving=Math.abs(v.speed)>.05;m.phase=v.wheel;m.avatarVisible=v.type!=='car';target.set(v.x,v.y+1.15,v.z);const length=v.type==='car'?7:5;eye.set(v.x+Math.sin(m.yaw)*Math.cos(m.pitch)*length,v.y+Math.max(.4,1.15+Math.sin(m.pitch)*length),v.z+Math.cos(m.yaw)*Math.cos(m.pitch)*length);const k=cameraBoom(target,eye,{...world,ignoredObstacle:driver});eye.sub(target).multiplyScalar(k).add(target);camera.position.lerp(eye,1-Math.exp(-dt*9));camera.lookAt(target);return;}
  drivingView.current.id='';const speed=keys.has('ShiftLeft')||keys.has('ShiftRight')?2.9:1.65,dx=(Math.cos(m.yaw)*right-Math.sin(m.yaw)*forward)*dt*speed,dz=(-Math.sin(m.yaw)*right-Math.cos(m.yaw)*forward)*dt*speed;
  const beforeX=m.x,beforeZ=m.z;if(!m.sitting)stepMotor(m,dx,dz,dt,world);const distance=Math.hypot(m.x-beforeX,m.z-beforeZ);m.moving=distance>.0001;
  blocked.current=length>.1&&distance<Math.hypot(dx,dz)*.25;
  if(m.moving){m.phase+=distance*8;const yaw=Math.atan2(-dx,-dz);m.bodyYaw+=Math.atan2(Math.sin(yaw-m.bodyYaw),Math.cos(yaw-m.bodyYaw))*(1-Math.exp(-dt*12));}

  const s=useHome.getState(),r=roomAt(m.x,m.z,world.layout)||villageRoomAt(m.x,m.z,plan.dimensions),indoor=r&&r.kind!=='yard',first=s.walkView==='first';
  if(first){eye.set(m.x,m.y+(m.sitting?1:1.48),m.z);target.set(m.x-Math.sin(m.yaw)*Math.cos(m.pitch-.48)*3,m.y+(m.sitting?1:1.2)-Math.sin(m.pitch-.48)*3,m.z-Math.cos(m.yaw)*Math.cos(m.pitch-.48)*3);}
  else{target.set(m.x+(m.pose==="lie"?Math.sin(m.bodyYaw)*.55:0),m.y+(m.pose==="lie"?.15:m.sitting?1.12:.88),m.z+(m.pose==="lie"?Math.cos(m.bodyYaw)*.55:0));const distance=indoor?2.65:5.2;target.y+=Math.max(0,-m.pitch)*distance*1.5;eye.set(m.x+Math.sin(m.yaw)*Math.cos(Math.max(.12,m.pitch))*distance,Math.max(m.y+.25,target.y+Math.sin(m.pitch)*distance),m.z+Math.cos(m.yaw)*Math.cos(Math.max(.12,m.pitch))*distance);const k=cameraBoom(target,eye,{...world,ignoredObstacle:m.supportItem||undefined});eye.sub(target).multiplyScalar(k).add(target);}
  m.avatarVisible=!first&&eye.distanceTo(target)>1.05;
  camera.position.lerp(eye,snap.current?1:1-Math.exp(-dt*12));camera.lookAt(target);snap.current=false;
 },-1);
 return <Avatar/>;
}
