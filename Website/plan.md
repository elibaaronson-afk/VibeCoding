Implementation plan: Recruiter-facing Website (goal: Solutions Consultant)

Problem
- Create a professional website that presents Aaron as a solutions consultant for recruiters and hiring managers, using assets in Website/assets.

Repository snapshot (key findings)
- Website/ exists and contains: index.html, tests, vitest + Playwright config, package.json with test scripts.
- Website/assets contains: Resume 6_2026.pdf, SmilingHeadshot.jpg, several certification PDFs, TrainTrack examples (trainer_app.tsx, trainer_app_explained.md).
- Tests and tooling already present (Vitest/Playwright); current project is test-enabled but lightweight.

Assumptions
- Use static HTML/CSS/vanilla JS (user selected this option).
- Content for pages will come from assets in Website/assets and from current index.html.
- No CMS is required; deploy will be static hosting (GitHub Pages, Netlify, or similar).

Goals & success criteria
- Clear one-page or small multi-page site presenting: hero/headshot, elevator pitch, skills/stack, selected projects, resume download, contact section (email / LinkedIn), and links to certifications.
- Fast load, mobile-first responsive design, accessible (a11y basics), and SEO-friendly metadata.
- Easy-to-update content (single HTML + content folder) so recruiter can view quickly.

Proposed pages & structure
- / (Home) — hero with headshot, one-line pitch (solutions consultant), CTA to resume/contact
- /about (or About section on home) — detailed background, soft skills, approach
- /projects — short case studies (TrainTrack and others) with links and short descriptions
- /resume — download link to Resume 6_2026.pdf and brief summary
- Contact — mailto & LinkedIn; optional lightweight contact form (Formspree) if desired
- All assets stored under Website/assets and referenced with relative URLs

UX & content priorities
- Hero: headshot, 1–2 sentence positioning (“I’m Aaron — I translate product needs into technical solutions and deliver business outcomes.”)
- Projects: 2–3 short case studies with outcomes and links to code or demos
- Resume: single-click download, visible CTA
- Contact: email + LinkedIn, optionally phone

Implementation steps (high-level)
1. Audit existing Website/index.html and assets; capture missing content.
2. Create page templates (HTML partials or single-page with sections) and base stylesheet (mobile-first CSS). Use semantic HTML.
3. Add content from assets (embed headshot, link PDFs, summarize TrainTrack as a project). Create project cards.
4. Add resume download and certifications page/section.
5. Implement responsive styles and small JS for interactivity (theme toggle, smooth scroll, mobile nav).
6. Accessibility and SEO: semantic tags, alt text, meta tags, robots, sitemap (optional).
7. Tests & lint: keep Vitest tests for sanity checks (existing), add smoke test that index.html loads and contains header/nav.
8. Deploy: prepare build (if any) and publish to GitHub Pages or Netlify; include README with deploy steps.

Todos (short):
- audit-codebase: Audit current Website files and confirm content to keep/replace (read index.html and assets).
- create-layout: Implement base HTML/CSS layout and mobile nav.
- add-assets: Add headshot, resume link, and certification links into content.
- update-skills: Update Skills section to match the skills listed on Resume 6_2026.pdf; remove 'Solution design & architecture' and 'Stakeholder communication'.
- create-project-cards: Add TrainTrack project card and at least one more project summary.
- resume-download: Add resume download/action and printable resume meta. (DONE: added alternate PDF link and download attribute on hero CTA)
- contact-setup: Add mailto + LinkedIn; optionally wire Formspree if requested.
- responsive-styles: Ensure responsive breakpoints and accessible colors.
- seo-accessibility: Add meta tags, titles, alt attributes, and basic a11y checks.
- tests-smoke: Add simple Vitest smoke tests for presence of header and resume link.
- deploy-setup: Add instructions and configuration for GitHub Pages/Netlify.

Risks & considerations
- Resume and certifications must be up-to-date and not contain sensitive info.
- If a contact form is added, need spam protection or use third-party service.
- TrainTrack code is present — consider linking to repo instead of embedding large source files.

Next actions (on approval)
- Start working interactive: implement create-layout, add-assets, resume-download, responsive-styles, seo-accessibility, tests-smoke, deploy-setup.

Notes
- User chose static HTML/CSS/vanilla JS (recommended for recruiters).
- Will reuse assets in Website/assets. If more content (case studies) is needed, request text blurbs.

Saved plan.
