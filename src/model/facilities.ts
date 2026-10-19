import {catalog} from './catalog';
import {landmarks,ticketPoint} from './expedition';
import type {PlacedItem,Room,Layout} from './types';
export type Facility={id:string;name:string;x:number;z:number;w:number;d:number;color:string;roof:string;kind:string};
export const facilities:Facility[]=[
 {id:'depot',name:'村庄客运站',x:145,z:10,w:28,d:15,color:'#d9cbb1',roof:'#647f81',kind:'bus'},
 {id:'post',name:'邮政与快递驿站',x:300,z:21,w:17,d:11,color:'#d4d8c0',roof:'#577c68',kind:'post'},
 {id:'repair',name:'农机与车辆维修',x:332,z:65,w:23,d:17,color:'#c7b59e',roof:'#7f9297',kind:'repair'},
 {id:'tea',name:'槐树下茶馆',x:300,z:125,w:21,d:15,color:'#d4c1a2',roof:'#8a6a53',kind:'tea'},
 {id:'school',name:'乡村文化学堂',x:295,z:190,w:31,d:20,color:'#e0d5b7',roof:'#8d6f5a',kind:'school'},
 {id:'market',name:'四季农贸集市',x:321,z:239,w:34,d:18,color:'#d5c2a4',roof:'#8d9c78',kind:'market'},
 {id:'public-wc',name:'游客公共卫生间',x:373,z:313,w:11,d:9,color:'#c9d1c0',roof:'#748476',kind:'wc'},
 ...landmarks.map(l=>{const p=ticketPoint(l);return{id:'ticket-'+l.id,name:l.name+' · 游客售票厅',x:p.x-4,z:p.z-3,w:8,d:6,color:l.id==='pyramid'?'#c9b08b':'#d6c7af',roof:l.id==='tiananmen'?'#a88b49':'#66878a',kind:'ticket'};}),
];
export const facilityRooms:Room[]=facilities.map(f=>({id:'facility-'+f.id,name:f.name,building:f.id,kind:'room',x:f.x,z:f.z,w:f.w,d:f.d,confidence:'estimated',note:'可进入的村庄公共设施与游客服务'}));
export function facilityWallPieces(f:Facility){const mid=f.x+f.w/2;return[{ax:f.x,az:f.z,bx:f.x+f.w,bz:f.z},{ax:f.x,az:f.z,bx:f.x,bz:f.z+f.d},{ax:f.x+f.w,az:f.z,bx:f.x+f.w,bz:f.z+f.d},{ax:f.x,az:f.z+f.d,bx:mid-1.1,bz:f.z+f.d},{ax:mid+1.1,az:f.z+f.d,bx:f.x+f.w,bz:f.z+f.d}];}
let items:PlacedItem[]|undefined;
export function facilityItems(){if(items)return items;items=[];const add=(f:Facility,type:string,u:number,v:number,rotation=0)=>{const def=catalog.find(c=>c.id===type);if(!def)return;items!.push({id:'facility-'+f.id+'-'+items!.length,type,room:'facility-'+f.id,x:f.x+f.w*u,z:f.z+f.d*v,rotation,scale:1,color:def.color,locked:true,unitPrice:0,note:f.name});};
 for(const f of facilities){
  if(f.kind==='tea'){for(const u of [.23,.7])for(const v of [.3,.72]){add(f,'round-tea',u,v);add(f,'garden-chair',u-.09,v,90);add(f,'garden-chair',u+.09,v,270);}add(f,'cabinet',.9,.15);}
  else if(f.kind==='school'){for(let row=0;row<3;row++)for(let col=0;col<5;col++){add(f,'desk',.15+col*.16,.32+row*.23);add(f,'dining-chair',.15+col*.16,.38+row*.23,180);}add(f,'bookshelf',.09,.11);}
  else if(f.kind==='repair'){add(f,'rack',.12,.15);add(f,'rack',.84,.13);add(f,'workbench',.5,.14);add(f,'trike',.65,.6);add(f,'crate',.15,.8);}
  else if(f.kind==='market'){for(let i=0;i<5;i++){add(f,'shop-shelf',.12+i*.18,.16);add(f,'crate',.12+i*.18,.7);}add(f,'checkout',.85,.8);}
  else if(f.kind==='wc'){add(f,'sink',.18,.3);add(f,'toilet',.78,.3);add(f,'cabinet',.18,.12);}
  else{add(f,'checkout',.72,.28);add(f,'desk',.3,.22);add(f,'office-chair',.3,.13);add(f,'waiting-seat',.22,.73);if(f.w>12){add(f,'waiting-seat',.65,.65);add(f,'rack',.12,.18);add(f,'crate',.83,.2);}}
 }return items;
}
export function facilityRoom(id:string){return facilityRooms.find(r=>r.id===id);}
export function facilityLayout():Layout{return{rooms:facilityRooms,walls:[],buildings:facilities.map(f=>({id:f.id,name:f.name,x:f.x,z:f.z,w:f.w,d:f.d,base:.08,height:3.25,rise:.5,roof:'metal',ridge:'x'})),dividerZ:0,gateX:0,innerY:.08,terraceY:.08,terraceDepth:0};}
export const plaza={x:150,z:230,w:110,d:46};
