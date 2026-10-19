// A seated shin stays vertical; solve the thigh angle from the actual floor.
// High beds and children's chairs intentionally allow feet to hang above it.
export function seatedLegAngle(rootAboveFloor:number,scale:number){
 return Math.acos(Math.max(0,Math.min(1,(rootAboveFloor/scale+.73-.445)/.29)));
}
