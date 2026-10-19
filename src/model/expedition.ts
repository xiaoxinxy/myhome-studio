// Metres. A compact village tourism district, not the real cities' geography.
export const outerBounds={minX:-1550,maxX:2550,minZ:0,maxZ:3200};
export type Landmark={id:string;name:string;x:number;z:number;w:number;d:number;h:number;arrival:{x:number;z:number};description:string};
export const landmarks:Landmark[]=[
{id:'pyramid',name:'吉萨金字塔',x:-250,z:115,w:230,d:230,h:146.5,arrival:{x:-250,z:260},description:'石灰岩塔身、入口甬道、石室与展陈 · 146.5m原始轮廓'},
{id:'eiffel',name:'埃菲尔铁塔',x:210,z:115,w:125,d:125,h:330,arrival:{x:210,z:205},description:'钢桁架、拱脚、三层观景台 · 可乘电梯观景'},
{id:'pisa',name:'比萨斜塔',x:105,z:250,w:16,d:16,h:58.36,arrival:{x:105,z:287},description:'白色石材柱廊、内部旋梯与钟楼 · 可逐层游览'},
{id:'louvre',name:'卢浮宫与玻璃金字塔',x:-180,z:430,w:330,d:220,h:28,arrival:{x:-180,z:560},description:'雕饰立面、折线屋顶、玻璃金字塔、两翼展厅与艺术品'},
{id:'tiananmen',name:'天安门城楼',x:305,z:350,w:83,d:42,h:34.7,arrival:{x:305,z:408},description:'汉白玉基座、五座券门、重檐琉璃瓦、华表和城楼展厅'},
];
export const landmark=(id:string)=>landmarks.find(l=>l.id===id)!;
export function landmarkAt(x:number,z:number){return landmarks.find(l=>Math.abs(x-l.x)<l.w/2+45&&Math.abs(z-l.z)<l.d/2+65);}
export function outerRoads(){return [
{id:'outer-scenic-west-link',ax:-1320,az:1750,bx:1400,bz:1750,width:10,surface:'asphalt' as const},
{id:'outer-scenic-west',ax:-1320,az:570,bx:-1320,bz:3060,width:10,surface:'asphalt' as const},
{id:'outer-scenic-south',ax:-1320,az:3060,bx:2420,bz:3060,width:10,surface:'asphalt' as const},
{id:'outer-scenic-east',ax:2420,az:570,bx:2420,bz:3060,width:10,surface:'asphalt' as const},
{id:'outer-snow-entry',ax:1400,az:1450,bx:2420,bz:1450,width:8,surface:'asphalt' as const},
{id:'outer-forest-track',ax:1100,az:570,bx:1100,bz:1750,width:5,surface:'earth' as const},
{id:'outer-volcano-entry',ax:700,az:1750,bx:700,bz:1900,width:6,surface:'earth' as const},
{id:'outer-access',ax:122,az:36.8,bx:1400,bz:36.8,width:10,surface:'asphalt' as const},
{id:'outer-east',ax:1400,az:36.8,bx:1400,bz:1660,width:14,surface:'asphalt' as const},
{id:'outer-south',ax:-730,az:1660,bx:1400,bz:1660,width:14,surface:'asphalt' as const},
{id:'outer-west',ax:-730,az:36.8,bx:-730,bz:1660,width:14,surface:'asphalt' as const},
{id:'outer-north',ax:-730,az:570,bx:1400,bz:570,width:12,surface:'asphalt' as const},
{id:'outer-tour-west',ax:-400,az:36.8,bx:-400,bz:570,width:8,surface:'asphalt' as const},
{id:'outer-tour-main',ax:-400,az:285,bx:400,bz:285,width:8,surface:'asphalt' as const},
{id:'outer-tour-east',ax:400,az:36.8,bx:400,bz:570,width:8,surface:'asphalt' as const},
{id:'outer-west-entry',ax:-400,az:36.8,bx:-100,bz:36.8,width:8,surface:'asphalt' as const},
{id:'outer-tower-entry',ax:80,az:215,bx:400,bz:215,width:8,surface:'asphalt' as const},
{id:'outer-museum-entry',ax:80,az:180,bx:80,bz:285,width:7,surface:'asphalt' as const},
{id:'outer-east-court',ax:100,az:420,bx:400,bz:420,width:8,surface:'asphalt' as const},
];}
export type Solid={id:string;x:number;z:number;w:number;d:number;h:number;base?:number};
export function landmarkSolids(){const out:Solid[]=[];const add=(id:string,x:number,z:number,w:number,d:number,h:number,base=0)=>out.push({id,x,z,w,d,h,base});
const p=landmark('pyramid'); // A 6m entrance corridor and a real chamber remain open.
add('pyramid-left',p.x-62.5,p.z,105,230,146.5);add('pyramid-right',p.x+62.5,p.z,105,230,146.5);add('pyramid-back',p.x,p.z-66,20,98,146.5);add('pyramid-corridor-left',p.x-6.5,p.z+62,7,106,4);add('pyramid-corridor-right',p.x+6.5,p.z+62,7,106,4);
const e=landmark('eiffel');for(const x of [-1,1])for(const z of [-1,1])add('eiffel-foot',e.x+x*56,e.z+z*56,13,13,20);
const l=landmark('louvre');for(const x of [-1,1]){add('louvre-wing',l.x+x*163,l.z,4,220,28);add('louvre-inner-wall',l.x+x*143,l.z-22,1,176,6);add('louvre-inner-wall-end',l.x+x*143,l.z+104,1,12,6);add('louvre-front',l.x+x*94,l.z+108,132,2,26);}add('louvre-back',l.x,l.z-105,330,12,28);add('glass-pyramid',l.x,l.z+24,34,34,21);
const t=landmark('tiananmen');let cursor=-41.5;for(const c of [-28,-14,0,14,28]){const edge=c-3.2;add('gate-pier',t.x+(cursor+edge)/2,t.z,edge-cursor,42,11,1);cursor=c+3.2;}add('gate-pier',t.x+(cursor+41.5)/2,t.z,41.5-cursor,42,11,1);
return out;}
export type Deck={id:string;x:number;z:number;w:number;d:number;y:number};
let decks:Deck[]|undefined;
export function landmarkDecks():Deck[]{if(decks)return decks;const e=landmark('eiffel'),t=landmark('tiananmen'),p=landmark('pisa');return decks=[57,115,276].map((y,i)=>({id:'eiffel-'+y,x:e.x,z:e.z,w:[68,44,12][i],d:[68,44,12][i],y:y+1.25})).concat([{id:'gate-deck',x:t.x,z:t.z+15,w:80,d:11,y:12},{id:'gate-gallery',x:t.x,z:t.z,w:62,d:26,y:12},{id:'pisa-top',x:p.x+54.2*Math.sin(.069),z:p.z,w:11,d:11,y:54.2*Math.cos(.069)}]);}
export function ticketPoint(l:Landmark){return{x:l.arrival.x+18,z:l.arrival.z-(l.id==='pisa'?12:4)};}
