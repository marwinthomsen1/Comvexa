// A bounded per-process guard supplements Supabase's provider rate limits.
const attempts=new Map();
export function allowAuthAttempt(key,now=Date.now()){
 for(const [id,value] of attempts)if(value.until<=now)attempts.delete(id);
 if(!attempts.has(key)){if(attempts.size>=1000)return false;attempts.set(key,{count:0,until:now+15*60*1000});}
 const item=attempts.get(key);return ++item.count<=10;
}
