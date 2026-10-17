import {test,expect} from '@playwright/test';

test('两端南向门可实际通行，南院有鸡鹅菜园、昼夜及喂食，街边有人和动物',async({page})=>{
 test.setTimeout(180000);let store='',motion='',interactions='';const errors:string[]=[];
 page.on('request',r=>{const p=new URL(r.url()).pathname;if(p==='/src/store.ts')store=r.url();if(p==='/src/walkState.ts')motion=r.url();if(p==='/src/interactions.ts')interactions=r.url();});page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/');await expect(page.getByRole('button',{name:'小人漫游',exact:true})).toBeEnabled({timeout:45000});
 await page.getByRole('button',{name:'小人漫游',exact:true}).click();await expect(page.getByTestId('walk-hud')).toBeVisible();await expect(page.locator('.walk-heading strong')).toHaveText('前院');
 // Put the observer at each red-box entrance, then use real keyboard motion through it.
 for(const [x,room] of [[.625,'西卧室'],[21.4,'小房间2']] as const){
  await page.evaluate(async({url,x})=>{const {walkMotion:m}=await import(url);m.x=x;m.z=6.05;m.y=.96;m.yaw=0;m.keys.clear();},{url:motion,x});
  await expect(page.locator('.walk-heading strong')).toHaveText('正房前长条平台');await page.keyboard.down('KeyW');
  await expect(page.locator('.walk-heading strong')).toHaveText(room);await page.keyboard.up('KeyW');
 }
 await page.screenshot({path:'artifacts/south-facing-door-0.7.png'});await page.getByRole('button',{name:'退出漫游'}).click();
 await page.getByRole('button',{name:'南院',exact:true}).click();await expect(page.locator('.scene-title h2')).toContainText('南院');
 await page.evaluate(async()=>{for(let i=0;i<18;i++)await new Promise(requestAnimationFrame);});await page.screenshot({path:'artifacts/south-yard-0.7-day.png'});
 await page.getByRole('button',{name:'在南院漫游',exact:true}).click();await expect(page.locator('.walk-heading strong')).toContainText('南院');
 await page.getByRole('button',{name:'给鸡和鹅撒把粮'}).click();await expect(page.locator('.toast')).toContainText('撒下谷物');
 await page.keyboard.down('KeyS');const z=Number(await page.getByTestId('walk-hud').getAttribute('data-z'));await expect.poll(async()=>Number(await page.getByTestId('walk-hud').getAttribute('data-z'))).toBeGreaterThan(z+.4);await page.keyboard.up('KeyS');
 await page.screenshot({path:'artifacts/south-yard-0.7-walking.png'});
 await page.evaluate(async url=>{const {useHome}=await import(url);useHome.setState({time:22,weather:'rain'});},store);
 await expect.poll(()=>page.evaluate(async url=>{const {worldTargets}=await import(url);return [...worldTargets.entries()].filter(([id])=>id.startsWith('neighbor-')||id.startsWith('passer-')).map(([id,t])=>({id,z:t.point().z}));},interactions)).toHaveLength(14);
 const street=await page.evaluate(async url=>{const {worldTargets}=await import(url);return [...worldTargets.entries()].filter(([id])=>id.startsWith('animal-')).map(([,t])=>t.point());},interactions);expect(street).toHaveLength(10);expect(street.some(p=>p.x>0&&p.x<22&&p.z<33)).toBe(true);
 await page.screenshot({path:'artifacts/south-yard-0.7-night-rain.png'});
 await page.getByRole('button',{name:'退出漫游'}).click();await page.getByRole('button',{name:'南院',exact:true}).click();await page.getByRole('button',{name:'平面图',exact:true}).click();await expect(page.locator('.scene-title h2')).toHaveText('全院总览');await page.getByRole('button',{name:'小人漫游',exact:true}).click();await expect(page.locator('.walk-heading strong')).toHaveText('前院');expect(errors).toEqual([]);
});
