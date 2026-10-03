# HealthFusion_FL — Frontend

Explainable Adaptive Federated Healthcare Intelligence Framework. Next.js 14
(App Router) + TypeScript + Tailwind CSS. Built for the AD4V71 (MLOps)
academic project.

## Setup

```bash
npm install
cp .env.example .env.local   # NEXT_PUBLIC_DEMO_MODE=true by default
npm run dev                  # http://localhost:3000
```

Other commands: `npm run typecheck`, `npm run build`, `npm run lint`.

## Architecture decisions worth knowing about

- **Route namespacing.** The original spec lists `/privacy` under both the
  public marketing site and the secure application ("Privacy Center"). Those
  can't share one URL in Next.js, so the secure Privacy Center lives at
  `/privacy-center`. Everything else follows the spec's routes exactly.
- **Route groups.** `app/(public)/…` is the marketing site (its own header
  and footer). `app/(app)/…` is the authenticated product (`AppShell` with
  sidebar + top bar). Route groups don't add to the URL, so `/dashboard`,
  `/assessment`, etc. are exactly as specced.
- **Demo/live switching.** `lib/demo-mode.ts` reads `NEXT_PUBLIC_DEMO_MODE`.
  Every function in `services/api/*` checks that flag: `true` returns typed
  data from `data/demo/*`, `false` calls `NEXT_PUBLIC_API_BASE_URL` via
  `services/api/client.ts`. No component ever imports demo data directly —
  they only call `services/api`, so pointing at a real backend later is a
  one-line env change, not a rewrite.
- **Role simulation.** There's no real auth. `lib/role-context.tsx` is a
  client-side context (persisted to `localStorage`) that the login screen
  and the top-bar role switcher both write to. `components/layout/nav-config.ts`
  is the single source of truth for which nav items each role sees.
- **Honest feature status.** `types/federated.ts` defines `FeatureStatus =
  "active" | "simulation" | "demo" | "planned"`. `components/ui/FeatureStatusBadge.tsx`
  renders it consistently everywhere a claim is made about what's really
  implemented (Privacy Center, public Privacy page, Explainability, model
  and prediction pages).

## What's fully built vs. lighter in this pass

Everything in the route map below renders inside the correct shell with
correct navigation, typed data, and loading/empty/error handling. The
following got full "flagship" depth (the pages the spec calls out as
signature): Home, How It Works, Dashboard, Federated Network Map +
hospital detail, Explainability, Assessment + Result, Privacy Center.
Product, Technology, Research, Documentation, Demo, Models, Model
Comparison, Audit, Insights, System, Settings, Notifications, and Help
are real, wired-up pages with real (if simpler) content — ask for any of
them to be expanded further.

## Route map

```
Public            /  /product  /how-it-works  /technology  /privacy
                  /research  /documentation  /demo  /login  /select-organization

Secure app        /dashboard
Patient care      /assessment  /assessment/result/[id]  /assessment/history
                  /reports/[id]
AI intelligence   /explainability  /insights  /models  /models/comparison
Federated network /federated  /federated/rounds  /federated/hospitals/[id]
Trust & privacy   /privacy-center  /audit
System            /system  /settings  /notifications  /help

Status pages      /403  /404  /maintenance  /error  (+ error boundary)
```

## Expected backend API (for `NEXT_PUBLIC_DEMO_MODE=false`)

See `services/api/*.ts` for the exact calls and `types/*.ts` for the exact
shapes each one expects back:

- `GET /api/federated/snapshot`, `GET /api/federated/hospitals/:id`
- `POST /api/assessment`, `GET /api/assessment/:id`, `GET /api/assessment/history`
- `GET /api/models`
- `GET /api/privacy`
- `GET /api/audit`

## Implemented / Simulation / Planned (as shown in the product)

- **Active:** encryption in transit, audit logging, the privacy boundary
  itself (no raw data leaves a hospital in this architecture).
- **Simulation:** FedAvg / Adaptive FedAvg aggregation, role-based access
  control, SHAP-style explainability (real data contract, demo values).
