import {create} from 'zustand';
import {persist} from 'zustand/middleware';
import {npcAgents,npcReply} from './model/npcRuntime';
import {useHome} from './store';
import {clearWalkInput} from './walkState';
type Message={role:'user'|'assistant';text:string};
let pending:AbortController|null=null;
type ChatState={active:string|null;busy:boolean;journal:Record<string,Message[]>;open:(id:string)=>void;close:()=>void;send:(text:string)=>Promise<void>};
export const useNpcChat=create<ChatState>()(persist( (set,get)=>({active:null,busy:false,journal:{},open:id=>{if(!npcAgents.has(id))return;pending?.abort();pending=null;clearWalkInput();document.exitPointerLock?.();set({active:id,busy:false});},close:()=>{pending?.abort();pending=null;set({active:null,busy:false});clearWalkInput();},send:async text=>{const s=get(),a=npcAgents.get(s.active||'');if(!a||!text.trim()||s.busy)return;const id=a.profile.id,history=s.journal[id]||[],user:Message={role:'user',text:text.trim().slice(0,250)};set({busy:true,journal:{...s.journal,[id]:[...history,user].slice(-20)}});pending=new AbortController();try{const state=useHome.getState(),answer=await npcReply({profile:a.profile,activity:a.activity,time:state.time,weather:state.weather,history,text:user.text},pending.signal);if(get().active===id)set(v=>({busy:false,journal:{...v.journal,[id]:[...(v.journal[id]||[]),{role:'assistant' as const,text:answer}].slice(-20)}}));}catch{if(get().active===id)set({busy:false});}}}),{name:'courtyard-citizen-conversations-v1',partialize:s=>({journal:s.journal}),merge:(saved,current)=>({...current,journal:(saved as {journal?:Record<string,Message[]>})?.journal||{}})}));
