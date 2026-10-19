import {useEffect,useMemo,useRef} from 'react';
import {useFrame,useThree} from '@react-three/fiber';
import * as THREE from 'three';
import {skyAt} from '../model/sky';
import {useHome} from '../store';
const plane=new THREE.PlaneGeometry(1,1);
function skyTexture(kind:'sun'|'moon'|'cloud'){
 const c=document.createElement('canvas');c.width=c.height=256;const ctx=c.getContext('2d')!;
 if(kind==='cloud'){for(let i=0;i<18;i++){const x=60+(Math.sin(i*18)+1)*65,y=75+(Math.cos(i*7)+1)*47,r=34+i%5*8,g=ctx.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,'rgba(255,255,255,.45)');g.addColorStop(1,'rgba(255,255,255,0)');ctx.fillStyle=g;ctx.fillRect(0,0,256,256);}}
 else if(kind==='sun'){const g=ctx.createRadialGradient(128,128,24,128,128,126);g.addColorStop(0,'#fff8d2');g.addColorStop(.28,'rgba(255,233,160,.95)');g.addColorStop(.5,'rgba(255,215,124,.27)');g.addColorStop(1,'rgba(255,206,122,0)');ctx.fillStyle=g;ctx.fillRect(0,0,256,256);}
 else{ctx.fillStyle='#e3e7db';ctx.beginPath();ctx.arc(128,128,91,0,Math.PI*2);ctx.fill();for(let i=0;i<36;i++){const x=128+Math.sin(i*17.3)*72,y=128+Math.cos(i*9.1)*72,r=3+i%6*2;ctx.fillStyle=i%2?'#bdc8c8':'#c9d2cf';ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();}}
 const texture=new THREE.CanvasTexture(c);texture.colorSpace=THREE.SRGBColorSpace;return texture;
}
export function SkyWorld(){const {scene}=useThree(),sun=useRef<THREE.Sprite>(null),moon=useRef<THREE.Sprite>(null),clouds=useRef<THREE.InstancedMesh>(null),clock=useRef(0),matrix=useMemo(()=>new THREE.Matrix4(),[]),position=useMemo(()=>new THREE.Vector3(),[]),scale=useMemo(()=>new THREE.Vector3(),[]),textures=useMemo(()=>({sun:skyTexture('sun'),moon:skyTexture('moon'),cloud:skyTexture('cloud')}),[]),materials=useMemo(()=>({sun:new THREE.SpriteMaterial({map:textures.sun,transparent:true,depthWrite:false,fog:false,toneMapped:false}),moon:new THREE.SpriteMaterial({map:textures.moon,transparent:true,depthWrite:false,fog:false,toneMapped:false}),cloud:new THREE.MeshBasicMaterial({map:textures.cloud,transparent:true,depthWrite:false,alphaTest:.005,fog:false})}),[textures]);
 useEffect(()=>()=>{Object.values(textures).forEach(t=>t.dispose());Object.values(materials).forEach(m=>m.dispose());delete scene.userData.sky;},[textures,materials,scene]);
 useFrame(({camera},dt)=>{const s=useHome.getState(),sky=skyAt(s.time,s.weather);clock.current+=Math.min(dt,.1);for(const [ref,p]of [[sun,sky.sun],[moon,sky.moon]] as const){if(ref.current){ref.current.visible=p.visible;ref.current.position.set(camera.position.x+p.x*1900,camera.position.y+p.y*1900,camera.position.z+p.z*1900);}}
  materials.sun.opacity=s.weather==='cloudy'?.55:1;materials.cloud.color.set(sky.cloudColor);materials.cloud.opacity=sky.cloudOpacity;
  if(clouds.current){const count=Math.min(sky.cloudCount,s.quality==='performance'?16:28);clouds.current.count=count;for(let i=0;i<count;i++){const angle=i*2.399963+clock.current*.0015,r=680+(i%4)*180;position.set(camera.position.x+Math.cos(angle)*r,camera.position.y+320+(i%5)*90,camera.position.z+Math.sin(angle)*r);scale.set(650+i%3*100,310+i%4*38,1);matrix.compose(position,camera.quaternion,scale);clouds.current.setMatrixAt(i,matrix);}clouds.current.instanceMatrix.needsUpdate=true;}
  scene.userData.sky={sunVisible:sky.sun.visible,moonVisible:sky.moon.visible,clouds:clouds.current?.count||0,weather:s.weather,night:sky.night};
 },-4);
 return <group name="日月与随天气变化的云层"><sprite ref={sun} name="天空中的太阳" material={materials.sun} scale={[95,95,1]} renderOrder={-20}/><sprite ref={moon} name="天空中的月亮" material={materials.moon} scale={[65,65,1]} renderOrder={-20}/><instancedMesh ref={clouds} name="雨雪乌云" args={[plane,materials.cloud,28]} frustumCulled={false} renderOrder={-18}/></group>;
}
