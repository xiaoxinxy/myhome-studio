export const motionFrameLimit=.16;
export function motionSubsteps(delta:number){const elapsed=Math.min(motionFrameLimit,Math.max(0,delta)),count=Math.max(1,Math.ceil(elapsed/(1/60)));return{elapsed,count,step:elapsed/count};}
export type FrameSummary={fps:number;frameMs:number;p95Ms:number;maxMs:number;slowFrames:number};
export class FrameWindow{
 private samples:number[]=[];
 add(seconds:number){if(Number.isFinite(seconds)&&seconds>0)this.samples.push(seconds*1000);}
 clear(){this.samples.length=0;}
 flush():FrameSummary|null{if(!this.samples.length)return null;const samples=this.samples.sort((a,b)=>a-b),frameMs=samples.reduce((a,b)=>a+b)/samples.length,result={fps:Math.round(1000/frameMs),frameMs,p95Ms:samples[Math.min(samples.length-1,Math.floor(samples.length*.95))],maxMs:samples.at(-1)!,slowFrames:samples.filter(ms=>ms>50).length};this.clear();return result;}
}
