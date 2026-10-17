import {StaticBatch} from './StaticBatch';
import {useRef} from 'react';
import {useFrame} from '@react-three/fiber';
import * as THREE from 'three';
import {Box} from './Primitives';
import {useInteractions} from '../interactions';
import {useHome} from '../store';
import {surface,glass} from './materials';

export function PortalDoor({id,width,height,mode,walking=false,cut=false,appearance="wood"}:{id:string;width:number;height:number;mode:'slide'|'double'|'single';walking?:boolean;cut?:boolean;appearance?:'wood'|'white'|'glass'}){
 const override=useInteractions(s=>s.doors[id]),toggle=useInteractions(s=>s.door),open=override??walking,left=useRef<THREE.Group>(null),right=useRef<THREE.Group>(null),progress=useRef(open?1:0),h=cut?.72:height;
 useFrame((_,delta)=>{if(Math.abs(Number(open)-progress.current)<.00001&&left.current?.userData.settled===open)return;if(left.current)left.current.userData.settled=open;progress.current+=(Number(open)-progress.current)*(1-Math.exp(-delta*9));const t=progress.current;if(mode==='slide'){if(left.current)left.current.position.x=-width/4-t*width*.45;if(right.current)right.current.position.x=width/4+t*width*.45;}else{if(left.current)left.current.rotation.y=-t*Math.PI/2;if(right.current)right.current.rotation.y=t*Math.PI/2;}});
 const leaf=(w:number)=> <StaticBatch revision={mode+width+h+appearance}>{appearance==="glass"?<><Box p={[0,h*.56,0]} s={[w-.09,h*.83,.028]} m={glass}/>{[-1,1].map(q=><Box key={q} p={[q*(w/2-.035),h/2,0]} s={[.045,h,.06]} c="#a4b9b1"/>)}{[.05,h*.18,h-.04].map(y=><Box key={y} p={[0,y,0]} s={[w,.07,.06]} c="#a4b9b1"/>)}<Box p={[0,h*.08,0]} s={[w,h*.16,.055]} c="#acbeb6"/></>:<Box p={[0,h/2,0]} s={[w-.035,h,.06]} m={appearance==="white"?surface('tile','#dce7df',w,h):surface(mode==='single'?'wood':'metal',mode==='double'?'#9dafa9':mode==='slide'?'#52645d':'#baa483',w,h)}/>}<Box p={[0,h*.47,.055]} s={[.03,.25,.045]} c="#d2c7a6"/>{mode==='slide'&&<Box p={[0,h*.75,.035]} s={[w-.1,h*.3,.025]} c="#91a69e"/>}</StaticBatch>;
 return <group name={mode==='slide'?'客厅左右推拉门':mode==='double'?'大门双开门':'房间平开门'} userData={{keepInteractive:true,doorId:id}} onPointerDown={e=>e.stopPropagation()} onClick={e=>{if(e.delta>5)return;e.stopPropagation();toggle(id,!open);useHome.setState({notice:open?'门已关闭':'门已打开'});}}>
  <StaticBatch revision={String(h)+width}>{[-1,1].map(side=><Box key={side} p={[side*width/2,h/2,0]} s={[.06,h,.17]} c="#7c897b"/>)}<Box p={[0,h,0]} s={[width+.1,.06,.17]} c="#7c897b"/></StaticBatch>
  {mode==='slide'?<><Box p={[0,h+.06,0]} s={[width*2,.06,.09]} c="#9ba394"/><group name="左门扇" ref={left} position={[-width/4,0,.02]}>{leaf(width/2)}</group><group name="右门扇" ref={right} position={[width/4,0,-.02]}>{leaf(width/2)}</group></>:<><group name="左门扇" ref={left} position={[-width/2,0,0]}><group position={[mode==='double'?width/4:width/2,0,0]}>{leaf(mode==='double'?width/2:width)}</group></group>{mode==='double'&&<group name="右门扇" ref={right} position={[width/2,0,0]}><group position={[-width/4,0,0]}>{leaf(width/2)}</group></group>}</>}
 </group>;
}
