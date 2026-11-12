import Link from "next/link";
import { Header } from "@/components/marketing/header";
import { Brand } from "@/components/layout/brand";
import { DesignPreview } from "@/components/marketing/design-preview";
import { ConnectedDemo } from "@/components/marketing/connected-demo";
import { Icon } from "@/components/ui/icon";
import { templatePreviews } from "@/config/site";
export default function Home() {
  return (
    <>
      <Header />
      <main id="main-content">
        <section className="hero wrap">
          <div className="hero-top">
            <span className="eyebrow">
              <span className="status-dot" />A MORE CONNECTED WAY TO CREATE
            </span>
            <span className="edition-label">
              THE CREATIVE PLATFORM / IN DEVELOPMENT
            </span>
          </div>
          <div className="hero-heading">
            <h1>
              Create once.
              <br />
              <span>
                Use <em>everywhere.</em>
              </span>
            </h1>
            <div className="hero-aside">
              <p>
                One idea. A whole world
                <br />
                of possibilities.
              </p>
              <p className="muted">
                Turn your photos and information into coordinated designs.
                Change the details once. Keep every design in sync.
              </p>
              <Link className="button" href="/dashboard">
                Explore the local preview <Icon name="arrow" />
              </Link>
              <span className="fine-print">
                No account needed for this browser-only preview.
              </span>
            </div>
          </div>
          <div className="hero-studio">
            <div className="studio-caption">
              <span>
                <span className="status-dot" /> ONE CAMPAIGN. MANY
                POSSIBILITIES.
              </span>
              <span>CONCEPT PREVIEW ↗</span>
            </div>
            <div className="hero-designs">
              <div className="hero-poster poster-one">
                <DesignPreview />
                <span className="format-tag">01 / SOCIAL POST</span>
              </div>
              <div className="hero-poster poster-two">
                <DesignPreview
                  tone="peach"
                  format="portrait"
                  headline={"MAKE ROOM\nFOR GREEN."}
                />
                <span className="format-tag">02 / PROMOTIONAL FLYER</span>
              </div>
              <div className="hero-poster poster-three">
                <DesignPreview
                  tone="lilac"
                  format="story"
                  headline={"A LITTLE\nMORE LIFE."}
                />
                <span className="format-tag">03 / STORY</span>
              </div>
              <div className="connection-sticker">
                <Icon name="link" />
                <div>
                  Same story.
                  <br />
                  <strong>Different canvas.</strong>
                </div>
                <span>✦</span>
              </div>
            </div>
            <div className="studio-bottom">
              <span>Your ideas deserve more than one format.</span>
              <a href="#connected">
                See the connection <span aria-hidden="true">↓</span>
              </a>
            </div>
          </div>
        </section>
        <section id="how-it-works" className="section wrap">
          <div className="section-heading">
            <div>
              <span className="eyebrow">LESS REPEATING. MORE CREATING.</span>
              <h2>
                From a little information
                <br />
                to a bigger picture.
              </h2>
            </div>
            <p className="section-intro">
              The workflow we’re building brings the details, the designs, and
              the updates together.
            </p>
          </div>
          <div className="steps">
            {[
              [
                "01",
                "Bring your idea",
                "A product to sell. An event to share. Start with your photos and the details that matter.",
              ],
              [
                "02",
                "Make it a package",
                "Choose a visual direction and create coordinated posts, stories, and promotional designs.",
              ],
              [
                "03",
                "Keep it connected",
                "A new price? A different date? Update shared details without starting every design again.",
              ],
            ].map(([n, t, d]) => (
              <article key={n}>
                <span className="step-number">
                  {n}
                  <span>↗</span>
                </span>
                <h3>{t}</h3>
                <p>{d}</p>
              </article>
            ))}
          </div>
        </section>
        <section id="packages" className="package-section">
          <div className="wrap package-layout">
            <div>
              <span className="eyebrow">DESIGN PACKAGES · COMING SOON</span>
              <h2>
                One idea.
                <br />
                All the right
                <br />
                <em>places.</em>
              </h2>
              <p>
                Build a coordinated set for your next product, promotion, or
                gathering. A consistent look, wherever your story goes.
              </p>
              <div className="package-formats">
                <span>Social posts</span>
                <span>Stories</span>
                <span>Flyers</span>
                <span>Posters</span>
                <span>Event announcements</span>
              </div>
              <p className="fine-print">
                Illustrative formats. Generation and exports are not available
                yet.
              </p>
            </div>
            <div className="package-art">
              <div className="package-label">
                THE GREENHOUSE / CAMPAIGN NO. 01
              </div>
              <DesignPreview
                tone="lilac"
                format="portrait"
                headline={"GROW YOUR\nOWN WAY."}
              />
              <DesignPreview
                tone="sage"
                headline={"FRESH STARTS.\nGREEN HEARTS."}
              />
              <span className="package-note">
                A family of designs.
                <br />A feeling that’s all yours.
              </span>
            </div>
          </div>
        </section>
        <section id="connected" className="section wrap">
          <div className="section-heading">
            <div>
              <span className="eyebrow">THE COMVEXA CONNECTION</span>
              <h2>
                Update the details.
                <br />
                <em>Keep the design.</em>
              </h2>
            </div>
            <p className="section-intro">
              Shared content. Individual style. Connected designs are planned to
              keep names, prices, and dates in step, while every layout stays
              your own.
            </p>
          </div>
          <ConnectedDemo />
          <div className="connection-notes">
            <span>
              <Icon name="check" />
              One source for shared information
            </span>
            <span>
              <Icon name="check" />A distinct layout for every format
            </span>
            <span>
              <Icon name="check" />
              Individual overrides planned
            </span>
          </div>
        </section>
        <section id="templates" className="section templates-section wrap">
          <div className="section-heading">
            <div>
              <span className="eyebrow">A LITTLE HEAD START</span>
              <h2>
                Good ideas deserve
                <br />a good starting point.
              </h2>
            </div>
            <div>
              <p className="section-intro">
                Considered templates for everyday creators.
                <br />A small preview of what’s taking shape.
              </p>
              <Link className="text-link" href="/dashboard/templates">
                Explore template concepts <span>↗</span>
              </Link>
            </div>
          </div>
          <div className="template-grid">
            {templatePreviews.map((item) => (
              <article className="template-card" key={item.id}>
                <DesignPreview {...item} />
                <div>
                  <h3>{item.name}</h3>
                  <span>{item.category} / Concept</span>
                </div>
              </article>
            ))}
          </div>
        </section>
        <section id="free-tools" className="free-section wrap">
          <div className="free-symbol" aria-hidden="true">
            ✳
          </div>
          <div>
            <span className="eyebrow">ROOM FOR EVERY CREATOR</span>
            <h2>
              Big ideas shouldn’t
              <br />
              need a big budget.
            </h2>
            <p>
              Our plan: free basic design tools, a selection of free templates,
              and standard exports without watermarks. Made for the everyday
              things you want to put into the world.
            </p>
            <span className="pill">PLANNED FOR LAUNCH · NOT AVAILABLE YET</span>
          </div>
          <div className="free-list">
            <span>
              Text, photos & shapes <Icon name="plus" />
            </span>
            <span>
              Templates to make your own <Icon name="plus" />
            </span>
            <span>
              Watermark-free standard exports <Icon name="plus" />
            </span>
            <p>Export formats and limits will be confirmed after testing.</p>
          </div>
        </section>
        <section className="cta-section wrap">
          <span className="eyebrow">SOMETHING GOOD IS TAKING SHAPE</span>
          <h2>
            Your next idea.
            <br />
            <em>More possibilities.</em>
          </h2>
          <p>
            Take a look around the foundation of your future creative space.
          </p>
          <Link className="button" href="/dashboard">
            Explore the workspace preview <Icon name="arrow" />
          </Link>
          <span className="fine-print">
            Local project planning works now. Editor and cloud accounts are
            coming next.
          </span>
        </section>
      </main>
      <footer className="site-footer wrap">
        <Brand />
        <p>
          From the Philippines.
          <br />
          For whatever you’re creating.
        </p>
        <div>
          <span>© {new Date().getUTCFullYear()} Comvexa</span>
          <span>CREATIVE PLATFORM IN DEVELOPMENT</span>
        </div>
      </footer>
    </>
  );
}
