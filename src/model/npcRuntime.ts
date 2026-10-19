export type NpcActivity='stand'|'walk'|'sit'|'talk'|'work'|'play'|'examine'|'sweep'|'lie';
export type NpcProfile={id:string;name:string;occupation:string;personality:string;home:string;appearance:number};
export type NpcRuntime={profile:NpcProfile;x:number;y:number;z:number;yaw:number;activity:NpcActivity;phase:number;moving:boolean;pauseUntil:number;destination:string;supportItem?:string};
let revision=0;
class AgentMap extends Map<string,NpcRuntime>{override set(k:string,v:NpcRuntime){revision++;return super.set(k,v);}override delete(k:string){revision++;return super.delete(k);}override clear(){revision++;super.clear();}}
export const npcAgents=new AgentMap();
const agentCells=new Map<string,NpcRuntime[]>();let indexed=-1,lastIndex=-Infinity;
export function nearbyAgents(x:number,z:number,r:number){const now=performance.now();if(indexed!==revision||now-lastIndex>16){agentCells.clear();for(const a of npcAgents.values()){const key=Math.floor(a.x/16)+':'+Math.floor(a.z/16);let cell=agentCells.get(key);if(!cell){cell=[];agentCells.set(key,cell);}cell.push(a);}indexed=revision;lastIndex=now;}
 const result:NpcRuntime[]=[];for(let i=Math.floor((x-r-1)/16);i<=Math.floor((x+r+1)/16);i++)for(let j=Math.floor((z-r-1)/16);j<=Math.floor((z+r+1)/16);j++)for(const a of agentCells.get(i+':'+j)||[])if(Math.abs(a.x-x)<r+1&&Math.abs(a.z-z)<r+1)result.push(a);return result;
}
export type DialogueContext={profile:NpcProfile;activity:NpcActivity;time:number;weather:string;history:{role:'user'|'assistant';text:string}[];text:string};
export interface NpcDialogueProvider{reply(context:DialogueContext,signal:AbortSignal):Promise<string>}
const localProvider:NpcDialogueProvider={async reply(c){const job=c.profile.occupation;if(/车|景|旅游/.test(c.text))return '村口和客运站都有旅游大巴，环线经过铁塔、斜塔、城楼、卢浮宫和金字塔。先到售票厅领取参观票，观景台有电梯入口。';if(/名字|你是|介绍/.test(c.text))return '我叫'+c.profile.name+'，在这里'+job+'。'+c.profile.personality+'，平时住在'+c.profile.home+'。';if(/忙|干什么|工作/.test(c.text))return '我现在在'+({sit:'坐着歇脚',talk:'和街坊聊天',work:'干活',play:'玩耍',examine:'照看候诊的人',sweep:'打扫院子',walk:'去下一个地方',lie:'躺着休息',stand:'等一会儿'}[c.activity])+'。'+(/医生/.test(job)?'大家按叫号顺序来，这里的看病是游戏里的生活场景。':/农|园/.test(job)?'天气好的时候就把院子和菜畦收拾一下。':'等手上的事忙完，咱们可以坐下聊聊。');if(/你好|您好|嗨/.test(c.text))return c.history.length>2?'又见面了！刚才我们已经聊过，今天村里挺热闹。':'你好呀！我是'+c.profile.name+'，有空到村里走走。';return '嗯，我听到了。'+c.profile.name+'想了想：'+(c.weather==='rain'?'今天下雨，先到屋檐下聊。':c.time>18?'时候不早了，忙完就准备回家。':'我平时最熟悉'+job+'的事，你也可以问问我正在忙什么，或者怎么坐车去景点。');}};
let provider=localProvider;
// Future AI integration swaps an authenticated server-side provider. API keys
// must not be embedded into the APK. Citizens already have stable identities,
// schedules, activity context and individual conversation history.
export function setNpcDialogueProvider(next:NpcDialogueProvider|null){provider=next||localProvider;}
export function npcReply(c:DialogueContext,signal:AbortSignal){return provider.reply(c,signal);}
