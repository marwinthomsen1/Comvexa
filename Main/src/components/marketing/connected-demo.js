"use client";
import { useRef, useState } from "react";
import Link from "next/link";
import { DesignPreview } from "./design-preview";
import { Icon } from "@/components/ui/icon";
import {
  formatDemoPrice,
  validateDemoPrice,
} from "@/lib/design-document/demo-price";
const formats = [
  {
    id: "facebook",
    name: "Facebook ad",
    tone: "electric",
    format: "square",
    badge: "NEW ARRIVAL",
  },
  {
    id: "instagram",
    name: "Instagram post",
    tone: "pink",
    format: "square",
    badge: "FIND YOUR SOUND",
  },
  {
    id: "story",
    name: "Instagram story",
    tone: "blue",
    format: "story",
    badge: "NEW ARRIVAL",
  },
  {
    id: "flyer",
    name: "Promotional flyer",
    tone: "sunset",
    format: "portrait",
    badge: "BIG SALE",
  },
];
export function ConnectedDemo() {
  const [price, setPrice] = useState("950");
  const [revision, setRevision] = useState(0);
  const stage = useRef(null);
  const displayPrice = formatDemoPrice(price);
  function changePrice(value) {
    if (validateDemoPrice(value) && value !== price) {
      setPrice(value);
      setRevision((old) => old + 1);
    }
  }
  function move(event) {
    if (
      !window.matchMedia(
        "(hover: hover) and (prefers-reduced-motion: no-preference)",
      ).matches
    )
      return;
    const box = event.currentTarget.getBoundingClientRect();
    stage.current.style.setProperty(
      "--pointer-x",
      `${((event.clientX - box.left) / box.width - 0.5) * 10}px`,
    );
    stage.current.style.setProperty(
      "--pointer-y",
      `${((event.clientY - box.top) / box.height - 0.5) * 8}px`,
    );
  }
  function resetMotion() {
    stage.current?.style.setProperty("--pointer-x", "0px");
    stage.current?.style.setProperty("--pointer-y", "0px");
  }
  return (
    <>
      <section className="creative-hero wrap" aria-labelledby="hero-title">
        <div className="creative-hero-copy entrance entrance-one">
          <span className="creative-pill">
            <Icon name="spark" />
            The Creative Design Platform
          </span>
          <h1 id="hero-title">
            Create once.
            <br />
            <span className="gradient-text">Use everywhere.</span>
          </h1>
          <p className="hero-support">
            Turn one idea into posters, social posts, stories, and flyers — all
            connected and easy to update.
          </p>
          <div className="hero-buttons">
            <Link className="button" href="/dashboard">
              Start Creating Free <Icon name="arrow" />
            </Link>
            <a className="button button-outline" href="#how-it-works">
              <span className="play-icon" aria-hidden="true">
                ▶
              </span>
              See How It Works
            </a>
          </div>
          <p className="preview-caption">
            Explore the free local design studio. Cloud accounts coming soon.
          </p>
          <div className="hero-benefits">
            <div>
              <span className="benefit-symbol bolt" aria-hidden="true">
                ϟ
              </span>
              <span>
                <strong>Connected Designs</strong>
                <small>One update. Every format.</small>
              </span>
            </div>
            <div>
              <Icon name="layers" />
              <span>
                <strong>Design Packages</strong>
                <small>A coordinated creative set.</small>
              </span>
            </div>
            <div>
              <Icon name="spark" />
              <span>
                <strong>Free Design Tools</strong>
                <small>Planned, without watermarks.</small>
              </span>
            </div>
          </div>
        </div>
        <div
          ref={stage}
          className="showcase-stage entrance entrance-two"
          onPointerMove={move}
          onPointerLeave={resetMotion}
        >
          <div className="showcase-orbit" aria-hidden="true" />
          <div className="showcase-glow" aria-hidden="true" />
          <span className="showcase-rays" aria-hidden="true">
            ╲│╱
          </span>
          <div className="showcase-card showcase-main">
            <DesignPreview concept="fashion" format="portrait" priority />
          </div>
          <div className="showcase-card showcase-facebook">
            <DesignPreview concept="travel" />
          </div>
          <div className="showcase-card showcase-story">
            <DesignPreview concept="birthday" format="story" />
          </div>
          <div className="showcase-card showcase-flyer">
            <DesignPreview concept="food" format="portrait" />
          </div>
          <span className="showcase-disclaimer">
            CREATIVE POSSIBILITIES · EXAMPLE DESIGNS
          </span>
        </div>
      </section>
      <section
        id="connected"
        className="demo-bar wrap entrance entrance-three"
        aria-labelledby="demo-title"
      >
        <div className="demo-intro">
          <h2 id="demo-title">Connected Designs in Action</h2>
          <p>
            Change the price once.
            <br />
            Watch every preview follow.
          </p>
          <span className="demo-label">LIVE FRONTEND DEMONSTRATION</span>
        </div>
        <div className="demo-control">
          <label htmlFor="demo-price">
            Product Price <span>PHP</span>
          </label>
          <div className="demo-input">
            <span aria-hidden="true">₱</span>
            <input
              id="demo-price"
              type="number"
              inputMode="numeric"
              min="0"
              max="999999"
              step="1"
              value={price}
              onChange={(event) => changePrice(event.target.value)}
              aria-describedby="demo-help"
            />
          </div>
          <div id="demo-help" className="demo-actions">
            <button type="button" onClick={() => changePrice("850")}>
              Try ₱850 <span aria-hidden="true">↗</span>
            </button>
            <button type="button" onClick={() => changePrice("950")}>
              Reset
            </button>
          </div>
        </div>
        <span className="demo-arrow" aria-hidden="true">
          <Icon name="arrow" />
        </span>
        <div className="demo-previews">
          {formats.map((item) => (
            <div className="mini-design" key={item.id}>
              <DesignPreview
                {...item}
                price={displayPrice}
                revision={revision}
              />
              <span className="mini-check" aria-hidden="true">
                <Icon name="check" />
              </span>
              <span className="mini-format">{item.name}</span>
            </div>
          ))}
        </div>
        <p className="sr-only" aria-live="polite">
          All connected demonstration designs now show {displayPrice}. This
          illustration is not saved.
        </p>
      </section>
    </>
  );
}
