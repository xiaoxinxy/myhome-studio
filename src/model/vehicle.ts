import type {PlacedItem,ItemDef} from './types';
import {nearbySegments,nearbyObstacles,type WalkWorld} from './walking';
import {streetBounds} from './neighborhood';
export type VehicleState={id:string;type:string;x:number;z:number;y:number;yaw:number;speed:number;wheel:number;originX:number;originZ:number;originRotation:number};
export const vehicles=new Map<string,VehicleState>();
export const vehicleTopSpeed=(type:string)=>type==='car'?200/3.6:type==='ebike'?30/3.6:25/3.6;
export function vehicleState(f:PlacedItem,base=0){if(!vehicles.has(f.id))vehicles.set(f.id,{id:f.id,type:f.type,originX:f.x,originZ:f.z,originRotation:f.rotation,x:f.x,z:f.z,y:base,yaw:-f.rotation*Math.PI/180,speed:0,wheel:0});return vehicles.get(f.id)!;}
function hitSegment(ax:number,az:number,bx:number,bz:number,hx:number,hz:number){let lo=0,hi=1;for(const [a,b,h] of [[ax,bx,hx],[az,bz,hz]]){const delta=b-a;if(Math.abs(delta)<1e-9){if(Math.abs(a)>h)return false;}else{let t1=(-h-a)/delta,t2=(h-a)/delta;if(t1>t2)[t1,t2]=[t2,t1];lo=Math.max(lo,t1);hi=Math.min(hi,t2);if(lo>hi)return false;}}return true;}
export function canDrive(v:VehicleState,x:number,z:number,yaw:number,c:ItemDef,w:WalkWorld){
 const bounds=streetBounds(w.plan.dimensions),radius=Math.hypot(c.w,c.d)/2;if(x-radius<bounds.minX||x+radius>bounds.maxX||z-radius<.15||z+radius>bounds.maxZ)return false;
 const cos=Math.cos(yaw),sin=Math.sin(yaw),local=(px:number,pz:number)=>({x:(px-x)*cos-(pz-z)*sin,z:(px-x)*sin+(pz-z)*cos});
 for(const s of nearbySegments(w,x,z,radius+.4)){if(v.y+c.h<=s.base||v.y>=s.base+s.height)continue;if(Math.max(s.ax,s.bx)<x-radius-.3||Math.min(s.ax,s.bx)>x+radius+.3||Math.max(s.az,s.bz)<z-radius-.3||Math.min(s.az,s.bz)>z+radius+.3)continue;const a=local(s.ax,s.az),b=local(s.bx,s.bz);if(hitSegment(a.x,a.z,b.x,b.z,c.w/2+s.radius+.03,c.d/2+s.radius+.03))return false;}
 for(const o of nearbyObstacles(w,x,z,radius+.4)){if(o.itemId===v.id||v.y+c.h<=o.base||v.y>=o.base+o.height||Math.abs(o.x-x)>radius+Math.hypot(o.w,o.d)/2||Math.abs(o.z-z)>radius+Math.hypot(o.w,o.d)/2)continue;
  const dx=o.x-x,dz=o.z-z,axes=[[cos,-sin],[sin,cos],[o.cos,o.sin],[-o.sin,o.cos]];
  const separated=axes.some(([ax,az])=>Math.abs(dx*ax+dz*az)>Math.abs(cos*ax-sin*az)*c.w/2+Math.abs(sin*ax+cos*az)*c.d/2+Math.abs(o.cos*ax+o.sin*az)*o.w/2+Math.abs(-o.sin*ax+o.cos*az)*o.d/2+.03);if(!separated)return false;
 }
 // Vehicles stay on the low courtyard/street level instead of climbing the inner steps.
 if(x>0&&x<w.plan.dimensions.width&&z<w.layout.dividerZ+1.1)return false;
 return true;
}
export function driveStep(v:VehicleState,throttle:number,steer:number,dt:number,c:ItemDef,w:WalkWorld){
 dt=Math.max(0,Math.min(dt,.08));const max=vehicleTopSpeed(v.type),braking=throttle&&Math.sign(throttle)!==Math.sign(v.speed)&&Math.abs(v.speed)>.2,accel=throttle?throttle*(braking?12:v.type==='car'?5:2.1): -Math.sign(v.speed)*Math.min(Math.abs(v.speed)/Math.max(dt,.001),1.1);
 v.speed=Math.max(-Math.min(12/3.6,max*.4),Math.min(max,v.speed+accel*dt));let blocked=false;
 const steps=Math.max(1,Math.ceil(Math.abs(v.speed*dt)/.08));for(let i=0;i<steps;i++){
  const steeringRatio=(v.type==='car'?3.1:1.6)*(1+Math.pow(Math.abs(v.speed)/9,2)),angle=v.yaw-steer*v.speed*dt/steps/steeringRatio,x=v.x+Math.sin(angle)*v.speed*dt/steps,z=v.z+Math.cos(angle)*v.speed*dt/steps;
  if(canDrive(v,x,z,angle,c,w)){v.x=x;v.z=z;v.yaw=angle;v.wheel+=v.speed*dt/steps/.3;}else{v.speed=0;blocked=true;break;}
 }return blocked;
}
