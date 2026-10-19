import {FrameWindow} from '../model/framePacing';
import {walkMotion} from '../walkState';
import {create} from 'zustand';
import {useEffect,useRef} from 'react';
import {useThree,useFrame} from '@react-three/fiber';
import * as THREE from 'three';
import {setSurfaceDetail} from './materials';
import {useHome} from '../store';

export const useRenderDpr=create<{dpr:number}>(()=>({dpr:1}));
export const renderTiming={fps:0,frameMs:0,p95Ms:0,maxMs:0,slowFrames:0,dpr:1,suspended:false};
export function RenderBudget({sun,revision}:{sun:React.RefObject<THREE.DirectionalLight|null>;revision:string}){
 const quality=useHome(s=>s.quality),walking=useHome(s=>s.walking),{gl,setDpr,size,camera,scene}=useThree();
 const pacing=useRef(new FrameWindow()),timer=useRef(0),frames=useRef(0),total=useRef(0),shadowTimer=useRef(1),stable=useRef(0),pixelRatio=useRef(1),detail=useRef<boolean|null>(null),slow=useRef(0),lastEmergency=useRef(-20);
 const max=quality==='high'?Math.min(devicePixelRatio,1.6):quality==='performance'?(walking?.65:.9):Math.min(devicePixelRatio,walking?.8:1.15),min=quality==='performance'?.5:walking&&quality==='balanced'?.6:.75;
 useEffect(()=>{pixelRatio.current=max;setDpr(max);useRenderDpr.setState({dpr:max});timer.current=0;frames.current=0;total.current=0;stable.current=0;},[max,setDpr,size.width,size.height]);
 useEffect(()=>{if(sun.current){sun.current.shadow.autoUpdate=false;sun.current.shadow.needsUpdate=true;}shadowTimer.current=1;},[revision,quality,sun]);
 useEffect(()=>{let cancelled=false;useHome.setState({sceneReady:false});setSurfaceDetail(quality==='high');const prepare=async()=>{const textures=new Map<string,THREE.Texture>();scene.traverse(o=>{const raw=(o as THREE.Mesh).material;if(!raw)return;for(const m of (Array.isArray(raw)?raw:[raw])){const material=m as THREE.MeshStandardMaterial;for(const map of [material.map,material.normalMap,material.roughnessMap,material.emissiveMap])if(map)textures.set([map.source.uuid,map.wrapS,map.wrapT,map.anisotropy].join(':'),map);}});let i=0;for(const texture of textures.values()){if(cancelled)return;gl.initTexture(texture);if(++i%12===0)await new Promise(requestAnimationFrame);}if(!cancelled)await gl.compileAsync(scene,camera);};void prepare().then(()=>{if(!cancelled)useHome.setState({sceneReady:true});},()=>{if(!cancelled)useHome.setState({sceneReady:true,notice:'场景材质将按需准备'});});return()=>{cancelled=true;};},[gl,scene,camera,quality]);
 useEffect(()=>{const visibility=()=>{renderTiming.suspended=document.hidden;timer.current=0;frames.current=0;total.current=0;pacing.current.clear();stable.current=0;slow.current=0;};document.addEventListener("visibilitychange",visibility);return()=>document.removeEventListener("visibilitychange",visibility);},[]);
 useFrame((_,delta)=>{
  if(document.hidden){renderTiming.suspended=true;return;}renderTiming.suspended=false;if(delta<.001)return;pacing.current.add(delta);timer.current+=delta;total.current+=delta;frames.current++;
  shadowTimer.current+=delta;
  if(sun.current&&shadowTimer.current>(walking?8:4)){sun.current.shadow.needsUpdate=true;shadowTimer.current=0;}
  if(timer.current<1.5)return;
  const ms=total.current/frames.current*1000;renderTiming.fps=Math.round(1000/ms);renderTiming.frameMs=ms;renderTiming.dpr=gl.getPixelRatio();Object.assign(renderTiming,pacing.current.flush()||{});
  let next=pixelRatio.current;
  if(ms>40){next=Math.max(Math.min(min,pixelRatio.current),next-.1);stable.current=0;}else if(ms<23){stable.current+=timer.current;if(stable.current>6){next=Math.min(max,next+.05);stable.current=0;}}else stable.current=0;
  if(ms>100)slow.current+=timer.current;else slow.current=0;
  const emergency=walking&&slow.current>3&&performance.now()/1000-lastEmergency.current>10&&pixelRatio.current>.51;
  if(walking&&quality==='high'&&slow.current>6){useHome.setState({quality:'balanced',notice:'设备负载较高，已自动切换均衡画质；顶部可以调整'});slow.current=0;}
  if(emergency){next=Math.max(.5,pixelRatio.current*.7);lastEmergency.current=performance.now()/1000;slow.current=0;}
  if(!emergency&&walking&&(walkMotion.moving||walkMotion.keys.size||Math.abs(walkMotion.stickX)+Math.abs(walkMotion.stickY)>.1))next=pixelRatio.current;
  if(Math.abs(next-pixelRatio.current)>.01){pixelRatio.current=next;setDpr(next);useRenderDpr.setState({dpr:next});}
  timer.current=0;frames.current=0;total.current=0;
 },-2);
 return null;
}
