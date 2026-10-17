import {useEffect,useMemo,useRef} from 'react';
import {useFrame,useThree} from '@react-three/fiber';
import * as THREE from 'three';
import {makeWalkWorld,walkSpawn,walkHeight} from '../model/walking';
import type {Plan} from '../model/types';
import {useHome} from '../store';
import {sceneActions} from './exports';

export function RoomObserver({plan,room}:{plan:Plan;room:string}){
 const {camera,gl,size}=useThree(),world=useMemo(()=>makeWalkWorld(plan),[plan]),look=useRef({yaw:0,pitch:0,fov:72}),target=useMemo(()=>new THREE.Vector3(),[]);
 const position=useMemo(()=>{const p=walkSpawn(world,room);return new THREE.Vector3(p.x,walkHeight(p.x,p.z,world)+1.45,p.z);},[world,room]);
 useEffect(()=>{look.current={yaw:0,pitch:0,fov:size.width/size.height<.8?78:72};camera.position.copy(position);},[camera,position,size.width,size.height]);
 useEffect(()=>{
  const canvas=gl.domElement,pointers=new Map<number,{x:number;y:number}>(),c=camera as THREE.PerspectiveCamera,previous=c.fov;
  const zoom=(factor:number)=>{look.current.fov=Math.max(45,Math.min(90,look.current.fov*factor));};sceneActions.zoom=zoom;
  const down=(e:PointerEvent)=>{if(useHome.getState().interaction==='arrange')return;e.preventDefault();canvas.setPointerCapture(e.pointerId);pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});};
  const move=(e:PointerEvent)=>{const old=pointers.get(e.pointerId);if(!old||useHome.getState().dragging)return;
   if(pointers.size===1){look.current.yaw-=(e.clientX-old.x)*.005;look.current.pitch=Math.max(-1.05,Math.min(1.05,look.current.pitch+(e.clientY-old.y)*.004));}
   else{const other=[...pointers].find(([id])=>id!==e.pointerId)?.[1];if(other){const before=Math.hypot(old.x-other.x,old.y-other.y),after=Math.hypot(e.clientX-other.x,e.clientY-other.y);if(after>3&&before>3)zoom(before/after);}}
   pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
  };
  const up=(e:PointerEvent)=>{pointers.delete(e.pointerId);if(canvas.hasPointerCapture(e.pointerId))canvas.releasePointerCapture(e.pointerId);};
  const wheel=(e:WheelEvent)=>{e.preventDefault();zoom(e.deltaY>0?1.05:.95);};const blur=()=>pointers.clear();
  canvas.addEventListener('pointerdown',down);canvas.addEventListener('pointermove',move);canvas.addEventListener('pointerup',up);canvas.addEventListener('pointercancel',up);canvas.addEventListener('wheel',wheel,{passive:false});window.addEventListener('blur',blur);
  return()=>{delete sceneActions.zoom;c.fov=previous;c.updateProjectionMatrix();canvas.removeEventListener('pointerdown',down);canvas.removeEventListener('pointermove',move);canvas.removeEventListener('pointerup',up);canvas.removeEventListener('pointercancel',up);canvas.removeEventListener('wheel',wheel);window.removeEventListener('blur',blur);};
 },[camera,gl]);
 useFrame(()=>{const l=look.current,c=camera as THREE.PerspectiveCamera;if(c.fov!==l.fov){c.fov=l.fov;c.updateProjectionMatrix();}camera.position.copy(position);target.set(position.x-Math.sin(l.yaw)*Math.cos(l.pitch),position.y-Math.sin(l.pitch),position.z-Math.cos(l.yaw)*Math.cos(l.pitch));camera.lookAt(target);});
 return null;
}
