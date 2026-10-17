import {test,expect} from '@playwright/test';

test('3D 实际命中合批家具后能拖动，室内拖动不会同时旋转镜头',async({page})=>{
 test.setTimeout(150000);let store='',exports='';const errors:string[]=[];
 page.on('request',r=>{const path=new URL(r.url()).pathname;if(path==='/src/store.ts')store=r.url();if(path==='/src/render/exports.ts')exports=r.url();});page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/');await expect(page.getByRole('button',{name:'小人漫游',exact:true})).toBeEnabled();
 const state=()=>page.evaluate(async url=>{const {useHome}=await import(url);const s=useHome.getState();return{items:s.current().items,undo:s.undoStack.length,dragging:s.dragging};},store);
 const project=(x:number,y:number,z:number)=>page.evaluate(async({url,x,y,z})=>{const {sceneActions}=await import(url);return sceneActions.project!(x,y,z);},{url:exports,x,y,z});
 await page.evaluate(async()=>{for(let i=0;i<14;i++)await new Promise(requestAnimationFrame);});const portals=()=>page.evaluate(async url=>(await import(url)).sceneActions.portals!(),exports);let gate=(await portals()).find((v:{name:string})=>v.name==='大门双开门')!;let doorPoint=await project(11.45,1.2,30.06);await page.mouse.click(doorPoint.x,doorPoint.y);await expect.poll(async()=>((await portals()).find((v:{id:string})=>v.id===gate.id)!).leftRotation).toBeLessThan(-1.4);expect((await portals()).find((v:{id:string})=>v.id===gate.id)!.rightRotation).toBeGreaterThan(1.4);
 await page.getByLabel('选择房间').selectOption('courtyard');await page.evaluate(async()=>{for(let i=0;i<14;i++)await new Promise(requestAnimationFrame);});const sliding=(await portals()).find((v:{name:string})=>v.name==='客厅左右推拉门')!;doorPoint=await project(11.4,2.4,5.44);await page.mouse.click(doorPoint.x,doorPoint.y);await expect.poll(async()=>((await portals()).find((v:{id:string})=>v.id===sliding.id)!).leftX).toBeLessThan(sliding.leftX-.4);
 await page.getByRole('button',{name:'俯视',exact:true}).click();await page.waitForTimeout(1200);await page.getByRole('button',{name:'布置物件',exact:true}).click();
 let before=await state(),item=before.items.filter((f:{type:string;room:string;x:number})=>f.type==='pot'&&f.room==='courtyard'&&f.x>11).at(-1)!;
 let point=await project(item.x,1.1,item.z);expect(point.visible).toBe(true);await page.mouse.move(point.x,point.y);await page.mouse.down();await page.mouse.move(point.x-35,point.y+10,{steps:12});await page.mouse.up();
 await expect.poll(async()=>JSON.stringify((await state()).items.find((f:{id:string})=>f.id===item.id))).not.toBe(JSON.stringify(item));expect((await state()).undo).toBe(before.undo+1);expect((await state()).dragging).toBe(false);await page.getByRole('button',{name:'撤销',exact:true}).click();
 await page.locator('.tool-rail').getByRole('button',{name:'空间',exact:true}).click();await page.getByLabel('选择房间').selectOption('living');await page.waitForTimeout(700);before=await state();item=before.items.find((f:{type:string;room:string})=>f.type==='sideboard'&&f.room==='living')!;
 point=await project(item.x,1.8,item.z);expect(point.visible).toBe(true);await page.mouse.move(point.x,point.y);await page.mouse.down();await page.mouse.move(point.x-28,point.y+8,{steps:10});await page.mouse.up();
 await expect.poll(async()=>JSON.stringify((await state()).items.find((f:{id:string})=>f.id===item.id))).not.toBe(JSON.stringify(item));expect((await state()).dragging).toBe(false);await page.screenshot({path:'artifacts/working-interior-drag.png'});expect(errors).toEqual([]);
});

test('车辆、树和猫有实际互动反馈，触控取消后停止且能重新操控',async({page})=>{
 test.setTimeout(150000);let store='',interactions='';page.on('request',r=>{const path=new URL(r.url()).pathname;if(path==='/src/store.ts')store=r.url();if(path==='/src/interactions.ts')interactions=r.url();});
 await page.goto('/');await expect(page.getByRole('button',{name:'小人漫游',exact:true})).toBeEnabled();
 const select=async(type:string)=>page.evaluate(async({url,type})=>{const {useHome}=await import(url),f=useHome.getState().current().items.find((f:{type:string})=>f.type===type)!;useHome.setState({selected:f.id});return f.id;},{url:store,type});
 const car=await select('car');await page.getByRole('button',{name:'打开车灯',exact:true}).click();expect(await page.evaluate(async({url,id})=>(await import(url)).useInteractions.getState().items[id].lights,{url:interactions,id:car})).toBe(true);
 const tree=await select('pomegranate');await page.getByRole('button',{name:'浇水',exact:true}).click();expect(await page.evaluate(async({url,id})=>(await import(url)).useInteractions.getState().items[id].waterUntil>Date.now(),{url:interactions,id:tree})).toBe(true);
 await select('cat-bluewhite');await page.getByRole('button',{name:'摸摸小猫',exact:true}).click();await expect(page.locator('.toast')).toContainText('抚摸');await page.getByRole('button',{name:'结束互动',exact:true}).click();
 await page.setViewportSize({width:390,height:844});await page.getByRole('button',{name:'小人漫游',exact:true}).click();await expect(page.getByTestId('walk-hud')).toBeVisible();
 const z=async()=>Number(await page.getByTestId('walk-hud').getAttribute('data-z')),stick=(await page.getByRole('group',{name:'移动摇杆'}).boundingBox())!;
 const move=async()=>{await page.mouse.move(stick.x+58,stick.y+58);await page.mouse.down();await page.mouse.move(stick.x+58,stick.y+10,{steps:5});};
 let before=await z();await move();await expect.poll(z).toBeLessThan(before-.3);await page.evaluate(()=>window.dispatchEvent(new PointerEvent('pointercancel',{pointerId:1})));await expect(page.getByTestId('walk-hud')).toHaveAttribute('data-input-active','false');await page.mouse.up();const stopped=await z();await page.waitForTimeout(400);expect(await z()).toBeCloseTo(stopped,2);
 before=await z();await move();await expect.poll(z).toBeLessThan(before-.3);await page.mouse.up();await expect(page.getByTestId('walk-hud')).toHaveAttribute('data-input-active','false');await page.screenshot({path:'artifacts/corrected-walking-mobile.png'});
});
