import {cloudConfig,trustedWrite,readBoundedJSON} from '@/lib/auth/config';
import {authClient,privateJSON,verifiedUser} from '@/lib/auth/server';
import {unavailableResponse,validateAuth} from '@/lib/auth/foundation';
import {allowAuthAttempt} from '@/lib/auth/rate-limit';
export async function GET(){
 if(!cloudConfig())return unavailableResponse();
 try{const user=await verifiedUser(await authClient());return privateJSON({configured:true,user:user?{id:user.id,email:user.email}:null});}catch{return privateJSON({error:'Account service could not be reached. Try again.'},503);}
}
export async function POST(request){
 const config=cloudConfig();if(!config)return unavailableResponse();
 if(!trustedWrite(request,config))return privateJSON({error:'This account request must come from Comvexa.'},403);
 try{
  const input=await readBoundedJSON(request,4096);
  if(!input||typeof input!=="object"||Array.isArray(input)||!["login","register","logout"].includes(input.mode))return privateJSON({error:"Choose a valid account action."},400);
  const client=await authClient();
  if(input.mode==='logout'){const {error}=await client.auth.signOut({scope:'local'});if(error)return privateJSON({error:'Could not sign out. Try again.'},503);return privateJSON({ok:true});}
  const {email}=validateAuth(input.mode,input);
  if(!allowAuthAttempt(`${input.mode}:${email.toLowerCase()}`))return privateJSON({error:'Too many attempts. Try again in 15 minutes.'},429);
  const result=input.mode==='register'?await client.auth.signUp({email,password:input.password,options:{data:{display_name:input.displayName.trim()}}}):await client.auth.signInWithPassword({email,password:input.password});
  if(result.error){const code=result.error.code;const message=code==='email_not_confirmed'?'Confirm your email before logging in.':input.mode==='login'?'Login failed. Check your email and password.':'Registration could not be completed. Check your details, or try logging in if you already have an account.';return privateJSON({error:message},result.error.status===429?429:400);}
  return privateJSON({ok:true,confirmationRequired:!result.data.session});
 }catch(e){if(/Email|email|password|Name|Name|account action|JSON|body|limit|content/.test(e.message))return privateJSON({error:'Check your email, name and password (12–128 characters).'},400);return privateJSON({error:'Account service could not be reached. Try again.'},503);}
}
