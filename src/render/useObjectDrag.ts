import {useEffect,useRef} from 'react';
import {useThree,type ThreeEvent} from '@react-three/fiber';
import * as THREE from 'three';
import type {PlacedItem} from '../model/types';
import {useHome} from '../store';

// Track the gesture in client coordinates even when its ray leaves the object.
// Orbit/room look must never compete with an active furniture gesture.
export function useObjectDrag(item:PlacedItem,base:number,readOnly:boolean){
 const {camera,gl}=useThree(),cleanup=useRef<(()=>void)|null>(null);
 useEffect(()=>()=>cleanup.current?.(),[]);
 return (event:ThreeEvent<PointerEvent>)=>{
  const state=useHome.getState();if(state.walking||readOnly||state.interaction!=='arrange')return;
  event.stopPropagation();useHome.setState({selected:item.id});
  if(item.locked){useHome.setState({notice:'这个物件已锁定，可在编辑面板解锁；固定炕不能移动'});return;}
  cleanup.current?.();const canvas=gl.domElement,plane=new THREE.Plane(new THREE.Vector3(0,1,0),-base),ray=new THREE.Raycaster(),pointer=new THREE.Vector2();
  const point=(e:{clientX:number;clientY:number})=>{const rect=canvas.getBoundingClientRect();pointer.set((e.clientX-rect.left)/rect.width*2-1,-(e.clientY-rect.top)/rect.height*2+1);ray.setFromCamera(pointer,camera);return ray.ray.intersectPlane(plane,new THREE.Vector3());};
  const initial=point(event);if(!initial)return;const offset={x:item.x-initial.x,z:item.z-initial.z},id=event.pointerId;let active=false;
  useHome.setState({dragging:true});canvas.setPointerCapture(id);
  const finish=()=>{window.removeEventListener('pointermove',move,true);window.removeEventListener('pointerup',up,true);window.removeEventListener('pointercancel',up,true);window.removeEventListener('pointerdown',second,true);window.removeEventListener('blur',finish);canvas.removeEventListener('lostpointercapture',up);if(canvas.hasPointerCapture(id))canvas.releasePointerCapture(id);useHome.setState({dragging:false});cleanup.current=null;};
  const up=(e:PointerEvent)=>{if(e.pointerId===id)finish();};
  const second=(e:PointerEvent)=>{if(e.pointerId!==id)finish();};
  const move=(e:PointerEvent)=>{if(e.pointerId!==id)return;if(!useHome.getState().dragging){finish();return;}e.preventDefault();e.stopPropagation();if(!active){if(Math.hypot(e.clientX-event.clientX,e.clientY-event.clientY)<6)return;active=true;useHome.getState().beginGesture();}const p=point(e);if(p)useHome.getState().edit(item.id,{x:p.x+offset.x,z:p.z+offset.z},false);};
  window.addEventListener('pointermove',move,true);window.addEventListener('pointerup',up,true);window.addEventListener('pointercancel',up,true);window.addEventListener('pointerdown',second,true);window.addEventListener('blur',finish);canvas.addEventListener('lostpointercapture',up);cleanup.current=finish;
 };
}
