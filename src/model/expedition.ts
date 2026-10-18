// Metres throughout. Landmarks share a fictional park, not a geographic replica.
export const outerBounds={minX:-850,maxX:1600,minZ:0,maxZ:1800};
export type Landmark={id:string;name:string;x:number;z:number;w:number;d:number;h:number;arrival:{x:number;z:number};description:string};
export const landmarks:Landmark[]=[
 {id:'pyramid',name:'吉萨金字塔',x:-440,z:650,w:230,d:230,h:146.5,arrival:{x:-440,z:790},description:'原始高度 146.5 m · 方底边长约 230 m · 外观雏形'},
 {id:'eiffel',name:'埃菲尔铁塔',x:100,z:650,w:125,d:125,h:330,arrival:{x:100,z:740},description:'含天线高 330 m · 底部宽 125 m · 可穿行塔脚'},
 {id:'pisa',name:'比萨斜塔',x:510,z:650,w:16,d:16,h:58.36,arrival:{x:510,z:688},description:'高约 58.36 m · 柱廊与倾斜外形雏形'},
 {id:'louvre',name:'卢浮宫与玻璃金字塔',x:-320,z:1170,w:330,d:220,h:28,arrival:{x:-320,z:1220},description:'宫殿体量为游戏估算 · 玻璃金字塔约高 21 m、宽 34 m · 可进入简化展厅'},
 {id:'tiananmen',name:'天安门城楼',x:480,z:1170,w:83,d:42,h:34.7,arrival:{x:480,z:1235},description:'城楼总高约 34.7 m · 重檐、城台和五个门洞 · 外观雏形'},
];
export function landmarkAt(x:number,z:number){return landmarks.find(l=>Math.abs(x-l.x)<l.w/2+70&&Math.abs(z-l.z)<l.d/2+80);}
export function outerRoads(){return [
 {id:'outer-access',ax:122,az:36.8,bx:1400,bz:36.8,width:10,surface:'asphalt' as const},
 {id:'outer-east',ax:1400,az:36.8,bx:1400,bz:1660,width:14,surface:'asphalt' as const},
 {id:'outer-south',ax:-730,az:1660,bx:1400,bz:1660,width:14,surface:'asphalt' as const},
 {id:'outer-west',ax:-730,az:260,bx:-730,bz:1660,width:14,surface:'asphalt' as const},
 {id:'outer-north',ax:-730,az:260,bx:1400,bz:260,width:14,surface:'asphalt' as const},
 {id:'outer-spine',ax:850,az:260,bx:850,bz:1660,width:12,surface:'asphalt' as const},
 {id:'outer-monuments',ax:-730,az:830,bx:1400,bz:830,width:12,surface:'asphalt' as const},
 {id:'outer-museums',ax:-730,az:1340,bx:1400,bz:1340,width:12,surface:'asphalt' as const},
 ];}
// Rectangular pieces, including open tower feet and the Louvre gallery entrance.
export function landmarkSolids(){const out:{id:string;x:number;z:number;w:number;d:number;h:number}[]=[];const add=(id:string,x:number,z:number,w:number,d:number,h:number)=>out.push({id,x,z,w,d,h});
 add('pyramid',-440,650,230,230,146.5);add('pisa',510,650,17,17,58.36);
 for(const x of [-1,1])for(const z of [-1,1])add('eiffel-foot',100+x*56,650+z*56,13,13,20);
 // Palace's public south gallery has a central doorway, display rooms are walkable.
 const lx=-320,lz=1170;for(const x of [-1,1]){add('louvre-wing',lx+x*160,lz,10,220,28);add('louvre-front',lx+x*94,lz+105,132,8,26);}add('louvre-back',lx,lz-105,330,12,28);
 add('glass-pyramid',lx,lz+24,34,34,21);
 // Five passages through the gate plinth; all stay at ground level.
 let cursor=-41.5;for(const c of [-28,-14,0,14,28]){const edge=c-3.2;add('gate-pier',480+(cursor+edge)/2,1170,edge-cursor,42,11);cursor=c+3.2;}add('gate-pier',480+(cursor+41.5)/2,1170,41.5-cursor,42,11);
 return out;}
