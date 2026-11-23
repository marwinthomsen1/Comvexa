// Discovery depends only on small metadata, never the authored document recipes.
import metadata from "./library-metadata.js";
const normalize = value => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLowerCase();
const index = metadata.templates.map(template => ({template, search:normalize(`${template.id.replaceAll("-", " ")} ${template.name} ${template.description} ${template.style} ${metadata.categories.find(c => c[0] === template.category)?.[1]}`)}));
export function discoverTemplates({query = "", category = "All", ratio = "All", style = "All"} = {}) {
 const words = normalize(query).split(/\s+/).filter(Boolean);
 return index.filter(({template:t,search}) => (category === "All" || category.split(",").includes(t.category)) && (ratio === "All" || t.ratio === ratio) && (style === "All" || t.style === style) && words.every(word => search.includes(word))).map(({template})=>template);
}
