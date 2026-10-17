import type {Layout,Wall} from './types';

// Interior partitions in older layouts may not carry an explicit owner.
export function wallBuilding(w:Wall,layout:Layout):string|undefined {
  if(w.boundary)return undefined;
  return w.building||layout.buildings.find(b=>[w.a,w.b].every(([x,z])=>
    x>=b.x-.01&&x<=b.x+b.w+.01&&z>=b.z-.01&&z<=b.z+b.d+.01))?.id;
}

// Facade skirting/stripes must also leave the physical doorway clear.
export function wallBaseSpans(w:Wall):{start:number;width:number}[] {
 const length=Math.hypot(w.b[0]-w.a[0],w.b[1]-w.a[1]),result:{start:number;width:number}[]=[];
 let cursor=0;
 for(const door of w.openings.filter(o=>o.kind!=='window'&&o.bottom===0).sort((a,b)=>a.start-b.start)){
  if(door.start>cursor)result.push({start:cursor,width:door.start-cursor});cursor=door.start+door.width;
 }
 if(cursor<length)result.push({start:cursor,width:length-cursor});return result;
}
