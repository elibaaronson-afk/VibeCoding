Plan: React-first Website scaffold for TrainTrack

Goal
- Provide a React-based site scaffold so TrainTrack (React/TS) can be integrated and developed as a full app with a proper dev server, build, and e2e tests.

Constraints
- Preserve Website/assets (existing TrainTrack sources and static assets).
- Keep repository minimal: include only what's necessary to develop and test the React app.

Proposed approach
1. Initialize a minimal React dev setup in Website/ using Vite (recommended) or an esbuild dev server.
   - Use a React+TypeScript template (e.g., npm create vite@latest . -- --template react-ts).
   - Add scripts: dev, build, preview, test:e2e.
2. Integrate TrainTrack source into the React app.
   - Import assets/TrainTrack sources into src/ or import them directly from assets/TrainTrack into the app entry.
   - Expose a mountTrainTrack API from src/entry.tsx to support embedding the app or mounting it on a route.
3. Implement React routes/components
   - Home route: lightweight landing page with a link/button to open TrainTrack.
   - TrainTrack route: a React route that mounts the full TrainTrack app into the React application.
4. Build & bundling
   - Use Vite's build for production bundles. Optionally add a separate "build:embed" script that outputs an embeddable bundle if a static artifact is later required.
   - Ensure the mount API is exported when needed for embedding.
5. Testing & CI
   - Keep Playwright e2e tests; configure the dev server in playwright.config to start the Vite dev server during tests.
   - Add CI job(s) to run build and e2e tests.

Todos (suggested)
- setup-react-dev: Create Vite React+TS scaffold and package.json scripts
- integrate-traintrack-src: Import TrainTrack sources into src/ and wire mount API
- create-pages: Implement Home and TrainTrack React routes/components
- dev-build-test: Validate dev server, build output, and run Playwright tests

Notes
- Website/assets is preserved; copy static assets into the app's public/ when scaffolding the React project.
- After approval, implement the scaffold and run tests.

Next steps (prioritized for hiring-manager focus):

1. Finish TrainTrack integration
   - integrate-traintrack-src: Make TrainTrack importable in the React app and export a mount API.
2. Resume & hero
   - Ensure resume (Website/assets/Resume 6_2026.pdf) is prominently downloadable and summarized with 3–5 impact bullets on Home.
3. Case studies
   - Add 2–3 concise case studies (TrainTrack + one more) with problem/approach/outcome and links to demo/code.
4. Contact & availability
   - Mailto, LinkedIn, and a short note on availability.
5. Tests & CI
   - Run Playwright e2e (dev server) and add a CI workflow for build + e2e.

Todos (created)
- integrate-traintrack-src: Import TrainTrack sources into src/ and wire mount API (pending)
- add-resume-summary: Add resume summary and impact bullets to Home (pending)
- add-case-studies: Flesh out TrainTrack case study and add one more (pending)
- contact-setup: Verify contact links and availability (pending)
- ci-setup: Add CI workflow to run build + e2e tests (pending)

Saved plan.
