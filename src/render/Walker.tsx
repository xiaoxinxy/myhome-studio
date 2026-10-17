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
function Avatar(){
 const hair=useCommunity(s=>s.hair);
 const rig=useRef<THREE.Group>(null),pack=useRef<THREE.Group>(null),root=useRef<THREE.Group>(null),leftLeg=useRef<THREE.Group>(null),rightLeg=useRef<THREE.Group>(null),leftKnee=useRef<THREE.Group>(null),rightKnee=useRef<THREE.Group>(null),leftArm=useRef<THREE.Group>(null),rightArm=useRef<THREE.Group>(null),torso=useRef<THREE.Group>(null);
 useFrame(()=>{if(!root.current)return;const stride=m.moving?Math.sin(m.phase)*.5:0,crouching=(m.petting||Date.now()<m.crouchUntil),riding=!!useInteractions.getState().driving,lying=m.pose==="lie",seated=(m.sitting&&!lying)||riding;if(rig.current)rig.current.rotation.x=lying?Math.PI/2:0;if(pack.current)pack.current.visible=!m.sitting;
  root.current.position.set(m.x,m.y+(riding?.18:m.sitting?0:crouching?-.45:0),m.z);root.current.rotation.y=m.bodyYaw;
  if(leftLeg.current)leftLeg.current.rotation.x=seated?Math.PI/2:crouching?2:stride;if(rightLeg.current)rightLeg.current.rotation.x=seated?Math.PI/2:crouching?2:-stride;
  if(leftKnee.current)leftKnee.current.rotation.x=seated?-Math.PI/2:crouching?-2.8:0;if(rightKnee.current)rightKnee.current.rotation.x=seated?-Math.PI/2:crouching?-2.8:0;if(leftArm.current)leftArm.current.rotation.x=riding?.9:-stride*.7;if(rightArm.current)rightArm.current.rotation.x=crouching?1.1+Math.sin(Date.now()*.008)*.15:riding?.9:stride*.7;
  if(torso.current){torso.current.position.y=m.moving&&!riding?Math.abs(Math.sin(m.phase))*.025:0;torso.current.rotation.x=crouching?-.18:0;}
  root.current.visible=useHome.getState().walkView==='follow'&&m.avatarVisible;
 });
 return <group ref={root} name="漫游小人" scale={.76}><group ref={rig}><group ref={torso}>
  <Sphere p={[0,1.02,0]} s={[.235,.32,.145]} c="#64897d"/><Box p={[0,.78,0]} s={[.31,.18,.21]} c="#405468"/>
  <Cylinder p={[0,1.35,0]} r={.06} h={.12} c="#dcae89"/><Sphere p={[0,1.55,0]} s={[.16,.19,.155]} c="#e2ba98"/>
  <Sphere p={[0,1.65,.025]} s={[.168,.115,.155]} c={hair}/><Sphere p={[0,1.55,.08]} s={[.16,.13,.09]} c={hair}/>
  {[-1,1].map(side=><group key={side}><Sphere p={[side*.056,1.57,-.143]} s={[.017,.021,.01]} c="#343d3c"/><Sphere p={[side*.16,1.54,0]} s={[.027,.04,.034]} c="#dcae89"/></group>)}
  <Sphere p={[0,1.51,-.159]} s={[.025,.026,.02]} c="#d6a482"/><Box p={[0,1.47,-.144]} s={[.05,.008,.009]} c="#a16e56"/>
  <group ref={leftLeg} position={[-.095,.73,0]}><Cylinder p={[0,-.14,0]} r={.075} h={.28} c="#435a70"/><group ref={leftKnee} position={[0,-.28,0]}><Cylinder p={[0,-.14,0]} r={.07} h={.28} c="#435a70"/><Sphere p={[0,-.36,-.04]} s={[.09,.08,.15]} c="#eee8d7"/></group></group>
  <group ref={rightLeg} position={[.095,.73,0]}><Cylinder p={[0,-.14,0]} r={.075} h={.28} c="#435a70"/><group ref={rightKnee} position={[0,-.28,0]}><Cylinder p={[0,-.14,0]} r={.07} h={.28} c="#435a70"/><Sphere p={[0,-.36,-.04]} s={[.09,.08,.15]} c="#eee8d7"/></group></group>
  <group ref={leftArm} position={[-.225,1.2,0]}><Cylinder p={[0,-.19,0]} r={.065} h={.38} c="#64897d"/><Sphere p={[0,-.43,0]} s={[.055,.08,.055]} c="#e2ba98"/></group>
  <group ref={rightArm} position={[.225,1.2,0]}><Cylinder p={[0,-.19,0]} r={.065} h={.38} c="#64897d"/><Sphere p={[0,-.43,0]} s={[.055,.08,.055]} c="#e2ba98"/></group>
  <group ref={pack}><Sphere p={[0,1.09,.155]} s={[.17,.22,.08]} c="#b99566"/></group>
 </group></group></group>;
}

