import {Box,Cylinder,Sphere} from './Primitives';
import {solid} from './materials';

function Wheel({x,z,r=.29}:{x:number;z:number;r?:number}){return <group userData={{keepInteractive:true}} position={[x,r,z]} rotation={[0,0,Math.PI/2]}><group name="轮轴旋转"><Cylinder p={[0,0,0]} r={r} h={.15} c="#303837"/><Cylinder p={[0,0,0]} r={r*.64} h={.158} m={solid('#a5afaa',.4,.7)} c="#a5afaa"/><Cylinder p={[0,0,0]} r={r*.22} h={.17} c="#53625d"/></group></group>;}
function DetailedCar({color,variant}:{color:string;variant:string}){
 const van=variant==='van',suv=variant==='suv',pickup=variant==='pickup',hatch=variant==='hatchback',roof=van?1.85:suv?1.63:1.37,back=pickup?.1:van?-1.65:hatch?-1.4:-1.14,cabinDepth=pickup?1.5:van?3:2.35,front=back+cabinDepth;
 return <group name={'精细车辆 · '+variant}>
 <Box p={[0,.43,0]} s={[1.78,.4,4.2]} m={solid(color,.3,.6)}/><Box p={[0,.65,1.4]} s={[1.72,.15,1.35]} m={solid(color,.3,.5)}/>
 <Box p={[0,(roof+.7)/2,(front+back)/2]} s={[1.54,roof-.7,cabinDepth]} m={solid('#354b58',.25,.5)}/>
 <Box p={[0,roof,(front+back)/2]} s={[1.63,.12,cabinDepth-.1]} m={solid(color,.3,.5)}/>
 {[-1,1].map(side=><group key={side}>
 {[back+.06,(back+front)/2,front-.06].map(z=><Box key={z} p={[side*.79,(roof+.68)/2,z]} s={[.065,roof-.62,.065]} c={color}/>)}
 <Box p={[side*.79,.76,(back+front)/2]} s={[.065,.15,cabinDepth]} c={color}/>
 {[back+.45,front-.35].map(z=><group key={z}><Box p={[side*.895,.75,z]} s={[.02,.03,.19]} c="#c3c8c4"/><Box p={[side*.897,.48,z]} s={[.012,.31,.012]} c="#48534f"/></group>)}
 <Box p={[side*.91,1.03,front-.25]} s={[.23,.12,.22]} m={solid(color,.3,.6)}/>
 {[-1.37,1.37].map(z=><Wheel key={z} x={side*.87} z={z} r={suv?.36:.32}/>)}
 <Box p={[side*.61,.58,2.115]} s={[.43,.15,.035]} c="#e1f2e9"/><Box p={[side*.65,.58,-2.115]} s={[.35,.17,.035]} c="#c85143"/>
 <Box p={[side*.61,.48,2.13]} s={[.4,.018,.02]} c="#fff8ca"/>
 </group>)}
 <Box p={[0,.42,2.13]} s={[1.62,.13,.08]} c="#46535a"/><Box p={[0,.42,-2.13]} s={[1.62,.12,.08]} c="#46535a"/>
 <Box p={[0,.59,2.13]} s={[.55,.2,.025]} c="#263b45"/>{[-1,0,1].map(y=><Box key={y} p={[0,.58+y*.045,2.15]} s={[.55,.014,.018]} c="#b6c1ba"/>)}
 <Box p={[0,.4,2.18]} s={[.43,.1,.016]} c="#39769b"/><Box p={[0,.49,-2.18]} s={[.43,.1,.016]} c="#39769b"/>
 {pickup?<><Box p={[0,.67,-1.02]} s={[1.57,.08,1.85]} c="#4b5d5e"/>{[-1,1].map(v=><Box key={v} p={[v*.82,.86,-1.02]} s={[.12,.5,1.85]} c={color}/>)}<Box p={[0,.86,-1.96]} s={[1.7,.5,.1]} c={color}/></>:van?<><Box p={[0,1.14,-1.8]} s={[1.7,1.1,.24]} c={color}/><Box p={[0,1.03,-1.94]} s={[.025,1.08,.025]} c="#546864"/></>:<Box p={[0,.75,-1.6]} s={[1.68,.14,.92]} c={color}/>}
 {(suv||hatch)&&[-1,1].map(s=><Box key={s} p={[s*.61,roof+.1,(front+back)/2]} s={[.035,.09,cabinDepth*.85]} c="#6e7c7b"/>)}
 <Box p={[.4,roof+.16,back+.2]} s={[.025,.22,.025]} c="#4d5b5c"/>
 </group>;
}
export function Vehicle({type,color,variant='sedan'}:{type:string;color:string;variant?:'sedan'|'suv'|'hatchback'|'pickup'|'van'}){
 if(type==='car')return <DetailedCar color={color} variant={variant}/>;
 const trike=type==='trike';return <group name={trike?'家用三轮车':'电动自行车'}>
  {trike?<><Wheel x={-.52} z={-.65}/><Wheel x={.52} z={-.65}/><Wheel x={0} z={.87}/><Box p={[0,.61,-.54]} s={[1.2,.13,1.4]} c={color}/>{[-1,1].map(side=><Box key={side} p={[side*.57,.83,-.54]} s={[.06,.42,1.4]} c={color}/>)}<Box p={[0,.83,-1.22]} s={[1.2,.42,.06]} c={color}/><Box p={[0,.67,.33]} s={[.6,.2,.45]} c="#454e48"/><Box p={[0,1.28,.38]} s={[.64,.08,.65]} c={color}/>{[-1,1].map(side=><Box key={side} p={[side*.29,1.02,.58]} s={[.035,.5,.035]} c="#778d88"/>)}</>:<><Wheel x={0} z={-.57} r={.24}/><Wheel x={0} z={.65} r={.24}/><Box p={[0,.43,.02]} s={[.32,.22,.72]} c={color}/><Box p={[0,.66,-.14]} s={[.34,.11,.61]} c="#444f48"/><Box p={[0,.34,.29]} s={[.39,.05,.45]} c="#a6af9e"/><Box p={[0,.69,.53]} s={[.12,.59,.17]} rotation={[-.2,0,0]} c={color}/><Box p={[0,.62,-.61]} s={[.31,.04,.3]} c="#768379"/></>}
  <Box p={[0,trike?1.08:.96,.67]} s={[.63,.04,.04]} c="#4b5950"/><Sphere p={[0,trike?.97:.86,.72]} s={[.1,.08,.06]} c="#e3e4c8"/>{[-1,1].map(side=><Box key={side} p={[side*.28,trike?1.16:1.04,.67]} s={[.02,.18,.02]} c="#82928a"/>)}
 </group>;
}
