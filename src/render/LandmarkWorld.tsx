import {useRef,useEffect,type ReactNode} from 'react';
import {useFrame} from '@react-three/fiber';
import * as THREE from 'three';
import {Box,Cylinder,Sphere} from './Primitives';
import {StaticBatch} from './StaticBatch';
import {solid,unitBox} from './materials';
import {Sign} from './Sign';
import {landmarks,outerRoads} from '../model/expedition';
import {useHome} from '../store';
import {worldTargets} from '../interactions';
import {useExploration} from '../exploration';
import {walkMotion} from '../walkState';

type V=[number,number,number];
function Beam({a,b,width=.65,color='#807366'}:{a:V;b:V;width?:number;color?:string}){const d=new THREE.Vector3(...b).sub(new THREE.Vector3(...a)),q=new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),d.clone().normalize());return <mesh geometry={unitBox} material={solid(color,.65,.4)} position={[(a[0]+b[0])/2,(a[1]+b[1])/2,(a[2]+b[2])/2]} scale={[width,d.length(),width]} quaternion={q}/>;}
function Detail({children,distance=420}:{children:ReactNode;distance?:number}){const ref=useRef<THREE.Group>(null),point=useRef(new THREE.Vector3());useFrame(s=>{if(ref.current){const p=ref.current.getWorldPosition(point.current);ref.current.visible=s.camera.position.distanceTo(p)<distance;}});return <group ref={ref} userData={{keepInteractive:true}}>{children}</group>;}
function Eiffel({detail=false}:{detail?:boolean}){const levels=[[0,56,8],[57,31,5],[115,19,3.5],[276,4,1.4],[300,2,.8]];return <>
 {!detail&&<> {[-1,1].flatMap(x=>[-1,1].map(z=><group key={x+':'+z}>{levels.slice(0,-1).map(([y,r,w],i)=>{const [ny,nr]=levels[i+1];return <Beam key={i} a={[x*r,y,z*r]} b={[x*nr,ny,z*nr]} width={w}/>;})}<Box p={[x*56,1,z*56]} s={[13,2,13]} c="#8c887b"/></group>))}
 {[57,115,276].map((y,i)=>{const r=[34,22,6][i];return <group key={y}>{[-1,1].flatMap(s=>[0,1].map(axis=><Box key={s+':'+axis} p={[axis?s*r:0,y,axis?0:s*r]} s={[axis?3:r*2,2.5,axis?r*2:3]} c="#88745f"/>))}</group>;})}
 <Beam a={[0,300,0]} b={[0,330,0]} width={.8}/><Box p={[0,291,0]} s={[6,8,6]} c="#8c7c68"/></>}
 {detail&&levels.slice(0,-1).map(([y,r],i)=>{const [ny,nr]=levels[i+1],count=Math.ceil((ny-y)/9);return Array.from({length:count},(_,j)=>{const y0=y+(ny-y)*j/count,y1=y+(ny-y)*(j+1)/count,r0=r+(nr-r)*j/count,r1=r+(nr-r)*(j+1)/count;return [-1,1].flatMap(s=>[0,1].map(axis=><group key={i+':'+j+':'+s+':'+axis}>
 <Beam a={axis?[s*r0,y0,-r0]:[-r0,y0,s*r0]} b={axis?[s*r1,y1,r1]:[r1,y1,s*r1]} width={i===0?1:.48}/>
 <Beam a={axis?[s*r0,y0,r0]:[r0,y0,s*r0]} b={axis?[s*r1,y1,-r1]:[-r1,y1,s*r1]} width={i===0?1:.48}/>
 </group>));});})}
 </>;}
function Pisa(){return <group rotation={[0,0,-.069]}>
 <Cylinder p={[0,2,0]} r={7.7} h={4} c="#d9d3bf"/>
 {Array.from({length:7},(_,level)=><group key={level} position={[0,4+level*7.05,0]}><Cylinder p={[0,3.25,0]} r={level===6?5.8:6.2} h={6.5} c="#b5ae99"/>{[0,6.5].map(y=><Cylinder key={y} p={[0,y,0]} r={level===6?6.8:7.6} h={.38} c="#e7e1cf"/>)}<Detail distance={260}><StaticBatch revision={'pisa'+level}>{Array.from({length:24},(_,i)=>{const a=i/24*Math.PI*2;return <group key={i} position={[Math.sin(a)*6.95,0,Math.cos(a)*6.95]}><Cylinder p={[0,3.15,0]} r={.22} h={6.2} c="#eee8d6"/><Sphere p={[0,6.05,0]} s={[.37,.32,.37]} c="#eee8d6"/></group>;})}</StaticBatch></Detail></group>)}
 <Cylinder p={[0,56,0]} r={6.5} h={1.8} c="#ded9c7"/><Cylinder p={[0,57.75,0]} r={3.4} h={1.22} c="#d1c9af"/>
 </group>;}
