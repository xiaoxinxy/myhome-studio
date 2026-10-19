import {walkMotion} from '../walkState';
import {useRef,useState,useEffect} from 'react';
import {useFrame} from '@react-three/fiber';
import * as THREE from 'three';
import {Box,Cylinder,Sphere} from './Primitives';
import {Cat,catBreeds} from './Cats';
import {Dog,dogBreeds} from './Dogs';
import {hitPerson} from '../interactions';
import {reactions} from '../model/encounters';
import {StaticBatch} from './StaticBatch';
import {neighborhood,type Neighbor} from '../model/neighborhood';
import {useHome} from '../store';
import {environmentAt} from '../model/environment';
import {playTone,worldTargets} from '../interactions';
import type {Dimensions} from '../model/types';

function StreetAnimal({x,z,dog=false,phase=0,breed=0}:{x:number;z:number;dog?:boolean;phase?:number;breed?:number}){
 const root=useRef<THREE.Group>(null),timer=useRef(phase),pause=useRef(0);
 useFrame((_,delta)=>{if(!root.current)return;const s=useHome.getState(),night=environmentAt(s.time,s.weather).night,bad=s.weather==='rain'||s.weather==='snow';timer.current+=Date.now()<pause.current||night||bad?0:Math.min(delta,.06)*.18;const t=timer.current;root.current.position.set(x+(bad?0:Math.sin(t)*2.2),0,z+(bad?0:Math.cos(t)*.35));root.current.rotation.y=Math.cos(t)>0?Math.PI/2:-Math.PI/2;root.current.visible=true;});
 const pet=()=>{if(useHome.getState().walking&&root.current&&Math.hypot(walkMotion.x-root.current.position.x,walkMotion.z-root.current.position.z)<2.8){walkMotion.crouchUntil=Date.now()+3200;walkMotion.bodyYaw=walkMotion.yaw=Math.atan2(walkMotion.x-root.current.position.x,walkMotion.z-root.current.position.z);}pause.current=Date.now()+2500;playTone(dog?'dog':'cat');useHome.setState({notice:dog?'小狗停下来摇了摇尾巴':'小猫回应了你，停下来张望'});};useEffect(()=>{const id='animal-'+x+'-'+z;worldTargets.set(id,{point:()=>root.current?.position||{x,z},label:'摸摸 · '+(dog?dogBreeds[breed%4]:catBreeds[breed%5]),activate:pet});return()=>{worldTargets.delete(id);};},[x,z,dog]);
 return <group ref={root} position={[x,0,z]} name={dog?'街边小狗':'街边小猫'} onClick={e=>{if(e.delta>5)return;e.stopPropagation();pet();}}>{dog?<Dog breed={breed} phase={phase} paused={()=>Date.now()<pause.current}/>:<Cat breed={breed} phase={phase} paused={()=>Date.now()<pause.current}/>}</group>;
}
function RoadTree({x,z}:{x:number;z:number}){
 const root=useRef<THREE.Group>(null),[until,setUntil]=useState(0);useFrame(()=>{if(root.current)root.current.rotation.z=Date.now()<until?Math.sin(Date.now()*.016)*.03:0;});
 const shake=()=>{setUntil(Date.now()+1600);useHome.setState({notice:'树叶轻轻晃动'});};useEffect(()=>{const id='tree-'+x+'-'+z;worldTargets.set(id,{point:()=>({x,z}),label:'摇摇路边树',activate:shake});return()=>{worldTargets.delete(id);};},[x,z]);
 return <group position={[x,0,z]} onClick={e=>{if(e.delta>5)return;e.stopPropagation();shake();}}><StaticBatch revision="pit"><Box p={[0,.1,0]} s={[1.2,.2,1.2]} c="#7d8e86"/><Box p={[0,.21,0]} s={[1,.03,1]} c="#888362"/></StaticBatch><group ref={root}><StaticBatch revision="canopy"><Cylinder p={[0,1.5,0]} r={.1} h={3} c="#8b7756"/>{[0,1,2,3,4].map(i=><Sphere key={i} p={[Math.sin(i*2)*.45,2.9+(i%2)*.5,Math.cos(i*2)*.45]} s={[.8,1,.8]} c={i%2?'#859c6f':'#708a65'}/>)}</StaticBatch></group></group>;
}
export function NeighborhoodLife({d}:{d:Dimensions}){return <group name="邻里生活"><>{[-70,-29,3,d.width-3,d.width+28,d.width+68].map((x,i)=><StreetAnimal key={x} x={x} z={d.depth+1.9} dog={i%2===0} phase={i*1.4} breed={Math.floor(i/2)}/>)}{[-48,5,d.width+15,80].map((x,i)=><StreetAnimal key={'back-'+i} x={x} z={d.depth+63.9} dog={i%2===0} phase={i+3} breed={3+Math.floor(i/2)}/>)}{Array.from({length:12},(_,i)=>-78+i*16).map(x=><RoadTree key={x} x={x} z={d.depth+12.9}/>)}{Array.from({length:12},(_,i)=>-78+i*16).map(x=><RoadTree key={'back-tree-'+x} x={x} z={d.depth+74.9}/>)}<StaticBatch revision="street-clutter">{[-70,-29,d.width+28,d.width+68].map((x,i)=><group key={x}><Box p={[x,2.3,d.depth+12.1]} s={[3,.12,1.8]} c="#879991"/>{[-1,1].map(v=><Cylinder key={v} p={[x+v*1.35,1.1,d.depth+12.7]} r={.045} h={2.2} c="#778d7f"/>)}<Box p={[x,.2,d.depth+12]} s={[.7,.4,.55]} c="#aa9478"/><Cylinder p={[x+1,.42,d.depth+12.1]} r={.3} h={.84} c={i%2?'#7f9a87':'#839a9e'}/>{[0,1,2].map(k=><Box key={k} p={[x+.2,.06+k*.08,d.depth+13]} s={[1.1,.07,.4]} c="#b0a083"/>)}<Sphere p={[x-1,.23,d.depth+12.3]} s={[.3,.23,.35]} c="#a7a28d"/></group>)}</StaticBatch></></group>;}