- **Demo:** prediction scoring, model registry, feature-contribution charts.
- **Planned:** secure aggregation, differential privacy.

## Final refinement pass — API contract, honest claims, real auth scaffold

This section documents what changed in the most recent pass, and the
honest limits of what could be verified without a real backend.

### API contract alignment

No `docs/frontend_api_contract.md` was provided, so the endpoint list
written directly into that request is treated as ground truth for paths
and methods. Response casing isn't specified anywhere, so `lib/wire.ts`
assumes FastAPI/Pydantic's normal snake_case and normalizes every live
response to camelCase before it reaches application code — if you share
the real contract file, this can move from "reasonable assumption" to
"exact."

The contract splits things the old service layer treated as one call.
Rather than rewrite every page, the existing exported function names
(`getFederatedSnapshot`, `getModelRegistry`, `getPrivacySnapshot`, etc.)
now compose the new, contract-exact primitives underneath
(`getFederatedStatus` + `getFederatedClients` + `getFederatedRounds`,
`getModels` + `getActiveModel`, `getPrivacyStatus` + `getPrivacyConfig`).
Both layers are exported from `services/api/*` if you want to call the
primitives directly later.

**A real gap worth knowing about:** the contract has no
`GET /api/assessment/:id` or `GET /api/assessment/history` — only the two
synchronous scoring calls (`POST /api/prediction`, `POST /api/explainability`).
Rather than invent those endpoints, live mode keeps a client-side session
log (`lib/session-results.ts`, sessionStorage, cleared when the tab
closes) so the result and history pages still work for predictions run
*in that session*. That's not a substitute for real server-side
persistence, and the History and Result pages say so explicitly in live
mode. Same story for `/request-pilot` — there's no pilot-intake endpoint
in the contract, so live-mode submission is left as a real, visible gap
rather than a fake success message.

### Auth (Section B) — scaffolded, not hardened

`services/api/auth.ts` implements `POST /api/users/login` and
`GET /api/users/me` on the assumption the backend sets a session cookie
rather than returning a JWT in the body — this code never reads, stores,
or forwards a token string; `apiFetch` sends `credentials: "include"` and
the browser does the rest. `AppShell`'s `AuthGate` bounces to `/login` if
`GET /api/users/me` comes back empty. What's **not** done: real
server-side route protection (Next middleware inspecting the cookie
before a page renders), and there's no logout endpoint in the contract to
call, so logout only clears local UI state. Treat this as a correct
starting shape for a real backend integration, not as something that's
been security-tested against one.

### Honest claims (Sections H, I, E)

`data/feature-status.ts` is the one place that says what's active,
simulated, or planned — Product, Technology, Security, and the homepage
all read from it instead of writing their own copy, so the claims can't
drift apart again. The homepage's federation stats are now explicitly
labeled "demo federation — for illustration only."

### 3D map (Section F)

`FederatedIntelligenceMapAuto` now also renders, whenever `detail` isn't
`"compact"`: a status legend, a "patient data stays local" badge, a
pause/resume control for the ambient rotation, and a manual 2D/3D toggle
on top of the existing automatic WebGL/reduced-motion fallback. Clicking
a node now opens a side drawer (status, model version, round, reliability,
contribution weight) with a link through to the full page, instead of
navigating away immediately.

### New public pages

`/security`, `/for-hospitals` (with the onboarding-steps list, each step
honestly status-labeled), and `/request-pilot`. `/demo` now offers
"Launch interactive demo" and "Request a pilot" rather than a dead
"Request demo" link.

### Verified this pass

`tsc --noEmit` clean. Booted the dev server and hit all 36 routes — every
one returns 200 (`/404` correctly returns 404, that's the status page
working as intended). Grepped the dev log for real error signatures —
none. `next build` now passes (see the gap-closing pass below — the earlier Google Fonts failure was fixed, not just explained).


## Gap-closing pass

