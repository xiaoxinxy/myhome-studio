import type {Dimensions} from './types';
export type RoutePoint={x:number;z:number};
export type TrafficActor={id:string;x:number;z:number;yaw:number;w:number;d:number;kind:'car'|'van'|'trike'|'ebike'|'person';distance:number;route:RoutePoint[];speed:number;pausedUntil:number};
export const trafficActors=new Map<string,TrafficActor>();
export function routeLength(route:RoutePoint[]){return route.reduce((s,a,i)=>{const b=route[(i+1)%route.length];return s+Math.hypot(b.x-a.x,b.z-a.z);},0);}
export function routePosition(route:RoutePoint[],distance:number){const total=routeLength(route);let t=(distance%total+total)%total;for(let i=0;i<route.length;i++){const a=route[i],b=route[(i+1)%route.length],length=Math.hypot(b.x-a.x,b.z-a.z);if(t<=length)return{x:a.x+(b.x-a.x)*t/length,z:a.z+(b.z-a.z)*t/length,yaw:Math.atan2(b.x-a.x,b.z-a.z)};t-=length;}return{...route[0],yaw:0};}
export function createTraffic(d:Dimensions):TrafficActor[]{const A=d.depth+6.8,B=d.depth+68.8,C=d.depth+114.8,main=[{x:-94,z:A-1.15},{x:d.width+94,z:A-1.15},{x:d.width+94,z:A+1.15},{x:-94,z:A+1.15}],back=[{x:-86,z:B-.9},{x:d.width+85,z:B-.9},{x:d.width+85,z:B+.9},{x:-86,z:B+.9}],market=[{x:-62,z:C-.85},{x:86,z:C-.85},{x:86,z:C+.85},{x:-62,z:C+.85}];const result:TrafficActor[]=[];
 const add=(id:string,route:RoutePoint[],distance:number,kind:TrafficActor['kind'],speed:number)=>{result.push({id,route,distance,kind,speed,pausedUntil:0,w:kind==='person'?.4:kind==='ebike'?.6:kind==='trike'?1.25:1.78,d:kind==='person'?.4:kind==='ebike'?1.8:kind==='trike'?2.7:4.2,...routePosition(route,distance)});};
 for(let i=0;i<12;i++)add('traffic-main-'+i,main,i*routeLength(main)/12,['car','van','ebike','car','trike','ebike'][i%6] as TrafficActor['kind'],i%3===0?3.1:3.5);
 for(let i=0;i<6;i++)add('traffic-back-'+i,back,i*routeLength(back)/6,['car','trike','ebike'][i%3] as TrafficActor['kind'],2.8);
 for(let i=0;i<4;i++)add('traffic-market-'+i,market,i*routeLength(market)/4,i%2?'ebike':'car',2.1);
 for(let i=0;i<24;i++){const row=i<12?A:i<18?B:C,roadWidth=i<12?7.4:i<18?5.6:5,side=i%2?-1:1,start=-78+(i%6)*29,z=row+side*(roadWidth/2+.7),route=[{x:start,z},{x:start+18,z},{x:start+18,z:z+side*.25},{x:start,z:z+side*.25}];add('traffic-person-'+i,route,(i%4)*8,'person',.68+(i%3)*.08);}
 return result;
}
export function advanceTraffic(a:TrafficActor,dt:number,player?:(RoutePoint&{radius?:number})){if(Date.now()<a.pausedUntil)return false;const candidate=routePosition(a.route,a.distance+a.speed*Math.min(dt,.08));const vehicle=a.kind!=='person';if(player&&Math.hypot(candidate.x-player.x,candidate.z-player.z)<=Math.hypot(a.x-player.x,a.z-player.z)&&Math.hypot(candidate.x-player.x,candidate.z-player.z)<(vehicle?2.7+(player.radius??.2):.4+(player.radius??.2)))return false;
 if(vehicle)for(const b of trafficActors.values()){if(b===a||b.kind==='person')continue;const dx=b.x-a.x,dz=b.z-a.z,forward=dx*Math.sin(a.yaw)+dz*Math.cos(a.yaw),side=dx*Math.cos(a.yaw)-dz*Math.sin(a.yaw);if(forward>0&&forward<(a.d+b.d)/2+1.6&&Math.abs(side)<(a.w+b.w)/2+.1&&Math.cos(a.yaw-b.yaw)>.5)return false;}
 a.distance+=a.speed*Math.min(dt,.08);Object.assign(a,candidate);return true;}
