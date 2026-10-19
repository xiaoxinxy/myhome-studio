import {reactions} from '../model/encounters';
import {useEffect,useMemo,useRef,useState} from 'react';
import {useFrame} from '@react-three/fiber';
import * as THREE from 'three';
import {createWorldPopulation,sampleCrowdRoute,type CrowdPerson} from '../model/worldPopulation';
import {npcAgents} from '../model/npcRuntime';
import {personImpacts,stepPersonImpact,impactPose} from '../model/impacts';
import {naturalHeight} from '../model/nature';
import {useHome} from '../store';
import {useNpcChat} from '../npcChat';
import {worldTargets,hitPerson} from '../interactions';
import {walkMotion} from '../walkState';
import {makeWalkWorld,walkHeight,walkable} from '../model/walking';
import {Human,humanLook} from './Human';
import {MovingBatch} from './MovingBatch';
import {Box} from './Primitives';
const partColors=['skin','hair','coat','pants','pants','coat','coat','shoes','shoes'] as const;
const geometry=new THREE.BoxGeometry(1,1,1);
function DetailedVisitor({p,fallback,slot}:{p?:CrowdPerson;fallback:CrowdPerson;slot:number}){const root=useRef<THREE.Group>(null),a=(p||fallback).a;
 useFrame(()=>{if(!root.current)return;root.current.visible=!!p;if(!p)return;root.current.position.set(a.x,a.y,a.z);root.current.rotation.set(0,a.yaw,personImpacts.get(a.profile.id)?.tilt||0);},-.5);
 return <group ref={root} visible={!!p} userData={{trafficId:p?a.profile.id:'inactive-crowd-'+slot,paletteVersion:a.profile.appearance}} scale={.9}><Human look={{...humanLook(a.profile.appearance),hat:false,glasses:false,female:false}} motion={()=>({pose:personImpacts.has(a.profile.id)?impactPose(personImpacts.get(a.profile.id)!):a.activity,phase:a.phase,moving:a.moving})}/><group visible={!!p?.hiker} userData={{dynamicVisibility:true}}><Box p={[0,1.1,.19]} s={[.29,.34,.15]} c="#b08b59"/><Box p={[-.12,1.16,.1]} s={[.03,.36,.06]} c="#c2b48f"/><Box p={[.12,1.16,.1]} s={[.03,.36,.06]} c="#c2b48f"/></group></group>;
}
export function WorldCrowds(){const population=useMemo(createWorldPopulation,[]),plan=useHome(s=>s.current()),world=useMemo(()=>makeWalkWorld(plan),[plan]),mesh=useRef<THREE.InstancedMesh>(null),[near,setNear]=useState<string[]>([]),nearRef=useRef(new Set<string>()),selectionClock=useRef(0),clock=useRef(0),slots=useRef<string[]>([]);
 const material=useMemo(()=>new THREE.MeshStandardMaterial({color:'white',roughness:.9}),[]),scratch=useMemo(()=>({object:new THREE.Object3D(),color:new THREE.Color(),projection:new THREE.Matrix4(),frustum:new THREE.Frustum(),sphere:new THREE.Sphere(new THREE.Vector3(),2),matrix:new THREE.Matrix4()}),[]);
 useEffect(()=>{for(const p of population){const a=p.a,id=a.profile.id;npcAgents.set(id,a);worldTargets.set(id,{point:()=>a,label:'交谈 · '+a.profile.name,activate:()=>{if(!useHome.getState().walking||Math.hypot(walkMotion.x-a.x,walkMotion.z-a.z)>3){useHome.setState({notice:'走近'+a.profile.name+'可以交谈'});return;}a.pauseUntil=Date.now()+5000;useNpcChat.getState().open(id);},actions:[{label:'挥拳 · '+a.profile.name,activate:()=>hitPerson(id,a)}]});}return()=>{for(const p of population){const id=p.a.profile.id;npcAgents.delete(id);worldTargets.delete(id);personImpacts.delete(id);}material.dispose();};},[population,material]);
 useFrame(({camera,scene},dt)=>{clock.current+=dt;selectionClock.current+=dt;const now=Date.now();
  for(const p of population){const a=p.a,distance=Math.hypot(camera.position.x-a.x,camera.position.z-a.z);p.tick+=dt;
   if(personImpacts.has(a.profile.id)){const hit=stepPersonImpact(a.profile.id,dt,(x,z)=>walkHeight(x,z,world),(x,y,z)=>walkable(x,z,{...world,actorY:y,ignoredObstacle:a.profile.id}));if(hit){a.x=hit.x;a.y=hit.y;a.z=hit.z;a.activity=hit.stage==='down'?'lie':hit.stage==='return'?'walk':'stand';a.phase+=dt*5;continue;}}
   if(p.tick<(distance<70?0:distance<240?.12:.7))continue;const elapsed=p.tick;p.tick=0;
   const reaction=reactions.get(a.profile.id);if(reaction&&now<reaction.fleeUntil){const dx=a.x-reaction.sourceX,dz=a.z-reaction.sourceZ,d=Math.hypot(dx,dz)||1,nx=a.x+dx/d*elapsed*1.8,nz=a.z+dz/d*elapsed*1.8;if(now>reaction.hitUntil&&walkable(nx,nz,{...world,actorY:a.y,ignoredObstacle:a.profile.id})){a.x=nx;a.z=nz;if(p.hiker)a.y=naturalHeight(nx,nz);}a.activity=now<reaction.hitUntil?'stand':'walk';a.moving=now>reaction.hitUntil;a.phase+=elapsed*7;a.yaw=Math.atan2(-dx,-dz);continue;}
   if(useNpcChat.getState().active===a.profile.id||now<a.pauseUntil){a.activity='talk';a.moving=false;continue;}
   const stop=(p.elapsed+p.a.profile.appearance*.7)%38>30;p.elapsed+=elapsed;a.phase+=elapsed*4;a.moving=!stop;a.activity=stop?(p.a.profile.appearance%3?'stand':'talk'):'walk';
   // Pause at viewpoints and ticket queues; far-away residents advance in time
   // without per-frame path finding, wall scans or skeletal animation.
   if(!stop)p.offset+=elapsed*p.speed;
   const point=sampleCrowdRoute(p.route,p.offset,p.lane);Object.assign(a,point);if(p.hiker)a.y=naturalHeight(a.x,a.z);
  }
  if(selectionClock.current>.65){selectionClock.current=0;const ids=population.filter(p=>Math.hypot(camera.position.x-p.a.x,camera.position.z-p.a.z)<(nearRef.current.has(p.a.profile.id)?29:24)&&Math.abs(camera.position.y-p.a.y)<18).sort((p,q)=>Number(nearRef.current.has(q.a.profile.id))-Number(nearRef.current.has(p.a.profile.id))||Math.hypot(camera.position.x-p.a.x,camera.position.z-p.a.z)-Math.hypot(camera.position.x-q.a.x,camera.position.z-q.a.z)).slice(0,16).map(p=>p.a.profile.id).sort();if(ids.join()!==[...nearRef.current].sort().join()){nearRef.current=new Set(ids);setNear(ids);}}
  if(!mesh.current)return;const f=scratch;f.projection.multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse);f.frustum.setFromProjectionMatrix(f.projection);let count=0,colorDirty=false,visiblePeople=0;
  for(const p of population){const a=p.a;if(nearRef.current.has(a.profile.id)||Math.hypot(camera.position.x-a.x,camera.position.z-a.z)>190)continue;f.sphere.center.set(a.x,a.y+.8,a.z);if(!f.frustum.intersectsSphere(f.sphere))continue;visiblePeople++;const look=humanLook(a.profile.appearance),stride=a.moving?Math.sin(a.phase)*.26:0,hit=personImpacts.get(a.profile.id);
   const parts=[[0,1.53,0,.24,.31,.23],[0,1.68,.02,.25,.1,.23],[0,1.04,0,.32,.57,.21],[-.09,.39,stride,.12,.65,.13],[.09,.39,-stride,.12,.65,.13],[-.22,.98,-stride*.5,.1,.5,.12],[.22,.98,stride*.5,.1,.5,.12],[-.09,.075,stride-.03,.13,.1,.23],[.09,.075,-stride-.03,.13,.1,.23]];
   const sin=Math.sin(a.yaw),cos=Math.cos(a.yaw);
   for(let i=0;i<parts.length;i++){let [x,y,z,w,h,d]=parts[i];if(hit?.stage==='down'){z+=y-.1;y=.12;}f.object.position.set(a.x+(x*cos+z*sin)*.9,a.y+y*.9,a.z+(-x*sin+z*cos)*.9);f.object.rotation.set(0,a.yaw,hit?.tilt||0);f.object.scale.set(w*.9,h*.9,d*.9);f.object.updateMatrix();mesh.current.setMatrixAt(count,f.object.matrix);
    const identity=a.profile.id+':'+i;if(slots.current[count]!==identity){const color=partColors[i];f.color.set(color==='shoes'?'#60665e':look[color]);mesh.current.setColorAt(count,f.color);slots.current[count]=identity;colorDirty=true;}count++;
   }
  }mesh.current.count=count;if(count)mesh.current.instanceMatrix.needsUpdate=true;if(colorDirty&&mesh.current.instanceColor)mesh.current.instanceColor.needsUpdate=true;
  scene.userData.population={total:population.length,hikers:population.filter(p=>p.hiker).length,detailed:nearRef.current.size,visibleCoarse:visiblePeople,impacts:personImpacts.size};
 },-1);
 return <group name="景点游客、登山者和外围居民"><instancedMesh ref={mesh} args={[geometry,material,population.length*9]} frustumCulled={false} onClick={e=>{if(e.delta>5||e.instanceId===undefined)return;const id=slots.current[e.instanceId]?.split(':')[0];if(id){e.stopPropagation();worldTargets.get(id)?.activate();}}}/><MovingBatch dynamicOwners>{Array.from({length:16},(_,slot)=><DetailedVisitor key={slot} slot={slot} fallback={population[0]} p={population.find(p=>p.a.profile.id===near[slot])}/>)}</MovingBatch></group>;
}