function Louvre(){return <>
 <Box p={[0,-.035,0]} s={[390,.05,280]} c="#bcb6a4"/>
 {[-1,1].map(s=><group key={s}><Box p={[s*160,13,0]} s={[10,26,220]} c="#c4b49a"/><Box p={[s*160,27,0]} s={[14,4,224]} c="#626b6e"/><Box p={[s*94,12,105]} s={[132,24,8]} c="#cbbb9f"/><Box p={[s*94,25,105]} s={[136,3,12]} c="#627178"/></group>)}
 <Box p={[0,13,-105]} s={[330,26,12]} c="#caba9d"/><Box p={[0,27,-105]} s={[334,4,16]} c="#66737a"/>
 <mesh position={[0,10.5,24]} rotation={[0,Math.PI/4,0]}><coneGeometry args={[34/Math.sqrt(2),21,4]}/><meshStandardMaterial color="#7cb6ba" metalness={.42} roughness={.22} transparent opacity={.65} side={THREE.DoubleSide}/></mesh>
 <Detail distance={420}><StaticBatch revision="louvre-detail">{Array.from({length:39},(_,i)=>[-1,1].flatMap(s=>[5,13,21].map(y=><group key={i+':'+s+':'+y}><Box p={[-152+i*8,y,-98.9]} s={[2.6,4,.15]} c="#47616c"/>{[-1,1].map(q=><Box key={q} p={[-152+i*8+q*1.6,y,-98.7]} s={[.35,4.7,.4]} c="#e1cfac"/>)}</group>)))}
 {[-1,1].flatMap(s=>Array.from({length:25},(_,i)=>[5,13,21].map(y=><Box key={s+':'+i+':'+y} p={[s*154.9,y,-96+i*8]} s={[.16,4,2.5]} c="#4c6266"/>)))}
 {Array.from({length:11},(_,i)=><group key={i}><Box p={[-15+i*3,1,54]} s={[1.4,2,.35]} c="#b6ad8c"/><Beam a={[-17+i*3,0,24]} b={[0,21,24]} width={.09} color="#c3d0c6"/></group>)}
 </StaticBatch></Detail>
 {/* Gallery doors and interiors are intentionally separate from the palace mass. */}
 {[-1,1].map(s=><group key={'gallery'+s}><Box p={[s*94,.08,94]} s={[132,.16,14]} c="#c9b997"/><Box p={[s*94,6,88]} s={[132,.3,14]} c="#e4ddc8"/>{Array.from({length:8},(_,i)=><group key={i}><Box p={[s*(34+i*15),2.4,100.8]} s={[5,3,.15]} c="#7d674e"/><Box p={[s*(34+i*15),2.4,100.69]} s={[4.5,2.5,.06]} c={['#779181','#b48d65','#71899d','#b49e87'][i%4]}/><Box p={[s*(34+i*15),.45,93]} s={[3,.15,.7]} c="#8d7357"/></group>)}</group>)}
 </>;}
function Tiananmen(){let cursor=-41.5;const piers:ReactNode[]=[];for(const c of [-28,-14,0,14,28]){const edge=c-3.2;piers.push(<Box key={c} p={[(cursor+edge)/2,5.5,0]} s={[edge-cursor,11,42]} c="#a45343"/>);cursor=c+3.2;}return <>
 {piers}<Box p={[(cursor+41.5)/2,5.5,0]} s={[41.5-cursor,11,42]} c="#a45343"/><Box p={[0,11,0]} s={[83,2,42]} c="#a45343"/>
 {[-28,-14,0,14,28].map(x=><Box key={x} p={[x,9,0]} s={[6.4,4,42]} c="#a45343"/>)}
 <Box p={[0,18,0]} s={[66,12,27]} c="#a64b37"/>
 {[14,25].map((y,k)=><group key={y}>{Array.from({length:8},(_,i)=><Box key={i} p={[0,y+i*.75,0]} s={[76-i*2,.85,37-i*2]} c={i%2?'#b99039':'#c7a04d'}/>)}<Box p={[0,y+5.9,0]} s={[64,.7,1.2]} c="#dec16a"/>{[-1,1].map(s=><Sphere key={s} p={[s*37,y+.6,0]} s={[3,.9,18]} c="#c5a14e"/>)}</group>)}
 <Detail><StaticBatch revision="gate-details">{Array.from({length:10},(_,i)=><group key={i}><Cylinder p={[-30+i*6.65,20,13.8]} r={.42} h={8} c="#a94130"/><Box p={[-30+i*6.65,19,13.56]} s={[4.8,5,.25]} c="#544c3d"/>{[17,19,21].map(y=><Box key={y} p={[-30+i*6.65,y,13.8]} s={[4.8,.1,.1]} c="#c7b073"/>)}</group>)}{Array.from({length:42},(_,i)=><Box key={i} p={[-40+i*1.95,13,21]} s={[.8,1.5,.8]} c="#e0d5bc"/>)}<Box p={[0,8.1,21.05]} s={[3.3,3.7,.1]} c="#d2b287"/></StaticBatch></Detail>
 </>;}
