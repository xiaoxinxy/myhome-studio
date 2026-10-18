import {useRef} from 'react';
import {useFrame} from '@react-three/fiber';
import type {Group} from 'three';
import {Box,Cylinder,Sphere} from './Primitives';
import {StaticBatch} from './StaticBatch';
export const dogBreeds=['中华田园犬','黑背犬','柯基犬','奶油拉布拉多'] as const;
export function Dog({breed=0,phase=0,paused}:{breed?:number;phase?:number;paused?:()=>boolean}){const tail=useRef<Group>(null),legs=useRef<(Group|null)[]>([]);useFrame(()=>{const t=Date.now()*.006+phase;if(tail.current)tail.current.rotation.z=Math.sin(t*2)*.4;legs.current.forEach((g,i)=>{if(g)g.rotation.x=paused?.()?0:Math.sin(t+(i%3?0:Math.PI))*.22;});});const coat=['#ad885a','#5c5145','#c39558','#d3c4a2'][breed%4],short=breed===2,leg=short?.18:.36;return <group name={dogBreeds[breed%4]} scale={breed===1?1.13:1}>
 <StaticBatch revision={coat}><Sphere p={[0,leg+.17,0]} s={[.2,.24,short?.44:.39]} c={coat}/><Sphere p={[0,leg+.36,.4]} s={[.2,.2,.2]} c={coat}/><Sphere p={[0,leg+.28,.56]} s={[.13,.11,.15]} c={short?'#e5dfcf':coat}/><Sphere p={[0,leg+.31,.7]} s={[.045,.035,.035]} c="#323a37"/>
 {[-1,1].map(v=><group key={v}><Sphere p={[v*.095,leg+.4,.565]} s={[.022,.026,.013]} c="#2b3736"/>{breed===0||breed===1?<Box p={[v*.14,leg+.56,.36]} s={[.12,.22,.07]} rotation={[0,0,-v*.2]} c={breed===1?'#373a38':coat}/>:<Sphere p={[v*.18,leg+.33,.35]} s={[.07,.16,.08]} c={coat}/>}</group>)}
 {(breed===1||short)&&<Sphere p={[0,leg+.35,-.07]} s={[.17,.11,.32]} c={short?'#ebe5d4':'#353d39'}/>}<Box p={[0,leg+.27,.25]} s={[.34,.06,.06]} c="#7f5453"/>
 </StaticBatch>{[-1,1].flatMap((x,i)=>[-1,1].map((z,j)=><group key={i*2+j} ref={g=>{legs.current[i*2+j]=g;}} position={[x*.14,leg,z*.26]}><Cylinder p={[0,-leg/2,0]} r={.06} h={leg} c={coat}/><Sphere p={[0,-leg,.03]} s={[.075,.035,.11]} c={short?'#eee5d2':coat}/></group>))}<group ref={tail} position={[0,leg+.2,-.4]} rotation={[-.7,0,0]}><Cylinder p={[0,.17,0]} r={.045} h={.34} c={coat}/></group>
 </group>;}
