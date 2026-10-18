import {useRef,type ReactNode} from 'react';
import {useFrame} from '@react-three/fiber';
import type {Group} from 'three';
// Preserve live state/interaction registries; omit the whole distant district
// from both the color pass and cached shadow passes while touring the park.
export function VillageDistrict({children}:{children:ReactNode}){const root=useRef<Group>(null);useFrame(({camera})=>{if(root.current){const dx=Math.max(-110-camera.position.x,0,camera.position.x-130),dz=Math.max(-5-camera.position.z,0,camera.position.z-190);root.current.visible=Math.hypot(dx,dz)<240;}});return <group ref={root} name="村落区域 · 距离裁剪">{children}</group>;}
