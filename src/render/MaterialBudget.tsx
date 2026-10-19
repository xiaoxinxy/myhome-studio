import * as THREE from 'three';
import {useLayoutEffect,useRef} from 'react';
import {useFrame,useThree} from '@react-three/fiber';
import {useHome} from '../store';
export function diffuseMaterial(s:THREE.MeshStandardMaterial){return new THREE.MeshLambertMaterial({color:s.color,map:s.map,emissive:s.emissive,emissiveMap:s.emissiveMap,emissiveIntensity:s.emissiveIntensity,transparent:s.transparent,opacity:s.opacity,alphaMap:s.alphaMap,alphaTest:s.alphaTest,side:s.side,vertexColors:s.vertexColors,flatShading:s.flatShading,depthWrite:s.depthWrite,depthTest:s.depthTest,polygonOffset:s.polygonOffset,polygonOffsetFactor:s.polygonOffsetFactor,polygonOffsetUnits:s.polygonOffsetUnits,toneMapped:s.toneMapped,fog:s.fog,wireframe:s.wireframe});}
type Binding={mesh:THREE.Mesh;source:THREE.Material|THREE.Material[];display:THREE.Material|THREE.Material[]};
let restoreDisplay:(()=>void)|undefined,suspended=0;
export async function withOriginalMaterials<T>(action:()=>Promise<T>){suspended++;restoreDisplay?.();try{return await action();}finally{suspended--;}}
export function MaterialBudget(){const {scene}=useThree(),quality=useHome(s=>s.quality),cache=useRef(new Map<THREE.Material,THREE.MeshLambertMaterial>()),bindings=useRef(new Map<THREE.Mesh,Binding>()),sweep=useRef(0);
 const restore=()=>{for(const b of bindings.current.values())if(b.mesh.material===b.display)b.mesh.material=b.source;bindings.current.clear();};
 const apply=()=>{if(performance.now()-sweep.current>5000){sweep.current=performance.now();for(const [mesh] of bindings.current)if(!mesh.parent)bindings.current.delete(mesh);}if(suspended||quality==='high')return;scene.traverseVisible(o=>{const mesh=o as THREE.Mesh;if(!mesh.isMesh)return;const old=bindings.current.get(mesh);if(old&&mesh.material===old.display)return;const source=mesh.material,convert=(m:THREE.Material)=>{const s=m as THREE.MeshStandardMaterial;if(!s.isMeshStandardMaterial)return m;let cheap=cache.current.get(m);if(!cheap){cheap=diffuseMaterial(s);cache.current.set(m,cheap);}return cheap;};const display=Array.isArray(source)?source.map(convert):convert(source);if(display!==source){bindings.current.set(mesh,{mesh,source,display});mesh.material=display;}});};
 useLayoutEffect(()=>{restoreDisplay=restore;apply();return()=>{restore();if(restoreDisplay===restore)restoreDisplay=undefined;};},[scene,quality]);
 useLayoutEffect(()=>()=>{for(const m of cache.current.values())m.dispose();cache.current.clear();},[]);
 useFrame(apply,-3);return null;
}
