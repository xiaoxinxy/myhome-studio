import type {Dimensions} from './types';
import {reactions} from './encounters';
import {landmarks} from './expedition';
export type RoutePoint={x:number;z:number};
export type TrafficActor={height?:number;id:string;x:number;z:number;yaw:number;w:number;d:number;kind:'car'|'van'|'trike'|'ebike'|'person';distance:number;route:RoutePoint[];speed:number;pausedUntil:number;claimed?:boolean;velocity?:number;nextPause?:number;direction?:number;reactionUntil?:number;activity?:'walk'|'wait'|'drive'|'flee'|'stagger'};
export const trafficActors=new Map<string,TrafficActor>();
export function routeLength(route:RoutePoint[]){return route.reduce((s,a,i)=>{const b=route[(i+1)%route.length];return s+Math.hypot(b.x-a.x,b.z-a.z);},0);}
export function routePosition(route:RoutePoint[],distance:number){const total=routeLength(route);let t=(distance%total+total)%total;for(let i=0;i<route.length;i++){const a=route[i],b=route[(i+1)%route.length],length=Math.hypot(b.x-a.x,b.z-a.z);if(t<=length)return{x:a.x+(b.x-a.x)*t/length,z:a.z+(b.z-a.z)*t/length,yaw:Math.atan2(b.x-a.x,b.z-a.z)};t-=length;}return{...route[0],yaw:0};}
export function createTraffic(d:Dimensions):TrafficActor[]{const A=d.depth+6.8,B=d.depth+68.8,C=d.depth+114.8,main=[{x:-94,z:A-1.15},{x:d.width+94,z:A-1.15},{x:d.width+94,z:A+1.15},{x:-94,z:A+1.15}],back=[{x:-86,z:B-.9},{x:d.width+85,z:B-.9},{x:d.width+85,z:B+.9},{x:-86,z:B+.9}],market=[{x:-62,z:C-.85},{x:86,z:C-.85},{x:86,z:C+.85},{x:-62,z:C+.85}];const result:TrafficActor[]=[];
 const add=(id:string,route:RoutePoint[],distance:number,kind:TrafficActor['kind'],speed:number)=>{result.push({id,route,distance,kind,speed,pausedUntil:0,w:kind==='person'?.4:kind==='ebike'?.6:kind==='trike'?1.25:1.78,d:kind==='person'?.4:kind==='ebike'?1.8:kind==='trike'?2.7:4.2,...routePosition(route,distance)});};
 for(let i=0;i<12;i++)add('traffic-main-'+i,main,i*routeLength(main)/12,['car','van','ebike','car','trike','ebike'][i%6] as TrafficActor['kind'],i%3===0?3.1:3.5);
 for(let i=0;i<6;i++)add('traffic-back-'+i,back,i*routeLength(back)/6,['car','trike','ebike'][i%3] as TrafficActor['kind'],2.8);
 for(let i=0;i<4;i++)add('traffic-market-'+i,market,i*routeLength(market)/4,i%2?'ebike':'car',2.1);
 for(let i=0;i<24;i++){const row=i<12?A:i<18?B:C,roadWidth=i<12?7.4:i<18?5.6:5,side=i%2?-1:1,start=-78+(i%6)*29,z=row+side*(roadWidth/2+.7),route=i%8===0?[{x:start,z:row-5},{x:start+8,z:row-5},{x:start+8,z:row+5},{x:start,z:row+5}]:[{x:start,z},{x:start+18,z},{x:start+18,z:z+side*.25},{x:start,z:z+side*.25}];add('traffic-person-'+i,route,(i%4)*8,'person',.68+(i%3)*.08);}
 return result;
}
export function advanceTraffic(a:TrafficActor,dt:number,player?:(RoutePoint&{radius?:number}),now=Date.now()){
 if(a.claimed)return false;dt=Math.max(0,Math.min(dt,.08));const vehicle=a.kind!=='person',reaction=reactions.get(a.id),flee=!!reaction&&now<reaction.fleeUntil;
 if(flee&&reaction&&a.reactionUntil!==reaction.fleeUntil){const yaw=routePosition(a.route,a.distance).yaw;a.direction=(a.x-reaction.sourceX)*Math.sin(yaw)+(a.z-reaction.sourceZ)*Math.cos(yaw)<0?-1:1;a.reactionUntil=reaction.fleeUntil;}if(!flee)a.direction=1;const direction=a.direction||1;a.activity=vehicle?'drive':flee?'flee':'walk';if(reaction&&now<reaction.hitUntil){a.activity='stagger';a.velocity=0;return false;}
 if(!vehicle&&!flee){a.nextPause??=a.distance+10+(a.id.length%5);if(a.distance>=a.nextPause){a.pausedUntil=now+1600;a.nextPause=a.distance+18;}}
 if(!flee&&now<a.pausedUntil){a.activity='wait';a.velocity=0;return false;}
 let desired=a.speed*(flee?2.7:1);const candidate=routePosition(a.route,a.distance+desired*dt*direction);
 if(player&&!flee&&Math.hypot(candidate.x-player.x,candidate.z-player.z)<=Math.hypot(a.x-player.x,a.z-player.z)&&Math.hypot(candidate.x-player.x,candidate.z-player.z)<(vehicle?2.7+(player.radius??.2):.4+(player.radius??.2)))desired=0;
 if(vehicle)for(const b of trafficActors.values()){if(b===a)continue;const dx=b.x-a.x,dz=b.z-a.z,forward=dx*Math.sin(a.yaw)+dz*Math.cos(a.yaw),side=dx*Math.cos(a.yaw)-dz*Math.sin(a.yaw);if(forward>0&&forward<(a.d+b.d)/2+1.6+Math.max(0,a.velocity||0)*.7&&Math.abs(side)<(a.w+b.w)/2+.1&&(b.kind==='person'||b.claimed||Math.cos(a.yaw-b.yaw)>.5)){desired=0;break;}}
 a.velocity=desired===0?0:Math.min(desired,(a.velocity??desired)+dt*(vehicle?1.5:2));if(!a.velocity){a.activity='wait';return false;}
 a.distance+=a.velocity*dt*direction;const next=routePosition(a.route,a.distance);if(direction<0)next.yaw+=Math.PI;Object.assign(a,next);return true;
}

export function createOuterTraffic():TrafficActor[]{const r:TrafficActor[]=[];const route=[{x:-710,z:568},{x:1398,z:568},{x:1398,z:1658},{x:-710,z:1658},{x:-710,z:572},{x:1402,z:572},{x:1402,z:1662},{x:-714,z:1662},{x:-714,z:568}];
 for(let i=0;i<14;i++)r.push({id:'traffic-outer-'+i,route,distance:i*routeLength(route)/14,kind:i%4===0?'van':'car',speed:12+i%4,w:1.78,d:4.2,pausedUntil:0,...routePosition(route,i*routeLength(route)/14)});
 for(const l of landmarks)r.push({id:'traffic-parked-'+l.id,route:[l.arrival,{x:l.arrival.x+1,z:l.arrival.z}],distance:0,kind:l.id==='pisa'?'ebike':'car',speed:0,w:l.id==='pisa'?.6:1.78,d:l.id==='pisa'?1.8:4.2,pausedUntil:0,claimed:true,x:l.arrival.x+6,z:l.arrival.z,yaw:Math.PI/2});
 return r;}
