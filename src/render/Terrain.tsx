import type {Layout,Plan} from '../model/types';
import {Box} from './Primitives';
import {surface} from './materials';

export function Terrain({layout:l,plan:p}:{layout:Layout;plan:Plan}){
 const d=p.dimensions,W=d.width,M=d.mainDepth,Z=M+l.terraceDepth;
 const stone=surface('tile','#b6b8ab',W,l.terraceDepth);
 return <group name="院落高差与平台">
  <Box p={[W/2,l.innerY/2,(M+l.dividerZ)/2]} s={[W,l.innerY,l.dividerZ-M]} m={surface('paving',p.palette.paving,W,l.dividerZ-M)}/>
  <Box p={[W/2,(l.innerY+l.terraceY)/2,(M+Z)/2]} s={[W,l.terraceY-l.innerY,l.terraceDepth]} m={stone}/>
  {[-1,1].map(side=><Box key={side} p={[W/2+side*(W/2-d.wingWidth-.5),l.innerY+.018,(Z+l.dividerZ)/2]} s={[1,.036,l.dividerZ-Z]} m={surface('tile','#b6b8ab',1,l.dividerZ-Z)}/>)}
  {/* A four-riser entry from the lower forecourt through the opening in the low wall. */}
  {[0,1,2,3].map(i=><Box key={'entry'+i} p={[W/2,l.innerY*(i+1)/8,l.dividerZ+.28*(3-i)+.14]} s={[4.12,l.innerY*(i+1)/4,.28]} m={surface('tile','#8e998d',4.12,.24)}/>)}
  {/* Continuous terrace in front of the main house, reached from the inner yard. */}
  <Box p={[W/2,l.innerY+(l.terraceY-l.innerY)/4,Z+.16]} s={[W-2*d.wingWidth,(l.terraceY-l.innerY)/2,.32]} m={stone}/>
  <Box p={[W/2,l.terraceY+.01,Z-.035]} s={[W,.025,.07]} c="#859183"/>
 </group>;
}
