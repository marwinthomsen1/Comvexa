import {notFound} from 'next/navigation';
import WorkspaceValidation from '../../../../tests/browser/workspace-ui-fixture';
export default function Page(){if(process.env.NODE_ENV!=='development')notFound();return <WorkspaceValidation/>;}
