"use client";
import { useState } from "react";
import { DesignPreview } from "./design-preview";
import { Icon } from "@/components/ui/icon";
export function ConnectedDemo() {
  const [price, setPrice] = useState("450");
  const displayPrice = new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    maximumFractionDigits: 0,
  }).format(Number(price) || 0);
  return (
    <div className="connected-demo">
      <div className="shared-field">
        <div>
          <span className="small-label">CAMPAIGN CONTENT</span>
          <h3>
            One little change.
            <br />A whole lot of possibilities.
          </h3>
          <p>
            Try changing the price. All three previews follow along, each with
            its own layout.
          </p>
        </div>
        <label htmlFor="demo-price">
          Plant price <span>PHP</span>
          <input
            id="demo-price"
            type="number"
            min="0"
            max="999999"
            value={price}
            onChange={(event) => {
              const value = event.target.value;
              if (
                value === "" ||
                (Number(value) >= 0 && Number(value) <= 999999)
              )
                setPrice(value);
            }}
          />
        </label>
        <span className="demo-disclaimer">
          <Icon name="link" />
          Interactive illustration · not saved
        </span>
      </div>
      <div
        className="linked-previews"
        aria-label="Connected design illustration"
      >
        <DesignPreview price={displayPrice} />
        <DesignPreview tone="lilac" price={displayPrice} format="story" />
        <DesignPreview tone="peach" price={displayPrice} format="portrait" />
      </div>
      <p className="sr-only" aria-live="polite">
        All three illustration prices: {displayPrice}
      </p>
    </div>
  );
}
