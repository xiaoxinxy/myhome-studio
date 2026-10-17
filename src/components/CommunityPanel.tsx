import {useEffect} from 'react';
import {useCommunity,buyGoods,harvest,pickFruit} from '../community';
import {sitDown,useInteractions,seatTarget,stopToInteract} from '../interactions';
import {useHome} from '../store';
import {village} from '../model/village';
const titles={shop:'桥头小卖铺',civic:'村民服务中心',clinic:'村卫生所',barber:'老街理发店',field:'田间菜地',orchard:'村南果园'};
export function CommunityPanel(){
 const s=useCommunity(),p=useHome(v=>v.current()),sitting=useInteractions(v=>v.sitting);
 useEffect(()=>()=>{useCommunity.getState().act({active:null});},[]);
 if(!s.active)return null;const active=s.active;
 const seat=()=>{const h=village(p.dimensions).find(h=>h.n.style===(active==='barber'?15:14))!,f=h.plan.items.find(f=>f.type===(active==='barber'?'salon-chair':'dining-chair'))!;sitDown(true,seatTarget(p,f));};
 const close=()=>{if(sitting)sitDown(false);s.act({active:null});stopToInteract();};
 return <section className="interaction-card community-card in-walk" aria-label="村庄场所互动"><header><strong>{titles[active]}</strong><button aria-label="离开场所互动" onClick={close}>×</button></header><div>
 {active==='shop'&&<><p>货架余量 {s.stock} · 袋中日用品 {s.bag}</p><button disabled={!s.stock} onClick={()=>buyGoods()}>拿一份日用品到购物袋</button><small>取走后柜台货物减少；这是村庄体验，不产生支付。</small></>}
 {active==='civic'&&<><p>村务公开栏</p><p>周六上午：便民服务与图书借阅<br/>周日傍晚：村南环境清理<br/>公共设施：卫生所、小卖铺、理发店<br/>场景内活动为虚构内容。</p><button onClick={()=>s.act({active:null})}>收起公告，继续参观</button></>}
 {active==='clinic'&&<><p>候诊座椅、问诊桌、检查床与药柜均可使用。</p><button onClick={seat}>坐到问诊椅</button><button disabled={!sitting} onClick={()=>s.act({exam:true})}>体验测量</button>{s.exam&&<p role="status">模拟仪器已亮起 · 请起身休息。这是场景模拟，不提供健康数据。</p>}</>}
 {active==='barber'&&<><button onClick={seat}>坐到理发椅</button><button disabled={!sitting} onClick={()=>s.act({hair:s.hair==='#3c3530'?'#7b5036':'#3c3530'})}>换个发色</button><p>小人发色会立即改变，可起身后查看。</p></>}
 {active==='field'&&<><p>{s.harvested?'这一畦已采收，留出整齐的菜根。':s.watered?'土壤已浇湿，可以采收。':'沿田间小路走，给蔬菜浇水后再采收。'}</p><button disabled={s.watered} onClick={()=>s.act({watered:true})}>提水浇灌</button><button disabled={!s.watered||s.harvested} onClick={()=>harvest()}>采收一畦蔬菜</button><p>菜篮：{s.vegetables} 份蔬菜</p></>}
 {active==='orchard'&&<><p>沿果园的草间通道采摘，枝头果实会减少。</p><button disabled={s.picked} onClick={()=>pickFruit()}>采摘一篮果子</button><p>果篮：{s.fruit} 个果子</p></>}
 {sitting&&<button onClick={()=>sitDown(false)}>起身</button>}
 </div><small>本次游玩物品：日用品 {s.bag} · 蔬菜 {s.vegetables} · 果子 {s.fruit}</small></section>;
}
