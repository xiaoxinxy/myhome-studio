import * as THREE from 'three';
import type {Building,Palette} from '../model/types';
import {Box,Cylinder} from './Primitives';
import {solid,surface} from './materials';

// Shared triangular prism: end walls close the space beneath pitched roofs.
const gable=new THREE.BufferGeometry();
const vertices=[[-.5,0,-.5],[.5,0,-.5],[0,1,-.5],[-.5,0,.5],[.5,0,.5],[0,1,.5]];
const faces=[0,2,1,3,4,5,0,1,4,0,4,3,0,3,5,0,5,2,1,2,5,1,5,4];
gable.setAttribute('position',new THREE.Float32BufferAttribute(faces.flatMap(i=>vertices[i]),3));
gable.setAttribute('uv',new THREE.Float32BufferAttribute(faces.flatMap(i=>[vertices[i][0]+.5,vertices[i][1]]),2));
gable.computeVertexNormals();

export function GableEnds({b,palette}:{b:Building;palette:Palette}){
 const along=b.ridge==='x',length=along?b.w:b.d,depth=along?b.d:b.w;
 return <group position={[b.x+b.w/2,b.base+b.height,b.z+b.d/2]} rotation={[0,along?0:Math.PI/2,0]}>{[-1,1].map(sign=><mesh key={sign} geometry={gable} position={[sign*(length/2-.11),0,0]} rotation={[0,Math.PI/2,0]} scale={[depth,b.rise*.95,.22]} material={surface('facade',palette.facade,depth,b.rise)} castShadow receiveShadow/>)}</group>;
}

export function ShedRoof({b,palette}:{b:Building;palette:Palette}){
 const width=b.w+.5,depth=b.d+.55,rise=b.rise,angle=-Math.atan2(rise,depth),slope=Math.hypot(depth,rise),color=palette.metalRoof;
 return <group position={[b.x+b.w/2,b.base+b.height,b.z+b.d/2]}>
  <Box p={[0,rise/2,0]} s={[width,.07,slope]} rotation={[angle,0,0]} m={surface('metal',color,width,slope)}/>
  {Array.from({length:Math.ceil(width/.24)},(_,i)=><Box key={i} p={[-width/2+(i+.5)*.24,rise/2+.045,0]} s={[.025,.025,slope]} rotation={[angle,0,0]} c={color}/>)}
  {[-1,1].map(sign=><Box key={sign} p={[0,sign<0?rise:.01,sign*depth/2]} s={[width,.12,.1]} c="#526e73"/>)}
  {[-.44,0,.44].map(z=><group key={z} position={[b.id==='southwest'?b.w/2-.08:-b.w/2+.08,0,z*b.d]}><Cylinder p={[0,-b.height/2,0]} r={.035} h={b.height} c="#7c8680"/><Box p={[0,-b.height+.04,0]} s={[.18,.08,.18]} c="#7b8075"/></group>)}
  {[-.35,.35].map(x=><Box key={x} p={[x*b.w,-.12,0]} s={[.055,.12,b.d]} c="#566561"/>)}
  <Box p={[0,-.22,-b.d*.22]} s={[.28,.06,.18]} m={solid('#dbd2a9',.55)}/>
 </group>;
}
