import {landmarks,outerRoads} from './expedition';
import {mountainTrails,naturalHeight,type TrailPoint} from './nature';
import type {NpcRuntime} from './npcRuntime';
export type CrowdRoute={points:TrailPoint[];length:number};
export type CrowdPerson={a:NpcRuntime;route:CrowdRoute;offset:number;speed:number;elapsed:number;tick:number;hiker:boolean;region:string;lane:number};
export function crowdRoute(points:{x:number;y?:number;z:number}[]):CrowdRoute{let length=0;const result=points.map((p,i)=>{if(i)length+=Math.hypot(p.x-points[i-1].x,p.z-points[i-1].z,(p.y||0)-(points[i-1].y||0));return{...p,y:p.y||0,distance:length};});return{points:result,length};}
// Binary search is independent of trail resolution (each winding mountain has
// 1,400+ samples). All hikers share those arrays rather than duplicating them.
export function sampleCrowdRoute(route:CrowdRoute,distance:number,lane=0){
 const period=route.length*2,t=((distance%period)+period)%period,reverse=t>route.length,d=reverse?period-t:t;let lo=0,hi=route.points.length-1;
 while(hi-lo>1){const mid=(lo+hi)>>1;if(route.points[mid].distance<=d)lo=mid;else hi=mid;}
 const a=route.points[lo],b=route.points[hi],k=(d-a.distance)/Math.max(.00001,b.distance-a.distance),dx=b.x-a.x,dz=b.z-a.z,l=Math.hypot(dx,dz)||1;
 return{x:a.x+dx*k+dz/l*lane,y:a.y+(b.y-a.y)*k,z:a.z+dz*k-dx/l*lane,yaw:Math.atan2(-dx,-dz)+(reverse?Math.PI:0)};
}
export function createWorldPopulation():CrowdPerson[]{const result:CrowdPerson[]=[];
 const add=(region:string,route:CrowdRoute,count:number,hiker=false)=>{for(let i=0;i<count;i++){const index=result.length,id='crowd-'+region+'-'+i,offset=route.length*(i+.3)/count,a:NpcRuntime={profile:{id,name:['张','王','李','刘','陈','杨','赵','黄','周','吴','徐','孙','胡','朱','高','林','何','郭'][index%18]+['子安','雨桐','晨','晓岚','明远','佳宁','思齐','秋禾','云川','欣然','文博','梦溪','一帆','清禾','景行','小满','知夏','慕言','可心','星河'][Math.floor(index/18)%20],occupation:hiker?'登山与自然观察':'旅行与参观',personality:i%2?'喜欢摄影，也愿意与人交谈':'和朋友结伴出游，喜欢慢慢欣赏风景',home:'周边村镇',appearance:index+61},...sampleCrowdRoute(route,offset),activity:'walk',phase:index,moving:true,pauseUntil:0,destination:hiker?'在山林徒步、驻足欣赏风景':'和同伴参观景区'};result.push({a,route,offset,speed:hiker?.65+i%5*.09:.65+i%4*.12,elapsed:0,tick:i%7*.07,hiker,region,lane:(i%3-1)*(hiker?.65:.3)});}};
 for(const l of landmarks){
  // Forecourts, ticket queues, companions and promenades are separate groups.
  const z=l.arrival.z;
  add(l.id+'-forecourt',crowdRoute([{x:l.x-26,z:z+2},{x:l.x+8,z:z+2},{x:l.x+8,z:z-7},{x:l.x-20,z:z-7}]),14);
  add(l.id+'-ticket',crowdRoute([{x:l.x+10,z:z+4},{x:l.x+16,z:z+4},{x:l.x+18,z:z+1}]),6);
  if(l.id==='pyramid')add('pyramid-gallery',crowdRoute([{x:l.x,z:l.z+107},{x:l.x,z:l.z+28}]),8);
  if(l.id==='louvre')for(const side of [-1,1])add('louvre-wing-'+side,crowdRoute([{x:l.x+side*153,z:l.z+99,y:.08},{x:l.x+side*153,z:l.z-70,y:.08}]),8);
  if(l.id==='eiffel')add('eiffel-deck',crowdRoute([{x:l.x-23,z:l.z+22,y:58.25},{x:l.x+23,z:l.z+22,y:58.25}]),8);
  if(l.id==='tiananmen')add('gate-gallery',crowdRoute([{x:l.x-23,z:l.z+11,y:12},{x:l.x+23,z:l.z+11,y:12}]),8);
 }
 for(const trail of mountainTrails){add(trail.id,{points:trail.points,length:trail.length},32,true);const e=trail.points[0];add(trail.id+'-camp',crowdRoute([{x:e.x-8,z:e.z-3},{x:e.x+8,z:e.z-3},{x:e.x+4,z:e.z+2}]),8,true);}
 const roads=outerRoads().filter(r=>['outer-tour-main','outer-tour-east','outer-tour-west','outer-north','outer-access','outer-east-court'].includes(r.id));
 for(const r of roads){const dx=r.bx-r.ax,dz=r.bz-r.az,length=Math.hypot(dx,dz),side=r.width/2+.8;for(const sign of [-1,1])add(r.id+'-'+sign,crowdRoute([{x:r.ax+dx*.08+dz/length*side*sign,z:r.az+dz*.08-dx/length*side*sign},{x:r.bx-dx*.08+dz/length*side*sign,z:r.bz-dz*.08-dx/length*side*sign}]),6);}
 add('forest-walk',crowdRoute([{x:1106,z:845},{x:1106,z:1210},{x:1112,z:1330}]),16,true);
 // Camp/trail feet follow the exact rendered terrain, including cut shoulders.
 for(const p of result)if(p.hiker)p.a.y=naturalHeight(p.a.x,p.a.z);
 return result;
}
