import {useEffect,useRef} from 'react';
import {useFrame} from '@react-three/fiber';
import type {Group} from 'three';
import {buses,busStops,advanceBus,stopArrival,type BusRuntime} from '../model/transit';
import {trafficActors} from '../model/traffic';
import {useTourism} from '../tourism';
import {worldTargets} from '../interactions';
import {useHome} from '../store';
import {Box,Cylinder,Sphere} from './Primitives';
import {MovingBatch} from './MovingBatch';
import {StaticBatch} from './StaticBatch';
import {Human,humanLook} from './Human';
import {Sign} from './Sign';
import {glass,solid} from './materials';
function BusActor({bus:b,index}:{bus:BusRuntime;index:number}){const root=useRef<Group>(null),door=useRef<Group>(null),collider=useRef({id:b.id,x:b.x,z:b.z,yaw:b.yaw,w:2.55,d:10.2,height:3.3,kind:'van' as const,distance:0,route:[],speed:0,pausedUntil:0,claimed:true});useEffect(()=>{trafficActors.set(b.id,collider.current);return()=>{trafficActors.delete(b.id);};},[b]);
 useFrame(({camera},dt)=>{advanceBus(b,dt);Object.assign(collider.current,{x:b.x,z:b.z,yaw:b.yaw});if(root.current){root.current.position.set(b.x,0,b.z);root.current.rotation.y=b.yaw;root.current.visible=Math.hypot(camera.position.x-b.x,camera.position.z-b.z)<240;}if(door.current)door.current.position.z=b.pause>0?2.4:3.4;const s=useTourism.getState();if(s.riding===b.id&&b.pause>0&&b.lastStop===s.destination)s.alight();},-2);
 const color=index?'#8b9d82':'#648e96';return <group ref={root} position={[b.x,0,b.z]} userData={{trafficId:b.id,cullRadius:9}} name={'村庄旅游大巴 '+(index+1)}>
 <StaticBatch revision={'bus-'+index}><Box p={[0,.75,0]} s={[2.5,1.05,10]} m={solid(color,.4,.35)}/><Box p={[0,3.12,0]} s={[2.55,.18,10.1]} c="#d0d2bd"/><Box p={[0,1.03,0]} s={[2.3,.1,9.6]} c="#847c68"/>
 {[-1,1].map(s=><group key={s}><Box p={[s*1.25,2.15,0]} s={[.035,1.45,9.8]} m={glass}/>{[-4.7,-3.2,-1.6,0,1.6,3.2,4.7].map(z=><Box key={z} p={[s*1.25,2.25,z]} s={[.08,1.65,.09]} c={color}/>)}<Box p={[s*1.2,1.44,0]} s={[.1,.12,10]} c="#e6e1c9"/>{[-3.25,3.1].map(z=><group key={z} position={[s*1.18,.5,z]} rotation={[0,0,Math.PI/2]}><Cylinder p={[0,0,0]} r={.48} h={.22} c="#353d3a"/><Cylinder p={[0,0,0]} r={.29} h={.23} c="#aab1a4"/></group>)}<Box p={[s*1.42,2.2,4.1]} s={[.2,.65,.3]} c="#506660"/></group>)}
 <Box p={[0,2.28,5.02]} s={[2.3,1.32,.04]} m={glass}/><Box p={[0,.75,5.06]} s={[2.38,.38,.12]} c="#d2d3bd"/>{[-1,1].map(s=><Sphere key={s} p={[s*.85,.83,5.14]} s={[.25,.12,.04]} c="#e5e6c6"/>)}<Box p={[0,1.1,-5.04]} s={[2.4,1.5,.08]} c={color}/><Box p={[0,2.35,-5.06]} s={[2.1,.8,.06]} m={glass}/>
 {Array.from({length:6},(_,i)=>[-1,1].map(s=><group key={i+':'+s}><Box p={[s*.7,1.42,-3.8+i*1.22]} s={[.65,.16,.7]} c="#647666"/><Box p={[s*.7,1.85,-4+i*1.22]} s={[.65,.85,.13]} c="#647666"/></group>))}
 </StaticBatch><Sign text="村庄 · 五景区旅游环线" x={0} y={2.99} z={5.04} w={2.1} h={.23} bg="#354e49" color="#e4d99b"/>
 <group ref={door} position={[1.28,0,3.4]}><Box p={[0,2.1,0]} s={[.04,1.9,1.2]} m={solid('#a6bab0',.35,.5)}/><Box p={[.04,2.1,0]} s={[.05,1.6,.04]} c="#e1dbc7"/></group>
 {[0,1,2,3].map(i=><group key={i} position={[i%2?.7:-.7,.86,-3+Math.floor(i/2)*2.4]} rotation={[0,Math.PI,0]} scale={.9}><Human look={humanLook(i+41)} motion={()=>({pose:'sit',phase:i})}/></group>)}<group position={[-.7,.85,3.9]} rotation={[0,Math.PI,0]} scale={.9}><Human look={{...humanLook(31),coat:'#647588'}} motion={()=>({pose:'sit',phase:0})}/></group>
 </group>;}
export function TourBuses(){useEffect(()=>{for(const s of busStops){const p=stopArrival(s.id);worldTargets.set('bus-stop-'+s.id,{point:()=>p,label:'候车 / 乘大巴 · '+s.name,activate:()=>useTourism.getState().open('bus-'+s.id)});}return()=>{for(const s of busStops)worldTargets.delete('bus-stop-'+s.id);};},[]);return <group name="有停靠站与乘客的旅游大巴"><MovingBatch>{buses.map((b,i)=><BusActor key={b.id} bus={b} index={i}/>)}</MovingBatch><StaticBatch revision="bus-stations-12">{busStops.map(s=>{const p=stopArrival(s.id);return <group key={s.id} position={[p.x,0,p.z]}><Box p={[0,.1,-.6]} s={[9,.2,2]} c="#c0bda5"/><Box p={[0,2.7,-.6]} s={[9,.12,2.4]} c="#78928b"/>{[-1,1].map(q=><Cylinder key={q} p={[q*4,1.4,-1.4]} r={.06} h={2.8} c="#637c73"/>)}<Box p={[0,.45,-.8]} s={[5,.15,.6]} c="#8b795b"/><Sign text={s.name+' · 旅游环线'} x={0} y={2.3} z={-.5} w={7} h={.5}/><Sign text="村口 → 铁塔 → 斜塔 → 城楼 → 卢浮宫 → 金字塔" x={0} y={1.7} z={-1.35} w={7} h={.3}/></group>;})}</StaticBatch></group>;}
