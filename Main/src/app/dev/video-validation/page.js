import {notFound} from 'next/navigation';
import VideoValidation from '../../../../tests/browser/video-export-fixture';
export default function Page(){if(process.env.NODE_ENV!=='development')notFound();return <VideoValidation/>;}
