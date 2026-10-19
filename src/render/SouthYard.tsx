import {useLayoutEffect,useEffect,useMemo,useRef,useState} from 'react';
import {useFrame} from '@react-three/fiber';
import * as THREE from 'three';
import {southYard} from '../model/southYard';
import type {Dimensions} from '../model/types';
import {useHome} from '../store';
import {worldTargets} from '../interactions';
import {environmentAt} from '../model/environment';
import {Box,Cylinder} from './Primitives';
import {solid} from './materials';
const plantGeometry=new THREE.IcosahedronGeometry(1,0),plantNearGeometry=new THREE.SphereGeometry(1,8,6);
function Sphere({p,s,c,detail=false}:{p:[number,number,number];s:[number,number,number];c:string;detail?:boolean}){return <mesh geometry={detail?plantNearGeometry:plantGeometry} material={solid(c)} position={p} scale={s} receiveShadow/>;}
import {surface,glow} from './materials';
import {StaticBatch} from './StaticBatch';

export function SouthYardBuildings({d,lit}:{d:Dimensions;lit:boolean}){
 const y=southYard(d),c=y.coop,[close,setClose]=useState(false),near=useRef(false);useFrame(state=>{const p=state.camera.position,next=p.y<9&&p.x>-5&&p.x<y.w+5&&p.z>y.z-6&&p.z<y.z+y.d+6;if(near.current!==next){near.current=next;setClose(next);}});
 return <group name="马路对面的南院"><StaticBatch revision={JSON.stringify([d,lit,close])}>
  <Box p={[y.w/2,-.04,y.z+y.d/2]} s={[y.w,.12,y.d]} m={surface('paving','#aaa28b',y.w,y.d)}/>
  {[[0,y.z+y.d/2,.22,y.d],[y.w,y.z+y.d/2,.22,y.d],[y.w/2,y.z+y.d,y.w,.22],[(y.w/2-1.2)/2,y.z,y.w/2-1.2,.22],[y.w-(y.w/2-1.2)/2,y.z,y.w/2-1.2,.22]].map(([x,z,w,depth],i)=><group key={i}><Box p={[x,.65,z]} s={[w,1.3,depth]} m={surface('brick','#a69479',w,1.3)}/><Box p={[x,1.33,z]} s={[w+.05,.09,depth+.06]} c="#858d7d"/></group>)}
  <Box p={[y.w/2,.025,y.z+y.d/2]} s={[2,.025,y.d]} m={surface('paving','#c1bca4',2,y.d)}/>
  {[1,2].map(i=><Box key={i} p={[y.w/2,.026,y.z+1+i*(y.d-2)/3-.55]} s={[y.w-1,.026,1]} m={surface('paving','#c1bca4',y.w,1)}/>)}
  <Box p={[c.x+c.w/2,.13,c.z+c.d/2]} s={[c.w,.2,c.d]} c="#b2aa8f"/>
  <Box p={[c.x+c.w/2,1.2,c.z+.2]} s={[c.w,2.4,.18]} m={surface('brick','#b4a58b',c.w,2.4)}/>
  <Box p={[c.x+c.w-.14,1.2,c.z+c.d/2]} s={[.18,2.4,c.d]} m={surface('brick','#b4a58b',c.d,2.4)}/>
  <Box p={[c.x+c.w/2,2.5,c.z+c.d/2]} s={[c.w+.5,.13,c.d+.5]} rotation={[-.05,0,0]} m={surface('metal','#657e79',c.w,c.d)}/>
  {[0,.5,1].map(t=><Cylinder key={t} p={[c.x+c.w*t,1.31,c.z+c.d]} r={.065} h={2.62} c="#8c8c76"/>)}
  {Array.from({length:Math.ceil(c.w/.55)},(_,i)=><Box key={i} p={[c.x+i*.55,.53,c.z+c.d]} s={[.025,1.05,.025]} c="#7c8b7e"/>)}
  {[.08,.5,.95].map(t=><Box key={t} p={[c.x+c.w/2,t,c.z+c.d]} s={[c.w,.025,.025]} c="#7c8b7e"/>)}
  {/* Open west side of the coop connects directly to the garden paths. */}
  {[0,1,2,3,4].map(i=><group key={i}><Box p={[c.x+1+i*1.8,.3,c.z+.9]} s={[1.3,.55,.85]} c="#a58a63"/><Box p={[c.x+1+i*1.8,.59,c.z+.9]} s={[1.1,.03,.7]} c="#c5b16f"/></group>)}
  {[0,1].map(i=><group key={i}><Cylinder p={[c.x+2+i*4,.2,c.z+c.d-1]} r={.38} h={.3} c="#8e9f9b"/><Cylinder p={[c.x+2+i*4,.36,c.z+c.d-1]} r={.32} h={.025} c="#adc8c2"/></group>)}
  <Box p={[c.x+.4,2.1,c.z+c.d-.15]} s={[.2,.22,.15]} m={lit?glow:undefined} c="#eee4c2"/>
  {y.beds.map((b,i)=><group key={i} name={['白菜畦','萝卜畦','葱蒜畦','番茄畦','青菜畦'][i]}>
   <Box p={[b.x+b.w/2,.09,b.z+b.d/2]} s={[b.w,.14,b.d]} c="#766c4c"/>
   {[0,1,2].flatMap(row=>Array.from({length:Math.max(3,Math.floor(b.w/.75))},(_,j)=>{const x=b.x+.4+j*.75,z=b.z+.5+row*(b.d-.8)/3;return <group key={row+':'+j}><Sphere detail={close} p={[x,.22,z]} s={i===2?[.08,.28,.08]:[.25,.2,.25]} c={i%2?'#648152':'#7e965d'}/>{i!==2&&<><Sphere detail={close} p={[x-.13,.28,z+.09]} s={[.16,.13,.2]} c="#91a875"/><Sphere detail={close} p={[x+.12,.3,z-.06]} s={[.15,.18,.16]} c="#78915e"/></>}{i===3&&<><Cylinder p={[x,.6,z]} r={.018} h={1.05} c="#a28f6a"/><Sphere detail={close} p={[x,.55,z]} s={[.17,.3,.17]} c="#6b8955"/><Sphere detail={close} p={[x+.13,.48,z]} s={[.065,.065,.065]} c="#b75f42"/></>}</group>;}))}
  </group>)}
  <Box p={[y.w-2,.1,y.z+y.d-2]} s={[2,.12,1.1]} c="#80928a"/><Box p={[y.w-2,.18,y.z+y.d-2]} s={[1.7,.05,.8]} c="#a0bcb2"/>
 </StaticBatch></group>;
}

