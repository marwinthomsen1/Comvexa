"use client";
import {useEffect,useRef,useState} from 'react';
import {usePathname} from 'next/navigation';
import Link from 'next/link';
import {selectAccount,registerSyncFlusher} from '@/lib/cloud/account-scope';
import {createSyncEngine,httpSyncTransport} from '@/lib/cloud/sync-engine';
import {readAccountRecords,readSyncMeta,repairSettings,guestRecords} from '@/lib/cloud/local-account';
import './account-sync.css';
export default function AccountSync({children,initialUser}){
 const path=usePathname(),workspace=path.startsWith('/dashboard')||path.startsWith('/editor');
 const [ready,setReady]=useState(false),[status,setStatus]=useState({state:'loading',message:'Opening your account workspace…'}),[user,setUser]=useState(null),[guestCount,setGuestCount]=useState(0),[details,setDetails]=useState(false);
 const engine=useRef(null),sync=useRef(null);
 useEffect(()=>{if(!workspace){setReady(false);return;}setReady(false);setStatus({state:"loading",message:"Opening your account workspace…"});let stopped=false,timer,interval,authInterval;
  const startupTimer=setTimeout(()=>{if(!stopped)setStatus(previous=>({...previous,message:previous.progress?'Your account is still downloading. Keep this tab open.':'Connecting to your saved workspace…'}));},15000);
  const changed=()=>{setStatus(previous=>['conflict','session'].includes(previous.state)?previous:{...previous,state:'pending',message:'Changes waiting to save to your account…'});clearTimeout(timer);timer=setTimeout(()=>sync.current?.(),1800);};
  async function initialize(){try{
   if(stopped)return;
   const identity=initialUser||null;selectAccount(identity?.id||null);setUser(identity);
   authInterval=setInterval(async()=>{try{const r=await fetch('/api/auth',{cache:'no-store',signal:AbortSignal.timeout(20000)}),a=await r.json();if(r.ok&&(a.user?.id||null)!==(identity?.id||null)&&!stopped){engine.current?.stop();setReady(false);setStatus({state:'session',message:'Switching to your current account…'});window.location.reload();}}catch{/* Keep the current account cache during network interruptions. */}},15000);
   if(!identity){window.location.replace('/login');return;}
   setStatus({state:'loading',message:'Opening your saved workspace…'});
   await repairSettings();const cached={meta:await readSyncMeta()};if(stopped)return;
   if(cached.meta){clearTimeout(startupTimer);setReady(true);}
   engine.current=createSyncEngine({transport:httpSyncTransport(identity.id),onStatus:next=>{if(!stopped){setStatus(next);if(next.state==='session'){setReady(false);engine.current?.stop();window.location.replace('/login');}}}});
   sync.current=async resolution=>{try{const run=()=>engine.current.sync(resolution);if(!navigator.locks)throw Error('This browser does not support safe account sync. Use a current browser.');return await navigator.locks.request('comvexa-sync-'+identity.id,{signal:AbortSignal.timeout(35000)},run);}catch(error){const next={state:'offline',message:error.name==='TimeoutError'?'Account saving is taking longer than expected. Your device copy is preserved. Retry when connected.':error.message};if(!stopped)setStatus(next);return next;}};
   registerSyncFlusher(async()=>{let result;for(let i=0;i<3;i++){result=await sync.current();if(result?.state!=="pending")return result;}return result;});
   let result;for(let attempt=0;attempt<3;attempt++){result=await sync.current();if(stopped)return;if(result?.state!=='pending'||result.cached)break;}clearTimeout(startupTimer);
   if(result?.state!=='session'&&(result?.cached||result?.state==='saved'||cached.meta))setReady(true);
   else if(['offline','pending'].includes(result?.state))setStatus({...result,state:'offline',message:'Could not load your account yet. Reconnect and retry to avoid opening an empty workspace.'});
   const local=await readAccountRecords();if(!local.meta?.guestImported){const records=await guestRecords();setGuestCount(records.filter(r=>r.key.startsWith('designs/')||r.key.startsWith('brand-kits/')).length);}
   window.addEventListener('comvexa-account-change',changed);window.addEventListener('online',changed);window.addEventListener('focus',changed);window.addEventListener('storage',changed);
   interval=setInterval(()=>sync.current?.(),12000);

  }catch(e){clearTimeout(startupTimer);if(!stopped){if(e.code==='account_changed'){setStatus({state:'session',message:'Switching to your current account…'});window.location.reload();}else setStatus({state:'offline',message:e.message});}}}
  initialize();
  return()=>{stopped=true;clearTimeout(startupTimer);registerSyncFlusher(null);engine.current?.stop();clearTimeout(timer);clearInterval(interval);clearInterval(authInterval);window.removeEventListener('comvexa-account-change',changed);window.removeEventListener('online',changed);window.removeEventListener('focus',changed);window.removeEventListener('storage',changed);};
 },[workspace,initialUser?.id,initialUser?.email]);
 async function resolve(choice){await sync.current?.(choice);const current=await readAccountRecords();if(current.meta)setReady(true);setDetails(false);}
 const controls=<>{status.state==='conflict'&&<div className="account-sync-actions"><button onClick={()=>resolve('account')}>Use account version for conflicting items</button><button onClick={()=>resolve('device')}>Use this device’s version for conflicting items</button><p>A recovery snapshot of replaced device data is kept locally. Changes to other items are merged.</p></div>}{status.state==='offline'&&<button onClick={()=>ready?sync.current?.():window.location.reload()}>{ready?'Retry account saving':'Retry loading workspace'}</button>}{status.state==='session'&&<><a href="/login">Sign in again</a><button onClick={()=>window.location.reload()}>Reload workspace</button></>}</>;
 if(workspace&&!ready&&['loading','saving'].includes(status.state))return <main className="account-sync-skeleton" aria-label="Loading workspace" aria-busy="true"><aside/><section><div/><div/><div/><p className="account-loading-status" role="status">{status.message}<small>Your workspace opens after your account data is safely loaded.</small></p></section></main>;
 if(workspace&&!ready)return <main className="account-sync-gate"><h1>{status.state==='loading'||status.state==='saving'?'Opening your account…':'Your work is preserved'}</h1><p role="status">{status.message}</p>{controls}<Link href="/">Back to Comvexa</Link></main>;
 if(!workspace)return children;
 const compactStatus={saved:'All changes saved',saving:'Saving…',pending:'Changes pending',offline:'Offline · retry saving',conflict:'Review sync conflict',session:'Sign in again',loading:'Connecting…'}[status.state]||'Account status';
 return <div className={path.startsWith('/editor/')?'account-sync-frame account-sync-editor':'account-sync-frame'}>{workspace&&<div className={`account-sync-bar sync-${status.state}`}><button className="account-sync-status" onClick={()=>setDetails(v=>!v)} aria-expanded={details} title={status.message}><span aria-hidden="true">{status.state==='saved'?'✓':status.state==='saving'?'↻':'●'}</span> {compactStatus}</button>{!user&&<Link href="/login">Sign in for automatic account saving →</Link>}{details&&<div className="account-sync-details"><strong>{status.message}</strong>{user&&<small>{user.email}</small>}<p>{user?'Changes save automatically while online. Other devices load your account when you sign in.':'Guest work stays on this device. Sign in to keep your work across devices.'}</p>{status.at&&<p>Last account save: {new Date(status.at).toLocaleTimeString()}</p>}{controls}{user&&<Link href="/dashboard/backups">Account & recovery</Link>}</div>}</div>}{workspace&&user&&guestCount>0&&<div className="account-sync-import"><p>{guestCount} existing guest designs or brand kits are on this browser. Bring them into <strong>{user.email}</strong> once; future work saves automatically.</p><button onClick={async()=>{try{await navigator.locks.request('comvexa-sync-'+user.id,()=>engine.current.importGuest());setGuestCount(0);window.dispatchEvent(new Event('storage'));window.dispatchEvent(new Event('comvexa-design-change'));}catch(e){setStatus({state:'offline',message:e.message});}}}>Bring existing work into my account</button></div>}{children}</div>;
}
