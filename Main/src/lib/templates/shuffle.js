// A repeatable shuffle keeps pagination and filtered results steady while browsing.
export function shuffleTemplates(items,seed=0x6c2f87a1){
 const result=[...items];let state=seed>>>0;
 for(let i=result.length-1;i>0;i--){state=(Math.imul(state,1664525)+1013904223)>>>0;const j=Math.floor(state/4294967296*(i+1));[result[i],result[j]]=[result[j],result[i]];}
 return result;
}
