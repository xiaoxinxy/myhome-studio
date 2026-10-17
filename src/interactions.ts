import {create} from 'zustand';
import {walkMotion,clearWalkInput} from './walkState';
import {buildLayout,elevation} from './model/layout';
import {catalog} from './model/catalog';
import {worldRoom} from './model/village';
import {makeWalkWorld,walkable,walkHeight,cameraBoom} from './model/walking';
import {vehicleState,vehicles} from './model/vehicle';
import type {Plan,PlacedItem} from './model/types';
export type ItemInteraction={open?:boolean;lights?:boolean;petUntil?:number;waterUntil?:number;shakeUntil?:number;hornUntil?:number};
export const useInteractions=create<{items:Record<string,ItemInteraction>;doors:Record<string,boolean>;sitting:boolean;driving:string|null;vehicleEpoch:number;act:(id:string,patch:ItemInteraction)=>void;door:(id:string,open:boolean)=>void}>(set=>({items:{},doors:{},sitting:false,driving:null,vehicleEpoch:0,act:(id,patch)=>set(s=>({items:{...s.items,[id]:{...s.items[id],...patch}}})),door:(id,open)=>set(s=>({doors:{...s.doors,[id]:open}}))}));
export function stopToInteract(){clearWalkInput();}
let beforeSeat:{x:number;z:number;y:number;yaw:number}|null=null;
export function sitDown(sitting:boolean,target?:{x:number;z:number;y:number;yaw:number;pose?:"sit"|"lie";supportItem?:string}){clearWalkInput();if(sitting&&target){if(!walkMotion.sitting)beforeSeat={x:walkMotion.x,z:walkMotion.z,y:walkMotion.y,yaw:walkMotion.yaw};Object.assign(walkMotion,target,{bodyYaw:target.yaw});}else if(!sitting&&beforeSeat){Object.assign(walkMotion,beforeSeat);beforeSeat=null;}walkMotion.sitting=sitting;walkMotion.pose=sitting?(target?.pose||"sit"):"stand";walkMotion.supportItem=sitting?(target?.supportItem||null):null;useInteractions.setState({sitting});}
export function playTone(kind:'horn'|'cat'|'dog'){
 const context=new AudioContext(),osc=context.createOscillator(),gain=context.createGain();osc.connect(gain);gain.connect(context.destination);gain.gain.setValueAtTime(.045,context.currentTime);gain.gain.exponentialRampToValueAtTime(.001,context.currentTime+.38);osc.type=kind==='horn'?'sawtooth':'sine';osc.frequency.setValueAtTime(kind==='horn'?240:kind==='cat'?650:170,context.currentTime);osc.frequency.exponentialRampToValueAtTime(kind==='cat'?280:kind==='dog'?90:210,context.currentTime+.3);osc.start();osc.stop(context.currentTime+.4);osc.onended=()=>void context.close();
}

export const worldTargets=new Map<string,{point:()=>{x:number;z:number};label:string;activate:()=>void}>();

