import {useRef} from 'react';
import {useFrame,useThree} from '@react-three/fiber';
import type {Fog} from 'three';
import {fogRange,type Weather} from '../model/environment';
import type {Dimensions} from '../model/types';

export function AtmosphericFog({color,weather,d}:{color:string;weather:Weather;d:Dimensions}){const ref=useRef<Fog>(null),camera=useThree(s=>s.camera);useFrame(()=>{if(!ref.current)return;const p=camera.position,distance=Math.hypot(p.x-d.width/2,p.y,p.z-d.depth*.5),range=fogRange(distance,Math.max(d.width,d.depth),weather);const outer=p.z>210||p.x>135||p.x< -110;ref.current.near=weather==='fog'?35:weather==='rain'||weather==='snow'?180:260;ref.current.far=weather==='fog'?300:weather==='rain'||weather==='snow'?1100:2300;});return <fog ref={ref} attach="fog" args={[color,40,180]}/>;}
