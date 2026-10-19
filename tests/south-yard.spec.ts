import {test,expect} from '@playwright/test';

test('两端南向门可实际通行，南院有鸡鹅菜园、昼夜及喂食，街边有人和动物',async({page})=>{
 test.setTimeout(180000);let store='',motion='',interactions='',fiber='';const errors:string[]=[];
 page.on('request',r=>{const p=new URL(r.url()).pathname;if(p.includes('@react-three_fiber'))fiber=r.url();if(p==='/src/store.ts')store=r.url();if(p==='/src/walkState.ts')motion=r.url();if(p==='/src/interactions.ts')interactions=r.url();});page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/');await expect(page.getByRole('button',{name:'小人漫游',exact:true})).toBeEnabled({timeout:90000});
 await page.getByRole('button',{name:'小人漫游',exact:true}).click();await expect(page.getByTestId('walk-hud')).toBeVisible();await expect(page.locator('.walk-heading strong')).toHaveText('前院');
 const flock=await page.evaluate(async({motion,fiber})=>{const {walkMotion:m}=await import(motion),{_roots}=await import(fiber),scene=[..._roots.values()][0].store.getState().scene,mesh=scene.getObjectByName('南院 · 30只鸡和14只鹅');Object.assign(m,{x:11,z:28,y:0,yaw:0,pitch:.1});for(let i=0;i<6;i++)await new Promise(requestAnimationFrame);const hidden=mesh.count;Object.assign(m,{x:11,z:45,y:0,yaw:Math.PI,pitch:.25});for(let i=0;i<6;i++)await new Promise(requestAnimationFrame);return{hidden,visible:mesh.count};},{motion,fiber});expect(flock.hidden).toBe(0);expect(flock.visible).toBeGreaterThan(12);
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
 await expect.poll(()=>page.evaluate(async url=>{const {worldTargets}=await import(url);return [...worldTargets.entries()].filter(([id])=>id.startsWith('npc-neighbor-')).map(([id,t])=>({id,z:t.point().z}));},interactions)).toHaveLength(24);
 const street=await page.evaluate(async url=>{const {worldTargets}=await import(url);return [...worldTargets.entries()].filter(([id])=>id.startsWith('animal-')).map(([,t])=>t.point());},interactions);expect(street).toHaveLength(10);expect(street.some(p=>p.x>0&&p.x<22&&p.z<33)).toBe(true);
 await page.screenshot({path:'artifacts/south-yard-0.7-night-rain.png'});
 await page.getByRole('button',{name:'退出漫游'}).click();await page.getByRole('button',{name:'南院',exact:true}).click();await page.getByRole('button',{name:'平面图',exact:true}).click();await expect(page.locator('.scene-title h2')).toHaveText('全院总览');await page.getByRole('button',{name:'小人漫游',exact:true}).click();await expect(page.locator('.walk-heading strong')).toHaveText('前院');expect(errors).toEqual([]);
});
