import {useMemo,useRef} from 'react';
import {useFrame} from '@react-three/fiber';
import type {Group} from 'three';
import type {Plan} from '../model/types';
import {buildLayout} from '../model/layout';
import {village} from '../model/village';
import {StaticBatch} from './StaticBatch';
import {Box} from './Primitives';
// Cheap building silhouettes keep the village visible from mountain lookouts.
// Full interiors and furnishings remain culled at that distance.
export function VillageHorizon({plan}:{plan:Plan}){const root=useRef<Group>(null),buildings=useMemo(()=>[...buildLayout(plan.dimensions).buildings,...village(plan.dimensions).flatMap(h=>h.layout.buildings)],[plan.dimensions]);
 useFrame(({camera})=>{if(root.current){const dx=Math.max(-110-camera.position.x,0,camera.position.x-130),dz=Math.max(-5-camera.position.z,0,camera.position.z-190);root.current.visible=Math.hypot(dx,dz)>=240;}});
 return <group ref={root} name="山顶远眺的村庄轮廓"><StaticBatch revision="village-horizon">{buildings.map((b,i)=><group key={i}><Box p={[b.x+b.w/2,b.base+b.height/2,b.z+b.d/2]} s={[b.w,b.height,b.d]} c={i%3?'#c4c5b5':'#d4c8b0'}/><Box p={[b.x+b.w/2,b.base+b.height+.15,b.z+b.d/2]} s={[b.w+.3,.3,b.d+.3]} c={i%3?'#90765e':'#617f83'}/></group>)}</StaticBatch></group>;
}
