import {test,expect} from '@playwright/test';
import {readFile} from 'node:fs/promises';

test('小猫实际运动、暂停以及库房和精细内饰',async({page})=>{
 test.setTimeout(180000);
 await page.goto('/',{waitUntil:'domcontentloaded'});await expect(page.locator('canvas')).toBeVisible();
 const capture=async(name:string)=>{const downloaded=page.waitForEvent('download');await page.getByRole('button',{name:'导出 GLB 三维模型',exact:true}).click();const file=await downloaded;await file.saveAs('artifacts/'+name+'.glb');const bytes=await readFile('artifacts/'+name+'.glb');const json=JSON.parse(bytes.subarray(20,20+bytes.readUInt32LE(12)).toString());return json.nodes.filter((node:{name?:string})=>node.name?.startsWith('cat-motion')).map((node:{name:string;translation?:number[];rotation?:number[];matrix?:number[];children?:number[]})=>({name:node.name,t:node.translation,r:node.rotation,m:node.matrix,parts:node.children?.map(i=>json.nodes[i].matrix||[json.nodes[i].translation,json.nodes[i].rotation])}));};
 const first=await capture('cats-motion-a');expect(first).toHaveLength(3);await page.waitForTimeout(900);const second=await capture('cats-motion-b');expect(second).not.toEqual(first);
 await page.locator('.tool-rail').getByRole('button',{name:'模型',exact:true}).click();await page.getByLabel('小猫活动（关闭暂停）').uncheck();const paused=await capture('cats-paused-a');await page.waitForTimeout(700);expect(await capture('cats-paused-b')).toEqual(paused);
 await page.locator('.tool-rail').getByRole('button',{name:'空间',exact:true}).click();
 for(const [room,file] of [['living','living-interior'],['bed-east','bedroom-interior'],['west-room','warehouse-interior'],['east-shed','trike-shed'],['west-shed','car-shed']]){await page.getByLabel('选择房间').selectOption(room);await page.waitForTimeout(1300);await page.screenshot({path:'artifacts/'+file+'.png',fullPage:true});}
 const items=await page.evaluate(()=>JSON.parse(localStorage.getItem('courtyard-home-studio-v2')!).state.plans[0].items);expect(items.filter((i:{type:string;room:string})=>i.type==='ebike'&&i.room==='east-shed')).toHaveLength(2);expect(items.find((i:{type:string})=>i.type==='cat-bluewhite').room).toBe('living');
});
