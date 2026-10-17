import type {Dimensions,Layout,Room,Wall,Opening,Building,Rect} from './types';
export const initialDimensions:Dimensions={width:22,depth:30,mainDepth:5.4,wingWidth:4.8,wingLength:11.8,wallHeight:3.15,roofRise:1.15};
export function checkDimensions(d:Dimensions){if(!d||!Object.values(d).every(Number.isFinite))throw Error('尺寸数据无效');if(d.width<18||d.width>32||d.depth<26||d.depth>42||d.mainDepth<4||d.mainDepth>7||d.wingWidth<3.6||d.wingWidth>6||d.wingLength<3||d.wingLength>30||d.wallHeight<2.5||d.wallHeight>4.5||d.roofRise<.3||d.roofRise>2)throw Error('尺寸超出支持范围');if(d.width-2*d.wingWidth<7||d.depth-8-d.mainDepth-4.8<7)throw Error('院落空间不足，请调整房屋长度或院深');return{...d,wingLength:d.depth-8-d.mainDepth-4.8};}
export function buildLayout(d:Dimensions):Layout{
 checkDimensions(d);const W=d.width,D=d.depth,H=d.wallHeight,M=d.mainDepth,S=d.wingWidth,Z=M+4.8,dividerZ=D-8,L=dividerZ-Z;
 const buildings:Building[]=[{id:'main',name:'正房',x:0,z:0,w:W,d:M,base:1.14,height:H,roof:'tile',ridge:'x',rise:d.roofRise},{id:'west',name:'西厢房',x:0,z:Z,w:S,d:L,base:.78,height:H-.3,roof:'metal',ridge:'z',rise:.38},{id:'east',name:'东厢房',x:W-S,z:Z,w:S,d:L,base:.78,height:H-.15,roof:'tile',ridge:'z',rise:d.roofRise*.8},{id:'southwest',name:'西小棚',x:0,z:dividerZ,w:S,d:D-dividerZ,base:0,height:2.45,roof:'metal',ridge:'x',rise:.25},{id:'southeast',name:'东小棚',x:W-S,z:dividerZ+2,w:S,d:D-dividerZ-2,base:0,height:2.45,roof:'metal',ridge:'x',rise:.25},{id:'toiletblock',name:'厕所',x:0,z:D-1.6,w:1.6,d:1.6,base:0,height:2.35,roof:'metal',ridge:'x',rise:.2},{id:'bathhouse',name:'洗澡间',x:W-S,z:dividerZ,w:S,d:2,base:.1,height:2.55,roof:'metal',ridge:'x',rise:.2}];
 const rooms:Room[]=[];const r=(id:string,name:string,building:string,rect:Rect,kind:Room['kind']='room',note='室内陈设、门洞位置待确认')=>rooms.push({...rect,id,name,building,kind,confidence:kind==='yard'?'confirmed':'estimated',note});
 const a=W*.185,b=W*.20,c=W*.23,e=W*.22,f=W-a-b-c-e;
 r('bed-west','西卧室','main',{x:0,z:0,w:a,d:M},'room','用户确认：南墙最西端有门；陈设为示意');r('bed-middle','中卧室','main',{x:a,z:0,w:b,d:M});r('living','客厅','main',{x:a+b,z:0,w:c,d:M});r('bed-east','东卧室','main',{x:a+b+c,z:0,w:e,d:M},'room','用户确认：炕铺满南墙；室内连通门居中');r('small-north','小房间1','main',{x:W-f,z:0,w:f,d:M/6},'room','北侧小房间约占六分之一，门朝南靠西；用途待定');r('small-south','小房间2','main',{x:W-f,z:M/6,w:f,d:M*5/6},'room','南侧较大房间约占六分之五，门朝南靠东；用途待定');
 r('west-room','西厢库房','west',{x:0,z:Z,w:S,d:L},'room','用户确认：库房，内部通间，无隔墙');
 r('kitchen','厨房','east',{x:W-S,z:Z,w:S,d:L/3},'room','用户确认：东厢房最北侧');r('dining','餐屋','east',{x:W-S,z:Z+L/3,w:S,d:L/3},'room','用户确认：东厢房中间');r('guest','客房','east',{x:W-S,z:Z+L*2/3,w:S,d:L/3},'room','用户确认：东厢房最南侧，炕铺满东墙');
 r('west-shed','西小棚','southwest',{x:0,z:dividerZ,w:S,d:D-dividerZ},'shed','依据草图：棚内细节估算');r('east-shed','东小棚','southeast',{x:W-S,z:dividerZ+2,w:S,d:D-dividerZ-2},'shed','依据草图：棚内细节估算');r('bath','洗澡间','bathhouse',{x:W-S,z:dividerZ,w:S,d:2},'bath');
 r('courtyard','内院','yard',{x:S,z:Z,w:W-2*S,d:dividerZ-Z},'yard','照片确认：砖铺地面、两侧步道和果树；种植位置为估算');r('forecourt','前院','yard',{x:S,z:dividerZ,w:W-2*S,d:D-dividerZ},'yard','照片确认：大门与铁皮车棚区域');r('toilet','厕所','toiletblock',{x:0,z:D-1.6,w:1.6,d:1.6},'bath','草图标注，尺寸及外观待确认');
 r('terrace','正房前长条平台','yard',{x:0,z:M,w:W,d:Z-M},'yard','照片及用户确认：由内院上台阶到平台，平台隔开厢房与正房；高差估算');
 const walls:Wall[]=[];let n=0;const wall=(a:[number,number],b:[number,number],facing:Wall['facing'],openings:Opening[]=[],exterior=true,room?:string,height=H,boundary=false)=>walls.push({id:'wall-'+n++,a,b,height,thickness:exterior?.22:.14,exterior,facing,openings,room,boundary});
 const window=(start:number,width:number,bottom=.85,height=1.9):Opening=>({start,width,bottom,height,kind:'window'});const door=(start:number,width=1.05):Opening=>({start,width,bottom:0,height:2.35,kind:'door'});
 for(const building of buildings){const {x,z,w,d:depth,id,height}=building;
   wall([x,z],[x+w,z],'north',[],true,undefined,height);wall([x,z+depth],[x+w,z+depth],'south',[],true,undefined,height);
   wall([x,z],[x,z+depth],'west',[],true,undefined,height);wall([x+w,z],[x+w,z+depth],'east',[],true,undefined,height);
   const fronts=walls.slice(-4);fronts.forEach(wall=>{wall.building=id;});
   if(id==='main'){fronts[1].openings=[];for(const room of rooms.filter(r=>r.building===id&&r.id!=='small-north')){const offset=room.x-x;if(room.id==='living'){fronts[1].openings.push(window(offset+.18,(room.w-1.65)/2-.36),door(W/2-.825,1.65),window(W/2+.825+.18,(room.w-1.65)/2-.36));}else if(room.id==='small-south')fronts[1].openings.push(window(offset+.15,room.w-1.45),door(W-1.05,.9));else if(room.id==='bed-west')fronts[1].openings.push(door(.15,.95),window(1.35,room.w-1.63));else fronts[1].openings.push(window(offset+.28,room.w-.56));}for(const xPos of [a,a+b,a+b+c,W-f]){wall([xPos,0],[xPos,M],'east',[door((M-.9)/2,.9)],false,undefined,height);walls.at(-1)!.building='main';}wall([W-f,M/6],[W,M/6],'south',[door(.12,.85)],false,undefined,height);walls.at(-1)!.building='main';}
   else if(id==='west'){fronts[3].openings=[window(.35,2.1),door(L*.45,1.05),window(L*.66,Math.min(2.4,L*.3-.2))];}
   else if(id==='east'){fronts[2].openings=[];for(let i=0;i<3;i++){const span=L/3;if(i===1){fronts[2].openings.push(window(i*span+.12,span/2-.715),door(i*span+span/2-.475,.95));}else fronts[2].openings.push(window(i*span+.25,span-.5));if(i)wall([x,z+i*span],[x+w,z+i*span],'south',[door(.35,.9)],false,['kitchen','dining','guest'][i],height);}}
   else if(id==='southwest'||id==='southeast'){
    // Keep the outer perimeter and back wall, open the side facing the front yard.
    const remove=[fronts[0],fronts[id==='southwest'?3:2]];
    for(const w of remove)walls.splice(walls.indexOf(w),1);
    if(id==='southwest'){
     // The southwest toilet shares the perimeter; avoid duplicate walls through it.
     fronts[1].a=[1.6,z+depth];fronts[2].b=[x,D-1.6];
    }
   }
   else if(id==='toiletblock'){
    fronts[0].openings=[door(.3,.85)];
   }else fronts[1].openings=[door(w/2-.45,.9)];
 }
 // Separate low perforated walls between the two yards; central opening stays open.
 const vents=(length:number)=>Array.from({length:Math.max(1,Math.floor((length-.5)/.8))},(_,i)=>window(.35+i*.8,.28,1.03,.19));
 wall([0,dividerZ],[W/2-2.1,dividerZ],'south',vents(W/2-2.1),true,undefined,1.45,true);wall([W/2+2.1,dividerZ],[W,dividerZ],'south',vents(W/2-2.1),true,undefined,1.45,true);
 wall([0,M],[0,Z],'west',[],true,undefined,2.05,true);wall([W,M],[W,Z],'east',[],true,undefined,2.05,true);
 const gateWidth=3.6,gateX=W/2-gateWidth/2;
 wall([S,D],[W-S,D],'south',[{start:gateX-S,width:gateWidth,bottom:0,height:2.85,kind:'gate'}],true,undefined,3.05,true);
 return{rooms,walls,buildings,dividerZ,gateX,innerY:.60,terraceY:.96,terraceDepth:Z-M};
}
export function wallParts(w:Wall){const length=Math.hypot(w.b[0]-w.a[0],w.b[1]-w.a[1]);const parts:{start:number;width:number;bottom:number;height:number}[]=[];let cursor=0;for(const o of [...w.openings].sort((a,b)=>a.start-b.start)){if(o.start>cursor)parts.push({start:cursor,width:o.start-cursor,bottom:0,height:w.height});if(o.bottom>0)parts.push({start:o.start,width:o.width,bottom:0,height:o.bottom});if(o.bottom+o.height<w.height)parts.push({start:o.start,width:o.width,bottom:o.bottom+o.height,height:w.height-o.bottom-o.height});cursor=o.start+o.width;}if(cursor<length)parts.push({start:cursor,width:length-cursor,bottom:0,height:w.height});return parts;}
export function elevation(room:Room,layout:Layout){if(room.id==='courtyard')return layout.innerY;if(room.id==='terrace')return layout.terraceY;return layout.buildings.find(b=>b.id===room.building)?.base||0;}

export function roomInnerRect(r:Room,l:Layout):Rect{let west=0,east=0,north=0,south=0;for(const w of l.walls){const horizontal=Math.abs(w.a[1]-w.b[1])<.001;if(horizontal){if(Math.min(w.a[0],w.b[0])>=r.x+r.w-.001||Math.max(w.a[0],w.b[0])<=r.x+.001)continue;if(Math.abs(w.a[1]-r.z)<.001)north=Math.max(north,w.thickness/2);if(Math.abs(w.a[1]-r.z-r.d)<.001)south=Math.max(south,w.thickness/2);}else{if(Math.min(w.a[1],w.b[1])>=r.z+r.d-.001||Math.max(w.a[1],w.b[1])<=r.z+.001)continue;if(Math.abs(w.a[0]-r.x)<.001)west=Math.max(west,w.thickness/2);if(Math.abs(w.a[0]-r.x-r.w)<.001)east=Math.max(east,w.thickness/2);}}return{x:r.x+west,z:r.z+north,w:r.w-west-east,d:r.d-north-south};}
