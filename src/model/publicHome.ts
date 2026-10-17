import {existingPalette,catalog} from './catalog';
import type {Neighbor} from './neighborhood';
import type {VillageHome} from './village';
import type {Dimensions,Room,Building,Wall,Opening,PlacedItem} from './types';
export function publicHome(n:Neighbor,d:Dimensions):VillageHome{
 const k=n.style-12,rooms:Room[]=[],walls:Wall[]=[],items:PlacedItem[]=[],b:Building={id:n.id+'-main',name:n.name,x:n.x+.7,z:n.z+.7,w:[15.8,22.6,20.4,10.2][k],d:n.houseDepth,base:.12,height:n.height,rise:[.34,.05,.06,.75][k],roof:k===0?'metal':'tile',ridge:'x'};let count=0;
 const palette={...existingPalette,facade:['#c5ad8b','#e1d9c8','#ecf0e9','#b5a08a'][k],brick:n.color,roof:n.roof,metalRoof:n.roof,interior:['#e2d4b8','#e6e2d7','#ecf3ef','#dfd3bb'][k],floor:['#b4ac92','#c8c7b8','#d4e0da','#c9bba1'][k],frame:['#53675f','#765b48','#b1c9c4','#65594c'][k]};
 const door=(start:number,width=1):Opening=>({start,width,kind:'door',bottom:0,height:2.3});const window=(start:number,width:number):Opening=>({start,width,kind:'window',bottom:.9,height:1.55});
 const wall=(ax:number,az:number,bx:number,bz:number,facing:Wall['facing'],openings:Opening[]=[],exterior=true)=>walls.push({id:n.id+'-wall-'+count++,building:b.id,a:[ax,az],b:[bx,bz],facing,openings,exterior,height:b.height,thickness:exterior?.2:.12});
 const room=(id:string,name:string,x:number,z:number,w:number,depth:number):Room=>{const r:Room={id:n.id+'-'+id,name:n.name+' · '+name,x,z,w,d:depth,building:b.id,kind:'room',confidence:'estimated',note:'根据真实乡村设施特征重新设计，可进入互动'};rooms.push(r);return r;};
 const add=(r:Room,type:string,u:number,v:number,rotation=0)=>{const c=catalog.find(c=>c.id===type);if(!c)throw Error('Unknown public furniture '+type);items.push({id:r.id+'-'+type+'-'+items.length,type,room:r.id,x:r.x+r.w*u,z:r.z+r.d*v,rotation,scale:1,color:c.color,locked:true,unitPrice:0,note:n.name+'专用陈设'});};
 const {x,z,w,d:depth}=b;let front:Opening[]=[];
 if(k===0){const split=w*.72,h=room('hall','杂货零售与收银',x,z,split,depth),back=room('back','粮油仓储',x+split,z,w-split,depth);
  front=[window(.35,2.5),door(4.1,1.7),window(6.3,3.9),window(split+.55,2.8)];wall(x+split,z,x+split,z+depth,'east',[door(depth*.56,1.1)],false);
  for(const u of [.16,.5,.84])add(h,'shop-shelf',u,.11);for(const u of [.27,.7])add(h,'shop-shelf',u,.43,180);add(h,'checkout',.81,.79);add(h,'display-fridge',.11,.76);add(h,'wood-stool',.8,.65);add(h,'laundry-basket',.56,.78);add(back,'rack',.5,.12);add(back,'rack',.85,.57,90);add(back,'rice-sacks',.33,.65);add(back,'crate',.68,.86);
 }
 if(k===1){const rear=depth*.52,h=room('hall','便民服务大厅',x,z+rear,w,depth-rear),meeting=room('back','村民议事室',x,z,w*.57,rear),office=room('office','阅读与办公',x+w*.57,z,w*.43,rear);
  front=[window(.5,5.3),door(w/2-1,2),window(w-5.8,5.3)];wall(x,z+rear,x+w,z+rear,'south',[door(3.2,1.1),door(w*.73,1.1)],false);wall(x+w*.57,z,x+w*.57,z+rear,'east',[door(rear*.5,1)],false);
  add(h,'service-counter',.28,.23);add(h,'office-chair',.2,.1);add(h,'office-chair',.38,.1);add(h,'waiting-seat',.73,.72);add(h,'noticeboard',.77,.05);add(h,'planter',.1,.8);add(meeting,'conference-table',.5,.5);for(const u of [.25,.5,.75]){add(meeting,'dining-chair',u,.28,180);add(meeting,'dining-chair',u,.76);}add(office,'desk',.5,.22);add(office,'office-chair',.5,.43);add(office,'bookshelf',.15,.13);add(office,'bookshelf',.85,.13);add(office,'armchair',.72,.77);
 }
 if(k===2){const rear=depth*.52,split=w*.43,h=room('hall','候诊与登记',x,z+rear,split,depth-rear),consult=room('consult','独立诊疗室',x+split,z+rear,w-split,depth-rear),treat=room('back','观察与治疗',x,z,split,rear),pharmacy=room('pharmacy','药房',x+split,z,w-split,rear);
  front=[door(1.1,1.5),window(3.2,3.8),window(split+1,w-split-2)];wall(x+split,z,x+split,z+depth,'east',[door(rear+1.5,1.1)],false);wall(x,z+rear,x+w,z+rear,'south',[door(2,1.1),door(split+3,1.1)],false);
  add(h,'waiting-seat',.43,.24);add(h,'waiting-seat',.68,.73);add(h,'clinic-registration',.81,.45);add(consult,'clinic-desk',.68,.28);add(consult,'office-chair',.68,.12);add(consult,'dining-chair',.68,.47,180);add(consult,'exam-bed',.22,.62);add(consult,'medicine-cabinet',.89,.76);add(treat,'exam-bed',.28,.34);add(treat,'exam-bed',.72,.34);add(treat,'clinic-cart',.5,.82);add(pharmacy,'medicine-cabinet',.2,.11);add(pharmacy,'medicine-cabinet',.5,.11);add(pharmacy,'medicine-cabinet',.8,.11);add(pharmacy,'pharmacy-counter',.5,.72);add(pharmacy,'sink',.88,.72);
 }
 if(k===3){const cut=depth*.32,h=room('hall','镜台与理发区',x,z+cut,w,depth-cut),wash=room('back','洗发与毛巾间',x,z,w,cut);
  front=[window(.3,3.5),door(4.2,1.25),window(6,3.8)];wall(x,z+cut,x+w,z+cut,'south',[door(w-.2-1,1)],false);
  for(const u of [.24,.66]){add(h,'salon-station',u,.08);add(h,'salon-chair',u,.39,180);}add(h,'bench',.77,.86,180);add(h,'floor-lamp',.9,.85);add(wash,'salon-basin',.27,.3);add(wash,'salon-basin',.65,.3);add(wash,'towel-cabinet',.72,.79);add(wash,'wood-stool',.49,.73);
 }
 wall(x,z,x+w,z,'north');wall(x,z+depth,x+w,z+depth,'south',front);wall(x,z,x,z+depth,'west');wall(x+w,z,x+w,z+depth,'east');
 const yard:Room={id:n.id+'-yard',name:n.name+' · 门前',building:'yard',kind:'yard',x:n.x,z:n.z,w:n.w,d:n.depth,confidence:'estimated',note:'门前生活空间'};rooms.push(yard);add(yard,k===0?'rice-sacks':'planter',.15,.84);add(yard,'garden-chair',.35,.87);if(k===0)add(yard,'crate',.77,.68);
 return {n,layout:{rooms,walls,buildings:[b],dividerZ:n.z+n.depth,gateX:n.x+n.w/2,innerY:.08,terraceY:.08,terraceDepth:0},plan:{id:n.id,name:n.name,version:2,updated:'village-0.10',dimensions:d,palette,style:'existing',items,roomColors:{}}};
}
