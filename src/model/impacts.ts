import {encounter} from './encounters';
import {nearbyAgents,type NpcRuntime} from './npcRuntime';
export type PersonImpact={id:string;x:number;y:number;z:number;vx:number;vy:number;vz:number;age:number;stage:'air'|'down'|'rise'|'return';timer:number;homeX:number;homeZ:number;homeY:number;tilt:number};
export const personImpacts=new Map<string,PersonImpact>();
export function launchPerson(a:NpcRuntime,vx:number,vz:number,speed:number){
 if(personImpacts.has(a.profile.id)||Math.abs(speed)<2)return false;
 const length=Math.hypot(vx,vz)||1,push=Math.min(14,Math.abs(speed)*.48+1);
 personImpacts.set(a.profile.id,{id:a.profile.id,x:a.x,y:Math.max(0,a.y),z:a.z,vx:vx/length*push,vy:Math.min(7,3+Math.abs(speed)*.1),vz:vz/length*push,age:0,stage:'air',timer:0,homeX:a.x,homeZ:a.z,homeY:a.y,tilt:0});
 a.supportItem=undefined;a.moving=false;encounter.heat=Math.min(5,encounter.heat+1);encounter.lastIncident=Date.now();return true;
}
// The vehicle motor already subdivides travel into <= 8 cm, so even its maximum
// speed cannot tunnel across a person between these oriented-footprint tests.
export function contactPeople(x:number,z:number,y:number,yaw:number,w:number,d:number,speed:number,canContact?:()=>boolean){
 if(Math.abs(speed)<2)return 0;let count=0;const sin=Math.sin(yaw),cos=Math.cos(yaw),direction=Math.sign(speed);
 for(const a of nearbyAgents(x,z,Math.hypot(w,d)/2+.5)){
  if(personImpacts.has(a.profile.id)||a.y>y+2||a.y+1.5<y)continue;
  const dx=a.x-x,dz=a.z-z,lx=dx*cos-dz*sin,lz=dx*sin+dz*cos;
  if(Math.abs(lx)<w/2+.22&&Math.abs(lz)<d/2+.22&&(!canContact||canContact())&&launchPerson(a,sin*direction,cos*direction,speed))count++;
 }return count;
}
export function impactPose(p:PersonImpact){return p.stage==='air'?'jump':p.stage==='down'?'lie':p.stage==='rise'?'crouch':'walk';}
export function stepPersonImpact(id:string,elapsed:number,floor:(x:number,z:number)=>number,clear?:(x:number,y:number,z:number)=>boolean){
 const p=personImpacts.get(id);if(!p)return null;let remaining=Math.min(Math.max(0,elapsed),1);
 while(remaining>1e-7){const dt=Math.min(remaining,1/60);remaining-=dt;p.age+=dt;p.timer+=dt;
  if(p.stage==='air'){
   const nx=p.x+p.vx*dt,nz=p.z+p.vz*dt;if(!clear||clear(nx,p.y,nz)){p.x=nx;p.z=nz;}else{p.vx*=-.18;p.vz*=-.18;}
   p.vy-=12*dt;p.y+=p.vy*dt;p.tilt=Math.sin(p.age*5)*.5;const ground=floor(p.x,p.z);
   if(p.y<=ground&&p.vy<0){p.y=ground+.12;p.stage='down';p.timer=0;p.tilt=0;}
  }else if(p.stage==='down'){if(p.timer>1.15){p.stage='rise';p.timer=0;p.y=floor(p.x,p.z);}}
  else if(p.stage==='rise'){if(p.timer>.65){p.stage='return';p.timer=0;}}
  else{const dx=p.homeX-p.x,dz=p.homeZ-p.z,length=Math.hypot(dx,dz),step=Math.min(length,dt*1.65);if(length<.05){personImpacts.delete(id);return null;}const nx=p.x+dx/length*step,nz=p.z+dz/length*step;
   if(!clear||clear(nx,p.y,nz)){p.x=nx;p.z=nz;}else{if(clear(nx,p.y,p.z))p.x=nx;if(clear(p.x,p.y,nz))p.z=nz;}
   p.y=floor(p.x,p.z);
   // A blocked recovery stays at its landing position; it never teleports through a wall.
   if(p.timer>15){personImpacts.delete(id);return null;}
  }
 }return p;
}
