let owner=null,selected=false;
export function accountOwner(){return owner;}
export function selectAccount(value){if(value!==null&&!/^[0-9a-f-]{36}$/i.test(value))throw Error('Invalid account identity.');if(selected&&owner!==value)throw Object.assign(Error('Account changed. Reload to switch workspaces safely.'),{code:'account_changed'});owner=value;selected=true;}
export function accountKey(key,account=owner){return account?`${key}:account:${account}`:key;}
export function accountDatabase(name,account=owner){return account?`${name}-account-${account}`:name;}
export function accountChanged(){if(typeof window!=='undefined')window.dispatchEvent(new Event('comvexa-account-change'));}
export function accountStorage(){return{getItem:key=>localStorage.getItem(accountKey(key)),setItem:(key,value)=>{const name=accountKey(key);if(localStorage.getItem(name)!==String(value)){localStorage.setItem(name,value);accountChanged();}},removeItem:key=>{const name=accountKey(key);if(localStorage.getItem(name)!==null){localStorage.removeItem(name);accountChanged();}}};}

let flusher=null;
export function registerSyncFlusher(fn){flusher=fn;}
export async function flushAccountSync(){return flusher?flusher():null;}
