export const clampZoom=(value,width=1080,height=1080)=>Math.max(.05,Math.min(Math.max(1,Math.min(3,4096/Math.max(width,height))),value));
export const fitZoom=(width,height,viewWidth,viewHeight)=>Math.max(.05,Math.min(1,(viewWidth-140)/width,(viewHeight-140)/height));
export const zoomAnchor=(client,paper,zoom)=>({x:(client.x-paper.left)/zoom,y:(client.y-paper.top)/zoom,clientX:client.x,clientY:client.y});
export const anchoredScroll=(scroll,paper,anchor,zoom)=>({left:scroll.left+paper.left+anchor.x*zoom-anchor.clientX,top:scroll.top+paper.top+anchor.y*zoom-anchor.clientY});
