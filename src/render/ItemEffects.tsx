import {useRef,type ReactNode} from 'react';
import {useFrame} from '@react-three/fiber';
import * as THREE from 'three';
import {useInteractions} from '../interactions';
import {useHome} from '../store';
import {environmentAt} from '../model/environment';
import type {PlacedItem} from '../model/types';
import {Sphere,Box} from './Primitives';
import {glow} from './materials';

export function ItemEffects({item,children}:{item:PlacedItem;children:ReactNode}){
 const root=useRef<THREE.Group>(null),drops=useRef<THREE.Group>(null),heart=useRef<THREE.Group>(null),state=useInteractions(s=>s.items[item.id]),time=useHome(s=>s.time),weather=useHome(s=>s.weather),lamps=useHome(s=>s.lights);
 useFrame(()=>{const now=Date.now();if(root.current&&(state?.shakeUntil||root.current.rotation.z!==0))root.current.rotation.z=state?.shakeUntil&&now<state.shakeUntil?Math.sin(now*.018)*.028:0;if(drops.current){drops.current.visible=!!state?.waterUntil&&now<state.waterUntil;drops.current.position.y=((now%800)/800)*-.6;}if(heart.current){heart.current.visible=!!state?.petUntil&&now<state.petUntil;heart.current.position.y=.8+Math.sin(now*.003)*.07;}});
 const vehicle=['car','trike','ebike'].includes(item.type),light=state?.lights??(vehicle&&lamps&&environmentAt(time,weather).lamps);
 return <group><group ref={root}>{children}</group>{vehicle&&light&&[-1,1].map(side=><Box key={side} p={[side*(item.type==='car'?.65:.18),.55,(item.type==='car'?2.12:.85)]} s={[.2,.1,.06]} m={glow} shadow={false}/>)}{state?.waterUntil&&<group ref={drops} visible={false}>{Array.from({length:7},(_,i)=><Sphere key={i} p={[Math.sin(i)*.4,1+i*.07,Math.cos(i)*.4]} s={[.025,.06,.025]} c="#7cbad0"/>)}</group>}{state?.petUntil&&<group ref={heart} visible={false}><Sphere p={[-.05,0,0]} s={[.07,.08,.035]} c="#c78378"/><Sphere p={[.05,0,0]} s={[.07,.08,.035]} c="#c78378"/><Box p={[0,-.05,0]} s={[.1,.1,.025]} rotation={[0,0,Math.PI/4]} c="#c78378"/></group>}</group>;
}
