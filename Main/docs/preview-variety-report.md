# Comvexa — design preview variety correction

## Changes

The floating hero now combines fashion, travel, a birthday invitation and food. Headphones appear only in the four linked product-price demonstration cards. The package showcase now uses beauty, event and motorcycle concepts. The homepage and dashboard template galleries share eight categories: fashion, food, travel, invitations, motorcycles, beauty, events and social.

Each concept has its own palette and composition: coral editorial fashion, photographic turquoise travel with serif type, cream/pastel invitations, warm restaurant photography, ivory/sage skincare, charcoal/lime motorcycles, violet kinetic event typography, and lime/pink social graphics. Square, portrait and story aspect ratios are supported. Text remains HTML. The approved surrounding layout, ribbons, gradients, animation/reduced-motion behavior and themes remain in place.

Dashboard template filters derive from the available categories and wrap on small screens. Project/campaign/profile storage and authentication behavior were not changed. No database migrations, production modifications, deployments or Phase 3 work.

## Original assets and performance

Built-in ImageGen was used, not the fallback CLI. No stock photography or third-party reference photographs were downloaded. Images depict fictional/unbranded example content. Birthday, event and social art is original CSS/HTML. Generated originals were visually inspected and optimized without semantic edits to 960 × 960 WebP at quality 82. Assets are saved under `Main/public/images/previews/`:

| Asset | Source WebP bytes | Optimized response at 384px / q75 |
| --- | ---: | ---: |
| fashion.webp | 25,034 | 5,262 |
| food.webp | 106,090 | 14,982 |
| travel.webp | 264,732 | 34,548 |
| beauty.webp | 43,696 | 6,332 |
| motorcycle.webp | 97,076 | 14,944 |

Next Image supplies responsive sizes and lazy loading; only the central hero image is preloaded. All five optimized requests returned HTTP 200 / image/webp.

## Files

- New: `src/components/marketing/creative-preview.js`, five assets under `public/images/previews/`, this report.
- Changed: `src/components/marketing/design-preview.js`, `connected-demo.js`, `src/app/page.js`, `src/app/creative.css`, `src/config/site.js`, `src/features/workspace/template-gallery.js`.

## Validation

- ESLint: passed.
- Existing automated suite: all 11 passed, including price validation, local persistence, authentication fail-closed behavior, PostgreSQL RLS and motion/reduced-motion lifecycle tests.
- Production build: passed.
- HTTP smoke checks: all 12 passed.
- Native Edge: desktop light and dark hero inspected; Try ₱850 updated all four linked demo prices while hero concepts remained unchanged.
- Responsive emulation: 440 × 956 phone hero and template gallery, 768 × 1024 tablet package/gallery reviewed. No visible horizontal overflow or copy/button overlap at these viewports.
- Dashboard: all eight categories present; Beauty filter selected and showed its single matching concept, with image loaded.
- Initial missing-image requests occurred while the final two assets were still generating; after copying them and restarting the verification server, all five image endpoints passed.
- Full cross-browser/real-device, Lighthouse and FPS audits were not performed. Decorative miniature ad text scales with its card; normal UI labels remain separate. These are illustrative concepts, not usable templates or a working editor.

## Preview

From `Main`, run `npm run dev` and open http://127.0.0.1:3000. Review the hero, change the connected product price, scroll to templates and use /dashboard/templates. Verification server is stopped at handoff. Phase 3 remains unstarted.

## Exact asset prompts

### fashion.webp

Use case: photorealistic-natural. Original fashion editorial photograph for a website design example: fictional adult model wearing a fully covering cobalt blue pantsuit with long sleeves, orange sunglasses, confident standing pose, coral studio backdrop, premium commercial photography. Square framing, generous safe crop margins, no text, logos or watermarks.

### food.webp

Use case: product-mockup. Asset type: restaurant food photograph. An appetizing crispy chicken burger with lettuce, glossy brioche, sauce and pickles, sesame seeds, on a red-orange studio surface, close low angle, warm directional light, premium food photography. Original unbranded image for a creative platform's example design. Photographic quality, square composition, subject centered with generous safe crop margins. No text, typography, logos, trademarks, or watermarks. Not an advertisement layout; imagery only, HTML supplies all lettering.

### travel.webp

Use case: photorealistic-natural. Asset type: travel landscape photograph. Beautiful tropical limestone island lagoon inspired by Palawan, turquoise clear sea, white beach and lush green cliffs, small distant outrigger boat, aerial perspective, sunny natural light, vivid but believable. Original unbranded image for a creative platform's example design. Photographic quality, square composition, subject centered with generous safe crop margins. No text, typography, logos, trademarks, or watermarks. Not an advertisement layout; imagery only, HTML supplies all lettering.

### beauty.webp

Use case: product-mockup. Asset type: skincare still life photograph. Unbranded frosted blush glass serum bottle with white dropper, dewy green leaf and smooth pale stone on warm ivory pedestal, sage and cream backdrop, soft morning shadows, quiet luxurious beauty photography. Original unbranded image for a creative platform's example design. Photographic quality, square composition, subject centered with generous safe crop margins. No text, typography, logos, trademarks, or watermarks. Not an advertisement layout; imagery only, HTML supplies all lettering.

### motorcycle.webp

Use case: product-mockup. Asset type: motorcycle campaign photograph. An original unbranded matte black modern road motorcycle in full side three-quarter view on a dark concrete studio floor, lime green rim lighting, dramatic charcoal backdrop, all wheels visible, realistic mechanical detail, no rider. Original unbranded image for a creative platform's example design. Photographic quality, square composition, subject centered with generous safe crop margins. No text, typography, logos, trademarks, or watermarks. Not an advertisement layout; imagery only, HTML supplies all lettering.

