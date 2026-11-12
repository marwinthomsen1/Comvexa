export const RATIOS = {
  square: { width: 1080, height: 1080, label: "Square social post" },
  portrait: { width: 1080, height: 1350, label: "Portrait social post" },
  story: { width: 1080, height: 1920, label: "Vertical story" },
  landscape: { width: 1200, height: 630, label: "Landscape advertisement" },
};
export const TEMPLATE_FAMILIES = [
  {
    id: "fashion",
    category: "Fashion",
    name: "The editorial edit",
    tagline: "Wear your own kind of bold.",
    description:
      "An expressive editorial campaign with oversized type and a cut-away photo.",
    image: "fashion",
    background: "#fa735b",
    ink: "#ffffff",
    accent: "#222d9e",
    font: "Arial",
    sample: {
      name: "Own your everyday.",
      description: "A fresh collection for the way you move.",
      price: "From ₱899",
      contact: "Visit our studio",
      link: "@theeverydayedit",
    },
  },
  {
    id: "food",
    category: "Food and restaurants",
    name: "Fresh off the grill",
    tagline: "Big bite. Big mood.",
    description:
      "Warm restaurant photography, a bold menu panel and an unmistakable offer.",
    image: "food",
    background: "#9c251d",
    ink: "#fff3bd",
    accent: "#f5c347",
    font: "Arial",
    sample: {
      name: "Big bite. Big mood.",
      description: "Crispy chicken, fresh greens and our signature sauce.",
      price: "₱249 / combo",
      contact: "Order: 0917 000 1234",
      link: "@thegoodbite",
    },
  },
  {
    id: "beauty",
    category: "Beauty and skincare",
    name: "Daily rituals",
    tagline: "A little everyday glow.",
    description:
      "Soft ivory space, botanical imagery and quiet serif typography.",
    image: "beauty",
    background: "#f1eddf",
    ink: "#243b2e",
    accent: "#afc5ad",
    font: "Georgia",
    sample: {
      name: "A little everyday glow.",
      description:
        "Meet your new morning ritual. Simple care, beautifully considered.",
      price: "₱690",
      contact: "Discover the collection",
      link: "dew.example",
    },
  },
  {
    id: "electronics",
    category: "Electronics",
    name: "Next frequency",
    tagline: "Find your frequency.",
    description:
      "Electric blue panels, product-focused framing and a high-contrast price.",
    image: "headphones",
    background: "#11134b",
    ink: "#ffffff",
    accent: "#c8ff54",
    font: "Arial",
    sample: {
      name: "Wireless Headphones",
      description: "Your music. Your moment. Find your everyday sound.",
      price: "₱950",
      contact: "Message us to order",
      link: "@nextfrequency",
    },
  },
  {
    id: "motors",
    category: "Cars and motorcycles",
    name: "Open road",
    tagline: "Chase the horizon.",
    description:
      "Charcoal and lime with a panoramic vehicle image and technical typography.",
    image: "motorcycle",
    background: "#171b18",
    ink: "#ddff6a",
    accent: "#637e28",
    font: "Arial",
    sample: {
      name: "Chase the horizon.",
      description: "Explore the collection. Your next chapter starts here.",
      price: "Enquire for pricing",
      contact: "Book a showroom visit",
      link: "@openroadmoto",
    },
  },
  {
    id: "travel",
    category: "Travel and tourism",
    name: "The island journal",
    tagline: "Somewhere beautiful.",
    description:
      "Immersive destination photography with a layered editorial title panel.",
    image: "travel",
    background: "#eaf5ee",
    ink: "#123d43",
    accent: "#ffc86b",
    font: "Georgia",
    sample: {
      name: "Somewhere beautiful.",
      description: "Discover hidden lagoons and slower days in Palawan.",
      price: "From ₱4,990",
      contact: "Plan your island escape",
      link: "@theislandjournal",
    },
  },
  {
    id: "birthday",
    category: "Birthday invitations",
    name: "A little celebration",
    tagline: "Oh, what a ONEderful day!",
    description:
      "Playful pastel circles, a photo medallion and a centered invitation.",
    image: "travel",
    background: "#fff2ce",
    ink: "#932c66",
    accent: "#c4b0fa",
    font: "Georgia",
    sample: {
      name: "Mila turns one!",
      description:
        "Join us for a ONEderful afternoon. June 14 · 3 PM · The Garden.",
      price: "",
      contact: "RSVP: 0917 000 5678",
      link: "Dress code: your favorite color",
    },
  },
  {
    id: "events",
    category: "Events and concerts",
    name: "After hours",
    tagline: "Make some noise.",
    description:
      "Geometric rhythm, contrasting blocks and a festival-style information strip.",
    image: "fashion",
    background: "#262096",
    ink: "#f2ff71",
    accent: "#ff7bc8",
    font: "Arial",
    sample: {
      name: "Make some noise.",
      description: "The weekend sessions. August 23 · 6 PM · Manila.",
      price: "Tickets ₱500",
      contact: "Reserve your spot",
      link: "@afterhourslive",
    },
  },
];
export function getFamily(id) {
  const family = TEMPLATE_FAMILIES.find((t) => t.id === id);
  if (!family) throw new Error("Choose an available template style.");
  return family;
}
export const templates = Object.keys(RATIOS).flatMap((ratio) =>
  TEMPLATE_FAMILIES.map((f) => ({
    id: `${f.id}-${ratio}`,
    familyId: f.id,
    ratio,
    name: f.name,
    category: f.category,
    description: f.description,
  })),
);
export function getTemplate(id) {
  const template = templates.find((t) => t.id === id);
  if (!template) throw new Error("Template not found.");
  return template;
}
export function filterTemplates({
  query = "",
  category = "All",
  ratio = "All",
} = {}) {
  const q = query.trim().toLowerCase();
  return templates.filter(
    (t) =>
      (category === "All" || t.category === category) &&
      (ratio === "All" || t.ratio === ratio) &&
      `${t.name} ${t.category} ${t.description}`.toLowerCase().includes(q),
  );
}
