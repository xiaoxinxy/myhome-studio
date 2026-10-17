import {village} from '../model/village';
import {southYard} from '../model/southYard';
import {useMemo,useEffect} from 'react';
import {useFrame,useThree} from '@react-three/fiber';
import * as THREE from 'three';
import {neighborhood,neighborHouse} from '../model/neighborhood';
import {walkMotion} from '../walkState';
import {useHome} from '../store';
import type {Layout,Dimensions} from '../model/types';
import type {Weather as WeatherKind} from '../model/environment';

export function Weather({kind,layout,dimensions:d,high,street}:{kind:WeatherKind;layout:Layout;dimensions:Dimensions;high:boolean;street:boolean}){
 const camera=useThree(s=>s.camera),snow=kind==='snow',active=snow||kind==='rain',count=high?700:360;
 const roofs=useMemo(()=>[...layout.buildings,...(street?[{...southYard(d).coop,base:0,height:2.5,rise:0}]:[]),...(street?village(d).flatMap(h=>h.layout.buildings):[])],[layout,d,street]);
 const bottomAt=(x:number,z:number)=>{const b=roofs.find(b=>x>b.x-.3&&x<b.x+b.w+.3&&z>b.z-.3&&z<b.z+b.d+.3);return b?b.base+b.height+b.rise:z>0&&x>0&&x<d.width&&z<layout.dividerZ&&z>d.mainDepth?layout.innerY:.05;};
 const data=useMemo(()=>{const positions=new Float32Array(count*(snow?3:6)),bottom=new Float32Array(count);let seed=83;const random=()=>{seed=seed*16807%2147483647;return seed/2147483647;};for(let i=0;i<count;i++){const stride=snow?3:6,x=random()*(d.width+14)-7,z=random()*(d.depth+18)-4,y=random()*11+1;positions.set([x,y,z],i*stride);if(!snow)positions.set([x-.045,y+.5,z],i*stride+3);bottom[i]=bottomAt(x,z);}const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.BufferAttribute(positions,3));return{positions,bottom,geometry};},[count,snow,roofs,d.width,d.depth]);
 useEffect(()=>()=>data.geometry.dispose(),[data]);
 useFrame((state,delta)=>{if(!active)return;const stride=snow?3:6,t=state.clock.elapsedTime,walking=useHome.getState().walking,centerX=walking?walkMotion.x:camera.position.x,centerZ=walking?walkMotion.z:camera.position.z;
  for(let i=0;i<count;i++){const j=i*stride;if(Math.abs(data.positions[j]-centerX)>26||Math.abs(data.positions[j+2]-centerZ)>26){data.positions[j]=centerX+(i*13.17%48)-24;data.positions[j+2]=centerZ+(i*7.33%48)-24;data.bottom[i]=bottomAt(data.positions[j],data.positions[j+2]);}
   data.positions[j+1]-=Math.min(delta,.05)*(snow?.65:8);if(data.positions[j+1]<data.bottom[i])data.positions[j+1]=11+i%7*.12;
   if(!snow){data.positions[j+3]=data.positions[j]-.045;data.positions[j+4]=data.positions[j+1]+.5;data.positions[j+5]=data.positions[j+2];}else data.positions[j]+=Math.sin(t+i)*Math.min(delta,.05)*.035;
  }(data.geometry.getAttribute('position') as THREE.BufferAttribute).needsUpdate=true;
 });
 if(!active)return null;return snow?<points geometry={data.geometry} frustumCulled={false}><pointsMaterial color="#f1f6ed" size={.065} transparent opacity={.8} depthWrite={false}/></points>:<lineSegments geometry={data.geometry} frustumCulled={false}><lineBasicMaterial color="#b9d2dd" transparent opacity={.48} depthWrite={false}/></lineSegments>;
}
