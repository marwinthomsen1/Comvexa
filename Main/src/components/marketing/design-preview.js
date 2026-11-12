import Image from "next/image";
import { CreativePreview } from "./creative-preview";
export function DesignPreview({
  concept,
  tone = "electric",
  headline = "Wireless\nHeadphones",
  label = "COMVEXA STUDIO",
  price = "₱950",
  format = "square",
  className = "",
  badge = "NEW ARRIVAL",
  revision = 0,
  priority = false,
}) {
  if (concept)
    return (
      <CreativePreview
        concept={concept}
        format={format}
        priority={priority}
        className={className}
      />
    );
  return (
    <div
      className={`design-preview ad-preview tone-${tone} format-${format} ${className}`}
    >
      <div className="ad-wave" aria-hidden="true" />
      <span className="poster-label">{label}</span>
      <span className="ad-badge">{badge}</span>
      <h3>
        {headline.split("\n").map((line, index) => (
          <span key={index}>{line}</span>
        ))}
      </h3>
      <Image
        className="product-image"
        src="/images/wireless-headphones.png"
        alt=""
        width={768}
        height={768}
        sizes={
          priority
            ? "(max-width: 600px) 220px, 340px"
            : "(max-width: 600px) 180px, 300px"
        }
        priority={priority}
      />
      <div className="poster-bottom">
        <span className="ad-product-note">
          High-quality sound
          <br />
          Everyday possibility
        </span>
        <span key={`${revision}-${price}`} className="price-tag price-pop">
          {price}
        </span>
      </div>
    </div>
  );
}
