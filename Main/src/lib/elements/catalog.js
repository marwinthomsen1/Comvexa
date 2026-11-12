// Original Comvexa vector artwork. Fixed, application-owned paths only; no SVG imports,
// remote assets, external fonts, executable markup or arbitrary document path data.
const polygon = points => `M${points.map(p=>p.map(v=>Math.round(v*100)/100).join(",")).join("L")}Z`;
function regular(n) { return polygon(Array.from({length:n},(_,i)=>{const a=i*2*Math.PI/n-Math.PI/2;return[50+50*Math.cos(a),50+50*Math.sin(a)];})); }
function star(n, inner=23) { return polygon(Array.from({length:n*2},(_,i)=>{const a=i*Math.PI/n-Math.PI/2,r=i%2?inner:50;return[50+r*Math.cos(a),50+r*Math.sin(a)];})); }
const g = (id,name,category,path,keywords="",ratio=1) => ({id,name,category,path,keywords,ratio});
export const elementCategories = ["All", "Basic shapes", "Badges & stars", "Arrows", "Symbols", "Nature", "Decorations", "Business"];
export const elementLibrary = [
 {id:"rectangle",name:"Rectangle",category:"Basic shapes",primitive:"rect",ratio:1.4,keywords:"box square panel"},
 {id:"rounded-rectangle",name:"Rounded rectangle",category:"Basic shapes",primitive:"rect",radius:24,ratio:1.4,keywords:"card panel"},
 {id:"pill",name:"Pill",category:"Basic shapes",primitive:"rect",radius:1000,ratio:2.4,keywords:"capsule button label"},
 {id:"circle",name:"Circle",category:"Basic shapes",primitive:"ellipse",ratio:1,keywords:"ellipse round"},
 {id:"oval",name:"Oval",category:"Basic shapes",primitive:"ellipse",ratio:1.6,keywords:"ellipse"},
 {id:"line",name:"Divider",category:"Basic shapes",primitive:"rect",radius:0,ratio:12,keywords:"line separator"},
 g("triangle","Triangle","Basic shapes","M50 0L100 100H0Z"),
 g("right-triangle","Right triangle","Basic shapes","M0 0L100 100H0Z"),
 g("diamond","Diamond","Basic shapes","M50 0L100 50L50 100L0 50Z","rhombus"),
 g("pentagon","Pentagon","Basic shapes",regular(5)),
 g("hexagon","Hexagon","Basic shapes",regular(6)),
 g("octagon","Octagon","Basic shapes",regular(8)),
 g("trapezoid","Trapezoid","Basic shapes","M20 0H80L100 100H0Z"),
 g("parallelogram","Parallelogram","Basic shapes","M25 0H100L75 100H0Z"),
 g("arch","Arch","Basic shapes","M0 100V50A50 50 0 0 1 100 50V100Z"),
 g("semicircle","Semicircle","Basic shapes","M0 100A50 100 0 0 1 100 100Z","half circle",2),
 g("quarter-circle","Quarter circle","Basic shapes","M0 0A100 100 0 0 1 100 100H0Z"),
 g("teardrop","Teardrop","Basic shapes","M50 0C42 20 0 48 0 65A50 35 0 0 0 100 65C100 48 58 20 50 0Z"),
 g("star-four","Four-point star","Badges & stars",star(4,15),"sparkle"),
 g("star-five","Five-point star","Badges & stars",star(5,22)),
 g("star-six","Six-point star","Badges & stars",star(6,27)),
 g("star-eight","Eight-point star","Badges & stars",star(8,25),"burst"),
 g("star-twelve","Twelve-point burst","Badges & stars",star(12,35),"sale sticker"),
 g("star-sixteen","Sixteen-point burst","Badges & stars",star(16,40),"sale sticker"),
 g("sun","Sun","Badges & stars",star(16,28),"rays"),
 g("seal","Award seal","Badges & stars",star(24,45),"badge certificate"),
 g("shield","Shield","Badges & stars","M0 0H100V42C100 70 75 93 50 100C25 93 0 70 0 42Z","security badge"),
 g("ribbon","Ribbon badge","Badges & stars","M20 0H80V100L50 78L20 100Z","bookmark award"),
 g("arrow-right","Arrow right","Arrows","M0 30H60V0L100 50L60 100V70H0Z","next",1.6),
 g("arrow-left","Arrow left","Arrows","M100 30H40V0L0 50L40 100V70H100Z","back",1.6),
 g("arrow-up","Arrow up","Arrows","M30 100V40H0L50 0L100 40H70V100Z","north",0.65),
 g("arrow-down","Arrow down","Arrows","M30 0V60H0L50 100L100 60H70V0Z","south",0.65),
 g("arrow-double","Double arrow","Arrows","M0 50L28 0V33H72V0L100 50L72 100V67H28V100Z","horizontal",1.8),
 g("chevron-right","Chevron right","Arrows","M0 0H40L100 50L40 100H0L60 50Z","next"),
 g("chevron-left","Chevron left","Arrows","M100 0H60L0 50L60 100H100L40 50Z","back"),
 g("arrow-turn","Turn arrow","Arrows","M0 100V25H65V0L100 40L65 80V55H30V100Z","bent direction"),
 g("arrow-loop","Return arrow","Arrows","M0 35L35 0V22H65C112 22 112 100 65 100H25V75H65C82 75 82 47 65 47H35V70Z","curved undo"),
 g("arrow-long","Long arrow","Arrows","M0 42H75V0L100 50L75 100V58H0Z","pointer direction",2.6),
 g("heart","Heart","Symbols","M50 100C25 80 0 59 0 30C0 0 34 -10 50 18C66 -10 100 0 100 30C100 59 75 80 50 100Z","love valentine"),
 g("lightning","Lightning bolt","Symbols","M58 0L5 57H43L32 100L95 35H57Z","flash energy"),
 g("check","Check mark","Symbols","M0 52L20 32L41 55L81 0L100 14L44 100Z","tick success"),
 g("cross","Cross","Symbols","M0 20L20 0L50 30L80 0L100 20L70 50L100 80L80 100L50 70L20 100L0 80L30 50Z","close x"),
 g("plus","Plus","Symbols","M35 0H65V35H100V65H65V100H35V65H0V35H35Z","add medical"),
 g("minus","Minus","Symbols","M0 35H100V65H0Z","subtract",2),
 g("pin","Location pin","Symbols","M50 100C38 84 0 55 0 35A50 35 0 1 1 100 35C100 55 62 84 50 100ZM50 18A17 17 0 1 0 50 52A17 17 0 1 0 50 18Z","map destination"),
 g("flag","Flag","Symbols","M0 0H12V8H100L80 30L100 52H12V100H0Z","milestone"),
 g("speech","Speech bubble","Symbols","M0 0H100V72H42L12 100V72H0Z","chat quote",1.25),
 g("quote","Quotation marks","Symbols","M0 50L20 0H43L29 40H43V100H0ZM57 50L77 0H100L86 40H100V100H57Z","testimonial"),
 g("play","Play button","Symbols","M5 0L100 50L5 100Z","video media"),
 g("pause","Pause","Symbols","M0 0H35V100H0ZM65 0H100V100H65Z","video media"),
 g("music","Music note","Symbols","M35 0H100V72C100 108 55 108 55 80C55 64 72 60 84 65V25H50V72C50 108 5 108 5 80C5 64 22 60 35 65Z","song audio"),
 g("leaf","Leaf","Nature","M0 100C-2 40 35 0 100 0C100 65 60 102 0 100Z","botanical organic"),
 g("sprout","Sprout","Nature","M46 100V60C5 65 0 37 0 12C30 12 48 28 50 48C52 25 70 0 100 0C100 30 87 58 54 60V100Z","plant growth"),
 g("flower","Flower","Nature","M50 22C18 -18 -18 18 22 50C-18 82 18 118 50 78C82 118 118 82 78 50C118 18 82 -18 50 22Z","petals botanical"),
 g("tulip","Tulip","Nature","M45 100V65C10 65 0 35 0 0L28 22L50 0L72 22L100 0C100 35 90 65 55 65V100Z","flower"),
 g("mountain","Mountain","Nature","M0 100L35 0L58 57L75 28L100 100Z","travel outdoors"),
 g("cloud","Cloud","Nature","M20 100C-7 100 -7 55 18 50C10 10 57 -20 75 30C108 20 112 100 80 100Z","weather sky",1.5),
 g("moon","Crescent moon","Nature","M78 0C24 20 24 80 78 100C-25 110 -25 -10 78 0Z","night"),
 g("tree","Pine tree","Nature","M50 0L90 36H75L100 65H70L95 85H57V100H43V85H5L30 65H0L25 36H10Z","forest christmas"),
 g("wave","Wave","Decorations","M0 25C25 -10 25 60 50 25S75 60 100 25V75C75 110 75 40 50 75S25 40 0 75Z","water flowing",2),
 g("zigzag","Zigzag","Decorations","M0 30L20 0L40 30L60 0L80 30L100 0V60L80 90L60 60L40 90L20 60L0 90Z","chevron pattern",2),
 g("blob-round","Organic blob","Decorations","M10 20C35 -10 60 10 80 5C115 0 100 55 95 75C85 110 40 95 20 100C-10 100 5 55 10 20Z","abstract"),
 g("blob-soft","Soft blob","Decorations","M0 40C0 5 30 0 55 5C90 -5 115 25 90 50C115 90 70 110 50 95C15 115 -10 80 10 65Z","abstract"),
 g("sparkle","Sparkle","Decorations","M50 0Q50 50 100 50Q50 50 50 100Q50 50 0 50Q50 50 50 0Z","shine magic"),
 g("dots","Dot grid","Decorations",[10,50,90].flatMap(x=>[10,50,90].map(y=>`M${x-10} ${y}a10 10 0 1 0 20 0a10 10 0 1 0 -20 0Z`)).join(""),"pattern circles"),
 g("stripes","Diagonal stripes","Decorations","M0 0H20L0 20ZM40 0H60L0 60V40ZM80 0H100L0 100V80ZM100 20V40L40 100H20ZM100 60V80L80 100H60Z","pattern hatch"),
 g("checker","Checkerboard","Decorations",[0,25,50,75].flatMap((x,i)=>[0,25,50,75].filter((_,j)=>(i+j)%2===0).map(y=>`M${x} ${y}h25v25h-25Z`)).join(""),"pattern grid"),
 g("corner-frame","Corner frame","Decorations","M0 35V0H35V8H8V35ZM65 0H100V35H92V8H65ZM100 65V100H65V92H92V65ZM35 100H0V65H8V92H35Z","photo border"),
 g("bracket","Editorial bracket","Decorations","M0 0H100V10H15V90H100V100H0Z","frame left",0.35),
 g("tag","Price tag","Business","M0 0H60L100 50L60 100H0ZM68 40A10 10 0 1 0 68 60A10 10 0 1 0 68 40Z","sale label",1.4),
 g("ticket","Ticket","Business","M0 0H100V30C75 30 75 70 100 70V100H0V70C25 70 25 30 0 30Z","event admission",1.6),
 g("shopping-bag","Shopping bag","Business","M20 25V15C20 -5 80 -5 80 15V25H100V100H0V25ZM32 25H68V15C68 5 32 5 32 15Z","shop retail"),
 g("gift","Gift box","Business","M0 30H44C-10 28 5 -15 35 5L50 24L65 5C95 -15 110 28 56 30H100V50H0ZM5 56H44V100H5ZM56 56H95V100H56ZM42 23L30 12C20 4 17 22 42 23ZM58 23C83 22 80 4 70 12Z","present birthday"),
 g("crown","Crown","Business","M0 0L27 35L50 0L73 35L100 0L88 80H12ZM12 88H88V100H12Z","premium luxury"),
 g("trophy","Trophy","Business","M20 0H80V10H100V35C100 58 80 65 69 58C65 65 60 70 56 72V88H78V100H22V88H44V72C40 70 35 65 31 58C20 65 0 58 0 35V10H20ZM20 22H12V35C12 45 18 48 23 46ZM80 22L77 46C82 48 88 45 88 35V22Z","award winner"),
 g("house","House","Business","M0 42L50 0L100 42H88V100H60V63H40V100H12V42Z","home property real estate"),
 g("envelope","Envelope","Business","M0 0H100L50 55ZM0 15L43 62L0 100ZM100 15V100L57 62ZM50 72L80 100H20Z","mail contact",1.4),
 g("camera","Camera","Business","M0 20H25L32 0H68L75 20H100V100H0ZM50 32A27 27 0 1 0 50 86A27 27 0 1 0 50 32Z","photography social"),
 g("bars","Growth chart","Business","M0 65H25V100H0ZM37 35H62V100H37ZM75 0H100V100H75Z","analytics business statistics"),
];
const byId = new Map(elementLibrary.map(item=>[item.id,item]));
export function getGraphic(id) { return byId.get(id); }
export function filterElements(query="",category="All") {
 const q=query.trim().toLowerCase();
 const results = elementLibrary.filter(e=>(category==="All"||e.category===category)&&`${e.name} ${e.keywords} ${e.category}`.toLowerCase().includes(q));
 if(category === "All" && !q) {
  const popular = ["rectangle","circle","star-five","heart","arrow-right","lightning","speech","flower","tag","leaf","blob-round","sparkle"];
  const rank = new Map(popular.map((id,i)=>[id,i]));
  results.sort((a,b)=>(rank.get(a.id)??100)-(rank.get(b.id)??100));
 }
 return results;
}
