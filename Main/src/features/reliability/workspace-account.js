import {headers} from 'next/headers';
import {redirect} from 'next/navigation';
import AccountSync from './account-sync';

export default async function WorkspaceAccount({children}){
 // Proxy overwrites this header only after verifying the session with Supabase.
 const value=(await headers()).get('x-comvexa-verified-user');
 const user=value?JSON.parse(value):null;
 if(!user?.id)redirect('/login');
 return <AccountSync initialUser={user}>{children}</AccountSync>;
}
