import {Box} from './Primitives';
import {surface} from './materials';

export function InteriorDoor({width,height,cut,walking=false}:{width:number;height:number;cut:boolean;walking?:boolean}){
 const shownHeight=cut?.72:height;
 return <group name="室内连通门">
  {[-1,1].map(side=><Box key={side} p={[side*width/2,shownHeight/2,0]} s={[.065,shownHeight,.2]} c="#9d8e74"/>)}
  {!cut&&<Box p={[0,height,0]} s={[width+.08,.065,.2]} c="#9d8e74"/>}
  <Box p={[0,.018,0]} s={[width,.036,.19]} c="#b9ad94"/>
  <group position={[-width/2,0,0]} rotation={[0,-Math.PI*(walking?.5:.32),0]}>
   <Box p={[width/2,shownHeight/2,0]} s={[width-.06,shownHeight,.045]} m={surface('wood','#c1aa83',width,height)}/>
   <Box p={[width-.12,Math.min(.94,shownHeight*.65),.045]} s={[.12,.025,.04]} c="#7b8274"/>
  </group>
 </group>;
}