export function LandmarkWorld(){useEffect(()=>{for(const l of landmarks)worldTargets.set('landmark-'+l.id,{point:()=>l.arrival,label:'打卡 · '+l.name,activate:()=>{if(Math.hypot(walkMotion.x-l.arrival.x,walkMotion.z-l.arrival.z)>4)return;useExploration.getState().visit(l.id);useHome.setState({notice:l.description+' · 已收入旅行手册'});}});return()=>{for(const l of landmarks)worldTargets.delete('landmark-'+l.id);};},[]);const lit=useHome(s=>s.time<6||s.time>18);return <group name="世界地标公园 · 米制外观雏形">
 <StaticBatch revision="outer-roads-v1">{outerRoads().map(r=>{const horizontal=r.az===r.bz,length=Math.hypot(r.bx-r.ax,r.bz-r.az);return <group key={r.id}><Box p={[(r.ax+r.bx)/2,-.07,(r.az+r.bz)/2]} s={[horizontal?length:r.width,.12,horizontal?r.width:length]} c="#687274" shadow={false}/>{Array.from({length:Math.floor(length/35)},(_,i)=>{const t=(i+.5)/Math.floor(length/35);return <Box key={i} p={[r.ax+(r.bx-r.ax)*t,.001,r.az+(r.bz-r.az)*t]} s={[horizontal?5:.14,.014,horizontal?.14:5]} c="#ddd3ad" shadow={false}/>;})}</group>;})}</StaticBatch>
 {landmarks.map(l=><group key={l.id} position={[l.x,0,l.z]} name={l.name}>
 <StaticBatch revision={l.id+'base'}><Box p={[0,-.04,0]} s={[l.w+60,.06,l.d+60]} c={l.id==='pyramid'?'#c9b28b':'#aeb5a2'} shadow={false}/>
 {l.id==='pyramid'&&Array.from({length:100},(_,i)=><Box key={i} p={[0,(i+.5)*1.465,0]} s={[230*(1-i/100),1.465,230*(1-i/100)]} c={i%3?'#c9b28b':'#bfa47d'}/>)}
 {l.id==='eiffel'&&<Eiffel/>}{l.id==='tiananmen'&&<group scale={[1,34.7/30.675,1]}><Tiananmen/></group>}
 </StaticBatch>
 {l.id==='eiffel'&&<Detail distance={650}><StaticBatch revision="eiffel-lattice"><Eiffel detail/></StaticBatch></Detail>}
 {l.id==='pisa'&&<StaticBatch revision="pisa"><Pisa/></StaticBatch>}{l.id==='louvre'&&<StaticBatch revision="louvre"><Louvre/></StaticBatch>}
 <Sign text={l.name+' · 外观雏形'} x={0} y={2.3} z={l.d/2+23} w={9} h={1.2}/>
 <StaticBatch revision={'approach-'+l.id}>{[-1,1].map(s=><Cylinder key={s} p={[s*4,1.1,l.d/2+23]} r={.09} h={2.2} c="#655d4d"/>)}<Box p={[0,-.012,(l.d/2+(l.z>1000?1340:830)-l.z)/2]} s={[12,.02,Math.abs((l.z>1000?1340:830)-l.z-l.d/2)]} c="#b4af9b" shadow={false}/></StaticBatch>
 </group>)}
 <StaticBatch revision={'outer-gardens-'+lit}>{Array.from({length:45},(_,i)=><group key={i} position={[-680+i%15*142,0,370+Math.floor(i/15)*510]}><Cylinder p={[0,2.5,0]} r={.23} h={5} c="#807255"/><Sphere p={[0,5.5,0]} s={[2.5,3.3,2.5]} c={i%2?'#6b8960':'#7b9562'}/></group>)}</StaticBatch>
 </group>;}
