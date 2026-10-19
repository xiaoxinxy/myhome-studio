import {useShallow} from 'zustand/react/shallow';
import {useHome} from '../store';
// HUD coordinates, notices and the current walkRoom must not reconcile the 3D
// scene. These values change while walking without changing any scene asset.
export function useSceneState(){return useHome(useShallow(s=>({plans:s.plans,active:s.active,current:s.current,compare:s.compare,layers:s.layers,room:s.room,interior:s.interior,roomView:s.roomView,walking:s.walking,street:s.street,time:s.time,weather:s.weather,quality:s.quality,lights:s.lights,dragging:s.dragging,selected:s.selected,interaction:s.interaction,camera:s.camera,viewRevision:s.viewRevision,mode:s.mode,selectRoom:s.selectRoom})));}
