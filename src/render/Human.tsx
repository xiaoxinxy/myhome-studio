import * as THREE from 'three';
import {seatedLegAngle} from '../model/humanPose';
import {useRef} from 'react';
import {useFrame} from '@react-three/fiber';
import type {Group} from 'three';
import {Box,Cylinder,Sphere} from './Primitives';
import {solid} from './materials';
export type HumanPose='stand'|'walk'|'sit'|'lie'|'talk'|'work'|'play'|'examine'|'sweep'|'climb'|'jump'|'punch'|'crouch';
export type HumanMotion={pose:HumanPose;phase:number;moving?:boolean;seated?:boolean;floorOffset?:number;scale?:number};
export type HumanLook={skin:string;coat:string;pants:string;hair:string;hat?:boolean;glasses?:boolean;female?:boolean;age?:'child'|'adult'|'elder'};
export function humanLook(i:number):HumanLook{return{skin:['#dbb494','#c99e7f','#e7c4a3','#b98e72'][i%4],coat:['#647d75','#96856e','#6c8097','#b39387','#8e8e6b','#6b677d','#467b83'][i%7],pants:['#43515d','#665d50','#424b47'][i%3],hair:['#373933','#625244','#3c3330','#9b9b8c'][i%4],hat:i%9===0,glasses:i%6===0,female:i%3===1,age:i%13===0?'elder':'adult'};}
// Shared articulated geometry: all citizens use the same mesh family and can be
// submitted together by MovingBatch. Face, clothing, hands and joints stay distinct.
function DetailedHuman({look=humanLook(0),motion}:{look?:HumanLook;motion:()=>HumanMotion}){
 const rig=useRef<Group>(null),torso=useRef<Group>(null),head=useRef<Group>(null),arms=useRef<(Group|null)[]>([]),elbows=useRef<(Group|null)[]>([]),legs=useRef<(Group|null)[]>([]),knees=useRef<(Group|null)[]>([]);
 useFrame(()=>{if(rig.current&&!rig.current.parent?.visible)return;const a=motion(),t=a.phase,sit=a.pose==='sit'||!!a.seated,lie=a.pose==='lie',crouch=a.pose==='crouch',walk=a.pose==='walk',climb=a.pose==='climb',play=a.pose==='play',sitAngle=a.floorOffset===undefined?1.2:seatedLegAngle(a.floorOffset,a.scale||.9);if(rig.current)rig.current.rotation.x=lie?Math.PI/2:0;
  if(torso.current){torso.current.rotation.x=crouch?-.3:a.pose==='work'?-.22:a.pose==='sweep'?-.13:0;torso.current.position.y=crouch?-.4:play?Math.max(0,Math.sin(t*2))*.14:0;}
  if(head.current)head.current.rotation.y=a.pose==='talk'?Math.sin(t*.8)*.16:Math.sin(t*.3)*.035;
  for(let i=0;i<2;i++){const sign=i?1:-1,stride=Math.sin(t+(i?Math.PI:0));if(legs.current[i])legs.current[i]!.rotation.x=sit?sitAngle:crouch?1.7:climb?stride*.8:walk?stride*.42:a.pose==='jump'?-.35:0;if(knees.current[i])knees.current[i]!.rotation.x=sit?-sitAngle:crouch?-2.7:climb?-1.2:walk?-Math.max(0,-stride)*.25:a.pose==='jump'?-.7:0;
   if(arms.current[i]){arms.current[i]!.rotation.x=a.pose==='punch'&&i===1?1.7:crouch?.9:climb?1.7+stride*.5:walk?-stride*.35:a.pose==='work'?1+Math.sin(t*2)*.3:a.pose==='sweep'?.55+Math.sin(t)*.25:a.pose==='examine'?1.1:a.pose==='talk'&&i===1?.65+Math.sin(t*1.6)*.25:play?.7+Math.sin(t*2)*.7:sit?.35:.04;arms.current[i]!.rotation.z=climb?sign*.25:sign*.06;}
   if(elbows.current[i])elbows.current[i]!.rotation.x=a.pose==='talk'?.65:sit?.5:climb?.45:.18;
  }
 });
 const {skin,coat,pants,hair}=look;
 return <group ref={rig} name="新人物骨架"><group ref={torso}>
 <Sphere p={[0,1.04,0]} s={[.195,.29,.115]} c={coat}/><Box p={[0,.82,0]} s={[.29,.18,.2]} c={pants}/>
 <Box p={[0,1.09,-.114]} s={[.013,.33,.012]} c="#c3c6b4"/>{[.98,1.07,1.16].map(y=><Sphere key={y} p={[0,y,-.125]} s={[.014,.014,.008]} c="#a9b0a4"/>)}
 {[-1,1].map(s=><group key={s}><Box p={[s*.075,1.23,-.07]} s={[.11,.05,.07]} rotation={[0,0,s*.4]} c="#d8d4c2"/><Box p={[s*.1,1.07,-.112]} s={[.085,.075,.015]} c={coat}/><Box p={[s*.1,1.105,-.123]} s={[.086,.007,.01]} c="#b1b9a4"/></group>)}
 <Cylinder p={[0,1.34,0]} r={.055} h={.13} c={skin}/>
 <group ref={head} position={[0,1.53,0]}><Sphere p={[0,0,0]} s={[.135,.175,.12]} c={skin}/><Sphere p={[0,-.08,-.014]} s={[.112,.095,.097]} c={skin}/>
 <Sphere p={[0,.113,.025]} s={[.141,.082,.117]} c={hair}/>{[-1,1].map(s=><group key={s}><Sphere p={[s*.126,-.002,.002]} s={[.025,.042,.03]} c={skin}/><Sphere p={[s*.052,.019,-.106]} s={[.026,.014,.013]} c="#ebe7db"/><Sphere p={[s*.052,.019,-.118]} s={[.011,.011,.005]} c="#3b423b"/><Box p={[s*.052,.047,-.108]} s={[.048,.009,.012]} rotation={[0,0,s*.08]} c={hair}/><Sphere p={[s*.092,.095,.015]} s={[.055,.095,.105]} c={hair}/>{look.female&&<Sphere p={[s*.095,.005,.06]} s={[.055,.14,.07]} c={hair}/>}</group>)}
 <Sphere p={[0,-.025,-.123]} s={[.025,.038,.025]} c={skin}/><Box p={[0,-.079,-.109]} s={[.047,.009,.01]} c="#9f695b"/><Box p={[0,-.068,-.109]} s={[.04,.004,.012]} c="#d1a092"/>
 {look.glasses&&<>{[-1,1].map(s=><group key={s}><Box p={[s*.052,.02,-.127]} s={[.066,.043,.009]} c="#514c45"/><Box p={[s*.052,.02,-.133]} s={[.052,.029,.005]} c="#b0c2be"/></group>)}<Box p={[0,.026,-.132]} s={[.03,.009,.01]} c="#514c45"/></>}
 {look.hat&&<><Sphere p={[0,.16,.016]} s={[.15,.075,.13]} c="#a39e7e"/><Box p={[0,.13,-.13]} s={[.24,.025,.14]} c="#a39e7e"/></>}
 </group>
 {[-1,1].map((s,i)=><group key={s} ref={g=>{legs.current[i]=g;}} position={[s*.09,.73,0]}><Cylinder p={[0,-.145,0]} r={.072} h={.29} c={pants}/><group ref={g=>{knees.current[i]=g;}} position={[0,-.29,0]}><Sphere p={[0,0,0]} s={[.069,.072,.068]} c={pants}/><Cylinder p={[0,-.17,0]} r={.06} h={.34} c={pants}/><Box p={[0,-.385,-.035]} s={[.13,.085,.23]} c="#5d6258"/><Box p={[0,-.436,-.035]} s={[.135,.018,.24]} c="#b9b9a5"/></group></group>)}
 {[-1,1].map((s,i)=><group key={'arm'+s} ref={g=>{arms.current[i]=g;}} position={[s*.195,1.23,0]}><Sphere p={[0,-.04,0]} s={[.075,.09,.075]} c={coat}/><Cylinder p={[0,-.14,0]} r={.055} h={.24} c={coat}/><group ref={g=>{elbows.current[i]=g;}} position={[0,-.27,0]}><Cylinder p={[0,-.1,0]} r={.045} h={.2} c={coat}/><Box p={[0,-.185,0]} s={[.09,.035,.08]} c="#d6cfbc"/><Sphere p={[0,-.25,0]} s={[.043,.069,.027]} c={skin}/><Sphere p={[-s*.035,-.225,-.008]} s={[.018,.035,.021]} c={skin}/></group></group>)}
 </group></group>;
}