export function startDriving(plan:Plan,f:PlacedItem){if(Math.hypot(walkMotion.x-f.x,walkMotion.z-f.z)>3.4&&!vehicles.has(f.id))return false;const v=vehicleState(f);if(Math.hypot(walkMotion.x-v.x,walkMotion.z-v.z)>3.4)return false;sitDown(false);walkMotion.crouchUntil=0;walkMotion.petting=false;clearWalkInput();v.speed=0;walkMotion.x=v.x;walkMotion.z=v.z;walkMotion.yaw=v.yaw+Math.PI;useInteractions.setState({driving:f.id});return true;}
export function stopDriving(plan:Plan,force=false){const id=useInteractions.getState().driving;if(!id)return true;const v=vehicles.get(id);if(!v){useInteractions.setState({driving:null});return true;}const f=plan.items.find(f=>f.id===id),c=catalog.find(c=>c.id===(f?.type||v.type))!,world=makeWalkWorld(plan);clearWalkInput();v.speed=0;const candidates=[];for(const side of [-1,1])for(const length of [0,-.4,.4]){const x=v.x+Math.cos(v.yaw)*side*(c.w/2+.55)+Math.sin(v.yaw)*length,z=v.z-Math.sin(v.yaw)*side*(c.w/2+.55)+Math.cos(v.yaw)*length;if(walkable(x,z,world))candidates.push({x,z});}if(!candidates.length&&!force)return false;const p=candidates[0]||{x:plan.dimensions.width/2,z:plan.dimensions.depth-1.7};Object.assign(walkMotion,p,{y:walkHeight(p.x,p.z,world)});useInteractions.setState(s=>({driving:null,vehicleEpoch:s.vehicleEpoch+1}));return true;}
export function petCat(plan:Plan,f:PlacedItem){clearWalkInput();const world=makeWalkWorld(plan);if(Math.hypot(walkMotion.x-f.x,walkMotion.z-f.z)>2.6)return false;for(let i=0;i<12;i++){const a=i*Math.PI/6,x=f.x+Math.sin(a)*.6,z=f.z+Math.cos(a)*.6;if(walkable(x,z,world)&&Math.hypot(x-walkMotion.x,z-walkMotion.z)<1.3){walkMotion.x=x;walkMotion.z=z;break;}}walkMotion.bodyYaw=walkMotion.yaw=Math.atan2(walkMotion.x-f.x,walkMotion.z-f.z);walkMotion.crouchUntil=Date.now()+3600;walkMotion.petting=true;return true;}
export function seatTarget(plan:Plan,f:PlacedItem,pose:'sit'|'lie'='sit'){
 const layout=buildLayout(plan.dimensions),foreign=worldRoom(plan,f.room),r=foreign?.room||layout.rooms.find(r=>r.id===f.room)!,c=catalog.find(c=>c.id===f.type)!;
 const seat=f.type==='salon-chair'?.62:f.type==='waiting-seat'?.4925:f.type==='exam-bed'?.7625:c.model==='chair'?.505:c.model==='sofa'?.555:c.model==='bench'?.465:c.model==='stool'?c.h:c.model==='bed'?.64:c.model==='kang'?(pose==='lie'?.763:.715):c.h;
 const theta=-f.rotation*Math.PI/180,lying=pose==='lie'&&['bed','kang'].includes(c.model),front=(c.model==='kang'?c.d/2-.34:f.type==='salon-chair'?.29:c.model==='sofa'?.1+(c.d-.3)/2:c.d/2)*f.scale,offset=(c.model==='kang'?-1:1)*(lying?Math.max(.35,c.d*f.scale/2-.6):front-.143);
 return{x:f.x+Math.sin(theta)*offset,z:f.z+Math.cos(theta)*offset,y:elevation(r,foreign?.layout||layout)+seat*f.scale+(lying?.16:.012-(.73-.075)*.76),yaw:theta+(c.model==='kang'?0:Math.PI),pose:lying?'lie' as const:'sit' as const,supportItem:f.id};
}

export function restCamera(plan:Plan){const m=walkMotion,world={...makeWalkWorld(plan),ignoredObstacle:m.supportItem||undefined},pitch=.65,dist=2.65,target={x:m.x+Math.sin(m.bodyYaw)*.55,y:m.y+.15,z:m.z+Math.cos(m.bodyYaw)*.55};let best=-1;for(const yaw of [m.bodyYaw+Math.PI/2,m.bodyYaw-Math.PI/2,m.bodyYaw+Math.PI,m.bodyYaw]){const eye={x:m.x+Math.sin(yaw)*Math.cos(pitch)*dist,y:target.y+Math.sin(pitch)*dist,z:m.z+Math.cos(yaw)*Math.cos(pitch)*dist},score=Math.min(...[-.5,0,.5].map(side=>cameraBoom({x:target.x+Math.cos(yaw)*side,y:target.y,z:target.z-Math.sin(yaw)*side},{x:eye.x+Math.cos(yaw)*side,y:eye.y,z:eye.z-Math.sin(yaw)*side},world)));if(score>best){best=score;m.yaw=yaw;}}m.pitch=pitch;}
