import {create} from 'zustand';
export type CommunityActivity='shop'|'civic'|'clinic'|'barber'|'field'|'orchard';
export const useCommunity=create<{active:CommunityActivity|null;stock:number;bag:number;vegetables:number;fruit:number;watered:boolean;harvested:boolean;picked:boolean;hair:string;exam:boolean;act:(patch:Partial<Omit<ReturnType<typeof snapshot>,'act'>>)=>void}>(set=>({active:null,stock:8,bag:0,vegetables:0,fruit:0,watered:false,harvested:false,picked:false,hair:'#3c3530',exam:false,act:patch=>set(patch)}));
// Session life state is separate from renovation plans and never moves saved furniture.
function snapshot(){return {active:null as CommunityActivity|null,stock:0,bag:0,vegetables:0,fruit:0,watered:false,harvested:false,picked:false,hair:'',exam:false};}
export function buyGoods(){const s=useCommunity.getState();if(!s.stock)return false;s.act({stock:s.stock-1,bag:s.bag+1});return true;}
export function harvest(){const s=useCommunity.getState();if(!s.watered||s.harvested)return false;s.act({harvested:true,vegetables:s.vegetables+6});return true;}
export function pickFruit(){const s=useCommunity.getState();if(s.picked)return false;s.act({picked:true,fruit:s.fruit+5});return true;}