const lowSphere=new THREE.SphereGeometry(1,7,5),lowCylinder=new THREE.CylinderGeometry(1,1,1,6);
export function Human({look=humanLook(0),motion}:{look?:HumanLook;motion:()=>HumanMotion}){const high=useRef<Group>(null),low=useRef<Group>(null),limbs=useRef<(Group|null)[]>([]),position=useRef(new THREE.Vector3()),detailed=useRef(true);
 useFrame(({camera})=>{if(!high.current||!low.current)return;let owner:THREE.Object3D|null=high.current.parent;while(owner&&!owner.userData.trafficId)owner=owner.parent;if(owner&&!owner.visible){high.current.visible=false;low.current.visible=false;return;}const a=motion();high.current.getWorldPosition(position.current);const special=a.seated||!['stand','walk','talk'].includes(a.pose),near=special||camera.position.distanceTo(position.current)<(detailed.current?28:23);detailed.current=near;high.current.visible=!!near;low.current.visible=!near;if(!near)for(let i=0;i<4;i++)if(limbs.current[i])limbs.current[i]!.rotation.x=a.pose==='walk'?Math.sin(a.phase+(i%2?Math.PI:0))*(i<2?.4:-.3):0;});
 return <group name="人物距离细节"><group ref={high} userData={{dynamicVisibility:true}}><DetailedHuman look={look} motion={motion}/></group><group ref={low} userData={{dynamicVisibility:true}}><mesh geometry={lowSphere} position={[0,1.53,0]} scale={[.135,.175,.12]} material={solid(look.skin)}/><mesh geometry={lowSphere} position={[0,1.65,.02]} scale={[.14,.08,.12]} material={solid(look.hair)}/><Box p={[0,1.04,0]} s={[.32,.57,.21]} c={look.coat}/>{[-1,1].map((sign,i)=><group key={i} ref={g=>{limbs.current[i]=g;}} position={[sign*.09,.75,0]}><mesh geometry={lowCylinder} position={[0,-.34,0]} scale={[.067,.68,.067]} material={solid(look.pants)}/><Box p={[0,-.7,-.025]} s={[.13,.1,.22]} c="#62685b"/></group>)}{[-1,1].map((sign,i)=><group key={i} ref={g=>{limbs.current[i+2]=g;}} position={[sign*.21,1.23,0]}><mesh geometry={lowCylinder} position={[0,-.25,0]} scale={[.052,.5,.052]} material={solid(look.coat)}/></group>)}</group></group>;
}
