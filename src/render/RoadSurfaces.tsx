import {useMemo} from 'react';
import {roadSurfaces,outerSidewalks} from '../model/roads';
import type {Dimensions} from '../model/types';
import {Box} from './Primitives';
import {surface} from './materials';
import {StaticBatch} from './StaticBatch';
export function RoadSurfaces({d}:{d:Dimensions}){const roads=useMemo(()=>roadSurfaces(d),[d]),sidewalks=useMemo(()=>outerSidewalks(d),[d]);return <StaticBatch revision={'road-union-'+JSON.stringify(d)}><group name="无重叠的道路铺装">{roads.map(({road,rect:r},i)=><Box key={i} p={[r.x+r.w/2,-.072,r.z+r.d/2]} s={[r.w,.12,r.d]} m={surface(road.surface==='earth'?'soil':'asphalt',road.surface==='earth'?'#aa9c78':'#68716d',r.w,r.d)} shadow={false}/>)}{sidewalks.map((r,i)=><Box key={'side-'+i} p={[r.x+r.w/2,.025,r.z+r.d/2]} s={[r.w,.05,r.d]} c="#b5b6a3" shadow={false}/>)}</group></StaticBatch>;}
