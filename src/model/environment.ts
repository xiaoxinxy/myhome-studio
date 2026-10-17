export type Weather='clear'|'cloudy'|'rain'|'snow'|'fog';
export const weatherOptions=[['clear','晴天'],['cloudy','多云'],['rain','小雨'],['snow','飘雪'],['fog','薄雾']] as const;
export function environmentAt(time:number,weather:Weather){const hour=((time%24)+24)%24,altitude=Math.sin((hour-6)/12*Math.PI),day=Math.max(0,altitude),night=altitude<-.06,cloud=weather==='clear'?1:weather==='cloudy'?.68:weather==='fog'?.42:.46;
 return{hour,day,night,altitude,background:night?'#182537':weather==='snow'?'#cdd5d7':weather==='fog'?'#c2c9c5':weather==='rain'?'#9fadb4':day<.25?'#d5bbb0':'#dce4e0',sun:day*2.3*cloud,ambient:night?.22:.43+day*.25*cloud,hemi:night?.3:.72,lamps:night||hour<7||hour>17.5};}
export const timeLabel=(time:number)=>{const minutes=Math.round(((time%24)+24)%24*60)%1440;return String(Math.floor(minutes/60)).padStart(2,'0')+':'+String(minutes%60).padStart(2,'0');};

export function fogRange(distance:number,span:number,weather:Weather){const near=weather==='fog'?Math.max(1,distance*.55):weather==='rain'||weather==='snow'?Math.max(1,distance*.82):distance+35;return{near,far:Math.max(near+10,distance+(weather==='fog'?span*1.15:130))};}
