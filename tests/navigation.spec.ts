import {test,expect} from '@playwright/test';
import {readFile} from 'node:fs/promises';

test('观察不移动家具，点击不生成撤销记录，布置拖动才修改',async({page})=>{
 let storeUrl='';page.on('request',r=>{if(new URL(r.url()).pathname==='/src/store.ts')storeUrl=r.url();});
 await page.goto('/',{waitUntil:'domcontentloaded'});
 await page.getByRole('button',{name:'平面图',exact:true}).click();
 const state=()=>page.evaluate(async(url)=>{const {useHome}=await import(url);const s=useHome.getState();return {items:s.current().items,undo:s.undoStack.length,room:s.room,layers:s.layers,interior:s.interior};},storeUrl);
 await expect(page.getByRole('button',{name:'显示隐藏屋顶',exact:true})).toHaveCount(0);await expect(page.locator('.camera-tabs')).toHaveCount(0);const view=await page.locator('.plan-view').getAttribute('viewBox');await page.getByRole('button',{name:'放大视图',exact:true}).click();expect(await page.locator('.plan-view').getAttribute('viewBox')).not.toBe(view);await page.getByRole('button',{name:'恢复全院',exact:true}).click();await expect(page.locator('.plan-view')).toHaveAttribute('viewBox',view!);
 const before=await state(),item=before.items.find((f:{type:string})=>f.type==='pomegranate');
 const position=()=>page.locator('[data-item="'+item.id+'"]').evaluate(el=>{const p=new DOMPoint(0,0).matrixTransform((el as SVGGraphicsElement).getScreenCTM()!);return{x:p.x,y:p.y};});
 let pos=await position();await page.mouse.move(pos.x,pos.y);await page.mouse.down();await page.mouse.move(pos.x+25,pos.y,{steps:5});await page.mouse.up();
 expect((await state()).items).toEqual(before.items);expect((await state()).undo).toBe(0);
 await page.getByRole('button',{name:'布置物件',exact:true}).click();pos=await position();await page.mouse.click(pos.x,pos.y);expect((await state()).undo).toBe(0);
 await page.mouse.move(pos.x,pos.y);await page.mouse.down();await page.mouse.move(pos.x+22,pos.y,{steps:5});await page.mouse.up();
 expect((await state()).undo).toBe(1);expect((await state()).items.find((f:{id:string})=>f.id===item.id).x).not.toBe(item.x);
 await page.getByRole('button',{name:'撤销',exact:true}).click();expect((await state()).items).toEqual(before.items);
 await page.setViewportSize({width:390,height:844});
 await page.locator('.mobile-nav').getByRole('button',{name:'空间',exact:true}).click();await page.getByLabel('选择房间').selectOption('living');
 await expect(page.locator('.inspector')).not.toHaveClass(/mobile-open/);await expect(page.locator('.view-status')).toContainText('室内观察：正房');
 expect((await state()).layers).toEqual(before.layers);
 await page.getByRole('button',{name:'看这栋外观',exact:true}).click();expect((await state()).interior).toBe(false);
 await page.getByRole('button',{name:'恢复全院',exact:true}).click();expect((await state()).room).toBe(null);
 await page.locator('.mobile-nav').getByRole('button',{name:'布置',exact:true}).click();await page.getByLabel('添加到哪个区域').selectOption('guest');await expect(page.locator('.inspector')).toHaveClass(/mobile-open/);await expect(page.locator('.view-status')).toContainText('东厢房');await page.getByRole('button',{name:'关闭面板',exact:true}).click();await page.getByRole('button',{name:'恢复全院',exact:true}).click();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.screenshot({path:'artifacts/navigation-mobile.png',fullPage:true});
});

test('室内保留屋顶和天花板，可选剖视后恢复完整外观',async({page})=>{
 test.setTimeout(150000);const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/',{waitUntil:'domcontentloaded'});await expect(page.locator('canvas')).toBeVisible({timeout:90000});
 await page.getByLabel('选择房间').selectOption('living');await expect(page.locator('.view-status')).toContainText('正房');
 const capture=async(name:string)=>{const pending=page.waitForEvent('download');await page.getByRole('button',{name:'导出 GLB 三维模型',exact:true}).click();const path='artifacts/'+name+'.glb';await(await pending).saveAs(path);const bytes=await readFile(path);return JSON.parse(bytes.subarray(20,20+bytes.readUInt32LE(12)).toString());};
 const cut=await capture('navigation-local-cut');const roofs=cut.nodes.filter((n:{name?:string})=>n.name?.startsWith('roof-')).map((n:{name:string})=>n.name);
 expect(roofs).toHaveLength(7);expect(roofs).toContain('roof-main');expect(cut.nodes.some((n:{name?:string})=>n.name==='ceiling-main')).toBe(true);expect(roofs).toContain('roof-east');expect(roofs).toContain('roof-west');
 await page.screenshot({path:'artifacts/navigation-interior.png',fullPage:true});await page.getByRole('button',{name:'剖视布置',exact:true}).click();await expect(page.locator('.view-status')).toContainText('剖视布置');const section=await capture('navigation-opt-in-cut');expect(section.nodes.some((n:{name?:string})=>n.name==='roof-main')).toBe(false);
 await page.getByRole('button',{name:'恢复全院',exact:true}).click();await page.getByRole('button',{name:'俯视',exact:true}).click();await page.waitForTimeout(1000);
 const canvas=page.locator('canvas'),box=(await canvas.boundingBox())!;await page.mouse.click(box.x+box.width*.5,box.y+box.height*.55);await page.mouse.move(box.x+box.width*.45,box.y+box.height*.55);await page.mouse.down();await page.mouse.move(box.x+box.width*.6,box.y+box.height*.65,{steps:6});await page.mouse.up();
 await expect(page.locator('.view-status')).toHaveText('完整外观');
 await page.getByRole('button',{name:'放大视图',exact:true}).click();await page.getByRole('button',{name:'缩小视图',exact:true}).click();
 await page.getByRole('button',{name:'返回全院',exact:true}).click();const full=await capture('navigation-restored');expect(full.nodes.filter((n:{name?:string})=>n.name?.startsWith('roof-'))).toHaveLength(7);
 await page.screenshot({path:'artifacts/navigation-desktop.png',fullPage:true});expect(errors).toEqual([]);
});
