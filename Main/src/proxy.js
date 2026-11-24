import {createServerClient} from '@supabase/ssr';
import {NextResponse} from 'next/server';
import {cloudConfig} from './lib/auth/config';

// Validate the session before serving any workspace route, including direct URLs.
export async function proxy(request) {
 const settings=cloudConfig();
 const login=()=>NextResponse.redirect(new URL('/login',request.url));
 if(!settings)return login();
 let response=NextResponse.next();
 const client=createServerClient(settings.url,settings.key,{
  global:{fetch:(url,options)=>fetch(url,{...options,signal:AbortSignal.timeout(10000)})},
  cookieOptions:{httpOnly:true,sameSite:'lax',secure:settings.origin.startsWith('https:'),path:'/'},
  cookies:{getAll:()=>request.cookies.getAll(),setAll:values=>{
   for(const {name,value} of values)request.cookies.set(name,value);
   response=NextResponse.next({request});
   for(const {name,value,options} of values)response.cookies.set(name,value,{...options,httpOnly:true,sameSite:'lax',secure:settings.origin.startsWith('https:'),path:'/'});
  }},
 });
 try{
  const {data,error}=await client.auth.getUser();
  if(error||!data.user){const redirect=login();for(const cookie of response.cookies.getAll())redirect.cookies.set(cookie);return redirect;}
  const headers=new Headers(request.headers);
  headers.set('x-comvexa-verified-user',JSON.stringify({id:data.user.id,email:data.user.email}));
  const authenticated=NextResponse.next({request:{headers}});
  for(const cookie of response.cookies.getAll())authenticated.cookies.set(cookie);
  authenticated.headers.set('Cache-Control','private, no-store');
  return authenticated;
 }catch{return login();}
}
export const config={matcher:['/dashboard/:path*','/editor/:path*']};
