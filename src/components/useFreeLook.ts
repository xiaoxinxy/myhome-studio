import {useEffect,useRef,useState} from 'react';
import {walkMotion as m,clearWalkInput} from '../walkState';
import {useHome} from '../store';
export function useFreeLook(){
 const [locked,setLocked]=useState(false),[mode,setMode]=useState<'drag'|'hover'>(()=>localStorage.getItem('courtyard-look-mode')==='hover'?'hover':'drag'),wasLocked=useRef(false),selected=useHome(s=>s.selected);
 useEffect(()=>{if(selected&&document.pointerLockElement)document.exitPointerLock();},[selected]);
 useEffect(()=>{const move=(e:MouseEvent)=>{const lock=!!document.pointerLockElement;if(!lock&&(!(e.target as HTMLElement).closest('.walk-look,canvas')||mode==='drag'&&!(e.buttons&1)))return;if(useHome.getState().selected)return;m.yaw-=e.movementX*.0025;m.pitch=Math.max(-1.04,Math.min(useHome.getState().walkView==='first'?1.95:1.04,m.pitch+e.movementY*.0025));};const change=()=>{wasLocked.current=!!document.pointerLockElement;setLocked(wasLocked.current);clearWalkInput();};document.addEventListener('mousemove',move);document.addEventListener('pointerlockchange',change);return()=>{document.removeEventListener('mousemove',move);document.removeEventListener('pointerlockchange',change);};},[mode]);
 useEffect(()=>()=>{if(document.pointerLockElement)document.exitPointerLock();},[]);
 const toggle=()=>{if(document.pointerLockElement){document.exitPointerLock();return;}const canvas=document.querySelector('canvas');try{const result=canvas?.requestPointerLock();if(result&&typeof result.catch==='function')result.catch(()=>useHome.setState({notice:'此窗口不支持锁定鼠标，可以切换拖动或悬停转向'}));}catch{useHome.setState({notice:'可以切换拖动或悬停转向'});}};
 const toggleMode=()=>{if(document.pointerLockElement)document.exitPointerLock();setMode(v=>{const next=v==='drag'?'hover':'drag';localStorage.setItem('courtyard-look-mode',next);return next;});};
 return{locked,toggle,wasLocked,mode,toggleMode};
}
