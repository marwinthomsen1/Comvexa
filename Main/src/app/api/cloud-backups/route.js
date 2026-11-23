import {cloudConfig,trustedWrite,readBoundedJSON} from '@/lib/auth/config';
import {authClient,privateJSON,verifiedUser} from '@/lib/auth/server';
import {unavailableResponse} from '@/lib/auth/foundation';
import {validateLibraryBackup} from '@/lib/editor/library-backup';
const BUCKET='comvexa-library-backups',LIMIT=50*1024*1024;
function storageError(error){const missing=String(error.message).toLowerCase().includes('bucket not found');return privateJSON({error:missing?'Cloud backup storage is not set up yet. Your local library is unchanged.':'Cloud backup request failed. Try again; your local library is unchanged.'},missing?503:502);}
export async function GET(request){
 if(!cloudConfig())return unavailableResponse();
 try{const client=await authClient(),user=await verifiedUser(client);if(!user)return privateJSON({error:'Log in to access your cloud backups.'},401);
 const id=new URL(request.url).searchParams.get('id'),bucket=client.storage.from(BUCKET);
 if(id){if(!/^[0-9a-f-]{36}\.json$/.test(id))return privateJSON({error:'Invalid backup identifier.'},400);const {data,error}=await bucket.download(`${user.id}/${id}`);if(error)return storageError(error);return new Response(data,{headers:{'Content-Type':'application/json','Cache-Control':'no-store','Vary':'Cookie'}});}
 const {data,error}=await bucket.list(user.id,{limit:100,sortBy:{column:'created_at',order:'desc'}});if(error)return storageError(error);return privateJSON({backups:data.filter(f=>f.id).map(f=>({id:f.name,createdAt:f.created_at,bytes:f.metadata?.size||0}))});
 }catch{return privateJSON({error:'Cloud backup service could not be reached.'},503);}
}
export async function POST(request){
 const config=cloudConfig();if(!config)return unavailableResponse();if(!trustedWrite(request,config))return privateJSON({error:'This backup request must come from Comvexa.'},403);
 try{const client=await authClient(),user=await verifiedUser(client);if(!user)return privateJSON({error:'Log in before uploading a backup.'},401);
 let data;try{data=validateLibraryBackup(await readBoundedJSON(request,LIMIT));}catch{return privateJSON({error:'Choose a valid Comvexa library backup up to 50 MB.'},400);}
 const json=JSON.stringify(data);if(new TextEncoder().encode(json).byteLength>LIMIT)return privateJSON({error:'Cloud backups support up to 50 MB. Download a local backup instead.'},413);
 const id=crypto.randomUUID()+'.json';const {error}=await client.storage.from(BUCKET).upload(`${user.id}/${id}`,new Blob([json],{type:'application/json'}),{contentType:'application/json',upsert:false});if(error)return storageError(error);return privateJSON({id,ok:true},201);
 }catch{return privateJSON({error:'Cloud upload failed. Your local library is unchanged.'},503);}
}
