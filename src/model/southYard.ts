import type {Dimensions} from './types';
export type YardRect={x:number;z:number;w:number;d:number};
export function southYard(d:Dimensions){
 const yard={x:0,z:d.depth+13.2,w:d.width,d:d.depth*.6};
 const coop={x:yard.w/2,z:yard.z,w:yard.w/2,d:yard.d/3};
 const gate={x:yard.w/2,z:yard.z,w:2.4};
 const beds:YardRect[]=[];
 // Leave a continuous central path, a cross path, and a poultry run by the shed.
 for(let side=0;side<2;side++)for(let row=0;row<3;row++){
  if(side===1&&row===0)continue;
  beds.push({x:side===0?1:yard.w/2+1.5,z:yard.z+1+row*(yard.d-2)/3,w:yard.w/2-2.5,d:(yard.d-2)/3-1.1});
 }
 return{...yard,coop,gate,beds};
}
export function southYardLocation(x:number,z:number,d:Dimensions){const y=southYard(d);if(x<0||x>y.w||z<y.z||z>y.z+y.d)return null;return x>=y.coop.x&&z<=y.coop.z+y.coop.d?'南院 · 鸡棚':'南院 · 菜园与鸡鹅';}
