"use client";
import {accountStorage} from "@/lib/cloud/account-scope";

import {useCallback,useEffect,useState} from 'react';
import {DEFAULT_WORKSPACE,WORKSPACE_KEY,normalizeWorkspace,assetPreferences} from '@/lib/workspace-ui/preferences';
import {STUDIO_TOOLS} from '../studio-tools';
const toolIds=STUDIO_TOOLS.map(t=>t.id);
export function useWorkspacePreferences(){const [value,setValue]=useState(DEFAULT_WORKSPACE),[loaded,setLoaded]=useState(false),[error,setError]=useState('');useEffect(()=>{function load(){try{setValue(normalizeWorkspace(JSON.parse(accountStorage().getItem(WORKSPACE_KEY)||'{}'),toolIds));}catch{setError('Workspace preferences are session-only in this browser.');}setLoaded(true);}load();window.addEventListener('storage',load);return()=>window.removeEventListener('storage',load);},[]);useEffect(()=>{if(!loaded)return;const timer=setTimeout(()=>{try{accountStorage().setItem(WORKSPACE_KEY,JSON.stringify(value));}catch{setError('Workspace preferences are session-only in this browser.');}},120);return()=>clearTimeout(timer);},[value,loaded]);const update=useCallback(fn=>setValue(old=>normalizeWorkspace(typeof fn==='function'?fn(old):{...old,...fn},toolIds)),[]);return {value,update,error};}
export function useAssetPreferences(){const [value,setValue]=useState({favorites:[],recent:[]});useEffect(()=>{setValue(assetPreferences());const changed=e=>setValue(e.detail||assetPreferences()),storage=()=>setValue(assetPreferences());window.addEventListener('comvexa-asset-preferences',changed);window.addEventListener('storage',storage);return()=>{window.removeEventListener('comvexa-asset-preferences',changed);window.removeEventListener('storage',storage);};},[]);return value;}
