import { validateDraft, validateProfile } from "./validation.js";
export const STORAGE_KEY = "comvexa:creative-preview:v1";
export function emptyWorkspace() {
  return {
    version: 1,
    projects: [],
    campaigns: [],
    profile: { displayName: "Creator", bio: "" },
  };
}
export function readWorkspace(storage) {
  const raw = storage.getItem(STORAGE_KEY);
  if (!raw) return emptyWorkspace();
  const data = JSON.parse(raw);
  if (
    data?.version !== 1 ||
    !Array.isArray(data.projects) ||
    !Array.isArray(data.campaigns) ||
    data.projects.length > 100 ||
    data.campaigns.length > 100
  )
    throw new Error(
      "This saved preview could not be loaded. Your browser data has not been overwritten.",
    );
  const ids = new Set();
  for (const [kind, items] of [
    ["campaign", data.campaigns],
    ["project", data.projects],
  ]) {
    for (const item of items) {
      if (
        typeof item.id !== "string" ||
        !/^[a-zA-Z0-9-]{1,64}$/.test(item.id) ||
        ids.has(item.id) ||
        !Number.isFinite(Date.parse(item.createdAt))
      )
        throw new Error("The saved preview contains invalid items.");
      ids.add(item.id);
      Object.assign(item, validateDraft(kind, item, data.campaigns));
    }
  }
  data.profile = validateProfile(data.profile);
  return data;
}
export function writeWorkspace(storage, data) {
  storage.setItem(STORAGE_KEY, JSON.stringify(data));
}
export function addDraft(data, kind, input, id, createdAt) {
  const list = kind === "campaign" ? "campaigns" : "projects";
  if (data[list].length >= 100)
    throw new Error("This local preview supports up to 100 items per type.");
  const draft = {
    ...validateDraft(kind, input, data.campaigns),
    id,
    createdAt,
  };
  return { ...data, [list]: [draft, ...data[list]] };
}
