export type Reaction={hitUntil:number;fleeUntil:number;sourceX:number;sourceZ:number};
export const reactions=new Map<string,Reaction>();
export const encounter={heat:0,lastIncident:0,punchUntil:0,lastTick:0};
export function strike(id:string,source:{x:number;z:number},target:{x:number;z:number},now=Date.now()){
 if(now<encounter.punchUntil||Math.hypot(source.x-target.x,source.z-target.z)>1.9)return false;
 reactions.set(id,{hitUntil:now+650,fleeUntil:now+10000,sourceX:source.x,sourceZ:source.z});
 encounter.punchUntil=now+550;encounter.heat=Math.min(5,encounter.heat+1);encounter.lastIncident=now;return true;
}
export function alarm(source:{x:number;z:number},people:Iterable<{id:string;x:number;z:number}>,now=Date.now()){
 for(const p of people)if(Math.hypot(p.x-source.x,p.z-source.z)<14)reactions.set(p.id,{hitUntil:0,fleeUntil:now+9000,sourceX:source.x,sourceZ:source.z});
 encounter.heat=Math.min(5,encounter.heat+2);encounter.lastIncident=now;
}
export function coolDown(now=Date.now()){if(now-encounter.lastIncident>15000&&now-encounter.lastTick>5000){encounter.heat=Math.max(0,encounter.heat-1);encounter.lastTick=now;}}
