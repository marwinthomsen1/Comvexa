import {notFound} from 'next/navigation';
import AccountSyncValidation from '../../../../tests/browser/account-sync-fixture';
export default function Page(){if(process.env.NODE_ENV!=='development')notFound();return <AccountSyncValidation/>;}
