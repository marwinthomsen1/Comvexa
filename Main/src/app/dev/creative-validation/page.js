import {notFound} from 'next/navigation';
import PremiumValidation from '../../../../tests/browser/premium-tools-fixture';
export default function Page(){if(process.env.NODE_ENV!=='development')notFound();return <PremiumValidation/>;}
