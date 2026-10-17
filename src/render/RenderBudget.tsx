import {create} from 'zustand';
import {useEffect,useRef} from 'react';
import {useThree,useFrame} from '@react-three/fiber';
import * as THREE from 'three';
import {setSurfaceDetail} from './materials';
import {useHome} from '../store';

export const useRenderDpr=create<{dpr:number}>(()=>({dpr:1}));
export const renderTiming={fps:0,frameMs:0,dpr:1};
export function RenderBudget({sun,revision}:{sun:React.RefObject<THREE.DirectionalLight|null>;revision:string}){
 const quality=useHome(s=>s.quality),walking=useHome(s=>s.walking),{gl,setDpr,size,camera}=useThree();
 const timer=useRef(0),frames=useRef(0),total=useRef(0),shadowTimer=useRef(1),stable=useRef(0),pixelRatio=useRef(1),detail=useRef<boolean|null>(null);
 const max=quality==='high'?Math.min(devicePixelRatio,1.6):quality==='performance'?.9:Math.min(devicePixelRatio,1.15),min=quality==='performance'?.65:.75;
 useEffect(()=>{pixelRatio.current=max;setDpr(max);useRenderDpr.setState({dpr:max});timer.current=0;frames.current=0;total.current=0;stable.current=0;},[max,setDpr,size.width,size.height]);
 useEffect(()=>{if(sun.current){sun.current.shadow.autoUpdate=false;sun.current.shadow.needsUpdate=true;}shadowTimer.current=1;},[revision,quality,sun]);
 useFrame((_,delta)=>{
  if(delta<.001)return;const nextDetail=quality!=='performance'&&camera.position.y<(detail.current===false?12:18);if(nextDetail!==detail.current){detail.current=nextDetail;setSurfaceDetail(nextDetail);}timer.current+=delta;total.current+=delta;frames.current++;
  shadowTimer.current+=delta;
  if(sun.current&&shadowTimer.current>(walking?.5:1.5)){sun.current.shadow.needsUpdate=true;shadowTimer.current=0;}
  if(timer.current<1.5)return;
  const ms=total.current/frames.current*1000;renderTiming.fps=Math.round(1000/ms);renderTiming.frameMs=ms;renderTiming.dpr=gl.getPixelRatio();
  let next=pixelRatio.current;
  if(ms>40){next=Math.max(min,next-.1);stable.current=0;}else if(ms<23){stable.current+=timer.current;if(stable.current>6){next=Math.min(max,next+.05);stable.current=0;}}else stable.current=0;
  if(Math.abs(next-pixelRatio.current)>.01){pixelRatio.current=next;setDpr(next);useRenderDpr.setState({dpr:next});}
  timer.current=0;frames.current=0;total.current=0;
 },-2);
 return null;
}
