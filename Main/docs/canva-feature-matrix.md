# Canva versus Comvexa — capability and investment matrix

Research date: November 12, 2026. Comvexa baseline: `74c1478` (Phase 5). Public documentation review, not a hands-on Canva plan audit. Canva entitlements, rollout, geography and terminology can change; confirm them before publishing competitive marketing. No private Canva content, code, templates or assets were accessed or copied.

**Status:** I = implemented locally; P = partial; N = not implemented. **Difficulty:** S = bounded UI/command work, M = multiple subsystems, L = schema/export/security work, XL = new product engine or distributed system. **Priority:** P0 = launch reliability blocker, P1 = core creative value after reliability, P2 = expansion, P3 = defer until demand/budget. **Cost:** L = mainly device CPU and maintenance, M = storage/bandwidth/operations, H = usage-dependent compute or sustained real-time infrastructure. These are engineering assessments, not vendor prices. Dependencies refer to [roadmap milestones](product-roadmap.md); row estimates must not be summed because implementation overlaps.

## Graphic design, assets and output

| Capability | Canva public documentation | Comvexa today and gap | Difficulty | Required dependency / ongoing cost | Priority / target |
| --- | --- | --- | --- | --- | --- |
| Templates and custom dimensions | Templates and dimension controls listed [C1]; multi-format projects [C2] | P: 32 editable templates, presets/custom canvas 64–4096 px; lacks catalog breadth | M | Designer/licensed imagery, template validation, catalog discovery / L | P1 M8 |
| Multi-page and mixed-format designs | Multi-format suite supported [C2] | N: one canvas/document; packages are separate linked documents, not pages | L | Schema v2, migrations, page navigation, aggregate limits / L–M | P1 M9 |
| Text formatting and effects | Shadow, outline, curve and other effects documented [C5] | P: whole-element font/size/weight/alignment/line height; no text runs, spacing/effects or curved text | L | Font metrics, text runs, preview/export parity / L | P1 M8; complex effects later |
| Custom fonts | Font uploads supported with compatibility restrictions [C6] | N: four allowlisted fonts, no font upload | M–L | Licensed font registry, validation, load/fallback/embedding rules / L–M | P1 curated fonts M8; uploads after review |
| Multi-selection, groups, layers and alignment | Group/layer/align documented [C7] | P: individual selection, order/lock and basic guides; no multi-select/group operations | M–L | Selection transactions, parent transforms, cycle rules / L | P1 M8 |
| Shapes, vector editing, masks/frames | Element library supports customizable graphics [C8]; this review does not establish full Bézier/path-authoring parity | P: rect/ellipse only; no path editor, masks or reusable frame system | L | Typed scene nodes, safe path representation, clipping and vector export / L | P1 basic frames M8; paths M10 |
| Gradients, shadows and effects | Text gradient/effect combinations documented, with export caveats [C5] | N for editable artwork effects; homepage gradients do not count | M–L | Validated fills/effect stack and adapter capability checks / L | P1 M8 |
| Transparency and blend modes | Transparent outputs documented [C9]; exact artistic blend-mode coverage not verified here | P: element opacity; no blend-mode model or transparent-background export | M | Compositing policy and alpha/export tests / L | P1 opacity/export refinements; blend modes M10 |
| Image upload, crop and replacement | Crop and adjustment tools documented [C4] | I/P: PNG/JPEG/WebP, transform/crop and shared replacement; no focal-point awareness | M | Better crop UI and geometric/focal metadata / L | P0 QA Phase 6; improvements M10 |
| Filters and adjustments | Brightness/contrast, filters and retouch tools documented [C4] | N: crop/opacity only; no nondestructive effects | M–L | Effect parameters, worker/renderer cache, memory tests / L | P1 M10 |
| Background and object removal | BG Remover and Magic Edit documented [C4] | N | L | Model/provider licensing, mask editing, cost/privacy review / M–H or device compute | P2 M10 pilot/M14 |
| PNG/JPG and high-resolution output | Raster outputs and quality controls documented [C9] | I/P: consistent PNG/JPG at document dimensions, no standard watermark; 4096 px max, no scaling/alpha control | M | Memory budgets, render presets, golden export tests / L | P0 fidelity Phase 6; options M8/M10 |
| PDF/SVG, print and PPTX output | PDF, SVG and presentation PPTX documented with limitations [C9] | N: raster images and editable native JSON only; no print certification | L–XL | Export adapters, fonts, color/bleed policy, external-reader QA / L–M | P1 PDF M9; SVG M10; PPTX separate M9 increment |
| Persistent version history | Review/restore older versions documented [C10] | P: bounded session undo/redo and revision conflict detection, no persisted restore UI | L | Snapshot/operation retention, storage quota and restore permissions / M | P1 recovery first; durable history M12 |
| Asset libraries and brand kits | Asset/brand categories documented [C1] | P: embedded per-document assets and campaign image sources; no library or brand-kit manager | L | Blob/object repository, indexing, permissions, license metadata / M | P1 M8/M11, shared teams M12 |