// All birds share one low-poly geometry and one material: one draw call per flock.
// The simulation runs at 20 Hz nearby and stops updating off in the distance.
const birdGeometry=new THREE.SphereGeometry(1,8,6),birdFarGeometry=new THREE.IcosahedronGeometry(1,0);
const birdMaterial=new THREE.MeshStandardMaterial({color:'white',roughness:.9});
export function Poultry({d}:{d:Dimensions}){
 const y=useMemo(()=>southYard(d),[d]),mesh=useRef<THREE.InstancedMesh>(null),clock=useRef(0),next=useRef(0),last=useRef(0),feed=useRef(0);
 const view=useMemo(()=>({frustum:new THREE.Frustum(),matrix:new THREE.Matrix4(),sphere:new THREE.Sphere(new THREE.Vector3(),.85),center:new THREE.Vector3(y.w/2,0,y.z+y.d/2)}),[y]),dummy=useMemo(()=>new THREE.Object3D(),[]),matrix=useMemo(()=>new THREE.Matrix4(),[]),local=useMemo(()=>new THREE.Object3D(),[]);
 const birds=useMemo(()=>Array.from({length:44},(_,i)=>({goose:i>=30,phase:i*2.399,x:1.5+(i*3.71)%(d.width-3),z:y.z+1.5+(i*2.37)%(y.d-3),px:1.5+(i*3.71)%(d.width-3),pz:y.z+1.5+(i*2.37)%(y.d-3)})),[d,y]);
 useLayoutEffect(()=>{mesh.current?.setColorAt(0,new THREE.Color('white'));},[]);
 useEffect(()=>{worldTargets.set('south-yard-feed',{point:()=>({x:y.w/2,z:y.z+2}),label:'给鸡和鹅撒把粮',activate:()=>{feed.current=clock.current+24;useHome.setState({notice:'撒下谷物，鸡和鹅围过来啄食'});}});return()=>{worldTargets.delete('south-yard-feed');};},[y]);
 useFrame((state,dt)=>{
  clock.current+=Math.min(dt,.1);if(!mesh.current||clock.current<next.current)return;next.current=clock.current+.05;const stepTime=Math.min(.15,clock.current-last.current);last.current=clock.current;
  const distance=state.camera.position.distanceTo(view.center);mesh.current.visible=distance<110;if(distance>110&&mesh.current.userData.ready)return;state.camera.updateMatrixWorld();view.matrix.multiplyMatrices(state.camera.projectionMatrix,state.camera.matrixWorldInverse);view.frustum.setFromProjectionMatrix(view.matrix);
  mesh.current.geometry=distance>26?birdFarGeometry:birdGeometry;
  const s=useHome.getState(),shelter=environmentAt(s.time,s.weather).night||s.weather==='rain'||s.weather==='snow',active=s.layers.petMotion,t=active?clock.current:0;
  let index=0;const color=new THREE.Color();
  const part=(p:number[],scale:number[],c:string)=>{local.position.set(p[0],p[1],p[2]);local.scale.set(scale[0],scale[1],scale[2]);local.updateMatrix();matrix.multiplyMatrices(dummy.matrix,local.matrix);mesh.current!.setMatrixAt(index,matrix);mesh.current!.setColorAt(index++,color.set(c));};
  birds.forEach((b,i)=>{
   const a=t*.25+b.phase,feeding=feed.current>clock.current;
   const x=shelter?y.coop.x+.65+(i%11)*(y.coop.w-1.3)/10:feeding?y.w/2+Math.cos(b.phase)*(.65+i%6*.4):Math.max(.65,Math.min(y.w-.65,b.x+Math.sin(a)*.8));
   const z=shelter?y.z+.7+Math.floor(i/11)*(y.coop.d-1.4)/4:feeding?Math.max(y.z+.7,y.z+2+Math.sin(b.phase)*(.65+i%6*.4)):Math.max(y.z+.6,Math.min(y.z+y.d-.6,b.z+Math.cos(a)*.6));
   const g=b.goose,body=g?'#ecebdc':['#bb905e','#887052','#c3ab7b','#d3c5a2','#745b45'][i%5],peck=Math.sin(t*2+b.phase)>.8,step=Math.sin(t*7+b.phase)*.05;
   const dx=x-b.px,dz=z-b.pz,distance=Math.hypot(dx,dz),k=active?Math.min(1,stepTime*(g?.5:.65)/Math.max(.001,distance)):0;b.px+=dx*k;b.pz+=dz*k;
   view.sphere.center.set(b.px,.5,b.pz);if(!view.frustum.intersectsSphere(view.sphere))return;
   dummy.position.set(b.px,.06,b.pz);dummy.rotation.y=distance>.06?Math.atan2(dx,dz):a;dummy.scale.setScalar(g?.7:.55);dummy.updateMatrix();
   part([0,.4,0],[.19,.23,.32],body);part([0,.43,-.29],[.15,.15,.23],body);
   part([-.18,.42,0],[.055,.15,.24],g?'#d9ded1':'#a4855b');part([.18,.42,0],[.055,.15,.24],g?'#d9ded1':'#a4855b');
   part([0,peck?.4:g?.75:.61,peck?.36:.21],[.075,g?.28:.12,.08],body);
   part([0,peck?.23:g?1:.75,.32],[.11,.12,.12],body);
   part([0,peck?.19:g?.99:.72,.46],[.07,.035,.1],'#ca8b40');
   part([-.105,peck?.26:g?1.03:.78,.36],[.018,.018,.018],'#292e29');part([.105,peck?.26:g?1.03:.78,.36],[.018,.018,.018],'#292e29');
   part([-.095,.12+step,0],[.025,.12,.03],'#bd8948');part([.095,.12-step,.05],[.025,.12,.03],'#bd8948');
   part([0,g?.98:peck?.35:.89,.3],g?[.01,.01,.01]:[.06,.06,.08],g?body:'#b9543f');
  });
  mesh.current.count=index;if(index){mesh.current.instanceMatrix.needsUpdate=true;if(mesh.current.instanceColor)mesh.current.instanceColor.needsUpdate=true;}mesh.current.userData.ready=true;
 });
 return <instancedMesh ref={mesh} args={[birdGeometry,birdMaterial,44*12]} count={0} frustumCulled={false} name="南院 · 30只鸡和14只鹅" castShadow receiveShadow onClick={e=>{e.stopPropagation();worldTargets.get('south-yard-feed')?.activate();}}/>;
}
