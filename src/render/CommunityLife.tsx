import {useEffect,useMemo,useRef} from 'react';
import * as THREE from 'three';
import {useFrame} from '@react-three/fiber';
import {useCommunity,type CommunityActivity} from '../community';
import {worldTargets,stopToInteract} from '../interactions';
import {walkMotion} from '../walkState';
import {useHome} from '../store';
import {village} from '../model/village';
import {ruralPlots} from '../model/neighborhood';
import type {Dimensions} from '../model/types';
import {Box,Cylinder,Sphere} from './Primitives';
import {StaticBatch} from './StaticBatch';
export function VillageSign({text,x,y,z,w=5}:{text:string;x:number;y:number;z:number;w?:number}){
 const texture=useMemo(()=>{const c=document.createElement('canvas');c.width=768;c.height=128;const ctx=c.getContext('2d')!;ctx.fillStyle=text.includes('卫生')?'#f2f4e9':'#345c50';ctx.fillRect(0,0,768,128);ctx.fillStyle=text.includes('卫生')?'#a74c48':'#f7efce';ctx.font='bold 62px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(text,384,64,738);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t;},[text]);useEffect(()=>()=>texture.dispose(),[texture]);
 return <group position={[x,y,z]}>{[0,Math.PI].map(angle=><mesh key={angle} rotation={[0,angle,0]} position={[0,0,angle===0?.002:-.002]}><planeGeometry args={[w,.85]}/><meshBasicMaterial map={texture}/></mesh>)}</group>;
}
function ExamIndicator({x,z}:{x:number;z:number}){const ref=useRef<THREE.Group>(null);useFrame(({clock})=>{if(ref.current)ref.current.scale.y=.8+Math.sin(clock.elapsedTime*4)*.2;});return <group ref={ref} position={[x,1.05,z]}><Box s={[.6,.35,.12]} c="#78bd9d"/>{[-1,0,1].map(i=><Box key={i} p={[i*.12,0,.07]} s={[.06,.1+Math.abs(i)*.06,.01]} c="#e6f0cc"/>)}</group>;}
export function CommunityLife({d}:{d:Dimensions}){
 const s=useCommunity(),homes=village(d).filter(h=>h.n.style>=12),plots=ruralPlots(d),counter=homes[0]?.plan.items.find(f=>f.type==='checkout');
 const targets=useMemo(()=>[...homes.map((h,i)=>{const r=h.layout.rooms[0];return{id:['shop','civic','clinic','barber'][i] as CommunityActivity,name:h.n.name,x:r.x+r.w*.5,z:r.z+r.d*.60};}),...plots.map(r=>({id:r.id as CommunityActivity,name:r.name,x:r.x+r.w/2,z:r.z+2}))],[d]);
 const open=(id:CommunityActivity)=>{if(!useHome.getState().walking){useHome.setState({notice:'进入小人漫游后，可到这里体验'});return;}const t=targets.find(t=>t.id===id)!;if(Math.hypot(walkMotion.x-t.x,walkMotion.z-t.z)>2.8){useHome.setState({notice:'走近体验标牌后再互动'});return;}stopToInteract();useHome.setState({selected:null});s.act({active:id});};
 useEffect(()=>{for(const t of targets)worldTargets.set('community-action-'+t.id,{point:()=>t,label:'体验 · '+t.name,activate:()=>open(t.id)});return()=>{for(const t of targets)worldTargets.delete('community-action-'+t.id);};},[targets]);
 return <group name="村庄公共生活与田园">
 {targets.map(t=><group key={t.id} position={[t.x,0,t.z]} onClick={e=>{if(e.delta>5)return;e.stopPropagation();open(t.id);}}><Cylinder p={[0,.045,0]} r={.55} h={.04} c="#c0aa70"/><Cylinder p={[.65,.22,0]} r={.1} h={.44} c="#a8a17b"/><Sphere p={[.65,.48,0]} s={[.12,.12,.12]} c="#dec586"/></group>)}
 {counter&&<StaticBatch revision={'shop-goods-'+s.stock}>{Array.from({length:s.stock},(_,i)=><Box key={i} p={[counter.x+(i%4-1.5)*.27,1.32,counter.z+(Math.floor(i/4)-.5)*.3]} s={[.22,.3,.24]} c={i%2?'#b89466':'#759d87'}/>)}</StaticBatch>}
 {s.exam&&homes[2]&&<ExamIndicator x={homes[2].layout.rooms[0].x+homes[2].layout.rooms[0].w*.65} z={homes[2].layout.rooms[0].z+homes[2].layout.rooms[0].d*.25}/>}
 {plots.map((r,index)=><group key={r.id} name={r.name}><VillageSign text={r.name} x={r.x+r.w/2} y={1.5} z={r.z+.5}/><StaticBatch revision={JSON.stringify([r,s.watered,s.harvested,s.picked])}>
 <Box p={[r.x+r.w/2,-.05,r.z+r.d/2]} s={[r.w,.08,r.d]} c={index?'#a1ac7b':'#b2a383'}/>
 <Box p={[r.x+r.w/2,.01,r.z+r.d/2]} s={[2,.08,r.d]} c="#c2b89c"/>
 {index===0?Array.from({length:8},(_,i)=>{const x=r.x+3+(i<4?i*4.5:i*4.5+5);return <group key={i}><Box p={[x,.025,r.z+r.d/2]} s={[3,.12,r.d-6]} c={s.watered?'#645540':'#92805d'}/>{Array.from({length:14},(_,j)=><group key={j} position={[x,.1,r.z+4+j*1.5]}>{!(s.harvested&&i===0)&&<><Sphere p={[0,.25,0]} s={[.38,.25,.38]} c={i%3===0?'#6a9153':i%3===1?'#8ca460':'#507b55'}/><Sphere p={[.2,.35,0]} s={[.22,.32,.16]} c="#72965d"/></>}</group>)}</group>;}):Array.from({length:24},(_,i)=>{const col=i%6,row=Math.floor(i/6),x=r.x+4+col*9+(col>2?1:0),z=r.z+6+row*6;return <group key={i}><Cylinder p={[x,1.1,z]} r={.12} h={2.2} c="#917851"/><Sphere p={[x,2.55,z]} s={[1.5,1.35,1.5]} c={i%2?'#809957':'#668453'}/>{[-1,1].filter(k=>!s.picked||i>4||k===1).map(k=><Sphere key={k} p={[x+k*.85,2.3,z+.9]} s={[.18,.18,.18]} c={i%2?'#c9994d':'#b25c49'}/>)}</group>;})}
 </StaticBatch></group>)}
 </group>;
}
