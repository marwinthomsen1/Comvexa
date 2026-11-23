export function cloudConfig(env=process.env){
 const url=env.NEXT_PUBLIC_SUPABASE_URL,key=env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,ref=env.SUPABASE_DEV_PROJECT_REF;
 if(env.COMVEXA_CLOUD_AUTH_ENABLED!=='true'||typeof ref!=='string'||!/^[a-z]{20}$/.test(ref)||url!==`https://${ref}.supabase.co`||typeof key!=='string'||!/^sb_publishable_[a-zA-Z0-9_-]+$/.test(key))return null;
 try{const origin=new URL(env.APP_ORIGIN);if(!['http:','https:'].includes(origin.protocol)||origin.username||origin.password||origin.origin!==env.APP_ORIGIN)return null;return{url,key,ref,origin:origin.origin};}catch{return null;}
}
export function trustedWrite(request,config){
 if(!config)return false;
 const origin=request.headers.get('origin');
 if(origin===config.origin)return true;
 // Both loopback names are used by the local app; no arbitrary hosts are accepted.
 try{const expected=new URL(config.origin),actual=new URL(origin);return ['localhost','127.0.0.1'].includes(expected.hostname)&&['localhost','127.0.0.1'].includes(actual.hostname)&&actual.protocol===expected.protocol&&actual.port===expected.port&&actual.origin===origin;}catch{return false;}
}
export async function readBoundedJSON(request,limit){
 if(!request.headers.get('content-type')?.startsWith('application/json'))throw Error('Send JSON content.');
 const reader=request.body?.getReader();if(!reader)throw Error('Request body is missing.');const chunks=[];let size=0;
 try{for(;;){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>limit){await reader.cancel();throw Error('Request exceeds the size limit.');}chunks.push(value);}const all=new Uint8Array(size);let offset=0;for(const c of chunks){all.set(c,offset);offset+=c.length;}return JSON.parse(new TextDecoder().decode(all));}finally{reader.releaseLock();}
}
