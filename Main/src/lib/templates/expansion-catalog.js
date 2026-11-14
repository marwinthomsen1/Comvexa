// Authored compositions. Coordinates are in a 794 × 1123 A4 design space.
// Each resume has its own section map; no color/size variants are counted.
const resumes = [
 ['clear-path','Clear Path','ATS-Friendly','plain','profile:48,180,698,100|experience:48,306,698,300|education:48,640,698,130|skills:48,806,698,130'],
 ['career-record','Career Record','ATS-Friendly','rule','experience:48,190,698,318|skills:48,546,698,120|education:48,710,698,130|profile:48,890,698,100'],
 ['technical-brief','Technical Brief','ATS-Friendly','compact','profile:48,155,698,100|skills:48,285,698,110|experience:48,435,698,300|education:48,785,698,130'],
 ['graduate-record','Graduate Record','ATS-Friendly','plain','education:48,180,698,125|projects:48,344,698,160|experience:48,550,698,280|skills:48,870,698,120'],
 ['research-record','Research Record','ATS-Friendly','rule','profile:48,190,698,100|education:48,326,698,130|experience:48,492,698,290|projects:48,818,698,130|skills:48,980,698,80'],
 ['northline','Northline','Modern Professional','band','profile:48,212,698,100|experience:300,354,446,360|education:300,758,446,170|skills:48,354,210,240|projects:48,648,210,290'],
 ['side-note','Side Note','Modern Professional','left','profile:288,190,458,125|experience:288,364,458,350|education:288,765,458,170|skills:48,260,190,245|projects:48,562,190,320'],
 ['right-angle','Right Angle','Modern Professional','right','profile:48,200,450,110|experience:48,354,450,360|education:48,766,450,170|skills:548,230,198,245|projects:548,530,198,330'],
 ['project-led','Project Led','Modern Professional','split','profile:48,195,698,100|projects:48,340,330,230|skills:420,340,326,230|experience:48,620,698,270|education:48,936,698,125'],
 ['folio-line','Folio Line','Modern Professional','rule','profile:48,195,698,105|experience:48,344,455,370|skills:550,344,196,220|education:48,764,455,180|projects:550,620,196,330'],
 ['boardroom','Boardroom','Executive','serif','profile:48,200,698,125|experience:48,372,698,340|education:48,764,330,170|skills:420,764,326,170'],
 ['leadership-dossier','Leadership Dossier','Executive','band','profile:48,220,698,125|projects:48,390,220,260|experience:312,390,434,355|education:312,800,434,160|skills:48,710,220,250'],
 ['managing-partner','Managing Partner','Executive','split','profile:48,200,430,155|skills:530,200,216,220|experience:48,454,698,320|education:48,820,698,150'],
 ['strategy-column','Strategy Column','Executive','left','profile:280,195,466,125|experience:280,366,466,370|education:280,790,466,165|skills:48,290,185,245|projects:48,600,185,350'],
 ['campus-journal','Campus Journal','Student & Fresh Graduate','plain','profile:48,180,698,100|education:48,326,330,180|skills:420,326,326,180|projects:48,550,698,180|experience:48,780,698,270'],
 ['first-step','First Step','Student & Fresh Graduate','band','education:48,220,698,160|projects:48,426,450,230|skills:548,426,198,245|experience:48,710,698,320'],
 ['internship-notes','Internship Notes','Student & Fresh Graduate','right','profile:48,190,450,125|education:48,360,450,170|experience:48,580,450,360|skills:548,260,198,245|projects:548,566,198,355'],
 ['lab-notebook','Lab Notebook','Student & Fresh Graduate','compact','education:48,170,698,130|experience:48,350,698,280|projects:48,678,330,300|skills:420,678,326,220'],
 ['type-director','Type Director','Creative','display','profile:48,250,698,100|experience:48,398,430,360|projects:530,398,216,300|education:48,804,430,180|skills:530,754,216,230'],
 ['studio-index','Studio Index','Creative','split','profile:48,205,330,150|skills:420,205,326,180|projects:48,436,698,190|experience:48,676,450,350|education:548,676,198,260'],
 ['creative-margin','Creative Margin','Creative','left','profile:286,200,460,125|projects:286,370,460,180|experience:286,598,460,360|skills:48,280,190,245|education:48,600,190,300'],
 ['editorial-grid','Editorial Grid','Creative','display','profile:48,250,440,120|education:540,250,206,220|experience:48,430,440,350|skills:540,530,206,230|projects:48,832,698,180'],
 ['quiet-serif','Quiet Serif','Minimalist','serif','profile:78,205,638,120|experience:78,380,638,310|education:78,750,638,135|skills:78,942,638,100'],
 ['white-space','White Space','Minimalist','compact','profile:64,180,666,110|experience:64,350,426,350|skills:544,350,186,240|education:64,770,666,170'],
 ['essential-lines','Essential Lines','Minimalist','rule','experience:64,210,666,310|education:64,580,666,135|skills:64,775,300,180|profile:420,775,310,180'],
 ['balanced-page','Balanced Page','Minimalist','serif','profile:64,200,666,100|experience:64,360,666,310|education:64,740,300,200|skills:420,740,310,200'],
 ['global-profile','Global Profile','International','band','profile:48,220,698,120|experience:48,390,450,360|education:48,800,450,170|skills:548,390,198,245|languages:548,700,198,240'],
 ['bilingual-record','Bilingual Record','International','plain','languages:48,190,698,100|profile:48,330,698,100|experience:48,470,698,290|education:48,810,330,180|skills:420,810,326,180'],
 ['cross-border','Cross Border','International','right','profile:48,195,450,125|experience:48,365,450,360|education:48,780,450,180|languages:548,230,198,170|skills:548,465,198,270|projects:548,800,198,220'],
 ['international-brief','International Brief','International','split','profile:48,200,698,110|experience:48,360,698,310|languages:48,730,205,190|education:288,730,220,260|skills:548,730,198,240'],
];
export const resumePlans = resumes.map(([slug,name,style,header,map],index)=>({id:`resume-${slug}`,name,style,header,index,sections:map.split('|').map(v=>{const [kind,box]=v.split(':');return {kind,box:box.split(',').map(Number)};})}));
const decks=[
 ['business-review','Quarterly Business Review','Business','Performance with perspective','Revenue growth|Customer retention|Operating priorities'],
 ['startup-pitch','Startup Pitch','Startup','A better way to move ideas forward','The problem|Our solution|Business model'],
 ['classroom-story','Classroom Story','Education','How cities can grow greener','The question|What we discovered|Try it together'],
 ['marketing-plan','Marketing Plan','Marketing','A campaign worth remembering','Audience insight|Creative direction|Channel plan'],
 ['project-report','Project Report','Professional','From brief to delivery','Project scope|Milestones|Results and learning'],
 ['portfolio-deck','Creative Portfolio','Editorial','Selected work, considered carefully','Design approach|Featured project|Process and impact'],
 ['product-launch','Product Launch','Product','Meet the next everyday essential','Customer need|Product experience|Launch roadmap'],
];
export const presentationPlans=decks.map(([slug,name,style,title,topics],index)=>({id:`deck-${slug}`,name,style,title,topics:topics.split('|'),index}));
export const expansionTemplates=[...resumePlans.map(t=>({id:t.id,name:t.name,category:'resumes',ratio:'resume-a4',style:t.style,pageCount:1,description:`${t.name}: an editable A4 resume with contact, experience, education and skills. Fictional example information.${t.style==='ATS-Friendly'?' Conventional headings and a single-column reading order; compatibility varies by applicant tracking system.':''}${t.style==='International'?' Adapt the content and conventions to your target country.':''}`})),...presentationPlans.map(t=>({id:t.id,name:t.name,category:'presentations',ratio:'slides',style:t.style,pageCount:5,description:`Five coordinated, editable slides: a title, three content slides and a closing slide. PDF and image exports.`}))];
export const printPlans=[
 {id:'print-business-card',name:'Atelier Business Card',category:'business-cards',ratio:'card',style:'Minimalist',pageCount:2},
 {id:'print-certificate',name:'Certificate of Achievement',category:'certificates',ratio:'print-landscape',style:'Classic',pageCount:1},
 {id:'print-weekly-planner',name:'Weekly Focus Planner',category:'planners',ratio:'resume-a4',style:'Minimalist',pageCount:1},
 {id:'print-calendar',name:'January 2027 Calendar',category:'planners',ratio:'print-landscape',style:'Editorial',pageCount:1},
 {id:'print-brochure',name:'Studio Services Brochure',category:'brochures',ratio:'resume-a4',style:'Editorial',pageCount:3},
 {id:'print-product-catalog',name:'Objects Product Catalog',category:'catalogs',ratio:'resume-a4',style:'Modern',pageCount:3},
 {id:'print-portfolio',name:'Selected Work Portfolio',category:'portfolios',ratio:'resume-a4',style:'Editorial',pageCount:3},
 {id:'print-menu',name:'Gather Seasonal Menu',category:'food',ratio:'resume-a4',style:'Classic',pageCount:1},
 {id:'print-letter',name:'Studio Letterhead',category:'other',ratio:'resume-a4',style:'Professional',pageCount:1},
 {id:'print-checklist',name:'Project Launch Checklist',category:'personal',ratio:'resume-a4',style:'Minimalist',pageCount:1},
 {id:'print-program',name:'Community Evening Program',category:'events',ratio:'resume-a4',style:'Classic',pageCount:2},
];
export const collagePlans=[
 ['pair','Two Together',[[48,180,332,700],[414,180,332,700]]],
 ['trio','Travel Triptych',[[48,180,440,700],[512,180,234,338],[512,542,234,338]]],
 ['four','Four Moments',[[48,180,337,337],[409,180,337,337],[48,541,337,337],[409,541,337,337]]],
 ['grid','Nine Little Stories',Array.from({length:9},(_,i)=>[48+(i%3)*238,180+Math.floor(i/3)*238,222,222])],
 ['scrapbook','Scrapbook Notes',[[48,220,410,365],[405,650,340,300],[68,650,305,290]]],
 ['polaroid','Polaroid Journal',[[70,210,295,340],[430,320,295,340],[100,650,295,340]]],
 ['birthday','Birthday Memories',[[48,290,698,380],[48,710,337,270],[409,710,337,270]]],
 ['travel','Travel Postcards',[[48,180,698,420],[48,640,220,300],[287,640,220,300],[526,640,220,300]]],
 ['album','Photo Album',[[48,180,698,360],[48,580,337,360],[409,580,337,360]]],
].map(([slug,name,frames])=>({id:`collage-${slug}`,name,frames,category:'collages',ratio:'resume-a4',style:'Photography',pageCount:1}));
expansionTemplates.push(...[...printPlans,...collagePlans].map(({frames: _frames,...t})=>({...t,description:`${t.name}: ${t.pageCount} editable ${t.pageCount===1?'page':'pages'} with individually editable text and layout.`})));
