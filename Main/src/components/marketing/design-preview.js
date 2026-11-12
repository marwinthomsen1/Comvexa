export function PlantArt() {
  return (
    <svg
      className="plant-art"
      viewBox="0 0 300 330"
      fill="none"
      aria-hidden="true"
    >
      <ellipse
        cx="151"
        cy="306"
        rx="96"
        ry="12"
        fill="currentColor"
        opacity=".08"
      />
      <path
        d="M151 252C141 180 169 135 153 61M151 207C119 171 93 146 71 112M153 184C176 155 209 127 235 109M150 156C129 119 123 94 116 68"
        stroke="#345940"
        strokeWidth="5"
      />
      <path
        d="M153 115C111 91 135 31 158 14c23 39 31 74-5 101Z"
        fill="#416e48"
      />
      <path d="M120 145c-54 4-74-40-74-68 45 8 73 21 74 68Z" fill="#2d5739" />
      <path d="M168 158c-9-46 44-71 76-69-13 46-34 72-76 69Z" fill="#507c4f" />
      <path d="M132 186c-52 6-81-25-92-51 48-1 81 8 92 51Z" fill="#6f9257" />
      <path d="M160 208c-2-46 46-64 78-58-18 42-40 64-78 58Z" fill="#345f40" />
      <path d="M105 236h93l-13 67c-21 11-45 11-67 0l-13-67Z" fill="#ba6548" />
      <ellipse cx="151.5" cy="236" rx="46.5" ry="11" fill="#d48765" />
      <ellipse cx="151.5" cy="236" rx="35" ry="6" fill="#654636" />
      <path d="M119 247l9 50" stroke="#df9976" strokeWidth="4" opacity=".6" />
    </svg>
  );
}
export function DesignPreview({
  tone = "sage",
  headline = "GOOD THINGS\nGROW HERE.",
  label = "THE GREENHOUSE EDIT",
  price = "₱450",
  format = "square",
  className = "",
}) {
  return (
    <div
      className={`design-preview tone-${tone} format-${format} ${className}`}
    >
      <span className="poster-label">{label}</span>
      <h3>
        {headline.split("\n").map((line, index) => (
          <span key={index}>{line}</span>
        ))}
      </h3>
      <PlantArt />
      <div className="poster-bottom">
        <span>{price}</span>
        <span>MADE TO GROW ↗</span>
      </div>
    </div>
  );
}
