import {notFound} from 'next/navigation';
import LibraryValidation from '../../../../tests/browser/expanded-library-fixture';
export default function Page(){if(process.env.NODE_ENV!=='development')notFound();return <LibraryValidation/>;}
