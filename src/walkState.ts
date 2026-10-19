import type {Climb} from './model/characterMotor';
import {create} from 'zustand';

// High-frequency motion stays outside the saved renovation plan and React tree.
export const walkMotion={x:0,z:0,y:0,yaw:0,pitch:.48,bodyYaw:0,phase:0,moving:false,sitting:false,seatFloor:0,pose:"stand" as "stand"|"sit"|"lie",supportItem:null as string|null,crouchUntil:0,petting:false,avatarVisible:true,stickX:0,stickY:0,keys:new Set<string>(),warp:0,destination:null as string|null,ready:false,vy:0,grounded:true,jumpRequested:false,climbRequested:false,climb:null as Climb|null,pendingPoint:null as {x:number;y:number;z:number}|null};
export const useWalkStatus=create<{x:number;z:number;y:number;room:string;blocked:boolean;speed:number;posture:string}>(()=>({x:0,z:0,y:0,room:'门口',blocked:false,speed:0,posture:'步行'}));
export function clearWalkInput(){walkMotion.keys.clear();walkMotion.stickX=0;walkMotion.stickY=0;walkMotion.moving=false;walkMotion.jumpRequested=false;walkMotion.climbRequested=false;}
export function requestWalkSpawn(room:string|null=null){clearWalkInput();walkMotion.destination=room;walkMotion.warp++;}

export function requestWalkPoint(x:number,y:number,z:number){clearWalkInput();walkMotion.pendingPoint={x,y,z};walkMotion.warp++;}
