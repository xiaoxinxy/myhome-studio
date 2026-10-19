import {useEffect,useMemo,useRef} from 'react';
import {useFrame} from '@react-three/fiber';
import * as THREE from 'three';
import {mountainTrails,mountainHeight,type MountainTrail} from '../model/nature';
import {worldTargets} from '../interactions';
import {useHome} from '../store';
import {StaticBatch} from './StaticBatch';
import {Box,Cylinder} from './Primitives';
import {Sign} from './Sign';
const trailMaterial=new THREE.MeshStandardMaterial({vertexColors:true,roughness:1,polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-1});
function Trail({trail:t}:{trail:MountainTrail}){
 const root=useRef<THREE.Group>(null),m=t.mountain;
 const geometry=useMemo(()=>{const positions:number[]=[],colors:number[]=[],indices:number[]=[],c=new THREE.Color(),base=new THREE.Color(m.kind==='volcano'?'#a89a84':m.kind==='snow'?'#afad9c':'#b0a382');
  for(let i=0;i<t.points.length;i++){const p=t.points[i],a=t.points[Math.max(0,i-1)],b=t.points[Math.min(t.points.length-1,i+1)],length=Math.hypot(b.x-a.x,b.z-a.z),nx=(b.z-a.z)/length,nz=-(b.x-a.x)/length;
   for(let j=0;j<5;j++){const side=(j-2)*t.width/4,x=p.x+nx*side,z=p.z+nz*side;positions.push(x,mountainHeight(m,x,z)+.045,z);c.copy(base).multiplyScalar(j===0||j===4?.72:.94+Math.sin(i*1.7+j)*.06);colors.push(c.r,c.g,c.b);}
   if(i)for(let j=0;j<4;j++){const a=(i-1)*5+j,b=i*5+j;indices.push(a,b,a+1,a+1,b,b+1);}
  }const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));g.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));g.setIndex(indices);g.computeVertexNormals();return g;
 },[t,m]);
 useEffect(()=>()=>geometry.dispose(),[geometry]);
 const markers=useMemo(()=>{const result:number[]=[0];let next=450;for(let i=1;i<t.points.length-1;i++)if(t.points[i].distance>=next){result.push(i);next+=450;}result.push(t.points.length-1);return result;},[t]);
 const signs=useMemo(()=>markers.map(index=>{const p=t.points[index],a=t.points[Math.max(0,index-1)],b=t.points[Math.min(t.points.length-1,index+1)],length=Math.hypot(b.x-a.x,b.z-a.z),side=t.width/2+2.2,x=p.x+(b.z-a.z)/length*side,z=p.z-(b.x-a.x)/length*side;return{x,z,y:mountainHeight(m,x,z),rotation:Math.atan2(a.x-b.x,a.z-b.z)};}),[t,m,markers]);
 const rails=useMemo(()=>{if(m.kind==='fuji')return[];const result:{x:number;y:number;z:number;length:number;rotation:THREE.Quaternion}[]=[];const side=(i:number)=>{const p=t.points[i],r=Math.hypot(p.x-m.x,p.z-m.z)||1,x=p.x+(p.x-m.x)/r*(t.width/2+.25),z=p.z+(p.z-m.z)/r*(t.width/2+.25);return new THREE.Vector3(x,mountainHeight(m,x,z)+.9,z);};for(let i=3;i<t.points.length-4;i+=4){const a=side(i),b=side(i+4),d=b.clone().sub(a),center=a.clone().add(b).multiplyScalar(.5);result.push({x:center.x,y:center.y,z:center.z,length:d.length(),rotation:new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),d.normalize())});}return result;},[t,m]);
 useEffect(()=>{const ids:string[]=[];for(let j=0;j<markers.length;j++){const p=t.points[markers[j]],id='hike-'+m.id+'-'+j;ids.push(id);worldTargets.set(id,{point:()=>({x:p.x,y:mountainHeight(m,p.x,p.z),z:p.z}),label:j===markers.length-1?'登顶留念 · '+m.name:'查看山道路标',activate:()=>useHome.setState({notice:j===markers.length-1?'已抵达'+m.name+'山顶！海拔约'+Math.round(mountainHeight(m,p.x,p.z))+'米。':'沿'+t.name+'前行，距顶约'+Math.round(t.length-p.distance)+'米；折返弯处顺着浅色山道走。'})});}return()=>ids.forEach(id=>worldTargets.delete(id));},[t,m,markers]);
 useFrame(({camera})=>{if(root.current)root.current.visible=Math.hypot(camera.position.x-m.x,camera.position.z-m.z)<m.r+450;});
 const summit=t.points.at(-1)!,sy=mountainHeight(m,summit.x,summit.z);
 return <group ref={root} name={t.name+' · 山脚步行至峰顶'}><mesh geometry={geometry} material={trailMaterial} receiveShadow/><StaticBatch revision={'hiking-furniture-'+t.id}>
  {rails.map((r,i)=><group key={'rail-'+i} position={[r.x,r.y,r.z]} quaternion={r.rotation}><Cylinder p={[0,0,0]} r={.045} h={r.length} c="#a0aaa1"/></group>)}
  {t.points.filter((_,i)=>i%18===0).map((p,i)=>{const k=i*18,a=t.points[Math.max(0,k-1)],b=t.points[Math.min(t.points.length-1,k+1)],length=Math.hypot(b.x-a.x,b.z-a.z),x=p.x+(b.z-a.z)/length*(t.width/2+.3),z=p.z-(b.x-a.x)/length*(t.width/2+.3),y=mountainHeight(m,x,z);return <group key={i}><Cylinder p={[x,y+.52,z]} r={.045} h={1.04} c="#766b53"/><Box p={[x,y+.92,z]} s={[.12,.12,.12]} c="#c9b985"/></group>;})}
  {markers.map((index,j)=>{const p=signs[j];return <Cylinder key={j} p={[p.x,p.y+1,p.z]} r={.055} h={2} c="#75694e"/>;})}
  <Cylinder p={[summit.x+2,sy+2.2,summit.z]} r={.07} h={4.4} c="#a5aca5"/><Box p={[summit.x+2.7,sy+3.8,summit.z]} s={[1.4,.8,.025]} c="#a55440"/>
 </StaticBatch>{markers.map((index,j)=>{const p=t.points[index],sign=signs[j],y=mountainHeight(m,p.x,p.z),last=j===markers.length-1;return <Sign key={j} rotation={sign.rotation} x={sign.x} y={sign.y+1.8} z={sign.z} w={last?5:4.6} h={.65} text={last?m.name+' · 峰顶 '+Math.round(y)+'m':j===0?t.name+' → 全程 '+(t.length/1000).toFixed(1)+'km':'↑ 山顶 '+((t.length-p.distance)/1000).toFixed(1)+'km · 海拔 '+Math.round(y)+'m'} bg="#e2dac0"/>;})}</group>;
}
export function HikingTrails(){return <>{mountainTrails.map(t=><Trail key={t.id} trail={t}/>)}</>;}
