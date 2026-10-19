import {memo,useMemo,useRef,useState} from 'react';
import {useFrame} from '@react-three/fiber';
import {GableEnds} from './BuildingDetails';
import {HouseWalls} from './Architecture';
import {village,type VillageHome} from '../model/village';
import {catalog} from '../model/catalog';
import {useHome} from '../store';
import {Box,Cylinder,Sphere} from './Primitives';
import {surface} from './materials';
import {StaticBatch} from './StaticBatch';
import {UsableFurniture} from './UsableFurniture';
import {PublicRoof,PublicExterior,PublicInterior} from './PublicDetails';
import {ItemEffects} from './ItemEffects';
import type {Dimensions} from '../model/types';
const Interior=memo(function Interior({home:h}:{home:VillageHome}){
 const [near,setNear]=useState(false),[yardNear,setYardNear]=useState(false),flag=useRef(false),yardFlag=useRef(false),timer=useRef(0);
 useFrame((state,dt)=>{timer.current+=dt;if(timer.current<.4)return;timer.current=0;const p=state.camera.position,next=h.layout.buildings.some(b=>Math.hypot(Math.max(b.x-p.x,0,p.x-b.x-b.w),Math.max(b.z-p.z,0,p.z-b.z-b.d),Math.max(0,p.y-b.height))<(useHome.getState().walking?5:(flag.current?18:12)));if(next!==flag.current){flag.current=next;setNear(next);}const yn=Math.hypot(Math.max(h.n.x-p.x,0,p.x-h.n.x-h.n.w),Math.max(h.n.z-p.z,0,p.z-h.n.z-h.n.depth))<45;if(yn!==yardFlag.current){yardFlag.current=yn;setYardNear(yn);}});

 return <group name={h.n.name+' · 室内陈设'}>{h.n.style>=12&&<group visible={near}><StaticBatch revision="public-interior"><PublicInterior home={h}/></StaticBatch></group>}{h.plan.items.map(f=>{const def=catalog.find(c=>c.id===f.type)!;return <group visible={f.room.endsWith('-yard')?yardNear:near} key={f.id} position={[f.x,f.room.endsWith('-yard')?.08:.12,f.z]} rotation={[0,-f.rotation*Math.PI/180,0]} onClick={e=>{if(e.delta<5){e.stopPropagation();useHome.setState({selected:f.id});}}}><ItemEffects item={f}>{['fridge','cabinet'].includes(def.model)?<UsableFurniture item={f} def={def}/>:<StaticBatch revision={f.type+f.color}><UsableFurniture item={f} def={def}/></StaticBatch>}</ItemEffects></group>;})}</group>;
});
const Home=memo(function Home({home,lit}:{home:VillageHome;lit:boolean}){
 const {n,layout,plan}=home,walking=useHome(s=>s.walking),[detail,setDetail]=useState(false),near=useRef(false),timer=useRef(0);
 useFrame((state,dt)=>{timer.current+=dt;if(timer.current<.35)return;timer.current=0;const p=state.camera.position,next=layout.buildings.some(b=>Math.hypot(Math.max(b.x-p.x,0,p.x-b.x-b.w),Math.max(b.z-p.z,0,p.z-b.z-b.d),Math.max(0,p.y-b.height))<(near.current?34:26));if(next!==near.current){near.current=next;setDetail(next);}});
 return <group name={n.name}>
 {n.style>=12&&<StaticBatch revision={String(detail)+lit}><PublicExterior home={home} lit={lit} detail={detail}/></StaticBatch>}
 {<group visible={detail}><StaticBatch revision={JSON.stringify([n,walking])}><group>
  <Box p={[n.x+n.w/2,0,n.z+n.depth/2]} s={[n.w,.16,n.depth]} m={surface('paving',plan.palette.paving,n.w,n.depth)}/>
  <HouseWalls layout={layout} plan={plan} walking={walking} cut={false} lit={lit} finish={n.style===13||n.style===14?"paint":n.style>=12?"brick":"facade"}/>
  {layout.buildings.map(b=>{const along=b.ridge==='x',width=along?b.w:b.d,depth=along?b.d:b.w;return <group key={b.id} name={b.id+'-封闭屋顶'}>
   <Box p={[b.x+b.w/2,.08,b.z+b.d/2]} s={[b.w,.12,b.d]} c="#9da18e"/>
   <Box p={[b.x+b.w/2,b.base+b.height-.025,b.z+b.d/2]} s={[b.w,.05,b.d]} c={plan.palette.interior}/>
   {n.style<12&&<GableEnds b={b} palette={plan.palette}/>}
   {n.style>=12?<PublicRoof home={home}/>:<group position={[b.x+b.w/2,b.base+b.height,b.z+b.d/2]} rotation={[0,along?0:Math.PI/2,0]}>{[-1,1].map(side=><Box key={side} p={[0,b.rise/2,side*depth/4]} s={[width+.5,.12,Math.hypot(depth/2,b.rise)+.18]} rotation={[side*Math.atan2(b.rise,depth/2),0,0]} m={surface(b.roof==='tile'?'roof':'metal',n.roof,width,depth/2)}/>)}</group>}
  </group>;})}
  {n.style<12&&layout.rooms.filter(r=>r.kind!=='yard').map((r,i)=><Box key={r.id} p={[r.x+r.w/2,.123,r.z+r.d/2]} s={[r.w-.1,.025,r.d-.1]} m={surface(i%3?'wood':'tile',plan.palette.floor,r.w,r.d)}/>)}
  {n.style<12&&<>  {[-1,1].map(side=><Box key={side} p={[n.x+(side+1)*n.w/2,1,n.z+n.depth/2]} s={[.18,1.8,n.depth]} m={surface('brick',n.color,.18,n.depth)}/>)}
  <Box p={[n.x+n.w/2,1,n.z]} s={[n.w,1.8,.18]} m={surface('brick',n.color,n.w,1.8)}/>
  {[.21,.79].map(u=><Box key={u} p={[n.x+n.w*u,1,n.z+n.depth]} s={[n.w*.42,1.8,.2]} m={surface('brick',n.color,n.w*.42,1.8)}/>)}
  {[.42,.58].map(u=><Box key={u} p={[n.x+n.w*u,1.25,n.z+n.depth]} s={[.3,2.3,.3]} c="#a9ad99"/>)}
</>}
  {Array.from({length:2+n.style%5},(_,i)=><group key={i} position={[n.x+1.1+i*.7,.1,n.z+n.depth-1.3]}><Cylinder p={[0,.18,0]} r={.22} h={.36} c={n.style%2?'#ad8a69':'#899e88'}/><Sphere p={[0,.5,0]} s={[.22,.3,.22]} c="#7d945e"/></group>)}
  {n.style%3===0&&<Box p={[n.x+n.w*.75,.17,n.z+n.depth-3]} s={[3.5,.2,1.5]} c="#7e9f9d"/>}
  {n.style%3===1&&Array.from({length:3},(_,i)=><Box key={i} p={[n.x+n.w*.72,.15,n.z+n.depth-3-i*.8]} s={[3,.18,.5]} c="#8a9067"/>)}
  {n.style%3===2&&<group><Box p={[n.x+n.w*.7,.4,n.z+n.depth-3]} s={[2,.8,1.2]} m={surface('wood','#aa9472',2,.8)}/><Box p={[n.x+n.w*.7,.86,n.z+n.depth-3]} s={[2.2,.1,1.3]} c="#d1c6a8"/></group>}
 </group></StaticBatch></group>}<group visible={!detail}><StaticBatch revision={JSON.stringify(n)}><DistantHome home={home}/></StaticBatch></group><Interior home={home}/></group>;
});
function DistantHome({home}:{home:VillageHome}){const {n,layout}=home;return <group name="远景建筑轮廓">
 <Box p={[n.x+n.w/2,0,n.z+n.depth/2]} s={[n.w,.16,n.depth]} c="#b1b39f"/>
 {layout.buildings.map(b=>{const along=b.ridge==='x',width=along?b.w:b.d,depth=along?b.d:b.w;return <group key={b.id}><Box p={[b.x+b.w/2,b.base+b.height/2,b.z+b.d/2]} s={[b.w,b.height,b.d]} c={n.color}/>{n.style>=12?<PublicRoof home={home}/>:<group position={[b.x+b.w/2,b.base+b.height,b.z+b.d/2]} rotation={[0,along?0:Math.PI/2,0]}>{[-1,1].map(side=><Box key={side} p={[0,b.rise/2,side*depth/4]} s={[width+.5,.12,Math.hypot(depth/2,b.rise)+.18]} rotation={[side*Math.atan2(b.rise,depth/2),0,0]} c={n.roof}/>)}</group>}{[.2,.5,.8].map(u=><Box key={u} p={[b.x+b.w*u,b.base+1.65,b.z+b.d+.015]} s={[b.w*.16,1.4,.035]} c="#73877d"/>)}</group>;})}
 {n.style<12&&<> {[-1,1].map(side=><Box key={side} p={[n.x+(side+1)*n.w/2,1,n.z+n.depth/2]} s={[.18,1.8,n.depth]} c={n.color}/>)}
 <Box p={[n.x+n.w/2,1,n.z]} s={[n.w,1.8,.18]} c={n.color}/>{[.21,.79].map(u=><Box key={u} p={[n.x+n.w*u,1,n.z+n.depth]} s={[n.w*.42,1.8,.2]} c={n.color}/>)}
 </>} </group>;}
export function Neighbors({d,lit=false}:{d:Dimensions;lit?:boolean}){const homes=useMemo(()=>village(d),[d]);return <group name="十二户住宅与四处公共建筑">{homes.map(h=><Home key={h.n.id} home={h} lit={lit}/>)}</group>;}
