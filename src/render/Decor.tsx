import {Box,Cylinder,Sphere} from './Primitives';
import {glow,solid,surface} from './materials';
import type {ItemDef} from '../model/types';

export function Flowers({length=1}:{length?:number}){return <group>{Array.from({length:7},(_,i)=><group key={i} position={[(i/6-.5)*length,0,Math.sin(i*2)*.18]}><Cylinder p={[0,.16,0]} r={.008} h={.32+(i%2)*.07} c="#6b8655"/><Sphere p={[.03,.12,0]} s={[.07,.022,.025]} c="#7c9561"/>{[0,1,2,3].map(j=><Sphere key={j} p={[Math.sin(j*Math.PI/2)*.035,.33+(i%2)*.07,Math.cos(j*Math.PI/2)*.035]} s={[.041,.026,.038]} c={['#d8ad95','#ddd1a1','#bc9eab'][i%3]}/>)}<Sphere p={[0,.35+(i%2)*.07,0]} s={[.02,.02,.02]} c="#c2a253"/></group>)}</group>}
export function TreePit({long=false}:{long?:boolean}){const w=long?3.25:1.65,d=long?1.25:1.65,m=surface('brick','#667d88',w,.23);return <group name={long?'石榴长条蓝砖花池':'蓝砖树坑'}><Box p={[0,.025,0]} s={[w-.15,.05,d-.15]} c="#695f48"/>{[-1,1].map(side=><group key={side}><Box p={[0,.115,side*d/2]} s={[w,.23,.13]} m={m}/><Box p={[side*w/2,.115,0]} s={[.13,.23,d]} m={surface('brick','#667d88',d,.23)}/></group>)}{long&&<><group position={[0,.05,-.4]}><Flowers length={2.8}/></group>{[-1,1].map(side=><group key={side} position={[side*1.05,.05,.35]}><Flowers length={.5}/></group>)}</>}</group>}

export function Decoration({def:c,color}:{def:ItemDef;color:string}){const{w,d,h}=c,wood=surface('wood',color,w,h);
 switch(c.model){
  case 'curtain-kang':return <group position={[0,.85,0]}><Decoration def={{...c,model:'curtain'}} color={color}/></group>;
  case 'rack':return <group>{[-1,1].flatMap(x=>[-1,1].map(z=><Box key={x+','+z} p={[x*(w/2-.035),h/2,z*(d/2-.035)]} s={[.05,h,.05]} c="#697b72"/>))}{[0,1,2,3].map(i=><group key={i}><Box p={[0,.08+i*h*.23,0]} s={[w,.045,d]} c="#8e9c8a"/>{i<3&&[-1,1].map(x=><group key={x} position={[x*w*.24,.27+i*h*.23,0]}><Box s={[w*.39,.32,d*.83]} m={surface('wood',i%2?'#9c947b':'#b9a68a')}/><Box p={[0,0,d*.42]} s={[.16,.07,.005]} c="#e2dbbe"/></group>)}</group>)}</group>;
  case 'crate':return <group><Box p={[0,h/2,0]} s={[w,h,d]} m={wood}/>{[-1,1].map(side=><Box key={side} p={[side*w*.28,h/2,d/2+.005]} s={[.05,h,.02]} c="#82735b"/>)}<Box p={[0,h*.65,d/2+.015]} s={[.14,.07,.015]} c="#e4dcc0"/></group>;
  case 'pendant':return <group><Cylinder p={[0,h-.45,0]} r={.012} h={.7} c="#5c6256"/><mesh position={[0,h-.86,0]} castShadow><cylinderGeometry args={[w*.2,w*.48,.24,16]}/><meshStandardMaterial color={color} roughness={.8}/></mesh><Cylinder p={[0,h-.99,0]} r={w*.43} h={.02} c="#f2e6c5" m={glow}/><Box p={[0,h-.08,0]} s={[.12,.05,.12]} c="#6a725f"/></group>;
  case 'curtain':return <group><Box p={[0,h+.03,0]} s={[w+.12,.035,.035]} c="#928874"/>{[-1,1].map(side=><group key={side}>{Array.from({length:5},(_,i)=><Box key={i} p={[side*(w/2-w*.23)+(i-2)*w*.045,h/2,Math.sin(i)*.025]} s={[w*.055,h,.07]} m={surface('fabric',i%2?color:'#c8c4b2')}/>)}</group>)}</group>;
  case 'art':return <group><Box p={[0,h*.62,0]} s={[w,h*.7,.06]} m={wood}/><Box p={[0,h*.62,.035]} s={[w-.09,h*.7-.09,.009]} c="#e4ddc8"/>{[0,1,2].map(i=><Sphere key={i} p={[-w*.26+i*w*.24,h*(.55+i*.05),.045]} s={[w*.22,h*.13,.005]} c={['#b5baa2','#91a28f','#748c7c'][i]}/>)}<Sphere p={[w*.22,h*.78,.048]} s={[w*.07,w*.07,.005]} c="#c2a777"/></group>;
  case 'mirror':return <group><Box p={[0,h*.6,0]} s={[w,h*.65,.07]} m={wood}/><Box p={[0,h*.6,.04]} s={[w-.06,h*.65-.06,.01]} m={solid('#a8beb8',.13,.8)}/></group>;
  case 'flowers':return <group><Cylinder p={[0,.17,0]} r={w*.25} h={.34} c={color}/><group position={[0,.34,0]}><Flowers length={w*.7}/></group></group>;
  case 'tea':return <group position={[0,.4,0]}><Box p={[0,.025,0]} s={[w,.05,d]} m={wood}/><Sphere p={[0,.13,0]} s={[.11,.1,.09]} c="#8b7156"/><Cylinder p={[0,.22,0]} r={.045} h={.018} c="#8b7156"/>{[-1,1].map(side=><Cylinder key={side} p={[side*.18,.075,.05]} r={.045} h={.09} c="#e6dfcd"/>)}</group>;
  case 'kitchenware':return <group><Box p={[0,.86,0]} s={[w,.04,d]} m={wood}/>{[-1,1].map(side=><group key={side} position={[side*w*.26,.94,0]}><Cylinder p={[0,0,0]} r={.12} h={.12} c={side<0?'#7c8f85':'#c0ae8b'}/><Cylinder p={[0,.07,0]} r={.12} h={.025} c="#adb6a6"/></group>)}<Box p={[w*.35,1.06,-d*.25]} s={[.09,.3,.09]} c="#8d9e7b"/></group>;
  case 'petbed':return <group><Cylinder p={[0,.08,0]} r={w*.5} h={.16} c={color}/><Sphere p={[0,.15,0]} s={[w*.42,.07,d*.42]} c="#ddd2bb"/></group>;
  case 'bowl':return <group>{[-1,1].map(side=><group key={side} position={[side*.14,0,0]}><Cylinder p={[0,.04,0]} r={.11} h={.08} c={color}/><Cylinder p={[0,.082,0]} r={.083} h={.005} c={side<0?'#967a55':'#98b2ad'}/></group>)}</group>;
  case 'shoerack':return <group>{[-1,1].map(side=><Box key={side} p={[side*(w/2-.03),h/2,0]} s={[.05,h,d]} m={wood}/>)}{[0,1,2].map(i=><group key={i}><Box p={[0,.06+i*h*.4,0]} s={[w,.035,d]} m={wood}/>{[-.3,-.1,.1,.3].map((x,j)=><Sphere key={j} p={[x*w,.12+i*h*.4,.02]} s={[.07,.045,.14]} c={['#777c6e','#aaa38d'][j%2]}/>)}</group>)}</group>;
  default:return null;
 }
}
