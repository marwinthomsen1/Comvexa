import Link from "next/link";
import { Header } from "@/components/marketing/header";
import { Brand } from "@/components/layout/brand";
import { DesignPreview } from "@/components/marketing/design-preview";
import { ConnectedDemo } from "@/components/marketing/connected-demo";
import { RibbonBackdrop } from "@/components/marketing/ribbon-backdrop";
import { MotionEffects } from "@/components/marketing/motion-effects";
import { Icon } from "@/components/ui/icon";
import { templatePreviews } from "@/config/site";
export default function Home() {
  return (
    <div className="landing-page">
      <MotionEffects />
      <RibbonBackdrop />
      <Header />
      <main id="main-content">
        <ConnectedDemo />
        <section id="how-it-works" className="how-section wrap reveal">
          <div className="center-heading">
            <span className="creative-pill">How Comvexa Works</span>
            <h2>
              From one idea to many designs
              <span className="heading-underline" />
            </h2>
            <p>
              The workflow we’re building. A simpler way to bring your ideas
              together.
            </p>
          </div>
          <div className="how-grid">
            {[
              [
                "image",
                "1",
                "Add your information",
                "Start with photos and details like a product name, price, or event date.",
              ],
              [
                "layers",
                "2",
                "Create a design package",
                "Use coordinated templates for the formats your idea needs.",
              ],
              [
                "refresh",
                "3",
                "Update once",
                "Change shared details and keep connected designs in step.",
              ],
            ].map(([icon, n, title, description]) => (
              <article key={n} className="how-card">
                <span className={`how-icon how-icon-${n}`}>
                  <Icon name={icon} />
                </span>
                <div>
                  <h3>
                    <span className="step-bubble">{n}</span>
                    {title}
                  </h3>
                  <p>{description}</p>
                </div>
              </article>
            ))}
          </div>
        </section>
        <section id="packages" className="creative-section wrap reveal">
          <div className="creative-section-heading">
            <div>
              <span className="creative-pill">One idea. Every format.</span>
              <h2>
                A whole creative world.
                <br />
                <span className="gradient-text">From one little idea.</span>
              </h2>
            </div>
            <div>
              <p>
                A post for your feed. A story for your followers. A flyer for
                your next big thing. Make them feel like they belong together.
              </p>
              <span className="availability-label">
                DESIGN PACKAGES · COMING SOON
              </span>
            </div>
          </div>
          <div className="package-showcase">
            <div className="package-copy">
              <span className="tiny-label">MEET YOUR NEXT CAMPAIGN</span>
              <h3>
                Different formats.
                <br />
                Same unmistakable you.
              </h3>
              <p>
                Your information stays consistent. Every layout gets room to
                shine.
              </p>
              <div className="package-formats">
                <span>Social posts</span>
                <span>Stories</span>
                <span>Flyers</span>
                <span>Posters</span>
              </div>
              <p className="fine-print">
                Example artwork only. Generating designs and exports is not
                available yet.
              </p>
            </div>
            <div className="package-stack">
              <DesignPreview concept="beauty" format="story" />
              <DesignPreview concept="event" format="square" />
              <DesignPreview concept="motorcycle" format="portrait" />
            </div>
          </div>
        </section>
        <section id="templates" className="creative-section wrap reveal">
          <div className="creative-section-heading">
            <div>
              <span className="creative-pill">A spark of inspiration</span>
              <h2>
                A beautiful place
                <br />
                to <span className="gradient-text">start creating.</span>
              </h2>
            </div>
            <div>
              <p>
                Colorful template concepts for products, promotions, and the
                everyday ideas you want to share.
              </p>
              <Link className="text-link" href="/dashboard/templates">
                Explore template concepts <Icon name="arrow" />
              </Link>
            </div>
          </div>
          <div className="template-grid creative-template-grid">
            {templatePreviews.map((item) => (
              <article className="template-card" key={item.id}>
                <DesignPreview {...item} />
                <div>
                  <h3>{item.name}</h3>
                  <span>{item.category} · Concept</span>
                </div>
              </article>
            ))}
          </div>
        </section>
        <section id="free-tools" className="creative-free wrap reveal">
          <div className="free-orb" aria-hidden="true">
            <Icon name="spark" />
          </div>
          <div>
            <span className="creative-pill">Creativity is for everyone</span>
            <h2>
              Big ideas.
              <br />
              <span className="gradient-text">Not a big budget.</span>
            </h2>
            <p>
              We’re building towards free basic design tools, free templates,
              and standard exports without watermarks. More room for your
              creativity.
            </p>
            <span className="availability-label">
              PLANNED FOR LAUNCH · NOT AVAILABLE YET
            </span>
          </div>
          <div className="creative-tool-list">
            <span>
              <Icon name="check" />
              Text, photos & shapes
            </span>
            <span>
              <Icon name="check" />
              Templates to make your own
            </span>
            <span>
              <Icon name="check" />
              Watermark-free standard exports
            </span>
            <p>
              Formats, quality, and usage limits will be confirmed after
              testing. No subscriptions or payments are connected.
            </p>
          </div>
        </section>
        <section className="creative-cta wrap reveal">
          <span className="creative-pill">
            <Icon name="spark" />
            Your next idea starts here
          </span>
          <h2>
            Make something
            <br />
            <span className="gradient-text">worth sharing.</span>
          </h2>
          <p>Explore the foundation of your future creative space.</p>
          <Link className="button" href="/dashboard">
            Start Creating Free <Icon name="arrow" />
          </Link>
          <span className="fine-print">
            Free browser-local editing and project planning. Cloud saving is
            coming later.
          </span>
        </section>
      </main>
      <footer className="site-footer creative-footer wrap">
        <Brand />
        <p>
          Create once. Use everywhere.
          <br />
          From the Philippines, for the world.
        </p>
        <div>
          <span>© {new Date().getUTCFullYear()} Comvexa</span>
          <span>CREATIVE PLATFORM IN DEVELOPMENT</span>
        </div>
      </footer>
    </div>
  );
}
