import {personImpacts,stepPersonImpact,impactPose} from '../model/impacts';
import {walkHeight,walkable} from '../model/walking';
import {makeWalkWorld} from '../model/walking';
import {wallOccludes} from '../model/occlusion';
import {npcAgents,type NpcRuntime} from '../model/npcRuntime';
import {useNpcChat} from '../npcChat';
import {Human,humanLook} from './Human';
import {MovingBatch} from './MovingBatch';
import {useEffect,useMemo,useRef} from 'react';
import {useFrame} from '@react-three/fiber';
import * as THREE from 'three';
import {Box,Cylinder,Sphere} from './Primitives';
import {StaticBatch} from './StaticBatch';
import {Vehicle} from './Vehicles';
import {createTraffic,createOuterTraffic,advanceTraffic,routePosition,trafficActors,type TrafficActor} from '../model/traffic';
import {useHome} from '../store';
import {walkMotion} from '../walkState';
import {worldTargets,playTone,useInteractions,hitPerson,takeTrafficVehicle} from '../interactions';
import {vehicles} from '../model/vehicle';
import type {Dimensions} from '../model/types';
function Actor({actor:a,index,world}:{actor:TrafficActor;index:number;world:ReturnType<typeof makeWalkWorld>}){const farTick=useRef(index%8/16),root=useRef<THREE.Group>(null),left=useRef<THREE.Group>(null),right=useRef<THREE.Group>(null),visibilityClock=useRef(index%9/50),rider=useRef<THREE.Group>(null),wheels=useRef<THREE.Object3D[]>([]),person=a.kind==='person',color=['#a9b9ae','#b2a490','#718e98','#a5afb6','#b1a2a0','#799489'][index%6];
 useFrame((state,dt)=>{
  const driven=vehicles.get(a.id),distance=Math.hypot(state.camera.position.x-a.x,state.camera.position.z-a.z);let moving=false,impact=personImpacts.get(a.id);
  if(a.claimed&&driven){a.x=driven.x;a.z=driven.z;a.yaw=driven.yaw;}
  if(impact){stepPersonImpact(a.id,dt,(x,z)=>walkHeight(x,z,world),(x,y,z)=>walkable(x,z,{...world,ignoredObstacle:a.id,actorY:y}));Object.assign(a,{x:impact.x,y:impact.y,z:impact.z});moving=impact.stage==='return';}
  else if(!a.claimed){if(Date.now()<a.pausedUntil){a.activity='wait';a.velocity=0;}else if(distance>240){farTick.current+=dt;if(farTick.current>.5){a.distance+=a.speed*farTick.current;Object.assign(a,routePosition(a.route,a.distance));farTick.current=0;}}
   else moving=advanceTraffic(a,dt,useHome.getState().walking?{x:walkMotion.x,z:walkMotion.z,radius:useInteractions.getState().driving?2.3:.2}:undefined);
  }else moving=!!driven&&Math.abs(driven.speed)>.1;
  if(person){const n=npcAgents.get(a.id);if(n)Object.assign(n,{x:a.x,y:a.y??.09,z:a.z,yaw:a.yaw,activity:impact?.stage==='down'?'lie':a.activity==='wait'?'talk':'walk',phase:a.distance*7});if(useNpcChat.getState().active===a.id)a.pausedUntil=Date.now()+300;}
  if(!root.current)return;root.current.position.set(a.x,person?a.y??.09:driven?.y||0,a.z);root.current.rotation.y=a.yaw+(person?Math.PI:0);visibilityClock.current+=dt;
  if(visibilityClock.current>.2){visibilityClock.current=0;root.current.visible=distance<(a.claimed?180:160)&&!wallOccludes(state.camera.position,{x:a.x,y:(a.y||0)+(person?1.35:1.2),z:a.z},world);}
  root.current.rotation.z=impact?.tilt||(a.activity==='stagger'?Math.sin(Date.now()*.03)*.16:0);
  if(!person&&root.current.visible){if(!wheels.current.length)root.current.traverse(o=>{if(o.name==='轮轴旋转')wheels.current.push(o);});for(const wheel of wheels.current)wheel.rotation.y=driven?.wheel||a.distance/.3;}
  if(rider.current)rider.current.scale.setScalar(a.claimed?0:1);if(person&&!impact&&a.activity==='wait'&&useHome.getState().walking&&Math.hypot(a.x-walkMotion.x,a.z-walkMotion.z)<4)root.current.rotation.y=Math.atan2(a.x-walkMotion.x,a.z-walkMotion.z);const step=moving?Math.sin(a.distance*8)*.42:0;if(left.current)left.current.rotation.x=step;if(right.current)right.current.rotation.x=-step;
 },-1);
 const citizen:NpcRuntime={profile:{id:a.id,name:['路过的李师傅','赶集的陈姐','邻村小周','散步的王叔'][index%4],occupation:'赶集与办事',personality:'喜欢和街坊交流',home:'邻村',appearance:index+20},x:a.x,y:.09,z:a.z,yaw:a.yaw,activity:'walk',phase:0,moving:true,pauseUntil:0,destination:'沿街办事'};
 const activate=()=>{if(person&&useHome.getState().walking&&Math.hypot(walkMotion.x-a.x,walkMotion.z-a.z)<3){a.pausedUntil=Date.now()+6000;useNpcChat.getState().open(a.id);return;}a.pausedUntil=Date.now()+3000;if(!person)playTone('horn');useHome.setState({notice:person?'路人停下来向你问好，稍后继续赶路':'司机停下来示意你先走，三秒后继续行驶'});};
 useEffect(()=>{trafficActors.set(a.id,a);if(person)npcAgents.set(a.id,citizen);worldTargets.set(a.id,{point:()=>a,label:person?'招呼路人':'叫停车辆',activate,actions:person?[{label:'挥拳 · 路人',activate:()=>{if(!hitPerson(a.id,a))useHome.setState({notice:'靠近到两米内再挥拳'});}}]:[{label:a.kind==='car'||a.kind==='van'?'夺车驾驶':'骑走车辆',activate:()=>{if(takeTrafficVehicle(useHome.getState().current(),a))useHome.setState({selected:null,walkView:'follow'});}}]});return()=>{trafficActors.delete(a.id);personImpacts.delete(a.id);if(person)npcAgents.delete(a.id);worldTargets.delete(a.id);};},[a]);
 return <group ref={root} userData={{trafficId:a.id}} position={[a.x,0,a.z]} name={person?'走动的街坊':a.kind==='van'?'送货面包车':'行驶中的车辆'} onClick={e=>{if(e.delta<5){e.stopPropagation();activate();}}}>
 {person?<Human look={humanLook(index+20)} motion={()=>({pose:personImpacts.has(a.id)?impactPose(personImpacts.get(a.id)!):a.activity==='wait'?'talk':a.activity==='stagger'?'stand':a.activity==='drive'?'stand':'walk',phase:a.distance*7})}/>:<><StaticBatch revision={a.kind+color}><Vehicle type={a.kind==='van'?'car':a.kind} color={color} variant={a.kind==='van'?'van':(['sedan','suv','hatchback','pickup'] as const)[index%4]}/></StaticBatch>{['ebike','trike'].includes(a.kind)&&<group ref={rider}><StaticBatch revision="rider"><Sphere p={[0,1.45,-.05]} s={[.13,.15,.13]} c="#baad8b"/><Box p={[0,1.08,-.06]} s={[.35,.46,.24]} c={color}/>{[-1,1].map(side=><Box key={side} p={[side*.24,.86,.14]} s={[.12,.43,.13]} rotation={[-.4,0,0]} c="#52635e"/>)}</StaticBatch></group>}</>}
 </group>;
}
export function RoadLife({d}:{d:Dimensions}){const plan=useHome(s=>s.current()),world=useMemo(()=>makeWalkWorld(plan),[plan]),actors=useMemo(()=>[...createTraffic(d),...createOuterTraffic()],[d]);return <group name="街道车流与步行居民"><MovingBatch>{actors.map((a,i)=><Actor key={a.id} actor={a} index={i} world={world}/>)}</MovingBatch></group>;}
