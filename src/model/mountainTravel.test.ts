import {expect,it} from 'vitest';
import {makePlan,catalog} from './catalog';
import {makeWalkWorld,walkable,walkHeight,moveWalker,cameraBoom} from './walking';
import {mountainTrails,mountainHeight,trailAt,naturalPlaces} from './nature';
import {stepMotor,type Motor} from './characterMotor';
import {streetBounds} from './neighborhood';
import {outerBounds} from './expedition';
import {busStops,stopArrival} from './transit';
import {driveStep,type VehicleState} from './vehicle';
import {motionSubsteps,FrameWindow} from './framePacing';

it('人物、车辆与全域地图共用扩大后的边界，三处山脚不再处于空气墙外',()=>{const w=makeWalkWorld(makePlan());expect(streetBounds(w.plan.dimensions)).toEqual(outerBounds);for(const p of naturalPlaces){expect(walkable(p.x,p.z,w),p.name).toBe(true);expect(moveWalker(p,0,3,w).z,p.name).toBeCloseTo(p.z+3);}expect(walkable(outerBounds.maxX+1,2000,w)).toBe(false);});
it('公共公交站及候车棚远离自家门轴，不放在自家院门与南院出入口之间',()=>{const p=makePlan(),home=busStops.find(s=>s.id==='home')!,arrival=stopArrival('home');expect(Math.abs(home.x-p.dimensions.width/2)).toBeGreaterThan(50);expect(Math.abs(arrival.x-p.dimensions.width/2)).toBeGreaterThan(50);});
for(const t of mountainTrails)it(t.name+'从入口实际走到峰顶，再原路下山，全程不传送',()=>{
 const w=makeWalkWorld(makePlan()),first=t.points[0],m:Motor={x:first.x,z:first.z,y:0,yaw:0,vy:0,grounded:true,jumpRequested:false,climbRequested:false,climb:null};let peak=0,steps=0;
 const travel=(points:typeof t.points)=>{for(const point of points){let attempts=0;const budget=Math.ceil(Math.hypot(m.x-point.x,m.z-point.z)/.12)+20;while(Math.hypot(m.x-point.x,m.z-point.z)>.03){const distance=Math.hypot(point.x-m.x,point.z-m.z),scale=Math.min(.12,distance)/distance;stepMotor(m,(point.x-m.x)*scale,(point.z-m.z)*scale,.04,w);if(++attempts>budget)throw Error('Blocked at '+JSON.stringify({point,m}));peak=Math.max(peak,m.y);steps++;}expect(Math.abs(m.y-mountainHeight(t.mountain,m.x,m.z))).toBeLessThan(.3);}};
 travel(t.points);expect(m.y).toBeGreaterThan(t.mountain.h*.8);expect(peak).toBeGreaterThan(t.mountain.h*.8);expect(trailAt(t,m.x,m.z)!.progress).toBeGreaterThan(t.length-1);travel([...t.points].reverse());expect(m.y).toBeCloseTo(0);expect(steps).toBeGreaterThan(10000);
},30000);
it('雪山、火山盘山路绕山旋转超过两圈，路面可在边界内驾驶',()=>{const w=makeWalkWorld(makePlan()),car=catalog.find(c=>c.id==='car')!;for(const t of mountainTrails.filter(t=>t.id!=='fuji')){let turn=0;for(let i=2;i<t.points.length;i++){const a=t.points[i-1],b=t.points[i],aa=Math.atan2(a.x-t.mountain.x,a.z-t.mountain.z),bb=Math.atan2(b.x-t.mountain.x,b.z-t.mountain.z);turn+=Math.atan2(Math.sin(bb-aa),Math.cos(bb-aa));}expect(turn).toBeGreaterThan(Math.PI*4);const p=t.points[2],q=t.points[3],v:VehicleState={id:'test-mountain-car',type:'car',x:p.x,z:p.z,y:walkHeight(p.x,p.z,w),yaw:Math.atan2(q.x-p.x,q.z-p.z),speed:3,wheel:0,originX:p.x,originZ:p.z,originRotation:0};expect(driveStep(v,1,0,.1,car,w)).toBe(false);expect(Math.hypot(v.x-p.x,v.z-p.z)).toBeGreaterThan(.25);expect(v.y).toBeCloseTo(walkHeight(v.x,v.z,w));}});
it('一次120ms慢帧拆成物理子步，人物与车辆不再只推进50ms',()=>{const w=makeWalkWorld(makePlan()),motor=(x:number):Motor=>({x,z:1700,y:0,yaw:0,vy:0,grounded:true,jumpRequested:false,climbRequested:false,climb:null}),a=motor(300),b=motor(300);stepMotor(a,.36,0,.12,w);for(let i=0;i<12;i++)stepMotor(b,.03,0,.01,w);expect(a.x).toBeCloseTo(b.x,7);const car=catalog.find(c=>c.id==='car')!,vehicle=():VehicleState=>({id:'pacing-car',type:'car',x:300,z:1700,y:0,yaw:0,speed:10,wheel:0,originX:300,originZ:1700,originRotation:0}),v=vehicle(),other=vehicle();driveStep(v,1,.2,.12,car,w);for(let i=0;i<12;i++)driveStep(other,1,.2,.01,car,w);expect(v.z).toBeCloseTo(other.z,2);expect(v.speed).toBeCloseTo(other.speed,6);expect(motionSubsteps(.12).step).toBeLessThanOrEqual(1/60);});
it('高平均FPS仍能报告偶发慢帧，后台样本可以清除',()=>{const window=new FrameWindow();for(let i=0;i<179;i++)window.add(.008);window.add(.12);const s=window.flush()!;expect(s.fps).toBeGreaterThan(100);expect(s.maxMs).toBe(120);expect(s.slowFrames).toBe(1);window.add(1);window.clear();expect(window.flush()).toBeNull();});
it('跟随镜头会避开山体，不能直接穿到坡面里面',()=>{const w=makeWalkWorld(makePlan()),t=mountainTrails[0],p=t.points[700],y=mountainHeight(t.mountain,p.x,p.z)+1;expect(cameraBoom({x:p.x,z:p.z,y},{x:t.mountain.x,z:t.mountain.z,y},w)).toBeLessThan(1);});
