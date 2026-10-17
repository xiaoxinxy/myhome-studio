import {publicHome} from './publicHome';
import {neighborhood,neighborHouse} from './neighborhood';
import {catalog,existingPalette} from './catalog';
import type {Neighbor} from './neighborhood';
import type {Dimensions,Layout,Plan,PlacedItem,Room,Building,Wall,Opening} from './types';
export type VillageHome={n:Neighbor;layout:Layout;plan:Plan};
const cache=new Map<string,VillageHome[]>();
export function village(d:Dimensions):VillageHome[]{
 const key=JSON.stringify(d);if(cache.has(key))return cache.get(key)!;
 const homes=neighborhood(d).map(n=>{
  const rooms:Room[]=[],buildings:Building[]=[],walls:Wall[]=[],items:PlacedItem[]=[];let serial=0;
  const palette={...existingPalette,facade:n.color,brick:n.color,roof:n.roof,metalRoof:n.roof,interior:n.style%2?'#e3ddcd':'#d9dfd1',floor:n.style%3?'#c4b293':'#b3bcae',frame:n.style%2?'#e4dfcd':'#718b7a'};
  const room=(id:string,name:string,b:Building,x:number,z:number,w:number,depth:number):Room=>{const r:Room={id:n.id+'-'+id,name:n.name+' · '+name,building:b.id,x,z,w,d:depth,kind:'room',confidence:'estimated',note:'独立设计陈设，可进入体验'};rooms.push(r);return r;};
  const opening=(start:number,width:number,kind:'door'|'window'='door'):Opening=>({start,width,kind,bottom:kind==='door'?0:.9,height:kind==='door'?2.3:1.7});
  const wall=(b:Building,ax:number,az:number,bx:number,bz:number,facing:Wall['facing'],openings:Opening[]=[],exterior=true)=>walls.push({id:n.id+'-wall-'+serial++,building:b.id,a:[ax,az],b:[bx,bz],height:b.height,thickness:exterior?.2:.13,exterior,facing,openings});
  const building=(id:string,x:number,z:number,w:number,depth:number):Building=>{const b:Building={id:n.id+'-'+id,name:n.name,x,z,w,d:depth,base:.12,height:n.height,rise:n.style===5?.12:.7+(n.style%3)*.12,roof:n.style%3===1?'metal':'tile',ridge:id==='main'?'x':'z'};buildings.push(b);return b;};
  const furnish=(r:Room,type:string,u:number,v:number,rotation=0)=>{const def=catalog.find(c=>c.id===type)!;items.push({id:r.id+'-'+type+'-'+items.length,type,room:r.id,x:r.x+r.w*u,z:r.z+r.d*v,rotation,scale:1,color:def.color,locked:true,unitPrice:0,note:'邻里住宅固定陈设'});};
  if(n.style>=12)return publicHome(n,d);
  const h=neighborHouse(n),main=building('main',h.x,h.z,h.w,h.d),splits=n.style%3===0?[.29,.38,.33]:n.style%3===1?[.22,.33,.25,.2]:[.35,.3,.35];let cursor=h.x;
  const front:Opening[]=[];
  splits.forEach((fraction,i)=>{
   const width=h.w*fraction,r=room('main-'+i,i===1?'客厅':i===splits.length-1&&n.style%2?'书房':'卧室',main,cursor,h.z,width,h.d);
   front.push(i===1?opening(cursor-h.x+width/2-.65,1.3):opening(cursor-h.x+.35,width-.7,'window'));
   if(i){wall(main,cursor,h.z,cursor,h.z+h.d,'east',[opening(h.d/2-.5,1)],false);}
   if(i===1){furnish(r,n.style%2?'deep-sofa':'sofa',.5,.22);furnish(r,'coffee',.5,.5);furnish(r,'television',.18,.85,180);furnish(r,'armchair',.8,.65,90);furnish(r,'rug',.5,.48);}
   else if(i===splits.length-1&&n.style%2){furnish(r,'desk',.65,.23);furnish(r,'office-chair',.65,.44,180);furnish(r,'bookshelf',.18,.2);}
   else{furnish(r,n.style===10?'single-bed':n.style%2?'bed18':'bed15',.5,.28);furnish(r,'wardrobe',.25,.87,180);furnish(r,'nightstand',.8,.25);}
   cursor+=width;
  });
  wall(main,h.x,h.z,h.x+h.w,h.z,'north');wall(main,h.x,h.z+h.d,h.x+h.w,h.z+h.d,'south',front);wall(main,h.x,h.z,h.x,h.z+h.d,'west');wall(main,h.x+h.w,h.z,h.x+h.w,h.z+h.d,'east');
  const gate=n.z+n.depth,wingWidth=3.6+(n.style%3)*.35,wingLength=n.depth-h.d-7-(n.style%2)*1.5;
  for(let side=0;side<2;side++){
   const horizontal=side===1&&n.style%4===3,depth=horizontal?4.8:wingLength*(side===0&&n.style%4===0?.76:1),width=horizontal?n.w*.56:wingWidth,x=horizontal?n.x+n.w*.42:side===0?n.x+.4:n.x+n.w-width-.4,z=horizontal?gate-8.4:h.z+h.d+2.1+(side===1&&n.style%4===2?1.3:0),b=building(side?'east':'west',x,z,width,depth),middle=depth*(n.style%2?.55:.44);if(horizontal)b.ridge='x';
   const r1=room(side+'-a',side?'厨房':n.style%3===0?'木工房':n.style%3===1?'花房':'库房',b,x,z,width,middle),r2=room(side+'-b',side?'餐屋':n.style%2?'客房':'工作间',b,x,z+middle,width,depth-middle);
   const openings=[...(middle>4.5?[opening(.3,1.1,'window')]:[]),opening(middle/2-.5,1),...(depth-middle>4.5?[opening(middle+.3,1.1,'window')]:[]),opening(middle+(depth-middle)/2-.5,1)];
   wall(b,x,z,x+width,z,'north');wall(b,x,z+depth,x+width,z+depth,'south');wall(b,x,z,x,z+depth,'west',side?openings:[]);wall(b,x+width,z,x+width,z+depth,'east',side?[]:openings);wall(b,x,z+middle,x+width,z+middle,'south',[opening(width/2-.5,1)],false);
   if(side){furnish(r1,'kitchen-unit',.5,.14);furnish(r1,'fridge',.18,.64);furnish(r1,'sink',.76,.65,90);furnish(r2,n.style%2?'round-dining':'dining-table',.5,.48);furnish(r2,'dining-chair',.5,.74);furnish(r2,'wood-stool',.22,.45);}
   else{furnish(r1,n.style%3===1?'planter':'rack',.5,.17);furnish(r1,'crate',.78,.7);furnish(r1,'desk',.5,.78,180);furnish(r2,n.style%2?'single-bed':'bookshelf',.5,.2);furnish(r2,'office-chair',.5,.64);furnish(r2,'desk',.5,.86,180);}
  }
  const yard:Room={id:n.id+'-yard',name:n.name+' · 院内',building:'yard',kind:'yard',x:n.x,z:n.z,w:n.w,d:n.depth,confidence:'estimated',note:'借鉴丁村街巷组织的想象设计'};rooms.push(yard);
  furnish(yard,n.style%2?'round-tea':'garden-table',.5,.62);furnish(yard,'garden-chair',.5,.69);furnish(yard,'pot',.28,.82);furnish(yard,'planter',.76,.82);
  const layout:Layout={rooms,buildings,walls,dividerZ:gate,gateX:n.x+n.w/2,innerY:.08,terraceY:.08,terraceDepth:0};
  const plan:Plan={id:n.id,name:n.name,version:2,updated:'village-0.8',dimensions:d,palette,style:n.style%2?'warm':'existing',items,roomColors:{}};
  return{n,layout,plan};
 });cache.set(key,homes);return homes;
}
export function worldItems(p:Plan){return [...p.items,...village(p.dimensions).flatMap(h=>h.plan.items)];}
export function worldRoom(p:Plan,id:string){for(const h of village(p.dimensions)){const r=h.layout.rooms.find(r=>r.id===id);if(r)return{room:r,layout:h.layout};}return null;}
export function villageRoomAt(x:number,z:number,d:Dimensions){for(const h of village(d)){const r=h.layout.rooms.find(r=>r.kind!=='yard'&&x>=r.x&&x<=r.x+r.w&&z>=r.z&&z<=r.z+r.d);if(r)return r;}return undefined;}
