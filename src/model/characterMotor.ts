import {nearbyObstacles,nearbySegments,distanceToSegment,walkHeight,walkable,moveWalker,type WalkWorld} from './walking';
import {landmark,landmarkDecks} from './expedition';
export const HUMAN_SCALE=.9,BODY_HEIGHT=1.62;
export type Climb={from:{x:number;y:number;z:number};to:{x:number;y:number;z:number};t:number};
export type Motor={x:number;y:number;z:number;yaw:number;vy:number;grounded:boolean;jumpRequested:boolean;climbRequested:boolean;climb:Climb|null};
export function supportHeight(x:number,z:number,y:number,w:WalkWorld){let h=walkHeight(x,z,w);
 for(const d of landmarkDecks()){const pisa=d.id==='pisa-top',dx=x-d.x,inside=pisa?Math.hypot(dx/Math.cos(.069),z-d.z)<5.5:Math.abs(dx)<d.w/2&&Math.abs(z-d.z)<d.d/2,level=d.y-(pisa?dx*Math.tan(.069):0);if(inside&&level<=y+.24)h=Math.max(h,level);}
 for(const s of nearbySegments(w,x,z,.4))if(distanceToSegment(x,z,s)<s.radius+.12&&s.base+s.height<=y+.24)h=Math.max(h,s.base+s.height);
 for(const o of nearbyObstacles(w,x,z,.3)){const dx=x-o.x,dz=z-o.z,top=o.base+o.height;if(top>y+.24||o.itemId?.startsWith('pyramid'))continue;if(Math.abs(dx*o.cos+dz*o.sin)<o.w/2&&Math.abs(-dx*o.sin+dz*o.cos)<o.d/2)h=Math.max(h,top);}
 const p=landmark('pisa'),dx=(x-p.x)*Math.cos(.069)-y*Math.sin(.069),dz=z-p.z,r=Math.hypot(dx,dz);if(r>3.8&&r<6.2){const a=(Math.atan2(dx,dz)+Math.PI*2)%(Math.PI*2),base=(Math.floor(a/(Math.PI*2)*25)+1)*.18;for(let k=0;k<13;k++){const local=base+k*4.5,step=(local-Math.sin(.069)*(x-p.x))/Math.cos(.069);if(step<=y+.24&&local<=54.0001)h=Math.max(h,step);}}
 return h;
}
export function findClimb(m:Motor,w:WalkWorld):Climb|null{const fx=-Math.sin(m.yaw),fz=-Math.cos(m.yaw);
 for(let d=.35;d<1.55;d+=.1){const x=m.x+fx*d,z=m.z+fz*d;let top=-1;
  for(const o of nearbyObstacles(w,x,z,.3)){const dx=x-o.x,dz=z-o.z;if(Math.abs(dx*o.cos+dz*o.sin)<o.w/2+.12&&Math.abs(-dx*o.sin+dz*o.cos)<o.d/2+.12)top=Math.max(top,o.base+o.height);}
  for(const s of nearbySegments(w,x,z,.3))if(distanceToSegment(x,z,s)<s.radius+.15)top=Math.max(top,s.base+s.height);
  if(top-m.y<.3||top-m.y>1.65)continue;const tx=x+fx*.22,tz=z+fz*.22;
  const blockedHead=w.layout.buildings.some(b=>tx>b.x&&tx<b.x+b.w&&tz>b.z&&tz<b.z+b.d&&top<b.base+b.height&&top+.03+BODY_HEIGHT>b.base+b.height-.02);if(!blockedHead&&walkable(tx,tz,{...w,actorY:top+.03}))return{from:{x:m.x,y:m.y,z:m.z},to:{x:tx,y:top+.03,z:tz},t:0};
 }return null;
}
export function stepMotor(m:Motor,dx:number,dz:number,dt:number,w:WalkWorld){dt=Math.min(.05,Math.max(0,dt));
 if(m.climbRequested){m.climbRequested=false;if(m.grounded)m.climb=findClimb(m,w);}
 if(m.climb){const c=m.climb;c.t=Math.min(1,c.t+dt/1.05);const t=c.t*c.t*tEase(c.t),k=Math.min(1,t);m.x=c.from.x+(c.to.x-c.from.x)*k;m.z=c.from.z+(c.to.z-c.from.z)*k;m.y=c.from.y+(c.to.y-c.from.y)*k+Math.sin(c.t*Math.PI)*.28;m.vy=0;m.grounded=false;if(c.t===1){m.climb=null;m.grounded=true;}return;}
 if(m.jumpRequested){m.jumpRequested=false;if(m.grounded){m.vy=4.7;m.grounded=false;}}
 const world={...w,actorY:m.y,airborne:!m.grounded},p=moveWalker(m,dx,dz,world);m.x=p.x;m.z=p.z;
 const support=supportHeight(m.x,m.z,m.y,w);if(m.grounded&&m.y-support<.25&&m.y>=support-.24){m.y=support;m.vy=0;}else{m.grounded=false;m.vy-=12*dt;let next=m.y+m.vy*dt;
  if(m.vy>0)for(const b of w.layout.buildings)if(m.x>b.x&&m.x<b.x+b.w&&m.z>b.z&&m.z<b.z+b.d&&m.y+BODY_HEIGHT<b.base+b.height&&next+BODY_HEIGHT>=b.base+b.height){next=b.base+b.height-BODY_HEIGHT-.015;m.vy=0;}
  if(next<=support&&m.vy<=0){next=support;m.vy=0;m.grounded=true;}m.y=next;
 }
 if(m.y-support>.26)m.grounded=false;
}
function tEase(t:number){return 3-2*t;}
