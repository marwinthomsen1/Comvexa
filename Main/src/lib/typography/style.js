export const TEXT_STYLE_DEFAULTS = {
 italic:false, underline:false, letterSpacing:0, effect:"none",
 outlineColor:"#241443", outlineWidth:0,
 shadowColor:"#241443", shadowBlur:0, shadowOffsetX:0, shadowOffsetY:0, shadowOpacity:0,
 gradientFrom:"#7235ef", gradientTo:"#f43a9b", gradientAngle:0,
};
export const TEXT_EFFECTS = ["none","shadow","outline","glow","offset","neon","gradient"];
const hex=value=>typeof value==="string"&&/^#[0-9a-f]{6}$/i.test(value);
export function validateTextStyle(value) {
 if(!value || typeof value!=="object" || Array.isArray(value) || Object.keys(value).some(k=>!Object.hasOwn(TEXT_STYLE_DEFAULTS,k))) throw new Error("Invalid typography style.");
 const s={...TEXT_STYLE_DEFAULTS,...value};
 if(typeof s.italic!=="boolean"||typeof s.underline!=="boolean"||!TEXT_EFFECTS.includes(s.effect))throw new Error("Invalid text formatting.");
 for(const key of ["outlineColor","shadowColor","gradientFrom","gradientTo"]) if(!hex(s[key]))throw new Error("Invalid typography color.");
 for(const [key,min,max]of [["letterSpacing",-1000,1000],["outlineWidth",0,1000],["shadowBlur",0,1000],["shadowOffsetX",-8192,8192],["shadowOffsetY",-8192,8192],["shadowOpacity",0,1],["gradientAngle",0,360]]) if(typeof s[key]!=="number"||!Number.isFinite(s[key])||s[key]<min||s[key]>max)throw new Error("Typography value out of bounds.");
 return s;
}
export function effectStyle(effect, current={}) {
 const s={...TEXT_STYLE_DEFAULTS,italic:current.italic||false,underline:current.underline||false,letterSpacing:current.letterSpacing||0,effect};
 if(effect==="shadow")Object.assign(s,{shadowOpacity:.5,shadowBlur:8,shadowOffsetX:4,shadowOffsetY:6});
 if(effect==="outline")s.outlineWidth=2;
 if(effect==="glow")Object.assign(s,{shadowOpacity:1,shadowBlur:22,shadowColor:"#a242ff"});
 if(effect==="offset")Object.assign(s,{shadowOpacity:1,shadowOffsetX:6,shadowOffsetY:6});
 if(effect==="neon")Object.assign(s,{outlineWidth:1,outlineColor:"#f43a9b",shadowColor:"#f43a9b",shadowOpacity:1,shadowBlur:24});
 return validateTextStyle(s);
}
export function textStyleAttributes(e) {
 const s={...TEXT_STYLE_DEFAULTS,...e.textStyle};
 const radians=s.gradientAngle*Math.PI/180,half=(Math.abs(Math.cos(radians))*e.width+Math.abs(Math.sin(radians))*e.height)/2,dx=Math.cos(radians)*half,dy=Math.sin(radians)*half;
 return {
  fontStyle:`${s.italic?"italic ":""}${e.fontWeight}`,
  textDecoration:s.underline?"underline":"",letterSpacing:s.letterSpacing,
  stroke:s.outlineColor,strokeWidth:s.outlineWidth,fillAfterStrokeEnabled:true,
  shadowColor:s.shadowColor,shadowBlur:s.shadowBlur,shadowOffsetX:s.shadowOffsetX,shadowOffsetY:s.shadowOffsetY,shadowOpacity:s.shadowOpacity,shadowEnabled:s.shadowOpacity>0,shadowForStrokeEnabled:false,
  fillPriority:s.effect==="gradient"?"linear-gradient":"color",
  fillLinearGradientStartPoint:{x:e.width/2-dx,y:e.height/2-dy},fillLinearGradientEndPoint:{x:e.width/2+dx,y:e.height/2+dy},fillLinearGradientColorStops:[0,s.gradientFrom,1,s.gradientTo],
 };
}
// Scale dimensional text styling with text/group transforms, just like font size.
export function scaleTextStyle(style, scale) {
 if(!style)return {};
 const out={...style};
 for(const key of ["letterSpacing","outlineWidth","shadowBlur","shadowOffsetX","shadowOffsetY"]) out[key]=Math.round(out[key]*scale*1e6)/1e6;
 return {textStyle:out};
}
