import {useMemo,useRef,useEffect} from 'react';
import {useFrame} from '@react-three/fiber';
import * as THREE from 'three';
import {mountains} from '../model/nature';
import {useHome} from '../store';
function cloudTexture(){const canvas=document.createElement('canvas');canvas.width=canvas.height=128;const ctx=canvas.getContext('2d')!;for(let i=0;i<12;i++){const x=30+(Math.sin(i*8.1)+1)*32,y=35+(Math.cos(i*3.7)+1)*28,r=22+i%4*5,g=ctx.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,'rgba(237,242,239,.28)');g.addColorStop(1,'rgba(237,242,239,0)');ctx.fillStyle=g;ctx.fillRect(0,0,128,128);}return new THREE.CanvasTexture(canvas);}
export function MountainMist(){const roots=useRef<(THREE.Group|null)[]>([]),panes=useRef<(THREE.Mesh|null)[]>([]),time=useRef(0),texture=useMemo(cloudTexture,[]),weather=useHome(s=>s.weather),timeOfDay=useHome(s=>s.time);
 useEffect(()=>()=>texture.dispose(),[texture]);
 useFrame(({camera},dt)=>{time.current+=Math.min(dt,.1);mountains.forEach((m,i)=>{const root=roots.current[i];if(!root)return;root.visible=Math.hypot(camera.position.x-m.x,camera.position.z-m.z)<m.r+400;if(!root.visible)return;for(let j=0;j<7;j++){const pane=panes.current[i*7+j];if(!pane)continue;pane.quaternion.copy(camera.quaternion);const a=j/7*Math.PI*2+time.current*.004;pane.position.set(m.x+Math.sin(a)*m.r*.5,m.h*(.35+j%3*.09)+Math.sin(time.current*.1+j)*4,m.z+Math.cos(a)*m.r*.5);}});
 });
 return <group name="山腰雾带与峰下云海">{mountains.map((m,i)=><group key={m.id} ref={g=>{roots.current[i]=g;}}>{Array.from({length:7},(_,j)=><mesh key={j} ref={g=>{panes.current[i*7+j]=g;}} scale={[m.r*.9,m.h*.32,1]} renderOrder={2}><planeGeometry args={[1,1]}/><meshBasicMaterial map={texture} color={timeOfDay<6||timeOfDay>19?'#75889b':'#e9efeb'} transparent opacity={weather==='fog'?.7:.38} depthWrite={false} alphaTest={.005} side={THREE.DoubleSide}/></mesh>)}</group>)}</group>;
}
