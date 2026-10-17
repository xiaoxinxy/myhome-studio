import {expect,it} from 'vitest';
import {makePlan} from './catalog';
import {southYard,southYardLocation} from './southYard';
import {makeWalkWorld,moveWalker,walkable} from './walking';
it('南院与北院等宽、进深六成，东北鸡棚为六分之一',()=>{
 const d=makePlan().dimensions,y=southYard(d);
 expect(y.w).toBe(d.width);expect(y.d/d.depth).toBeCloseTo(.6);expect(y.coop.w*y.coop.d/(y.w*y.d)).toBeCloseTo(1/6);
 expect(y.coop.x+y.coop.w).toBe(y.w);expect(y.coop.z).toBe(y.z);expect(y.z).toBeGreaterThan(d.depth+10.5);
 for(const b of y.beds){expect(b.x).toBeGreaterThan(0);expect(b.x+b.w).toBeLessThan(y.w);expect(b.z+b.d).toBeLessThan(y.z+y.d);}
});
it('能从北院大门过街进入南院，菜畦和围墙不能穿过，鸡棚从西侧可进',()=>{
 const p=makePlan(),y=southYard(p.dimensions),w=makeWalkWorld(p);let at={x:p.dimensions.width/2-.5,z:p.dimensions.depth-1.7};
 at=moveWalker(at,0,y.z+4-at.z,w);expect(at.z).toBeCloseTo(y.z+4);
 expect(southYardLocation(at.x,at.z,p.dimensions)).toContain('南院');
 const b=y.beds[0];expect(walkable(b.x+b.w/2,b.z+b.d/2,w)).toBe(false);
 expect(walkable(.1,y.z+3,w)).toBe(false);
 at=moveWalker(at,3,0,w);expect(at.x).toBeGreaterThan(y.coop.x+1);expect(southYardLocation(at.x,at.z,p.dimensions)).toContain('鸡棚');
 at=moveWalker(at,0,y.d,w);expect(at.z).toBeLessThan(y.coop.z+y.coop.d);
});
