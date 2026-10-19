import {memo,useEffect,useState} from 'react';
import {renderTiming} from '../render/RenderBudget';
import {useHome} from '../store';
export default memo(function FrameStatus(){const ready=useHome(s=>s.sceneReady),[fps,setFps]=useState(0);useEffect(()=>{const timer=setInterval(()=>setFps(renderTiming.fps),1200);return()=>clearInterval(timer);},[]);return <button className="frame-status" title="切换到流畅优先" onClick={()=>useHome.setState({quality:'performance',notice:'已切换流畅优先，弱设备会自动降低渲染分辨率'})}>{ready?(fps||'…')+' FPS':'准备画质…'} <span>· 流畅优先</span></button>;});
