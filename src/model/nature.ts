// Detailed height field is shared by walking and the nearby render mesh.
export const natureGrid=256, distantNatureGrid=48;
export type Mountain={id:string;name:string;x:number;z:number;r:number;h:number;kind:'fuji'|'volcano'|'snow'};
export const mountains:Mountain[]=[{id:'fuji',name:'富士山主题景观',x:-700,z:2400,r:570,h:430,kind:'fuji'},{id:'volcano',name:'赤岩火山',x:700,z:2400,r:430,h:285,kind:'volcano'},{id:'snow-mountain',name:'北境雪山',x:1850,z:2020,r:500,h:570,kind:'snow'}];
export const naturalPlaces=[{id:'fuji',name:'富士山观景营地',x:-700,z:1770,mountain:'fuji'},{id:'volcano',name:'火山地质观景台',x:700,z:1900,mountain:'volcano'},{id:'snow-mountain',name:'雪山登山口',x:1850,z:1440,mountain:'snow-mountain'},{id:'forest',name:'杉木森林步道',x:1100,z:850,mountain:null}];
// A compact game landscape inspired by Fuji's cone and snow cap, not its real elevation.
export function mountainBase(m:Mountain,x:number,z:number){const dx=(x-m.x)/m.r,dz=(z-m.z)/m.r,r=Math.hypot(dx,dz);if(r>=1)return 0;const a=Math.atan2(dx,dz);
 if(m.kind==='volcano'){const rim=Math.pow(.87,.95);return m.h*(r<.075?.56:r<.13?.56+(rim-.56)*(r-.075)/.055:Math.pow(1-r,.95))*(1+.025*Math.sin(a*9)*Math.min(1,Math.max(0,r-.075)*6));}
 if(m.kind==='snow')return m.h*Math.pow(1-r,1.12)*(1+.22*Math.sin(a*5+.6)*Math.sin(r*Math.PI));
 return m.h*Math.pow(1-Math.max(.035,r),1.45)*(1+.035*Math.sin(a*11)*Math.sin(r*Math.PI));}
export type TrailPoint={x:number;y:number;z:number;distance:number};
export type MountainTrail={id:string;name:string;mountain:Mountain;width:number;points:TrailPoint[];length:number;grid:Map<string,number[]>};
const trailCell=24;
export const mountainTrails:MountainTrail[]=mountains.map(m=>{
 const entry=naturalPlaces.find(p=>p.mountain===m.id)!,points:TrailPoint[]=[];
 const add=(x:number,z:number)=>{const y=mountainBase(m,x,z),last=points.at(-1);points.push({x,y,z,distance:last?last.distance+Math.hypot(x-last.x,y-last.y,z-last.z):0});};
 add(entry.x,entry.z);add(m.x,m.z-m.r);
 const waves=m.kind==='volcano'?3:4,endRadius=m.kind==='volcano'?.125:0;
 for(let i=1;i<=1400;i++){const t=i/1400,r=m.r*(1-(1-endRadius)*t),a=m.kind==='fuji'?Math.PI+Math.sin(t*Math.PI*2*waves)*.92:Math.PI+t*Math.PI*2*(m.kind==='snow'?2.8:2.1);add(m.x+Math.sin(a)*r,m.z+Math.cos(a)*r);}
 if(m.kind==='fuji')add(m.x,m.z-m.r*.045);
 const grid=new Map<string,number[]>();for(let i=0;i<points.length-1;i++){const a=points[i],b=points[i+1],pad=14;for(let x=Math.floor((Math.min(a.x,b.x)-pad)/trailCell);x<=Math.floor((Math.max(a.x,b.x)+pad)/trailCell);x++)for(let z=Math.floor((Math.min(a.z,b.z)-pad)/trailCell);z<=Math.floor((Math.max(a.z,b.z)+pad)/trailCell);z++){const key=x+':'+z;if(!grid.has(key))grid.set(key,[]);grid.get(key)!.push(i);}}
 return{id:m.id,name:m.kind==='volcano'?'火山盘山路':m.kind==='snow'?'雪山盘山路':'富士折返登山道',mountain:m,width:m.kind==='fuji'?6:8,points,length:points.at(-1)!.distance,grid};
});
export function trailAt(t:MountainTrail,x:number,z:number){let best=Infinity,result:{x:number;y:number;z:number;distance:number;progress:number;index:number;sideX:number;sideZ:number}|null=null;
 for(const i of t.grid.get(Math.floor(x/trailCell)+':'+Math.floor(z/trailCell))||[]){const a=t.points[i],b=t.points[i+1],dx=b.x-a.x,dz=b.z-a.z,l2=dx*dx+dz*dz,k=Math.max(0,Math.min(1,((x-a.x)*dx+(z-a.z)*dz)/l2)),px=a.x+dx*k,pz=a.z+dz*k,d=Math.hypot(x-px,z-pz);if(d>=best)continue;best=d;const length=Math.sqrt(l2);result={x:px,z:pz,y:a.y+(b.y-a.y)*k,distance:d,progress:a.distance+(b.distance-a.distance)*k,index:i,sideX:dz/length,sideZ:-dx/length};}return result;
}
// Cut a broad shoulder around each winding path, rather than lay a road on an
// unmodified steep cone. Physics uses the same resulting triangles as rendering.
export function mountainSample(m:Mountain,x:number,z:number){const base=mountainBase(m,x,z),trail=mountainTrails.find(t=>t.mountain===m)!,near=trailAt(trail,x,z);if(!near||near.distance>=14)return base;const blend=Math.max(0,Math.min(1,(14-near.distance)/10)),k=blend*blend*(3-2*blend);return base+(near.y-base)*k;}
const heightGrids=new WeakMap<Mountain,Float32Array>();
export function mountainGrid(m:Mountain){let data=heightGrids.get(m);if(!data){data=new Float32Array((natureGrid+1)**2);const step=m.r*2/natureGrid;for(let j=0;j<=natureGrid;j++)for(let i=0;i<=natureGrid;i++)data[j*(natureGrid+1)+i]=mountainSample(m,m.x-m.r+i*step,m.z-m.r+j*step);heightGrids.set(m,data);}return data;}
// Interpolate the exact triangles used by the render mesh; feet follow the visible slope.
export function mountainHeight(m:Mountain,x:number,z:number){if(Math.abs(x-m.x)>=m.r||Math.abs(z-m.z)>=m.r)return 0;const step=2*m.r/natureGrid,u=(x-m.x+m.r)/step,v=(z-m.z+m.r)/step,i=Math.floor(u),j=Math.floor(v),a=u-i,b=v-j,data=mountainGrid(m),k=j*(natureGrid+1)+i;
 const h00=data[k],h10=data[k+1],h01=data[k+natureGrid+1],h11=data[k+natureGrid+2];return a+b<=1?h00+(h10-h00)*a+(h01-h00)*b:h11+(h01-h11)*(1-a)+(h10-h11)*(1-b);}
export function naturalHeight(x:number,z:number){let height=0;for(const m of mountains)height=Math.max(height,mountainHeight(m,x,z));return height;}
export function forestTree(i:number){const col=i%20,row=Math.floor(i/20),x=910+col*18+Math.sin(i*31.1)*5,z=870+row*27+Math.cos(i*17.3)*6;return{x,z,h:7+i%6*.65,skip:Math.abs(x-1100)<10};}
