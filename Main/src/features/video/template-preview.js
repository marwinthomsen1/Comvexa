"use client";
import {useEffect,useState} from 'react';
import {generateVideoTemplate} from '@/lib/video/templates';
import VideoPreview from './video-preview';
export default function VideoTemplatePreview({id}){const [doc,setDoc]=useState(null),[time,setTime]=useState(0),[error,setError]=useState('');useEffect(()=>{setDoc(generateVideoTemplate(id));setTime(0);},[id]);return <div>{error&&<p role="alert">{error}</p>}{doc&&<VideoPreview doc={doc} time={time} onTime={setTime} onError={setError}/>}</div>;}
