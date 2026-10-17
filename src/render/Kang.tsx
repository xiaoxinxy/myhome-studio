import {Box,Sphere} from './Primitives';
import {surface} from './materials';
import type {ItemDef} from '../model/types';

export function Kang({def:c,color}:{def:ItemDef;color:string}){const{w,d}=c;return <group name="砖砌炕">
 <Box p={[0,.32,.16]} s={[w,.64,d-.32]} m={surface('tile','#c9c8b9',w,.64)}/>
 <Box p={[0,.65,.16]} s={[w+.02,.055,d-.3]} c="#8a8a73"/>
 <Box p={[0,.695,.16]} s={[w-.05,.04,d-.37]} m={surface('fabric',color,w,d)}/>
 <Box p={[0,.73,.32]} s={[w-.15,.035,d*.55]} m={surface('fabric','#b7c0ac',w,d)}/>
 <Box p={[0,.754,.48]} s={[w-.2,.018,.18]} m={surface('fabric','#8b9b86',w,.18)}/>
 {[-1,0,1].map(side=><Sphere key={side} p={[side*w*.27,.77,d/2-.3]} s={[w*.12,.075,.17]} c="#e6dfcd"/>)}
 <Box p={[0,.125,-d/2+.14]} s={[.75,.25,.28]} m={surface('wood','#a28b6d',.75,.25)}/>
 <Box p={[w*.3,.22,-d/2+.312]} s={[.24,.2,.025]} c="#69766b"/>
 </group>;}
