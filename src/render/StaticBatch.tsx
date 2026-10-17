import {useLayoutEffect,useRef,type ReactNode} from 'react';
import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {batchSurface} from './materials';

type BatchRecord={originals:THREE.Mesh[];batches:THREE.Mesh[];frozen:Map<THREE.Object3D,boolean>};
const records=new Set<BatchRecord>();
const subsets=new Map<string,THREE.BufferGeometry>();
const colorMaterials=new Map<string,THREE.MeshStandardMaterial>();
function batchMaterial(material:THREE.Material){
 const m=material as THREE.MeshStandardMaterial;
 if(!m.isMeshStandardMaterial||m.map||m.normalMap||m.roughnessMap||m.metalnessMap||m.emissiveMap||m.alphaMap||m.aoMap||m.bumpMap||m.displacementMap||m.envMap||m.emissive.getHex()!==0||m.transparent)return{key:material.uuid,material,color:undefined};
 const key=JSON.stringify([m.type,m.roughness,m.metalness,m.side,m.flatShading,m.depthWrite,m.depthTest,m.alphaTest,m.wireframe,m.envMapIntensity,m.toneMapped,m.polygonOffset,m.polygonOffsetFactor,m.polygonOffsetUnits]);
 if(!colorMaterials.has(key)){const copy=m.clone();copy.color.set('white');colorMaterials.set(key,copy);}
 return{key,material:colorMaterials.get(key)!,color:m.color};
}
function partGeometry(g:THREE.BufferGeometry,groups:number[]){
 const key=g.uuid+':'+groups.join(',');if(subsets.has(key))return subsets.get(key)!;
 const geometry=g.clone(),indices:number[]=[],index=g.getIndex();
 for(const i of groups){const group=g.groups[i];for(let j=group.start;j<group.start+group.count;j++)indices.push(index?index.getX(j):j);}
 geometry.setIndex(indices);geometry.clearGroups();subsets.set(key,geometry);return geometry;
}

// Keep the editable/exportable source hierarchy; only its opaque static meshes
// are replaced for rendering. Transparent panes and existing instances stay intact.
export function StaticBatch({children,revision}:{children:ReactNode;revision:string}){
 const root=useRef<THREE.Group>(null),source=useRef<THREE.Group>(null);
 useLayoutEffect(()=>{
  if(!root.current||!source.current)return;
  const container=root.current,record:BatchRecord={originals:[],batches:[],frozen:new Map()};
  container.updateWorldMatrix(true,true);const inverse=new THREE.Matrix4().copy(container.matrixWorld).invert();
  type Entry={mesh:THREE.Mesh;matrix:THREE.Matrix4;geometry:THREE.BufferGeometry;material:THREE.Material};
  const buckets=new Map<string,Entry[]>();
  source.current.traverseVisible(object=>{
   let parent:THREE.Object3D|null=object;while(parent&&parent!==source.current){if(parent.userData.keepInteractive)return;parent=parent.parent;}const mesh=object as THREE.Mesh;if(!mesh.isMesh||(mesh as THREE.InstancedMesh).isInstancedMesh||(mesh as THREE.SkinnedMesh).isSkinnedMesh)return;
   const materials=Array.isArray(mesh.material)?mesh.material:[mesh.material];if(materials.some(m=>m.transparent))return;
   const matrix=new THREE.Matrix4().multiplyMatrices(inverse,mesh.matrixWorld),parts=new Map<THREE.Material,number[]>();
   if(Array.isArray(mesh.material))mesh.geometry.groups.forEach((g,i)=>{const mat=materials[g.materialIndex||0];if(mat)parts.set(mat,[...(parts.get(mat)||[]),i]);});
   else parts.set(mesh.material,[]);
   if(!parts.size)return;record.originals.push(mesh);
   for(const [material,groups] of parts){const geometry=groups.length?partGeometry(mesh.geometry,groups):mesh.geometry,key=(material.userData.surfaceKey?'surface:'+material.userData.surfaceKey:geometry.uuid+batchMaterial(material).key)+mesh.castShadow+mesh.receiveShadow;
    const entry={mesh,matrix,geometry,material};if(!buckets.has(key))buckets.set(key,[]);buckets.get(key)!.push(entry);
   }
  });
  for(const entries of buckets.values()){
   if(entries[0].material.userData.surfaceKey){
    const pieces=entries.map(e=>{const g=e.geometry.index?e.geometry.toNonIndexed():e.geometry.clone();g.applyMatrix4(e.matrix);const uv=g.getAttribute('uv'),repeat=(e.material as THREE.MeshStandardMaterial).map!.repeat;for(let i=0;i<uv.count;i++)uv.setXY(i,uv.getX(i)*repeat.x,uv.getY(i)*repeat.y);return g;});
    const geometry=mergeGeometries(pieces);pieces.forEach(g=>g.dispose());
    if(geometry){const first=entries[0],mesh=new THREE.Mesh(geometry,batchSurface(first.material as THREE.MeshStandardMaterial));mesh.name='静态材质合并';mesh.userData.ownedBatchGeometry=true;mesh.castShadow=first.mesh.castShadow;mesh.receiveShadow=first.mesh.receiveShadow;container.add(mesh);record.batches.push(mesh);continue;}
   }
   const first=entries[0],batch=new THREE.InstancedMesh(first.geometry,batchMaterial(first.material).material,entries.length);
   batch.name='静态合批';batch.castShadow=first.mesh.castShadow;batch.receiveShadow=first.mesh.receiveShadow;
   entries.forEach((entry,i)=>{batch.setMatrixAt(i,entry.matrix);const color=batchMaterial(entry.material).color;if(color)batch.setColorAt(i,color);});batch.instanceMatrix.needsUpdate=true;if(batch.instanceColor)batch.instanceColor.needsUpdate=true;batch.computeBoundingSphere();container.add(batch);record.batches.push(batch);
  }
  source.current.traverse(object=>{let parent:THREE.Object3D|null=object;while(parent&&parent!==source.current){if(parent.userData.keepInteractive)return;parent=parent.parent;}record.frozen.set(object,object.matrixAutoUpdate);object.updateMatrix();object.matrixAutoUpdate=false;});
  record.originals.forEach(mesh=>{mesh.visible=false;});records.add(record);
  return()=>{records.delete(record);record.frozen.forEach((auto,o)=>{o.matrixAutoUpdate=auto;});record.originals.forEach(mesh=>{mesh.visible=true;});record.batches.forEach(batch=>{container.remove(batch);if(batch.userData.ownedBatchGeometry)batch.geometry.dispose();else(batch as THREE.InstancedMesh).dispose();});};
 },[revision]);
 return <group ref={root}><group ref={source}>{children}</group></group>;
}

export async function exportOriginalMeshes<T>(action:()=>Promise<T>):Promise<T>{
 for(const record of records){record.originals.forEach(mesh=>{mesh.visible=true;});record.batches.forEach(batch=>{batch.visible=false;});}
 try{return await action();}finally{for(const record of records){record.originals.forEach(mesh=>{mesh.visible=false;});record.batches.forEach(batch=>{batch.visible=true;});}}
}
