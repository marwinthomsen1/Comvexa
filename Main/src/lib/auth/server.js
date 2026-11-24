import 'server-only';
import {createServerClient} from '@supabase/ssr';
import {cookies} from 'next/headers';
import {cloudConfig} from './config.js';
export async function authClient(){
 const config=cloudConfig();if(!config)return null;
 const jar=await cookies();
 // Auth runs only in route handlers: refreshes always reach the browser as cookies.
 return createServerClient(config.url,config.key,{global:{fetch:(url,options)=>fetch(url,{...options,signal:options?.signal?AbortSignal.any([options.signal,AbortSignal.timeout(10000)]):AbortSignal.timeout(10000)})},cookieOptions:{httpOnly:true,sameSite:'lax',secure:config.origin.startsWith('https:'),path:'/'},cookies:{getAll:()=>jar.getAll(),setAll:values=>{for(const {name,value,options} of values)jar.set(name,value,{...options,httpOnly:true,sameSite:'lax',secure:config.origin.startsWith('https:'),path:'/'});}}});
}
export const privateJSON=(value,status=200)=>Response.json(value,{status,headers:{'Cache-Control':'no-store','Vary':'Cookie'}});
export async function verifiedUser(client){const {data,error}=await client.auth.getUser();return error?null:data.user;}
