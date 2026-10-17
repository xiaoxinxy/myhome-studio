import {useHome} from '../store';
import {useRef} from 'react';
import {useFrame} from '@react-three/fiber';
import * as THREE from 'three';
import {Box,Cylinder,Sphere} from './Primitives';
import {StaticBatch} from './StaticBatch';
import {ObjectModel} from './Objects';
import {useInteractions} from '../interactions';
import {vehicles} from '../model/vehicle';
import {solid,glow,surface,glass} from './materials';
import type {PlacedItem,ItemDef} from '../model/types';

export function UsableFurniture({item,def}:{item:PlacedItem;def:ItemDef}){
 if(def.model!=='fridge'&&def.model!=='cabinet')return <ObjectModel def={def} color={item.color} moving={false} phase={0}/>;
 return <Cabinet item={item} def={def}/>;
}
function Cabinet({item,def:c}:{item:PlacedItem;def:ItemDef}){
 const open=useInteractions(s=>s.items[item.id]?.open)||false,left=useRef<THREE.Group>(null),right=useRef<THREE.Group>(null),t=useRef(0),fridge=c.model==='fridge';
 useFrame((_,dt)=>{t.current+=(Number(open)-t.current)*(1-Math.exp(-dt*8));if(left.current)left.current.rotation.y=-t.current*1.65;if(right.current)right.current.rotation.y=t.current*1.65;});
 const display=c.id==='display-fridge',medical=c.id==='medicine-cabinet',towels=c.id==='towel-cabinet';const {w,d,h}=c,inner=fridge?'#e3e8df':'#ae9877';
 return <group name={fridge?'可开门冰箱':'可开门收纳柜'} userData={{keepInteractive:true,itemId:item.id}}>
  <StaticBatch revision={item.color}><Box p={[0,h/2,-d/2+.035]} s={[w,h,.07]} c={item.color}/>{[-1,1].map(side=><Box key={side} p={[side*(w/2-.035),h/2,0]} s={[.07,h,d]} c={item.color}/>)}{[.035,h-.035].map(y=><Box key={y} p={[0,y,0]} s={[w,.07,d]} c={item.color}/>)}
  {[.25,.5,.72].map((u,i)=><group key={u}><Box p={[0,h*u,0]} s={[w-.12,.035,d-.08]} c={inner}/>{(fridge||medical||towels)&&<>{[-1,0,1].map(j=><group key={j}>{towels?<><Box p={[j*w*.25,h*u+.06,0]} s={[w*.23,.09,d*.65]} m={surface("fabric",i%2?"#dfdfd0":"#b7c5c0")}/><Box p={[j*w*.25,h*u+.13,0]} s={[w*.21,.045,d*.61]} c="#eef0e3"/></>:medical?<><Box p={[j*w*.25,h*u+.1,.02]} s={[w*.2,.17,d*.53]} c="#e4e9dc"/><Box p={[j*w*.25,h*u+.1,d*.29]} s={[w*.2,.045,.012]} c={i%2?"#8bada4":"#b9a77e"}/></>:<><Cylinder p={[j*w*.25,h*u+.075,-d*.12]} r={.045} h={.13} c={towels?'#e5e7dc':medical?(i%2?'#94b8a9':'#e8d6a9'):i%2?'#9aad80':'#ded1aa'}/><Sphere p={[j*w*.25,h*u+.07,d*.23]} s={[.055,.055,.055]} c={['#bd7258','#91a76d','#d7b765'][i]}/></>}</group>)}</>}</group>)}</StaticBatch>
  <group ref={left} name="柜门左扇" position={[-w/2,0,d/2]}><StaticBatch revision={item.color}><Box p={[w/4,h/2,0]} s={[w/2-.015,h,.055]} m={display?glass:fridge||medical||towels?solid(item.color):surface('wood',item.color,w,h)}/>{display&&<>{[.05,w/2-.05].map(x=><Box key={x} p={[x,h/2,.02]} s={[.035,h,.055]} c={item.color}/>)}{[.06,h-.06].map(y=><Box key={y} p={[w/4,y,.02]} s={[w/2,.08,.055]} c={item.color}/>)}</>}<Box p={[w/2-.07,h*.58,.045]} s={[.025,Math.min(.23,h*.3),.035]} c="#6d8176"/></StaticBatch></group>
  <group ref={right} name="柜门右扇" position={[w/2,0,d/2]}><StaticBatch revision={item.color}><Box p={[-w/4,h/2,0]} s={[w/2-.015,h,.055]} m={display?glass:fridge||medical||towels?solid(item.color):surface('wood',item.color,w,h)}/>{display&&<>{[-.05,-w/2+.05].map(x=><Box key={x} p={[x,h/2,.02]} s={[.035,h,.055]} c={item.color}/>)}{[.06,h-.06].map(y=><Box key={y} p={[-w/4,y,.02]} s={[w/2,.08,.055]} c={item.color}/>)}</>}<Box p={[-w/2+.07,h*.58,.045]} s={[.025,Math.min(.23,h*.3),.035]} c="#6d8176"/></StaticBatch></group>
  {fridge&&open&&<><Box p={[0,h-.1,0]} s={[w-.2,.035,d*.5]} m={glow}/></>}
 </group>;
}
export function VehicleOffset({item,children}:{item:PlacedItem;children:React.ReactNode}){
 const root=useRef<THREE.Group>(null),wheels=useRef<THREE.Object3D[]>([]);useFrame(()=>{const v=vehicles.get(item.id);if(!v||!root.current)return;if(useHome.getState().compare){root.current.position.set(0,0,0);root.current.rotation.y=0;return;}if(v.originX!==item.x||v.originZ!==item.z||v.originRotation!==item.rotation){Object.assign(v,{originX:item.x,originZ:item.z,originRotation:item.rotation,x:item.x,z:item.z,y:0,yaw:-item.rotation*Math.PI/180,speed:0});}const angle=-item.rotation*Math.PI/180,dx=v.x-item.x,dz=v.z-item.z;root.current.position.set(Math.cos(angle)*dx-Math.sin(angle)*dz,v.y,Math.sin(angle)*dx+Math.cos(angle)*dz);root.current.rotation.y=v.yaw-angle;if(!wheels.current.length)root.current.traverse(o=>{if(o.name==='轮轴旋转')wheels.current.push(o);});for(const wheel of wheels.current)wheel.rotation.y=v.wheel;});
 return <group ref={root}>{children}</group>;
}
