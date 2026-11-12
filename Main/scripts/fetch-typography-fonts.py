"""Fetch curated Google Fonts Latin WOFF2 files and their upstream OFL licenses.
Run manually to refresh assets; never needed at runtime or build time.
"""
import concurrent.futures, urllib.request, urllib.parse, re, json, pathlib, hashlib
families={
'Sans-serif': ['Inter','Roboto','Open Sans','Lato','Montserrat','Poppins','Nunito','Raleway','Work Sans','DM Sans','Manrope','Outfit','Plus Jakarta Sans','Urbanist','Space Grotesk','Barlow','Josefin Sans','Quicksand','Rubik','Archivo'],
'Serif':['Playfair Display','Lora','Merriweather','Libre Baskerville','Crimson Pro','Cormorant Garamond','DM Serif Display','Bodoni Moda','EB Garamond','Spectral'],
'Display':['Anton','Bebas Neue','Oswald','Righteous','Alfa Slab One','Abril Fatface','Lobster','Fjalla One','Archivo Black','Cinzel'],
'Handwritten':['Caveat','Patrick Hand','Kalam','Indie Flower','Handlee','Architects Daughter'],
'Script':['Dancing Script','Great Vibes','Pacifico','Sacramento']}
single={'DM Serif Display','Anton','Bebas Neue','Righteous','Alfa Slab One','Abril Fatface','Lobster','Fjalla One','Archivo Black','Patrick Hand','Indie Flower','Handlee','Architects Daughter','Great Vibes','Pacifico','Sacramento'}
root=pathlib.Path('public/fonts');root.mkdir(exist_ok=True)
ua='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
def fetch(url):
 return urllib.request.urlopen(urllib.request.Request(url,headers={'User-Agent':ua}),timeout=45).read()
def one(item):
 category,name=item;slug=name.lower().replace(' ','');directory=root/slug;directory.mkdir(exist_ok=True)
 license_url=f'https://raw.githubusercontent.com/google/fonts/main/ofl/{slug}/OFL.txt'
 license=fetch(license_url);(directory/'OFL.txt').write_bytes(license)
 weights=[400] if name in single else [400,700]
 url='https://fonts.googleapis.com/css2?family='+urllib.parse.quote(name)+':wght@'+';'.join(map(str,weights))+'&display=swap'
 css=fetch(url).decode(); blocks=re.findall(r'/\* latin \*/\s*@font-face\s*\{([^}]+)\}',css)
 if not blocks:raise RuntimeError(name+' missing Latin WOFF2')
 files=[]
 for block in blocks:
  weight=int(re.search(r'font-weight:\s*(\d+)',block)[1]);src=re.search(r'url\((https://[^)]+)\)',block)[1]
  data=fetch(src)
  if data[:4]!=b'wOF2':raise RuntimeError(name+' not WOFF2')
  path=f'/fonts/{slug}/{weight}.woff2';pathlib.Path('public'+path).write_bytes(data)
  files.append({'weight':weight,'path':path,'source':src,'bytes':len(data),'sha256':hashlib.sha256(data).hexdigest()})
 if sorted(f['weight'] for f in files)!=weights:raise RuntimeError(name+' missing weights')
 return {'name':name,'category':category,'license':'OFL-1.1','licenseSource':license_url,'faces':files}
with concurrent.futures.ThreadPoolExecutor(max_workers=5) as pool:
 results=list(pool.map(one,[(c,n) for c,names in families.items() for n in names]))
pathlib.Path('src/lib/typography/fonts.json').write_text(json.dumps(results,indent=2)+'\n')
print(f'{len(results)} font families, {sum(len(f["faces"]) for f in results)} faces, {sum(a["bytes"] for f in results for a in f["faces"]):,} bytes')
