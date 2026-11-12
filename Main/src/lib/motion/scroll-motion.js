// Progressive enhancement: reduced motion and missing observers never hide content.
export function installScrollMotion({ root, preference, Observer, query }) {
  let revealObserver;
  let visibilityObserver;
  function configure() {
    revealObserver?.disconnect();
    visibilityObserver?.disconnect();
    root.classList.remove("motion-ready");
    if (preference.matches || !Observer) return;
    revealObserver = new Observer(
      (entries) =>
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            revealObserver.unobserve(entry.target);
          }
        }),
      { rootMargin: "0px 0px 40px 0px", threshold: 0.08 },
    );
    query(".reveal").forEach((node) => revealObserver.observe(node));
    visibilityObserver = new Observer((entries) =>
      entries.forEach((entry) => {
        entry.target.dataset.visible = String(entry.isIntersecting);
      }),
    );
    query(".showcase-stage, .ribbon-backdrop").forEach((node) =>
      visibilityObserver.observe(node),
    );
    root.classList.add("motion-ready");
  }
  configure();
  preference.addEventListener("change", configure);
  return () => {
    revealObserver?.disconnect();
    visibilityObserver?.disconnect();
    preference.removeEventListener("change", configure);
    root.classList.remove("motion-ready");
  };
}