## Connected creation and beginner workflows

| Capability | Canva public documentation | Comvexa today and gap | Difficulty | Required dependency / ongoing cost | Priority / target |
| --- | --- | --- | --- | --- | --- |
| Bulk generation/data binding | Bulk Create accepts sheet, spreadsheet, app or manual data [C11]; autofill API exists [C12] | P: one campaign generates four editable formats, stable field bindings persist | L | More layout families, reusable mappings, batch snapshots / L–M | P1 M11 |
| Shared text/price/date/image update | Canva documents bulk/autofill and connected multi-format workflows [C2,C11,C12]; equivalent persistent cross-design override semantics not established in this review | I locally: atomic campaign update, live previews and saved artwork resolution | L | Indexed membership, version-pinned large fanout, documented source ownership / L–M | P0 reliability Phase 6; P1 M11 |
| Individual linked-field overrides | Exact equivalent retention/restoration behavior not verified; do not label Canva as lacking it | I: explicit override including empty text, restore/detach, badges excluded from exports | M | Preserve contract through every schema/export adapter / L | P0 regression Phase 6 |
| Smart resizing and image replacement | Magic Resize and bulk workflows documented [C3] | P: curated per-ratio generation, geometric shared crop adaptation and overflow warning; no arbitrary responsive reflow | L–XL | Layout constraints, text measurement, focal points, user review / L–H depending on AI | P1 M11 deterministic first; AI M14 |
| Cross-campaign branding/scheduling | Brand categories [C1]; exact cross-campaign dependency-graph behavior not verified | N: one campaign per design; no scheduled source changes or external connectors | L–XL | Graph/cycle semantics, authorization, queues, audit/rollback / M–H | P2 M11/M17 |
| Beginner/mobile creation | Canva documents desktop/mobile video and photo workflows [C4,C13] | P: responsive UI, phone emulation passed; physical creation/crop/multi-file flows need more QA | M | Physical devices, keyboard/screen-reader alternatives, user research / L plus QA | P0 Phase 6/7 |
| Free standard workflow | Free tier exists; entitlements vary [C1] | I locally: basic editing/templates/PNG/JPG without billing or watermark; cloud costs not yet incurred | M product/operations | Sustainable limits and service budget; no paywall work approved / L–M | Preserve throughout |

## Video, AI, documents, websites and teams

