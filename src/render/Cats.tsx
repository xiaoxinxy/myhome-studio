import {StaticBatch} from './StaticBatch';
import * as THREE from 'three';
const earGeometry=new THREE.ConeGeometry(.075,.15,3);
import {useRef} from 'react';
import {useFrame} from '@react-three/fiber';
import type {Group} from 'three';
import {Box,Sphere,Cylinder} from './Primitives';

export const catBreeds=['玄猫','橘色狸花','三花猫','暹罗猫','蓝白猫'] as const;
export function Cat({blue=false,moving=true,phase=0,breed=0,paused}:{blue?:boolean;moving?:boolean;phase?:number;breed?:number;paused?:()=>boolean}){
 const root=useRef<Group>(null),tail=useRef<Group>(null),head=useRef<Group>(null),legs=useRef<(Group|null)[]>([]),time=useRef(phase+(blue?2:0));
 const coat=blue||breed===4?'#8896a5':breed===1?'#c29156':breed===2?'#e0d5bd':breed===3?'#d1bca0':'#262c2c',white='#eeeae1',face=breed===3?'#594c42':coat;
 useFrame((_,delta)=>{if(!moving||!root.current)return;if(paused?.()){legs.current.forEach(g=>{if(g)g.rotation.x=0;});return;}time.current+=Math.min(delta,.05);const t=time.current,walking=t%15<10,a=t*.55;
  if(walking){root.current.position.set(Math.sin(a)*.32,Math.sin(t*7)*.007,Math.cos(a)*.3);root.current.rotation.y=Math.atan2(Math.cos(a)*.32,-Math.sin(a)*.3);}
  legs.current.forEach((leg,i)=>{if(leg)leg.rotation.x=walking?Math.sin(t*7+(i===0||i===3?0:Math.PI))*.34:0;});
  if(tail.current)tail.current.rotation.z=Math.sin(t*1.8)*.18;if(head.current)head.current.rotation.y=walking?Math.sin(t*.8)*.08:Math.sin(t*1.4)*.24;
 });
 return <group ref={root} name={blue?'cat-motion-bluewhite':'cat-motion-black'} scale={blue?.8:1}>
  <StaticBatch revision={coat}><Sphere p={[0,.31,0]} s={[.145,.16,.3]} c={coat}/>{(blue||breed===4)&&<Sphere p={[0,.26,.12]} s={[.13,.115,.17]} c={white}/>} {breed===1&&[-.18,-.06,.06,.18].flatMap(z=>[-1,1].map(x=><Box key={z+':'+x} p={[x*.137,.36,z]} s={[.018,.12,.035]} rotation={[0,0,x*.2]} c="#855f37"/>))}{breed===2&&[-1,1].map(x=><Sphere key={x} p={[x*.12,.37,x*.12]} s={[.04,.11,.13]} c={x>0?'#ae7950':'#3e4241'}/>)}</StaticBatch>
  <group ref={head} position={[0,.45,.27]}><StaticBatch revision={coat}><Sphere p={[0,0,0]} s={[.16,.145,.14]} c={face}/>{[-1,1].map(side=><group key={side}><mesh position={[side*.095,.13,-.015]} rotation={[0,0,-side*.16]} geometry={earGeometry} castShadow><meshStandardMaterial color={face}/></mesh><Sphere p={[side*.065,.012,.121]} s={[.035,.042,.014]} c={blue?'#b7b263':'#b6ba76'}/><Sphere p={[side*.065,.012,.135]} s={[.009,.03,.005]} c="#17231f"/><Sphere p={[side*.045,-.052,.13]} s={[.055,.038,.035]} c={blue?white:'#4e5351'}/>{[-1,1].map(sign=><Box key={sign} p={[side*.14,-.04+sign*.015,.13]} s={[.15,.003,.003]} rotation={[0,0,side*sign*.13]} c="#b8b9ae" shadow={false}/>)}</group>)}{blue&&<Sphere p={[0,.01,.126]} s={[.027,.075,.02]} c={white}/>}<Sphere p={[0,-.035,.165]} s={[.018,.013,.012]} c="#c69999"/></StaticBatch></group>
  {[-1,1].flatMap((x,i)=>[-1,1].map((z,j)=><group key={i*2+j} ref={node=>{legs.current[i*2+j]=node;}} position={[x*.095,.25,z*.19]}><Cylinder p={[0,-.10,0]} r={.035} h={.2} c={coat}/><Sphere p={[0,-.205,.025]} s={[.049,.035,.07]} c={blue?white:coat}/></group>))}
  <group ref={tail} position={[0,.35,-.27]} rotation={[-.5,0,0]}><StaticBatch revision={coat}><Cylinder p={[0,.17,0]} r={.035} h={.34} c={coat}/><group position={[0,.32,0]} rotation={[0,0,-.45]}><Cylinder p={[0,.07,0]} r={.032} h={.14} c={coat}/></group></StaticBatch></group>
 </group>;
}
