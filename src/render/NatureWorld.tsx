import {useEffect,useMemo,useRef} from 'react';
import {useFrame} from '@react-three/fiber';
import * as THREE from 'three';
import {mountains,naturalPlaces,natureGrid,mountainSample,forestTree,type Mountain} from '../model/nature';
import {Box,Cylinder,Sphere} from './Primitives';
import {StaticBatch} from './StaticBatch';
import {Sign} from './Sign';
import {solid} from './materials';
import {worldTargets,sitDown} from '../interactions';
import {useHome} from '../store';
const conifer=new THREE.ConeGeometry(1,1,7),mountainMaterial=new THREE.MeshStandardMaterial({vertexColors:true,roughness:1});
function MountainTerrain({m}:{m:Mountain}){
 const geometry=useMemo(()=>{const positions:number[]=[],colors:number[]=[],indices:number[]=[],n=natureGrid,step=2*m.r/n,stone=new THREE.Color(m.kind==='volcano'?'#6e6257':m.kind==='snow'?'#73818a':'#78816f'),snow=new THREE.Color('#e0e7df'),grass=new THREE.Color('#728765'),c=new THREE.Color();
 for(let j=0;j<=n;j++)for(let i=0;i<=n;i++){const x=m.x-m.r+i*step,z=m.z-m.r+j*step,y=mountainSample(m,x,z),noise=Math.sin(x*.11+z*.07)*.035;positions.push(x,y,z);const snowline=m.kind==='snow'?.43:.62,snowAmount=m.kind==='volcano'?0:THREE.MathUtils.smoothstep(y/m.h+noise,snowline,snowline+.16);c.copy(y/m.h<.14?grass:stone).lerp(snow,snowAmount);c.multiplyScalar(.94+Math.sin(i*3+j*7)*.045);colors.push(c.r,c.g,c.b);}
 for(let j=0;j<n;j++)for(let i=0;i<n;i++){const a=j*(n+1)+i,b=a+n+1,c=a+1,d=b+1;indices.push(a,b,c,c,b,d);}const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));g.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));g.setIndex(indices);g.computeVertexNormals();return g;},[m]);
 useEffect(()=>()=>geometry.dispose(),[geometry]);
 return <group name={m.name}><mesh geometry={geometry} material={mountainMaterial} receiveShadow/>{m.kind==='volcano'&&<mesh position={[m.x,m.h*.56+.6,m.z]} rotation={[-Math.PI/2,0,0]}><circleGeometry args={[m.r*.075,28]}/><meshStandardMaterial color="#cf6234" emissive="#a73b13" emissiveIntensity={.65} roughness={.7}/></mesh>}</group>;
}
function ForestBlock({index}:{index:number}){const root=useRef<THREE.Group>(null),far=useRef<THREE.Group>(null),trees=useMemo(()=>Array.from({length:16},(_,j)=>forestTree(index%5*4+j%4+(Math.floor(index/5)*4+Math.floor(j/4))*20)).filter(t=>!t.skip),[index]),x=945+index%5*72,z=910+Math.floor(index/5)*108;
 useFrame(({camera})=>{const near=Math.hypot(camera.position.x-x,camera.position.z-z)<220;if(root.current)root.current.visible=near;if(far.current)far.current.visible=!near;});
 return <group><group ref={root}><StaticBatch revision={'forest-'+index}>{trees.map((t,i)=><group key={i}><Cylinder p={[t.x,t.h*.4,t.z]} r={.15} h={t.h*.8} c="#75644a"/>{[.45,.66,.84].map((u,j)=><mesh key={u} geometry={conifer} position={[t.x,t.h*u,t.z]} scale={[(1-u)*3.8+1,t.h*.48,(1-u)*3.8+1]} material={solid(i%3?'#496d54':'#5b7859')}/>)}</group>)}</StaticBatch></group><group ref={far}><StaticBatch revision={'forest-distant-'+index}>{Math.abs(x-1100)>50&&<Sphere p={[x,4.6,z]} s={[30,5,42]} c={index%3?'#597554':'#6a825a'}/>}</StaticBatch></group></group>;
}
export function NatureWorld(){useEffect(()=>{const ids:string[]=[];for(const p of naturalPlaces){const view='nature-'+p.id,seat='nature-bench-'+p.id;ids.push(view,seat);worldTargets.set(view,{point:()=>({x:p.x,z:p.z-2}),label:'观景 · '+p.name,activate:()=>useHome.setState({notice:p.mountain==='fuji'?'富士山主题山体采用压缩地形，沿观景台远眺积雪山顶。':p.mountain==='volcano'?'赤岩火山：环形火口、玄武岩坡面与熔岩湖。':p.mountain==='snow-mountain'?'雪山登山口：岩脊、雪线与山麓休憩区。':'杉木林步道：可以沿林间小路步行，长椅处可以休息。'})});worldTargets.set(seat,{point:()=>({x:p.x+5,z:p.z}),label:'坐在观景长椅上',activate:()=>sitDown(true,{x:p.x+5,z:p.z,y:.48+.012-.655*.9,yaw:Math.PI,floorY:0})});}return()=>ids.forEach(id=>worldTargets.delete(id));},[]);
 return <group name="山林自然景区">{mountains.map(m=><MountainTerrain key={m.id} m={m}/>)}{Array.from({length:25},(_,i)=><ForestBlock key={i} index={i}/>)}<StaticBatch revision="nature-rest-stations">{naturalPlaces.map(p=><group key={p.id} position={[p.x,0,p.z]}><Box p={[0,-.01,0]} s={[20,.04,12]} c="#b5af94"/><Box p={[5,.43,0]} s={[2.2,.1,.65]} c="#927c59"/>{[-1,1].map(s=><Box key={s} p={[5+s*.8,.21,0]} s={[.1,.42,.5]} c="#607467"/>)}<Box p={[5,.8,-.28]} s={[2.2,.55,.08]} c="#927c59"/>{[-1,1].map(s=><Cylinder key={'s'+s} p={[-8+s*2.2,1.1,-3]} r={.07} h={2.2} c="#8f7b5a"/>)}<Box p={[-6,.65,-2]} s={[1.2,1.3,.9]} c="#68826a"/><Box p={[-6,1.35,-2]} s={[1.3,.12,1]} c="#91a486"/>{[0,1,2].map(i=><group key={i}><Cylinder p={[i*1.2-6,1.4,4]} r={.04} h={2.8} c="#837358"/><Box p={[i*1.2-6,2.85,4]} s={[1.3,.09,2.8]} c="#a89673"/></group>)}</group>)}</StaticBatch>{naturalPlaces.map(p=><Sign key={p.id} rotation={Math.PI} text={p.name} x={p.x-8} y={2} z={p.z-3} w={4.8} h={.7} bg="#dfd7bd" color="#3c5949"/>)}</group>;
}
