"use client";
import './asset-controls.css';
import {favoriteAsset} from '@/lib/workspace-ui/preferences';
import {StudioIcon} from '@/components/ui/studio-icon';
export function AssetViewFilter({value,onChange}){return <div className="asset-view-filter" role="group" aria-label="Show assets">{[['all','All'],['favorites','Favorites'],['recent','Recent']].map(([id,label])=><button key={id} aria-pressed={value===id} onClick={()=>onChange(id)}>{label}</button>)}</div>;}
export function AssetFavorite({kind,id,name,prefs}){const key=kind+':'+id,active=prefs.favorites.includes(key);return <button type="button" className="asset-favorite" aria-label={`${active?'Unfavorite':'Favorite'} ${name}`} aria-pressed={active} title={`${active?'Remove from':'Add to'} favorites`} onClick={e=>{e.stopPropagation();favoriteAsset(key);}}><StudioIcon name={active?'starFilled':'star'} size={15}/></button>;}
