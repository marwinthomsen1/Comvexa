# Comvexa animated wordmark

The existing colorful C is now the first letter: **[original gradient C] + omvexa**. The duplicate text C was removed. The existing font family, weight, letter spacing and theme colors remain. The original two SVG paths, stroke styling, gradient coordinates and five color stops are unchanged; a comparison against baseline `e2c1a4d` confirmed path/stop equality. `public/icon.svg` is byte-for-byte unchanged and remains static.

## Implementation

- `src/components/layout/brand.js`: only the C artwork is wrapped in an animated SVG group. The remaining `omvexa` span stays still. The existing accessible link label and navigation handlers are preserved.
- `src/app/globals.css`: baseline alignment, zero inter-item gap, a fixed proportional SVG slot and the shared CSS keyframes. The C makes one full 360° turn in **6 seconds**, eases to rest and stays upright for **6 seconds**, then repeats. This uses the user's permitted rotate-and-pause alternative to maintain readability. Only `transform` changes; animation does not trigger React state updates or timers. No glow or particle effects were added.
- The rotation origin is the exact circular-arc center `(36 − √(18² − 14²), 24)` = `(24.686291501, 24)` in SVG view-box coordinates. Using the open C's asymmetric ink bounding box would cause wobble; its circular center remains fixed.
- `src/app/creative.css`: removed the old hover tilt and fixed-size icon spacing that treated the symbol as a separate logo. Existing per-placement font sizes remain; symbol size follows the typography. The editor's existing compact 32px C-only presentation remains.
- `prefers-reduced-motion: reduce` disables rotation and keeps the original upright C. Printing also uses the static C. There is no JavaScript animation loop in the shipped component.

The shared Brand component covers the landing/header, footer, dashboard sidebar, login/registration and editor branding. The favicon and compact editor use C only; the favicon has no animation.

## Verification

- **Lint:** pass, zero warnings. **Production build:** pass. **Existing automated suite:** 73/73 pass.
- **Desktop Safari:** visually inspected the light homepage. A 12.5-second browser measurement sampled a full cycle: text transform `none`, text rectangle change **0px**, brand box size change **0px**, maximum center drift **0.000009px**, and scale deviation under **0.000001** (floating-point precision). 267 distinct sampled angles confirmed live rotation. The upright pause and seamless loop were observed. These are brand-specific measurements, not a whole-page CLS or FPS claim.
- **Reduced motion:** used Edge's native DevTools Rendering media emulation, not a custom CSS override. `matchMedia` returned true, computed animation was `none`, duration `0s`, and the same 12.5-second measurement reported one fixed angle, no center movement and no text movement. Restored the tab to **No emulation** afterward.
- **Mobile:** visually inspected the actual dark homepage with Edge's 440px device emulation. Read actual live routes at a 388px iframe viewport: homepage, login, registration, dashboard and editor all had **388px document width**, without horizontal overflow. Their SVG sizes were 22.125, 24.594, 24.594, 20.5 and 32px respectively. Text was `omvexa` in wordmarks; the compact editor's text remained hidden at 0px. Link names remain “Comvexa home” or the editor's existing save-and-return label.
- **Production HTTP:** all 17 smoke checks passed on a separate loopback server. Additional checks confirmed the new wordmark markup on homepage/auth/dashboard, the exact static favicon response and a 404 for the removed QA route.
- Measured results: `docs/branding/browser-checks.json`.

`tests/browser/brand-acceptance-fixture.js` retains the temporary browser measurement page outside the application. To reproduce locally, temporarily copy it to `src/app/brand-qa/page.js`, run the dev server, visit `/brand-qa`, and measure one cycle or inspect live mobile placements. Use a disposable profile: the editor iframe opens a local test canvas. Use browser-native media emulation for reduced motion. Remove the temporary route before building production.

## Preview and limits

Open `http://127.0.0.1:3000/` or refresh the existing local preview. Watch the C complete a six-second turn and rest upright for six seconds. Login and dashboard use the same shared component. Saved editor work should be saved before refreshing its tab.

Physical iOS/Android devices and low-end-device FPS were not tested; mobile verification used desktop browsers with real viewport/media emulation. No production deployment, live domain or Supabase changes were made. Work is on `feat/animated-wordmark`; the final delivery records the commit hash.
