// 25 content briefs × 20 editorial layouts. Each opens as editable text, shapes and photos.
export const briefs=[
 ['coffee','Coffee House','food','Coffee, slowly.','Small-batch roasts. Good company.','Visit the coffee bar','food'],
 ['bakery','Neighborhood Bakery','food','Baked with joy.','Fresh from our oven every morning.','Discover today’s bake','food'],
 ['seasonal','Seasonal Kitchen','food','Gather around.','A fresh menu, made for sharing.','Reserve your table','food'],
 ['wellness','Everyday Wellness','fashion','Room to breathe.','Small rituals for a balanced day.','Find your daily ritual','wellness'],
 ['florist','Flower Studio','business','Say it in flowers.','Seasonal stems, thoughtfully arranged.','Order your bouquet','flowers'],
 ['interiors','Interior Studio','property','Space to belong.','Considered interiors for everyday living.','Explore the collection','interiors'],
 ['homes','Open House','property','Your next chapter.','Light-filled spaces. A place to call home.','Book a viewing','architecture'],
 ['escape','Island Escape','travel','Take the slow road.','Beautiful places. Unforgettable little moments.','Plan your escape','travel'],
 ['adventure','Outdoor Adventure','travel','Go a little further.','Fresh air and a new perspective await.','Explore the outdoors','nature'],
 ['fashion','Independent Fashion','fashion','Wear your story.','Everyday pieces with a point of view.','Shop the new edit','fashion'],
 ['launch','Product Launch','business','Meet what’s next.','Thoughtful design. Everyday possibilities.','Discover the launch','technology'],
 ['studio','Creative Studio','business','Ideas into impact.','A collaborative studio for ambitious brands.','Let’s create together','business'],
 ['workshop','Creative Workshop','events','Make something new.','An afternoon of ideas, learning and making.','Save your place','education'],
 ['community','Community Gathering','events','Better, together.','Meet your neighbors. Share something good.','Join the gathering','celebrations'],
 ['birthday','Birthday Celebration','events','Let’s celebrate!','A day for laughter, wishes and good company.','You’re invited','celebrations'],
 ['wedding','Wedding Invitation','events','A beautiful beginning.','Together with our families, join our celebration.','Save the date','flowers'],
 ['fitness','Movement Club','social','Find your rhythm.','Move with purpose. Build your own momentum.','Join the next session','fitness'],
 ['learning','Learning Collective','personal','Stay curious.','New skills start with one good question.','Start learning today','education'],
 ['reading','Book Club','personal','One more chapter.','Stories that stay with you. Conversations that matter.','Join our reading circle','education'],
 ['pets','Pet Care Studio','business','For your best friend.','Thoughtful care for your favorite companion.','Book a visit','animals'],
 ['garden','Garden Journal','social','Let good things grow.','A little sunshine. A little patience. New possibilities.','Grow something good','flowers'],
 ['nonprofit','Community Impact','business','Small acts. Real change.','Give your time. Share your skills. Make a difference.','Get involved','business'],
 ['music','Live Music Sessions','events','Feel every note.','An intimate evening of live sound and connection.','Reserve your ticket','celebrations'],
 ['portfolio','Independent Portfolio','social','Work with meaning.','Selected projects. A thoughtful creative process.','Explore my work','textures'],
 ['mindful','Mindful Notes','social','A moment for you.','Pause. Notice the little things. Begin again.','Keep this reminder','nature']
].map(([slug,name,category,title,body,cta,photoCategory],index)=>({slug,name,category,title,body,cta,photoCategory,index}));
export const layoutNames=['Editorial Split','Gallery Window','Bold Masthead','Quiet Column','Photo Postcard','Offset Journal','Double Exposure','The Noticeboard','Studio Grid','Full Bleed','Color Field','Type Statement','The Invitation','Framed Story','Weekend Edit','Circular Focus','The Feature','Vertical Journal','Panorama','The Bulletin'];
const ratios=['square','portrait','poster','story','landscape'];
export const volumeTemplates=briefs.flatMap(b=>layoutNames.map((style,layout)=>({id:`collection-${b.slug}-${layout+1}`,name:`${b.name} · ${style}`,category:b.category,ratio:ratios[layout%5],style,pageCount:1,description:`${b.title} ${b.body} ${b.photoCategory}. Editable ${style.toLowerCase()} layout.`,brief:b.slug,layout}))).sort((a,b)=>a.layout-b.layout);
