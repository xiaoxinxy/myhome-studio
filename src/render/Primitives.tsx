import * as THREE from 'three';
import {solid,unitBox,unitSphere,unitCylinder} from './materials';
export function Box({p=[0,0,0],s=[1,1,1],c='#ccc',m,rotation,shadow=true}:{p?:[number,number,number];s?:[number,number,number];c?:string;m?:THREE.Material|THREE.Material[];rotation?:[number,number,number];shadow?:boolean}){return <mesh geometry={unitBox} material={m||solid(c)} position={p} scale={s} rotation={rotation} castShadow={shadow} receiveShadow/>;}
export function Sphere({p,s,c,m}:{p:[number,number,number];s:[number,number,number];c:string;m?:THREE.Material}){return <mesh geometry={unitSphere} position={p} scale={s} material={m||solid(c)} castShadow receiveShadow/>;}
export function Cylinder({p,r,h,c,m}:{p:[number,number,number];r:number;h:number;c:string;m?:THREE.Material}){return <mesh geometry={unitCylinder} material={m||solid(c)} position={p} scale={[r,h,r]} castShadow receiveShadow/>;}
