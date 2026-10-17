import {useRef} from 'react';
import {useFrame,useThree} from '@react-three/fiber';
import type {Fog} from 'three';
import {fogRange,type Weather} from '../model/environment';
import type {Dimensions} from '../model/types';

export function AtmosphericFog({color,weather,d}:{color:string;weather:Weather;d:Dimensions}){const ref=useRef<Fog>(null),camera=useThree(s=>s.camera);useFrame(()=>{if(!ref.current)return;const p=camera.position,distance=Math.hypot(p.x-d.width/2,p.y,p.z-d.depth*.5),range=fogRange(distance,Math.max(d.width,d.depth),weather);ref.current.near=range.near;ref.current.far=range.far;});return <fog ref={ref} attach="fog" args={[color,40,180]}/>;}