| Capability | Canva public documentation | Comvexa today and gap | Difficulty | Required dependency / ongoing cost | Priority / target |
| --- | --- | --- | --- | --- | --- |
| Video upload/timeline/trim/split/combine | Media-first timeline, clip arrangement, trim/split documented [C13] | N: static images only | XL | Media metadata/proxies, timeline, demux/decode, worker budgets / M–H | P2 M13 |
| Audio tracks and synchronization | Timeline audio volume/fades/trimming documented [C14] | N | L–XL | Shared clock, waveform/proxy cache, audio rendering / M–H | P2 M13 |
| Animated text/elements/transitions | Element timing and animation controls documented [C13] | N: UI animations are not artwork animations | L | Deterministic time evaluation and keyframe schema / L–M | P2 M13 motion increment |
| Arbitrary keyframe editing/subtitle depth | This review did not verify detailed keyframe-authoring or subtitle format coverage; not evidence of absence | N for both | L–XL | Keyframe interpolation, captions model, optional transcription review / M–H | P2 M13; verify competitor details before claims |
| MP4/GIF/multiple-ratio video exports | MP4/GIF formats documented [C9]; video suite [C13] | N | XL | Frame/audio rendering, muxing/codecs, progress/cancel, resource quotas / H if remote | P2 M13 |
| Text-to-design and AI writing | AI creation and broader suite tools documented [C1,C2] | N: deterministic templates are not AI | L | Optional gateway, evaluations, schema validation, quota reservation / H variable | P2 M14 |
| AI images and photo editing | Generate/edit/upscale and object/background tools documented [C4] | N | L | Provider/model/license/retention approval, budgets, asset provenance / H variable | P2 M14 |
| Brand-aware AI/campaign assistance | AI/suite capabilities documented [C2]; exact output behavior is plan/tool dependent | N: no model integration; existing package generator is non-AI | L–XL | M11 brand schema, gateway, editable output evaluation / H variable | P2 M14 |
| Presentations and notes | Presentations [C2], speaker notes and PDF notes [C15] | N: no pages, presenter mode or notes | L | Page model, slide templates, presenter view and export / L–M | P1 M9 |
| Documents/CVs/letters/printables | Visual Docs and print categories documented [C2] | P: static A4 raster preset can be composed manually; no document/CV builder | XL | Flowing rich text, pagination, semantic document model / L–M | P2 M15 |
| Responsive websites and landing pages | Website category documented [C2] | N: Comvexa's own homepage is not a user website builder | XL | Block model, responsive DOM, preview/hosting isolation / M–H | P3 M16 |
| Interactive invitations/catalogs | Interactive designs documented through Canva Code [C16]; specific invitation/catalog interactions not exhaustively verified | N: static template artwork only | L–XL | Safe interactive blocks, navigation/forms policies and publishing / M–H | P3 M16 |
| Shared workspaces/projects and comments | Team categories [C1]; real-time cursors/comments/tasks [C2] | N: browser-local campaign list is not a team workspace | XL | Approved auth, memberships, hosted RLS/Storage, server permissions / M–H | P2 M12 |
| Real-time collaboration | Explicitly documented [C2] | N: local cross-tab notifications plus conflicts only | XL | Operation protocol/CRDT, presence, durable log, revocation and offline replay / M–H | P2 M12 after identity |
| Shared templates/brand permissions | Brand templates and controls listed [C1] | N: built-in catalog only; no user template sharing or roles | L | Workspace ownership, brand/style records, permissions/audit / M | P2 M11/M12 |
| Wider suite: whiteboards/sheets/emails | Listed in Visual Suite [C2] | N; not in approved near-term scope | XL | Separate interaction/data models, security/QA and product demand / M–H | P3 reassess after core adoption |

## Source register and limits

All links below are official Canva pages, reviewed through public search/page retrieval on the research date. Availability is **documented**, not independently benchmarked. Sources establish category support; they do not prove Comvexa parity or proprietary implementation details. “Not verified” must never be rewritten as “Canva does not have it.” Pricing/plan assignments are intentionally not generalized across the matrix because rollout and account differences apply.

- [C1 — Plans and categories](https://www.canva.com/pricing/): design, brand, AI and team categories. No exact template-count comparison is needed for planning.
- [C2 — Visual Suite](https://www.canva.com/visual-suite/): mixed-format projects, suite categories and collaboration.
- [C3 — Visual Suite 2.0 announcement](https://www.canva.com/en_in/newsroom/news/canva-create-2025/): bulk workflows and Magic Resize. This is a dated announcement, not evidence of current plan entitlement by itself.
- [C4 — Photo editor](https://www.canva.com/help/image-editor/): crop, adjustments, filters and AI image tools.
- [C5 — Text effects](https://www.canva.com/en_gb/help/text-effects/): effects and gradient export caveats.
- [C6 — Font uploads](https://www.canva.com/en_au/help/upload-fonts/): custom-font workflow and compatibility limits.
- [C7 — Group, layer and align](https://www.canva.com/help/layer-group-align/).
- [C8 — Element library](https://www.canva.com/design-school/resources/using-and-editing-elements/).
- [C9 — Download formats](https://www.canva.com/help/download-file-types/): image, document and video output; capability and plan restrictions vary.
- [C10 — Version history](https://www.canva.com/help/version-history/).
- [C11 — Bulk Create](https://www.canva.com/en_in/help/bulk-create/).
- [C12 — Autofill API](https://www.canva.dev/docs/apps/rest-apis/reference/autofills/create-design-autofill-job/): developer capability, not a claim that every consumer plan exposes identical controls.
- [C13 — Create/edit videos](https://www.canva.com/en_au/help/creating-and-editing-videos/).
- [C14 — Audio editing](https://www.canva.com/help/trim-audio-and-adjust-volume/).
- [C15 — Notes](https://www.canva.com/help/download-notes/).
- [C16 — Interactive designs](https://www.canva.com/en_gb/help/canva-code/).

No claim is made that Canva lacks connected content, overrides, vector tools, keyframes or any other unverified feature. A later hands-on comparison should test equivalent tasks and plan entitlements before publishing superiority claims. Operating-cost/difficulty/priority columns are Comvexa planning judgments derived from the code review and proposed architecture, not statements from Canva.
