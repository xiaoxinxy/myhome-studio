import {create} from 'zustand';
import {persist} from 'zustand/middleware';
export const useExploration=create(persist<{visited:string[];visit:(id:string)=>void}>(set=>({visited:[],visit:id=>set(s=>({visited:s.visited.includes(id)?s.visited:[...s.visited,id]}))}),{name:'courtyard-exploration-v1'}));
