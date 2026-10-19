import {outerRoads} from '../model/expedition';
import {useRef,useMemo,type ReactNode} from 'react';
import {useFrame} from '@react-three/fiber';
import * as THREE from 'three';
import {village} from '../model/village';
import {facilities,facilityItems,plaza,type Facility} from '../model/facilities';
import {farmPatches,hills,hillGrid,hillSample} from '../model/countryside';
import {catalog} from '../model/catalog';
import {Box,Cylinder,Sphere} from './Primitives';
import {StaticBatch} from './StaticBatch';
import {UsableFurniture,VehicleOffset} from './UsableFurniture';
import {surface,solid} from './materials';
import {Sign} from './Sign';
import {useHome} from '../store';
function FacilityBuilding({f}:{f:Facility}){const interior=useRef<THREE.Group>(null);useFrame(({camera})=>{if(interior.current)interior.current.visible=Math.hypot(Math.max(f.x-camera.position.x,0,camera.position.x-f.x-f.w),Math.max(f.z-camera.position.z,0,camera.position.z-f.z-f.d))<2.5;});const mid=f.x+f.w/2,front=f.z+f.d;return <group name={f.name}>
 <StaticBatch revision={f.id}><Box p={[mid,0,f.z+f.d/2]} s={[f.w+.8,.16,f.d+.8]} m={surface('tile','#bbb4a0',f.w,f.d)}/><Box p={[mid,1.7,f.z]} s={[f.w,3.25,.2]} m={surface('brick',f.color,f.w,3.25)}/>{[-1,1].map(s=><Box key={s} p={[mid+s*f.w/2,1.7,f.z+f.d/2]} s={[.2,3.25,f.d]} m={surface('brick',f.color,f.d,3.25)}/>)}
 {[-1,1].map(s=><group key={s}><Box p={[mid+s*(f.w/4+.55),.45,front]} s={[(f.w-2.2)/2,.74,.18]} m={surface('brick',f.color,f.w/2,.8)}/><Box p={[mid+s*(f.w/4+.55),2,front]} s={[(f.w-2.2)/2,2.3,.035]} m={solid('#9cb6b2',.3,.3)}/>{Array.from({length:Math.max(1,Math.floor(f.w/4))},(_,i)=><Box key={i} p={[f.x+1.1+i*3.7,1.95,front+.045]} s={[.055,2.2,.055]} c="#e0ddce"/>)}</group>)}
 <Box p={[mid,3.07,front]} s={[f.w,.42,.2]} c={f.color}/><Box p={[mid,3.29,f.z+f.d/2]} s={[f.w,.12,f.d]} c="#e3dfce"/>
 {[-1,1].map(s=><Box key={'roof'+s} p={[mid,3.6,f.z+f.d/2+s*f.d/4]} s={[f.w+1,.1,Math.hypot(f.d/2,.7)]} rotation={[s*Math.atan2(.7,f.d/2),0,0]} m={surface('metal',f.roof,f.w,f.d/2)}/>)}
 <Box p={[mid,2.9,front+1]} s={[f.w+.4,.16,2.2]} c={f.roof}/>{[-1,1].map(s=><Cylinder key={s} p={[mid+s*(f.w/2-.1),1.45,front+1.6]} r={.07} h={2.9} c="#6b786c"/>)}
 {f.kind==='school'&&<><Box p={[mid,1.8,f.z+.14]} s={[7,1.4,.05]} c="#34574c"/><Cylinder p={[f.x+f.w+4,4,front]} r={.06} h={8} c="#a6b4ad"/><Box p={[f.x+f.w+4.8,7.3,front]} s={[1.6,1,.025]} c="#b14b3b"/></>}
 {f.kind==='repair'&&<><Box p={[mid,.85,f.z+2]} s={[6,.12,1]} c="#718579"/>{[0,1,2,3,4].map(i=><Box key={i} p={[mid-2+i,.8,f.z+.18]} s={[.12,.5,.1]} c="#707c78"/>)}</>}
 {f.kind==='tea'&&[0,1,2,3,4].map(i=><Cylinder key={i} p={[f.x+1.5+i*1.2,1.3,f.z+f.d+4]} r={.05} h={2.6} c="#8d7859"/>)}
 </StaticBatch><Sign text={f.name} x={mid} y={3.1} z={front+1.12} w={Math.min(f.w-1,12)} h={.65} bg={f.kind==='post'?'#476b52':f.kind==='tea'?'#705b42':'#e8dfc7'} color={f.kind==='post'||f.kind==='tea'?'#f1ead7':'#3e5f52'}/>
 <group ref={interior}>{facilityItems().filter(i=>i.room==='facility-'+f.id).map(item=><group key={item.id} position={[item.x,.08,item.z]} rotation={[0,-item.rotation*Math.PI/180,0]} onClick={e=>{if(e.delta<5){e.stopPropagation();useHome.setState({selected:item.id});}}}><VehicleOffset item={item}><StaticBatch revision={item.type}><UsableFurniture item={item} def={catalog.find(c=>c.id===item.type)!}/></StaticBatch></VehicleOffset></group>)}</group>
 </group>;}
