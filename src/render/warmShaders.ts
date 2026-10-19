import type {WebGLRenderer,Object3D,Camera} from 'three';
// Three r180's compileAsync timer reads material.currentProgram even after the
// material has been disposed by a 2D/3D or plan switch. Poll native programs so
// disposal and cancellation can end warm-up without a stale timer throwing.
export async function warmShaders(renderer:WebGLRenderer,scene:Object3D,camera:Camera,cancelled:()=>boolean){
 if(cancelled())return;renderer.compile(scene,camera);
 const gl=renderer.getContext(),extension=gl.getExtension('KHR_parallel_shader_compile');
 if(!extension)return;
 let pending=(renderer.info.programs||[]).map(p=>p.program as WebGLProgram).filter(Boolean);
 while(!cancelled()&&!gl.isContextLost()&&pending.length){
  pending=pending.filter(p=>gl.isProgram(p)&&!gl.getProgramParameter(p,extension.COMPLETION_STATUS_KHR));
  if(pending.length)await new Promise<void>(resolve=>requestAnimationFrame(()=>resolve()));
 }
}