export function Walker({plan}:{plan:Plan}){
 const epoch=useInteractions(s=>s.vehicleEpoch),doors=useInteractions(s=>s.doors),view=useHome(s=>s.walkView),street=useHome(s=>s.street),world=useMemo(()=>makeWalkWorld(plan,street,Object.keys(doors).filter(id=>!doors[id])),[plan,street,doors,epoch]),{camera,size}=useThree();
 useEffect(()=>{const c=camera as THREE.PerspectiveCamera,previous=c.fov;return()=>{c.fov=previous;c.updateProjectionMatrix();};},[camera]);
 useEffect(()=>{const c=camera as THREE.PerspectiveCamera;c.fov=view==='first'?(size.width/size.height<.8?75:65):(size.width/size.height<.8?65:55);c.updateProjectionMatrix();},[camera,view,size.width,size.height]);
 const warp=useRef(-1),snap=useRef(true),blocked=useRef(false),eye=useMemo(()=>new THREE.Vector3(),[]),target=useMemo(()=>new THREE.Vector3(),[]);
 useEffect(()=>{
  m.ready=false;warp.current=-1;snap.current=true;
  return()=>{clearWalkInput();stopDriving(plan,true);m.crouchUntil=0;m.petting=false;m.ready=false;};
 },[]);
 useEffect(()=>{
  const publish=()=>{if(!m.ready)return;const r=roomAt(m.x,m.z,world.layout)||villageRoomAt(m.x,m.z,plan.dimensions),room=r?.id||null;
   if(useHome.getState().walkRoom!==room)useHome.setState({walkRoom:room});
   useWalkStatus.setState({x:m.x,z:m.z,y:m.y,room:r?.name||southYardLocation(m.x,m.z,plan.dimensions)||'门外街道',blocked:blocked.current,speed:Math.round(Math.abs(vehicles.get(useInteractions.getState().driving||'')?.speed||0)*36)/10,posture:useInteractions.getState().driving?'驾驶':m.sitting?(m.pose==='lie'?'躺下':'坐下'):Date.now()<m.crouchUntil?'蹲下摸猫':'步行'});
  };
  const timer=setInterval(publish,120);return()=>clearInterval(timer);
 },[world]);
 useFrame((_,delta)=>{
  if(!m.ready||warp.current!==m.warp){
   const spawn=walkSpawn(world,m.destination);m.x=spawn.x;m.z=spawn.z;m.y=walkHeight(m.x,m.z,world);m.yaw=0;m.bodyYaw=0;m.pitch=.38;m.phase=0;m.ready=true;warp.current=m.warp;snap.current=true;
  }
  const dt=Math.min(delta,.08),keys=m.keys;if(m.sitting||Date.now()<m.crouchUntil||useHome.getState().selected||useCommunity.getState().active){m.stickX=0;m.stickY=0;keys.clear();}
  if(keys.has('KeyQ'))m.yaw+=dt*1.8;if(keys.has('KeyE'))m.yaw-=dt*1.8;
  let right=(Math.abs(m.stickX)<.12?0:m.stickX)+(keys.has('KeyD')||keys.has('ArrowRight')?1:0)-(keys.has('KeyA')||keys.has('ArrowLeft')?1:0);
  let forward=-(Math.abs(m.stickY)<.12?0:m.stickY)+(keys.has('KeyW')||keys.has('ArrowUp')?1:0)-(keys.has('KeyS')||keys.has('ArrowDown')?1:0);
  const length=Math.hypot(right,forward);if(length>1){right/=length;forward/=length;}
  const driver=useInteractions.getState().driving;
  if(driver){const v=vehicles.get(driver)!,f=plan.items.find(f=>f.id===driver)!,def=catalog.find(c=>c.id===f.type)!;const actors=[...worldTargets.entries()].filter(([id])=>id.startsWith('neighbor-')||/^community-\d+$/.test(id)||id.startsWith('passer-')||id.startsWith('animal-')).map(([id,t])=>{const p=t.point();return{itemId:id,x:p.x,z:p.z,w:.45,d:.45,cos:1,sin:0,base:0,height:1.5};});blocked.current=driveStep(v,forward,right,dt,{...def,w:def.w*f.scale,d:def.d*f.scale},{...world,dynamicObstacles:actors});v.y+=(walkHeight(v.x,v.z,world)-v.y)*(1-Math.exp(-dt*12));m.x=v.x;m.z=v.z;m.y=v.y;m.bodyYaw=v.yaw+Math.PI;m.yaw=m.bodyYaw;m.moving=Math.abs(v.speed)>.05;m.phase=v.wheel;m.avatarVisible=v.type!=='car';target.set(v.x,v.y+1.15,v.z);const length=v.type==='car'?7:5;eye.set(v.x-Math.sin(v.yaw)*length,v.y+(v.type==='car'?4:3),v.z-Math.cos(v.yaw)*length);const k=cameraBoom(target,eye,{...world,ignoredObstacle:driver});eye.sub(target).multiplyScalar(k).add(target);camera.position.lerp(eye,1-Math.exp(-dt*9));camera.lookAt(target);return;}
  const speed=keys.has('ShiftLeft')||keys.has('ShiftRight')?2.9:1.65,dx=(Math.cos(m.yaw)*right-Math.sin(m.yaw)*forward)*dt*speed,dz=(-Math.sin(m.yaw)*right-Math.cos(m.yaw)*forward)*dt*speed;
  const p=moveWalker(m,dx,dz,world),distance=Math.hypot(p.x-m.x,p.z-m.z);m.x=p.x;m.z=p.z;m.moving=distance>.0001;
  blocked.current=length>.1&&distance<Math.hypot(dx,dz)*.25;
  if(m.moving){m.phase+=distance*8;const yaw=Math.atan2(-dx,-dz);m.bodyYaw+=Math.atan2(Math.sin(yaw-m.bodyYaw),Math.cos(yaw-m.bodyYaw))*(1-Math.exp(-dt*12));}
  if(!m.sitting)m.y+=(walkHeight(m.x,m.z,world)-m.y)*(1-Math.exp(-dt*18));
  const s=useHome.getState(),r=roomAt(m.x,m.z,world.layout)||villageRoomAt(m.x,m.z,plan.dimensions),indoor=r&&r.kind!=='yard',first=s.walkView==='first';
  if(first){eye.set(m.x,m.y+(m.sitting?1:1.2),m.z);target.set(m.x-Math.sin(m.yaw)*3,m.y+(m.sitting?1:1.2)-Math.sin(m.pitch-.48)*2,m.z-Math.cos(m.yaw)*3);}
  else{target.set(m.x+(m.pose==="lie"?Math.sin(m.bodyYaw)*.55:0),m.y+(m.pose==="lie"?.15:m.sitting?1.12:.88),m.z+(m.pose==="lie"?Math.cos(m.bodyYaw)*.55:0));const distance=indoor?2.65:5.2;eye.set(m.x+Math.sin(m.yaw)*Math.cos(m.pitch)*distance,target.y+Math.sin(m.pitch)*distance,m.z+Math.cos(m.yaw)*Math.cos(m.pitch)*distance);const k=cameraBoom(target,eye,{...world,ignoredObstacle:m.supportItem||undefined});eye.sub(target).multiplyScalar(k).add(target);}
  m.avatarVisible=!first&&eye.distanceTo(target)>1.05;
  camera.position.lerp(eye,snap.current?1:1-Math.exp(-dt*12));camera.lookAt(target);snap.current=false;
 },-1);
 return <Avatar/>;
}
