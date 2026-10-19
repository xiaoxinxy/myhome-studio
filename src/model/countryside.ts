import {naturalHeight} from './nature';
export const hills=Array.from({length:12},(_,i)=>({x:i<6?-820:1520,z:240+i%6*255,rx:70,rz:120,h:22+i%4*9})).filter((_,i)=>i%6!==5);
export const hillGrid=20;
export function hillSample(h:typeof hills[number],x:number,z:number){return Math.max(0,h.h*(1-(x-h.x)**2/h.rx**2-(z-h.z)**2/h.rz**2));}
export function hillHeight(h:typeof hills[number],x:number,z:number){if(Math.abs(x-h.x)>=h.rx||Math.abs(z-h.z)>=h.rz)return 0;const sx=2*h.rx/hillGrid,sz=2*h.rz/hillGrid,u=(x-h.x+h.rx)/sx,v=(z-h.z+h.rz)/sz,i=Math.floor(u),j=Math.floor(v),a=u-i,b=v-j,x0=h.x-h.rx+i*sx,z0=h.z-h.rz+j*sz,p=hillSample(h,x0,z0),q=hillSample(h,x0+sx,z0),r=hillSample(h,x0,z0+sz),s=hillSample(h,x0+sx,z0+sz);return a+b<=1?p+(q-p)*a+(r-p)*b:s+(r-s)*(1-a)+(q-s)*(1-b);}
export function terrainHeight(x:number,z:number){let y=naturalHeight(x,z);for(const h of hills)y=Math.max(y,hillHeight(h,x,z));return y;}
export const farmPatches=Array.from({length:32},(_,i)=>({x:-620+i%8*265,z:690+Math.floor(i/8)*270,w:175,d:160,kind:i%4})).filter(p=>!(p.x>880&&p.x<1300&&p.z>800&&p.z<1450));
