import { Brand } from "@/components/layout/brand";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Icon } from "@/components/ui/icon";
import { featurePreviews } from "@/config/site";

export default function Home() {
  return (
    <div className="site-shell">
      <header className="site-header"><Brand /><div className="header-tools"><span className="status"><span />In the making</span><ThemeToggle /></div></header>
      <main id="main-content">
        <section className="hero" aria-labelledby="hero-title">
          <div className="hero-copy">
            <p className="eyebrow"><span className="eyebrow-line" />A NEW CHAPTER IN LEARNING</p>
            <h1 id="hero-title">Learn smarter<br />with <span>Comvexa.</span></h1>
            <p className="hero-description">Big questions. Small breakthroughs. A little more understanding, every day.</p>
            <p className="hero-detail">We’re building an AI-powered space to ask, explore, and practice — at your own pace.</p>
            <a className="button button-primary" href="#explore">Explore what’s coming <span aria-hidden="true">↗</span></a>
            <p className="launch-note">Currently in development. Learning tools are coming soon.</p>
          </div>
          <div className="learning-art" role="img" aria-label="An open book with an orbit of ideas, illustrating a new chapter in learning">
            <span className="art-caption">ROOM FOR YOUR NEXT BIG IDEA</span>
            <div className="orbit orbit-one" /><div className="orbit orbit-two" />
            <span className="art-star star-one">✦</span><span className="art-star star-two">✧</span>
            <div className="idea-chip chip-one"><Icon name="spark" />Stay curious</div>
            <svg className="book" viewBox="0 0 360 290" fill="none" aria-hidden="true"><path d="M44 83c50-16 92-6 136 21 44-27 86-37 136-21v144c-46-13-91-4-136 22-45-26-90-35-136-22V83Z" fill="var(--book-shadow)" /><path d="M180 91C133 61 89 56 39 69v141c53-10 95 0 141 28V91Z" fill="var(--book-left)" stroke="var(--book-line)" strokeWidth="2" /><path d="M180 91c47-30 91-35 141-22v141c-53-10-95 0-141 28V91Z" fill="var(--book-right)" stroke="var(--book-line)" strokeWidth="2" /><path d="M180 92v144M65 99c27-3 55 2 85 16M65 123c27-3 55 2 85 16M65 147c27-3 55 2 67 8M210 115c28-14 54-19 85-16M210 139c28-14 54-19 85-16M210 163c28-14 54-19 68-17" stroke="var(--book-line)" strokeWidth="3" strokeLinecap="round" /><path d="m245 62 0 55 14-13 14 4V58" fill="var(--accent)" /></svg>
            <div className="idea-chip chip-two"><span className="chip-dot" />One idea at a time</div>
            <span className="art-bottom">YOUR CURIOSITY. A WORLD OF POSSIBILITY.</span>
          </div>
        </section>
        <section id="explore" className="feature-section" aria-labelledby="features-title">
          <div className="section-heading"><div><p className="eyebrow">THE TOOLKIT, REIMAGINED</p><h2 id="features-title">A few ways you’ll learn.</h2></div><span className="preview-label">A preview of what’s ahead</span></div>
          <div className="feature-grid">{featurePreviews.map((feature) => <article className="card feature-card" key={feature.name}><div className="feature-top"><span className={`feature-icon accent-${feature.accent}`}><Icon name={feature.icon} /></span><span className="feature-number">{feature.number}</span></div><h3>{feature.name}</h3><p>{feature.description}</p><span className="coming-soon">Coming soon</span></article>)}</div>
        </section>
      </main>
      <footer className="site-footer"><span>© {new Date().getUTCFullYear()} Comvexa</span><span>Built with curiosity. Made for everyone.</span><span>From the Philippines, for the world.</span></footer>
    </div>
  );
}
