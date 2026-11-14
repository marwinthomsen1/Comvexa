export function validateTextLayout(v){if(!v||!['arc','vertical'].includes(v.mode)||typeof v.bend!=='number'||!Number.isFinite(v.bend)||v.bend< -90||v.bend>90)throw Error('Invalid text layout.');return {mode:v.mode,bend:v.bend};}
export function arcPath(e){const y=e.height/2,control=y-e.height*(e.textLayout.bend/90);return `M0 ${y} Q${e.width/2} ${control} ${e.width} ${y}`;}
export function displayText(e){return e.textLayout?.mode==='vertical'?[...e.text.replace(/\s+/g,' ')].join('\n'):e.text;}