- **`/federated` now uses the full 3D map** (legend, drawer, pause, 2D/3D toggle) — it was the one page still on the plain 2D component.
- **`npm run build` passes.** Fonts are self-hosted via `@fontsource/inter` and `@fontsource/manrope` instead of `next/font/google`, which needed a live network fetch at build time. No external font requests remain. 34/34 pages generate; Three.js is code-split, so `/`, `/dashboard`, and `/federated` are ~102 kB first-load.
- **`npm test` — 64 tests (Vitest).** Covers wire normalization, the API client (credentials, 401→null, error status), role→navigation permissions, the session results log, demo scoring, WCAG contrast of every text/background token pair, 3D-theme/CSS token sync, and an honesty test asserting the Privacy Center's statuses agree with `data/feature-status.ts`. That last test was mutation-checked: re-introducing the original drift bug makes it fail.
- **Accessibility:** measured contrast and fixed real failures — the `mist` text token (all tertiary text) was 3.2–3.5:1, and three badge pairs narrowly failed; tokens adjusted minimally to pass AA (4.5:1) and now guarded by a test. Added skip-to-content links, focus trapping + focus return in all three overlay drawers, and removed closed drawers from the tab order.
- **How It Works is now a step explorer:** an accessible tablist (arrow keys, Home/End) drives a `focus` prop on the map that emphasizes the relevant layer in both the 3D and 2D renderers. Its status badges and closing note were rewritten to match the honest feature-status list.

### Still not closed (needs things this project doesn't have)

- **Live mode has never run against a real backend** — none exists here. Live-mode code is correctly shaped and unit-tested at the client layer, but not integration-tested.
- **Server-side route protection** (Next middleware) and a **logout endpoint** — the latter isn't in the contract.
- **No screen-reader or Lighthouse run** — contrast, keyboard operability, and focus management are verified; assistive-tech testing and real-browser performance audits need a browser.
- **No end-to-end tests** (Playwright etc.) — unit tests cover logic, not user flows.

## Second gap-closing pass

- **`/federated` fixed, verified this time against the actual built HTML** (earlier claim was correct but only route-checked, not content-checked).
- **Edge-level route protection**: `middleware.ts` + `lib/protected-routes.ts` (unit-tested) redirect to `/login?next=<path>` in live mode if no session cookie is present, before any protected page renders. `SESSION_COOKIE_NAME` is a configurable env var, not a guess — set it once the real backend's cookie name is known. This is a fast-path check (cookie presence only); `AppShell`'s `AuthGate` remains the authoritative check (calls `GET /api/users/me`). Demo mode never runs this. The `?next=` param now round-trips all the way through login → select-organization → the page you were trying to reach.
- **Automated structural accessibility scan**: `npm run a11y` boots the production server, fetches all 35 real pages, and runs axe-core (via jsdom) against the actual shipped HTML — not a sample, not a guess. First real run found a genuine bug: the demo-mode banner and all four standalone status pages (`/403`, `/404`, `/maintenance`, `/error`) had content outside any accessibility landmark. Fixed (banner got `role="region"`, status pages got wrapped in `<main>`) and **re-verified at zero violations** across all 35 pages. (jsdom doesn't paint, so contrast/layout rules are excluded here — contrast is covered separately and more precisely by `tests/design-tokens.test.ts`.)

**Final verification, run together, this pass:** `tsc --noEmit` clean · 68 Vitest tests passing (9 files) · `next build` succeeds, 34/34 pages · `npm run a11y` — 0 violations across 35 pages · full 35-route sweep against the actual production server (`next start`, not dev) — 0 problems.

### What's still open, honestly

- Live mode has never run against a real backend — none exists here. The middleware and auth code are correctly shaped and unit-tested at the logic layer; they are not integration-tested against a live FastAPI service.
- No logout endpoint in the contract, so logout only clears local UI state.
- No screen-reader testing and no real-browser performance audit (Lighthouse) — both need an actual browser/assistive tech this sandbox doesn't have. The structural a11y scan and the contrast tests are the rigorous substitutes available here.
- No end-to-end (Playwright-style) tests — unit tests cover logic, not full user flows in a real browser.
