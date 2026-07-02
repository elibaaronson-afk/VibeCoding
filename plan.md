Plan: React Vite site for TrainTrack

Goal
- Build a maintainable React+Vite website that hosts TrainTrack (assets/TrainTrack), a downloadable resume, and case-study pages.

Current state
- Vite + React present (package.json). TrainTrack sources under assets/TrainTrack. Playwright e2e config exists.
- Styles live in src/styles.css; app pages and components in src/.

Approach
1. Integrate TrainTrack: import assets/TrainTrack entry and expose mountTrainTrack in a TrainTrack page.
2. Core components: implement Header, Hero, Card grid, Demo container, Footer.
3. Build & QA: use Vite build and Playwright e2e (add visual checks for key breakpoints).
4. Branching: use a feature branch per task and run CI checks before merging.

Design ideas (all pages except TrainTrack)
- Design goals: clean, modern, professional, and lightly interactive while preserving existing color scheme.

Home / Landing
- Layout: bold hero with concise value statement, 2 CTAs (Demo, Contact). Use a split layout: headline + animated SVG or gradient accent.
- Interactions: subtle parallax on hero illustration, CTA button with micro-interaction (scale + shadow), scroll-down hint that morphs into section progress indicator.
- Sections: highlights (3 cards with hover elevation + reveal animation), latest case studies (card carousel or masonry grid), resume CTA.

Resume / About
- Layout: two-column on desktop (bio + metrics column), stacked on mobile.
- Interactions: animated counters for key metrics (clients, projects), progressive reveal for timeline entries (staggered fade/slide). Download resume button with copy-to-clipboard contact details.
- Accessibility: provide plain-text resume link and ARIA labels for timeline items.

Work / Case Studies
- Layout: filterable card grid with tags/chips; each card shows thumbnail, short blurb, and impact metrics.
- Interactions: hover flip or lift with quick actions (View case study, Live demo). Clicking opens a modal with detail (animated entry) rather than navigating away.
- Extras: tag-based filtering with animated transitions and small performance-friendly image lazy-loading.

Contact / Hire
- Layout: compact form plus contact methods and availability badge.
- Interactions: inline validation with friendly microcopy, success state with animated check and optional auto-schedule CTA (link to calendar).
- Privacy: store no sensitive data; use mailto or external form endpoint as configured.

Blog / Resources (optional)
- Layout: list or card view with reading-time and tags.
- Interactions: progressive loading, lightweight previews on hover, and keyboard-accessible pagination.

Global components & polish
- Header: sticky, compact with logo, nav, CTA, and theme toggle. Add a subtle scroll shadow and a mobile hamburger with animated open/close.
- Buttons & chips: defined design tokens for hover/focus states derived from color scheme.
- Motion: CSS-only animations scoped to utility classes; respect prefers-reduced-motion.
- Tokens: centralize colors, type scale, spacing in :root or tokens.ts for consistency.
- Accessibility: high contrast, keyboard focus styles, semantic HTML and ARIA where needed.
- Performance: defer heavy visuals, use SVGs and optimized images, lazy-load non-critical assets.

Verification & tests
- Visual smoke tests: Playwright snapshots for hero, nav, and a case-study modal at desktop/tablet/mobile widths.
- Accessibility checks: automated axe-core checks during CI for key pages.

Todos (unchanged)
- integrate-traintrack-src: Import TrainTrack entry and mount it in src/pages/TrainTrack (pending)
- add-resume-summary: Add a Resume page and link with 3–5 bullets (pending)
- add-case-studies: Create 2–3 case study pages with cards and details (pending)
- ci-setup: Add CI job to build and run Playwright e2e (pending)

Notes
- This document contains UI/UX ideas only. Implementation requires explicit approval before changing code.

Saved plan.