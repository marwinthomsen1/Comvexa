export function cleanText(value, label, max, required = true) {
  if (typeof value !== "string") throw new Error(`${label} must be text.`);
  const result = value.trim();
  if (
    (required && !result) ||
    result.length > max ||
    [...result].some((character) => {
      const code = character.charCodeAt(0);
      return code < 32 && ![9, 10, 13].includes(code);
    })
  ) {
    throw new Error(
      `${label} must be ${required ? "1" : "0"}–${max} characters.`,
    );
  }
  return result;
}
export const PROJECT_SIZES = {
  square: { label: "Square post", width: 1080, height: 1080 },
  portrait: { label: "Portrait post", width: 1080, height: 1350 },
  story: { label: "Story", width: 1080, height: 1920 },
  flyer: { label: "Flyer concept", width: 1240, height: 1754 },
};
export function validateDraft(kind, input, campaigns = []) {
  if (!input || typeof input !== "object")
    throw new Error("Enter project details.");
  const name = cleanText(input.name, "Name", 80);
  const description = cleanText(
    input.description ?? "",
    "Description",
    500,
    false,
  );
  if (kind === "campaign") return { name, description };
  if (kind !== "project") throw new Error("Unknown item type.");
  if (!Object.hasOwn(PROJECT_SIZES, input.size))
    throw new Error("Choose a canvas format.");
  const campaignId = input.campaignId || null;
  if (campaignId && !campaigns.some((item) => item.id === campaignId))
    throw new Error("Choose a campaign in this workspace.");
  return { name, description, size: input.size, campaignId };
}
export function validateProfile(input) {
  return {
    displayName: cleanText(input.displayName, "Display name", 60),
    bio: cleanText(input.bio ?? "", "Bio", 240, false),
  };
}
