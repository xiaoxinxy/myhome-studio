import {test,expect} from '@playwright/test';
import {buildLayout,initialDimensions} from '../src/model/layout';
import {readFile} from 'node:fs/promises';

test('贴墙炕与剖切后的连通门实际输出',async({page})=>{
 test.setTimeout(150000);await page.goto('/',{waitUntil:'domcontentloaded'});await expect(page.locator('canvas')).toBeVisible();await page.waitForTimeout(1500);const fullDownload=page.waitForEvent('download');await page.getByRole('button',{name:'导出 GLB 三维模型',exact:true}).click();await (await fullDownload).saveAs('artifacts/home-model.glb');const preview=page.waitForEvent('download');await page.getByRole('button',{name:'导出 PNG 预览图',exact:true}).click();await (await preview).saveAs('artifacts/export-preview.png');
 for(const [room,file] of [['bed-east','kang-south'],['guest','kang-east']]){await page.getByLabel('选择房间').selectOption(room);await page.waitForTimeout(1500);await page.screenshot({path:'artifacts/'+file+'.png',fullPage:true});}
 const download=page.waitForEvent('download');await page.getByRole('button',{name:'导出 GLB 三维模型',exact:true}).click();await (await download).saveAs('artifacts/kang-doors-cut.glb');const bytes=await readFile('artifacts/kang-doors-cut.glb');const model=JSON.parse(bytes.subarray(20,20+bytes.readUInt32LE(12)).toString());const expected=buildLayout(initialDimensions).walls.filter(w=>!w.exterior).flatMap(w=>w.openings.flatMap((o,i)=>o.kind==='door'?[w.id+':'+i]:[]));const actual=model.nodes.filter((n:{extras?:{doorId?:string}})=>n.extras?.doorId).map((n:{extras:{doorId:string}})=>n.extras.doorId);expect(expected).toHaveLength(7);for(const id of expected)expect(actual).toContain(id);expect(model.nodes.filter((n:{name:string})=>n.name==='砖砌炕')).toHaveLength(2);
 await page.getByRole('button',{name:'平面图',exact:true}).click();await page.screenshot({path:'artifacts/kang-door-plan.png',fullPage:true});
});