function Hill({h}:{h:typeof hills[number]}){const geometry=useMemo(()=>{const positions:number[]=[],indices:number[]=[],n=hillGrid;for(let j=0;j<=n;j++)for(let i=0;i<=n;i++){const x=h.x-h.rx+i*2*h.rx/n,z=h.z-h.rz+j*2*h.rz/n;positions.push(x,hillSample(h,x,z),z);}for(let j=0;j<n;j++)for(let i=0;i<n;i++){const a=j*(n+1)+i,b=a+n+1,c=a+1,d=b+1;indices.push(a,b,c,c,b,d);}const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));g.setIndex(indices);g.computeVertexNormals();return g;},[h]);return <mesh geometry={geometry} material={solid('#84906b')} receiveShadow/>;}
function SceneryChunk({x,z,children}:{x:number;z:number;children:ReactNode}){const root=useRef<THREE.Group>(null);useFrame(({camera})=>{if(root.current)root.current.visible=Math.hypot(camera.position.x-x,camera.position.z-z)<360;});return <group ref={root} userData={{keepInteractive:true}}><StaticBatch revision={x+':'+z}>{children}</StaticBatch></group>;}
export function WorldFacilities(){const d=useHome(s=>s.current().dimensions);return <group name="村庄服务设施、生活广场和田野">
 {facilities.map(f=><FacilityBuilding key={f.id} f={f}/>)}
 <StaticBatch revision="village-landscape-12">{facilities.map(f=>{const x=f.x+f.w/2,z=f.z+f.d+1,p=outerRoads().map(r=>({x:Math.max(Math.min(r.ax,r.bx),Math.min(Math.max(r.ax,r.bx),x)),z:Math.max(Math.min(r.az,r.bz),Math.min(Math.max(r.az,r.bz),z))})).sort((a,b)=>Math.hypot(a.x-x,a.z-z)-Math.hypot(b.x-x,b.z-z))[0],length=Math.hypot(p.x-x,p.z-z);return <Box key={f.id+'approach'} p={[(x+p.x)/2,.016,(z+p.z)/2]} s={[3,.03,Math.max(2,length+2)]} rotation={[0,Math.atan2(p.x-x,p.z-z),0]} m={surface('paving','#b5af9a',3,Math.max(2,length+2))}/>;})}{village(d).filter(h=>h.n.style<12).map(h=>{const chair=h.plan.items.find(f=>f.type==='garden-chair')!;return <Cylinder key={h.n.id+'family-seat'} p={[chair.x+1.05,.08+.225,chair.z+.62/2-.143]} r={.24} h={.45} c="#9f8766"/>;})}<Box p={[plaza.x+plaza.w/2,.015,plaza.z+plaza.d/2]} s={[plaza.w,.03,plaza.d]} m={surface('paving','#b7b6a0',plaza.w,plaza.d)}/>
 {Array.from({length:11},(_,i)=><group key={i} position={[plaza.x+5+i*10,0,plaza.z+4]}><Cylinder p={[0,2.3,0]} r={.15} h={4.6} c="#796a4e"/><Sphere p={[0,4.7,0]} s={[2.1,2.5,2]} c={i%2?'#82985d':'#657f57'}/><Box p={[0,.46,3]} s={[3,.18,.65]} c="#887456"/>{[-1,1].map(s=><Box key={s} p={[s*1.15,.24,3]} s={[.1,.48,.5]} c="#5e7267"/>)}</group>)}
 <Box p={[178,.08,255]} s={[18,.08,12]} c="#b99173"/>{[-1,1].map(s=><Cylinder key={s} p={[178+s*4,2,255]} r={.08} h={4} c="#6b8490"/>)}<Box p={[178,4,255]} s={[8,.12,.12]} c="#6b8490"/>{[-1,1].map(s=><group key={s}><Cylinder p={[178+s*2.2,2.3,255]} r={.018} h={3} c="#778278"/><Box p={[178+s*2.2,.85,255]} s={[1,.12,.45]} c="#967653"/></group>)}
 {[0,1].map(row=><group key={'chess'+row} position={[plaza.x+57.625,0,plaza.z+16+row*7]}><Box p={[0,.68,0]} s={[.65,.12,.8]} c="#9d8c6c"/><Box p={[0,.34,0]} s={[.2,.68,.3]} c="#807257"/><Box p={[0,.747,0]} s={[.5,.012,.5]} c="#c7b58b"/>{[-1,1].map(side=><group key={side}><Cylinder p={[side*.625,.225,0]} r={.23} h={.45} c="#a28a65"/>{[0,1,2].map(i=><Sphere key={i} p={[-.16+i*.15,.77,side*.14]} s={[.035,.018,.035]} c={side>0?'#5f5e50':'#9f5b45'}/>)}</group>)}</group>)}
 {Array.from({length:8},(_,i)=><group key={'stall'+i} position={[320+i%4*10,0,267+Math.floor(i/4)*38]}><Box p={[0,1,0]} s={[3,.15,1.2]} c="#aa926d"/><Box p={[0,2.5,0]} s={[3.8,.1,2.2]} c={i%2?'#a66c51':'#718b6a'}/>{[-1,1].map(s=><Cylinder key={s} p={[s*1.5,1.3,.8]} r={.035} h={2.6} c="#9a947d"/>)}{[-1,0,1].map(s=><Sphere key={s} p={[s*.65,1.18,0]} s={[.28,.16,.3]} c={['#a58950','#638458','#bc7958'][i%3]}/>)}</group>)}
 {farmPatches.map((p,i)=><SceneryChunk key={'field'+i} x={p.x} z={p.z}><Box p={[p.x,-.012,p.z]} s={[p.w,.02,p.d]} m={surface(p.kind===0?'soil':'grass',['#afa16d','#839464','#9b9e64','#738c63'][p.kind],p.w,p.d)}/>{Array.from({length:12},(_,r)=><Box key={r} p={[p.x-p.w/2+8+r*13,.12,p.z]} s={[.8,.24,p.d-8]} c={i%2?'#a9ac73':'#859759'} shadow={false}/>)}</SceneryChunk>)}
 {Array.from({length:180},(_,i)=>{const x=-610+i%18*118,z=670+Math.floor(i/18)*104;return <SceneryChunk key={'grove'+i} x={x} z={z}><Cylinder p={[x,2.2,z]} r={.18} h={4.4} c="#82725a"/><Sphere p={[x,5,z]} s={[2.5,3,2.4]} c={i%3?'#718a5d':'#889d68'}/></SceneryChunk>;})}
 {hills.map((h,i)=><Hill key={i} h={h}/>)}
 {Array.from({length:12},(_,i)=><SceneryChunk key={'barn'+i} x={490+i%4*230} z={700+Math.floor(i/4)*320}><group position={[490+i%4*230,0,700+Math.floor(i/4)*320]}><Box p={[0,2,0]} s={[20,4,12]} m={surface('brick',i%2?'#b3a485':'#bdac92',20,4)}/><Box p={[0,4.2,0]} s={[22,.16,14]} c={i%2?'#7b8e84':'#8f7658'}/><Box p={[0,1.6,6.05]} s={[3,3.2,.1]} c="#56695c"/></group></SceneryChunk>)}
 </StaticBatch>
 </group>;}
