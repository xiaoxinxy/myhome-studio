export const natureGrid=48;
export type Mountain={id:string;name:string;x:number;z:number;r:number;h:number;kind:'fuji'|'volcano'|'snow'};
export const mountains:Mountain[]=[{id:'fuji',name:'富士山主题景观',x:-700,z:2400,r:570,h:430,kind:'fuji'},{id:'volcano',name:'赤岩火山',x:700,z:2400,r:430,h:285,kind:'volcano'},{id:'snow-mountain',name:'北境雪山',x:1850,z:2020,r:500,h:570,kind:'snow'}];
export const naturalPlaces=[{id:'fuji',name:'富士山观景营地',x:-700,z:1770,mountain:'fuji'},{id:'volcano',name:'火山地质观景台',x:700,z:1900,mountain:'volcano'},{id:'snow-mountain',name:'雪山登山口',x:1850,z:1450,mountain:'snow-mountain'},{id:'forest',name:'杉木森林步道',x:1100,z:850,mountain:null}];
// A compact game landscape inspired by Fuji's cone and snow cap, not its real elevation.
export function mountainSample(m:Mountain,x:number,z:number){const dx=(x-m.x)/m.r,dz=(z-m.z)/m.r,r=Math.hypot(dx,dz);if(r>=1)return 0;const a=Math.atan2(dx,dz);
 if(m.kind==='volcano'){const rim=Math.pow(.87,.95);return m.h*(r<.075?.56:r<.13?.56+(rim-.56)*(r-.075)/.055:Math.pow(1-r,.95))*(1+.025*Math.sin(a*9)*Math.min(1,Math.max(0,r-.075)*6));}
 if(m.kind==='snow')return m.h*Math.pow(1-r,1.12)*(1+.22*Math.sin(a*5+.6)*Math.sin(r*Math.PI));
 return m.h*Math.pow(1-Math.max(.035,r),1.45)*(1+.035*Math.sin(a*11)*Math.sin(r*Math.PI));}
// Interpolate the exact triangles used by the render mesh; feet follow the visible slope.
export function mountainHeight(m:Mountain,x:number,z:number){if(Math.abs(x-m.x)>=m.r||Math.abs(z-m.z)>=m.r)return 0;const step=2*m.r/natureGrid,u=(x-m.x+m.r)/step,v=(z-m.z+m.r)/step,i=Math.floor(u),j=Math.floor(v),a=u-i,b=v-j,x0=m.x-m.r+i*step,z0=m.z-m.r+j*step;
 const h00=mountainSample(m,x0,z0),h10=mountainSample(m,x0+step,z0),h01=mountainSample(m,x0,z0+step),h11=mountainSample(m,x0+step,z0+step);return a+b<=1?h00+(h10-h00)*a+(h01-h00)*b:h11+(h01-h11)*(1-a)+(h10-h11)*(1-b);}
export function naturalHeight(x:number,z:number){let height=0;for(const m of mountains)height=Math.max(height,mountainHeight(m,x,z));return height;}
export function forestTree(i:number){const col=i%20,row=Math.floor(i/20),x=910+col*18+Math.sin(i*31.1)*5,z=870+row*27+Math.cos(i*17.3)*6;return{x,z,h:7+i%6*.65,skip:Math.abs(x-1100)<10};}
