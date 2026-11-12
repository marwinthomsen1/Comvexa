import Image from "next/image";

const designs = {
  fashion: {
    label: "THE EVERYDAY EDIT",
    title: "Wear your\nown kind\nof bold.",
    detail: "NEW SEASON / COLLECTION 01",
    image: "fashion",
    footer: "Style without limits ↗",
  },
  travel: {
    label: "THE ISLAND JOURNAL",
    title: "Somewhere\nbeautiful.",
    detail: "PALAWAN, PHILIPPINES",
    image: "travel",
    footer: "Find your next escape →",
  },
  birthday: {
    label: "YOU’RE INVITED",
    title: "Oh, what\na ONEderful\nday!",
    detail: "MILA TURNS ONE",
    footer: "JUNE 14 · 3 PM / THE GARDEN",
  },
  food: {
    label: "THE GOOD BITE",
    title: "Big bite.\nBig mood.",
    detail: "FRESH OFF THE GRILL",
    image: "food",
    footer: "BURGER + FRIES / ₱249",
  },
  beauty: {
    label: "DEW / DAILY RITUALS",
    title: "A little\neveryday\nglow.",
    detail: "MEET YOUR MORNING RITUAL",
    image: "beauty",
    footer: "Simple care. Beautiful moments.",
  },
  motorcycle: {
    label: "OPEN ROAD / MOTO",
    title: "CHASE\nTHE\nHORIZON.",
    detail: "YOUR NEXT CHAPTER STARTS HERE",
    image: "motorcycle",
    footer: "EXPLORE THE COLLECTION ↗",
  },
  event: {
    label: "AFTER HOURS PRESENTS",
    title: "MAKE\nSOME\nNOISE.",
    detail: "THE WEEKEND SESSIONS",
    footer: "AUG 23 / 6 PM / MANILA",
  },
  social: {
    label: "THE CREATIVE CLUB",
    title: "Small ideas.\nBig energy.",
    detail: "YOUR DAILY DOSE OF INSPIRATION",
    footer: "SAVE IT. SHARE IT. MAKE IT YOURS. ↗",
  },
};

export function CreativePreview({
  concept = "fashion",
  format = "square",
  priority = false,
  className = "",
}) {
  const design = designs[concept] || designs.fashion;
  return (
    <div
      className={`design-preview creative-preview concept-${concept} creative-format-${format} ${className}`}
    >
      {design.image && (
        <Image
          className="creative-art"
          src={`/images/previews/${design.image}.webp`}
          alt=""
          fill
          sizes={
            priority
              ? "(max-width: 600px) 240px, 360px"
              : "(max-width: 600px) 260px, (max-width: 1000px) 340px, 400px"
          }
          preload={priority}
        />
      )}
      <div className="creative-art-shade" aria-hidden="true" />
      <div className="creative-ornament" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
      <span className="creative-label">{design.label}</span>
      <span className="creative-detail">{design.detail}</span>
      <h3 className="creative-title">
        {design.title.split("\n").map((line, i) => (
          <span key={i}>{line}</span>
        ))}
      </h3>
      <span className="creative-footer-copy">{design.footer}</span>
    </div>
  );
}
