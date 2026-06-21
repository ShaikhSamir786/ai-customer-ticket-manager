# Frontend Engineering Handbook
### Official Frontend Standards — Production-Grade React / Next.js SaaS Application

> **Audience:** All frontend engineers, reviewers, and tech leads on the product team.
> **Scope:** Applies to all code shipped to production. Deviations require an Architecture Decision Record (ADR) and tech-lead sign-off.
> **Status:** Living document — versioned alongside the codebase, reviewed quarterly.

---

## Table of Contents

1. [Frontend Engineering Principles](#1-frontend-engineering-principles)
2. [Technology Standards](#2-technology-standards)
3. [React Architecture](#3-react-architecture)
4. [Performance Optimization](#4-performance-optimization)
5. [Folder Structure](#5-folder-structure)
6. [Coding Standards](#6-coding-standards)
7. [API Integration Standards](#7-api-integration-standards)
8. [Security Best Practices](#8-security-best-practices)
9. [Testing Standards](#9-testing-standards)
10. [Developer Experience](#10-developer-experience)
11. [Deployment Standards](#11-deployment-standards)
12. [Checklists](#12-checklists)

---

## 1. Frontend Engineering Principles

These nine principles are the constitution of this codebase. Every architectural decision, PR review comment, and tooling choice in this document is a downstream consequence of one of these.

### 1.1 Scalability

The codebase must support growth in three dimensions without a rewrite: **team size** (many engineers working in parallel without merge conflicts or hidden coupling), **feature surface** (new features added without touching unrelated code), and **traffic/data** (UI remains responsive as data volume grows).

- Organize by **feature, not by file type** (see [§5](#5-folder-structure)) — this is the single biggest lever for scaling a team.
- New features must be addable by creating new files/folders, not by editing a long list of existing ones (the "open/closed" principle applied to project structure).
- Anything that will be reused 3+ times graduates to a shared layer (`components/ui`, `hooks`, `utils`); anything used once stays local to its feature.
- Design data-fetching and state for pagination/virtualization from day one — retrofitting these onto a "fetch everything" implementation is expensive.

### 1.2 Maintainability

Code is read 10x more than it's written. Optimize for the next engineer (often a future version of yourself with no memory of this PR).

- Every non-obvious decision gets a comment explaining **why**, not what (the code already says what).
- No function or component exceeds ~150 lines or a cyclomatic complexity that requires re-reading twice to follow. Split it.
- Business logic is never duplicated — if you're about to copy-paste a function, extract it.
- Dead code, commented-out blocks, and `// TODO` without a linked ticket are removed in review, not merged.

### 1.3 Reusability

- Build components **composable-first**: small, single-purpose primitives (`Button`, `Input`, `Card`) that compose into feature components, rather than large monolithic components with many boolean props.
- Prefer **children/slots/render props** over prop explosion when a component needs to support visual variation.
- Shared logic (data fetching, form handling, permissions checks) is extracted into custom hooks — UI components stay declarative.
- A component is only "shared" once it's used by 2+ unrelated features; premature abstraction is avoided (rule of three).

### 1.4 Performance-First Development

Performance is a feature, scoped and budgeted like any other — not an afterthought fixed in a "performance sprint." See [§4](#4-performance-optimization) for full detail. At the principle level:

- Every new page/route ships with a Core Web Vitals budget in mind before the first commit.
- Default to Server Components in Next.js; opt into Client Components only when interactivity demands it.
- Data fetching is colocated and parallelized, never chained into request waterfalls.

### 1.5 Accessibility-First Development

Accessibility is a release-blocking requirement, not a post-launch audit item. WCAG 2.2 AA is the contractual baseline for every shipped UI. See [§12.4](#124-accessibility-checklist) for the enforced checklist. Semantic HTML is the default; ARIA is the exception used only when semantic HTML can't express the pattern.

### 1.6 Security-First Development

Every input is untrusted until validated; every output is unsafe until escaped. Security reviews are part of PR review for any code touching auth, user input, or third-party data — not a separate, later gate. See [§8](#8-security-best-practices).

### 1.7 Clean Code Principles

- **Single Responsibility:** a function/component/hook does one thing.
- **DRY, but not prematurely:** don't abstract two similar-looking pieces of code until a third occurrence proves the pattern.
- **Readability over cleverness:** a clear 5-line implementation beats a clever 2-line one-liner the next reader has to decode.
- **Pure functions where possible:** side effects are isolated to clearly named boundaries (hooks, services), not scattered through render logic.
- **Explicit over implicit:** no magic numbers/strings — name them as constants; no silent type coercion.

### 1.8 Separation of Concerns

Strict layering, each layer only aware of the one directly below it:

```
UI Components  →  Hooks (state/orchestration)  →  Services (API/business logic)  →  API client (HTTP/transport)
```

- Components never call `fetch`/`axios` directly — they call a hook, which calls a service.
- Styling concerns (Tailwind classes, component variants) never leak business logic; business logic never imports a styling utility.
- Validation schemas (Zod) are the single source of truth, shared between form validation and API boundary parsing — never duplicated as ad-hoc `if` checks.

### 1.9 Component-Driven Architecture

UI is built and verified bottom-up: design tokens → primitives (`ui/`) → composed components → feature components → pages. Each layer is independently viewable/testable in isolation (Storybook or equivalent) before being wired into a page, so visual and logic bugs are caught at the smallest possible unit.

---

## 2. Technology Standards

### 2.1 HTML5

- Semantic elements always: `<nav>`, `<main>`, `<header>`, `<footer>`, `<article>`, `<section>`, `<button>` (never a styled `<div onClick>`).
- One `<h1>` per page; heading levels never skip (no `<h2>` straight to `<h4>`).
- All interactive elements are natively focusable and keyboard-operable; `tabindex` values are `0` or `-1` only — never positive.
- Forms use real `<form>`, `<label for="">`, and native input types (`email`, `tel`, `number`) to get built-in validation and correct mobile keyboards for free.

### 2.2 CSS3

- Logical properties (`margin-inline`, `padding-block`) over physical ones (`margin-left`) to support RTL locales without rework.
- CSS custom properties for all design tokens — colors, spacing, radii — never hardcoded hex/px values in component styles.
- `clamp()` for fluid typography/spacing over multiple fixed breakpoints where it reduces media-query count.
- No `!important` outside of utility-class overrides explicitly designed for that purpose (e.g., a `.sr-only` reset).

### 2.3 Tailwind CSS

- Utility-first by default; extract a component class (`@apply`) only when the same utility cluster repeats 3+ times verbatim **and** isn't already a React component (prefer componentizing over `@apply`).
- All design tokens (color, spacing, radius, shadow) live in `tailwind.config.ts` — no arbitrary value (`w-[37px]`) unless there is no token-scale equivalent, and such cases are flagged in review.
- Class order is auto-sorted via `prettier-plugin-tailwindcss` — never manually ordered, never bike-shedded in review.
- Use `cn()` (clsx + tailwind-merge) for all conditional/merged class logic — never string concatenation.

```ts
// utils/cn.ts
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

### 2.4 JavaScript (ES2024+)

- `const` by default, `let` only when reassignment is structurally required, `var` never.
- Optional chaining (`?.`), nullish coalescing (`??`), and the `Array`/`Object` group/iteration methods (`Object.groupBy`, `Array.prototype.toSorted/toSpliced`) are preferred over manual loops and lodash equivalents where natively available.
- Async/await over raw `.then()` chains; every `await` is wrapped by a try/catch or delegated to a query library's built-in error state (never an unhandled rejection).
- No implicit globals, no prototype mutation, no `==` (strict equality only).

### 2.5 TypeScript

- `strict: true` non-negotiable in `tsconfig.json` (`strictNullChecks`, `noImplicitAny`, etc. all on).
- `any` is banned in application code (ESLint error, not warning); use `unknown` + narrowing, or generics, instead.
- Types are inferred from Zod schemas (`z.infer<typeof schema>`) at the API/form boundary so runtime validation and compile-time types can never drift apart.
- Prefer `type` for unions/intersections/utility compositions, `interface` for object shapes that may be extended (e.g., component props) — applied consistently, not interchangeably.
- No non-null assertions (`!`) outside of test files — handle the `null`/`undefined` case explicitly.

### 2.6 React.js

- Function components + hooks only — no class components in new code.
- Props are explicitly typed; no `React.FC` (it implicitly adds `children` and complicates generic components) — type props directly and type `children` explicitly when needed.
- Keys for lists are stable, unique domain IDs — never array index (except for fully static, never-reordered lists).
- Derived state is computed during render, not duplicated into `useState` + synced via `useEffect`.

### 2.7 Next.js (App Router)

- App Router is standard for all new routes; Pages Router is legacy-only, not used in new code.
- Server Components are the default for every route; `'use client'` is added only at the leaf components that need interactivity/browser APIs/hooks (push the client boundary as deep as possible).
- Data fetching happens in Server Components / Route Handlers, colocated with the route that needs it, using `fetch` with Next's caching extensions (`cache`, `next: { revalidate }`) or TanStack Query for client-driven data.
- Route Handlers (`app/api/.../route.ts`) are used for BFF-style endpoints (token exchange, webhook receivers) — not as a replacement for the real backend API.
- Metadata API (`generateMetadata`) for all SEO-relevant pages; no manual `<head>` manipulation.

### 2.8 Zustand

- Used for **client-only UI/app state**: sidebar open/closed, active theme, multi-step wizard progress, modal stacks — state with no server source of truth.
- One store per concern, not one giant global store. Co-locate the store with the feature that owns it (`features/billing/store/billing-store.ts`).
- Selectors are used on every consuming component (`useStore((s) => s.sidebarOpen)`) to avoid re-rendering on unrelated state changes — never destructure the whole store.

```ts
// features/dashboard/store/sidebar-store.ts
import { create } from 'zustand';

interface SidebarState {
  isCollapsed: boolean;
  toggle: () => void;
}

export const useSidebarStore = create<SidebarState>((set) => ({
  isCollapsed: false,
  toggle: () => set((s) => ({ isCollapsed: !s.isCollapsed })),
}));
```

### 2.9 Redux Toolkit

- Reserved for **complex, cross-cutting client state** with non-trivial transitions (e.g., a multi-entity normalized cache the team has decided not to delegate to TanStack Query, complex undo/redo flows). Not used by default — Zustand + TanStack Query cover the large majority of state needs; RTK is opt-in for justified complexity, documented via ADR.
- `createSlice` + `createAsyncThunk` (or RTK Query if adopted for a slice) only — no hand-written action types/reducers switch statements.
- Normalized state shape via `createEntityAdapter` for any collection data managed in Redux.

### 2.10 TanStack Query

- The default for **all server state** — anything that originates from an API is owned by Query, never duplicated into Zustand/Redux.
- Query keys are structured, hierarchical arrays defined in one place per feature (`features/billing/api/query-keys.ts`), never inlined ad hoc per call site.
- Mutations always implement `onSuccess` cache invalidation (or optimistic updates with rollback in `onError`) — a mutation that doesn't update the cache is treated as a bug.
- Stale time and cache time are tuned per data type (e.g., user profile: 5 min stale; live notification count: 0 stale + polling) — never left at library defaults without a deliberate decision.

```ts
// features/billing/api/query-keys.ts
export const billingKeys = {
  all: ['billing'] as const,
  invoices: () => [...billingKeys.all, 'invoices'] as const,
  invoice: (id: string) => [...billingKeys.invoices(), id] as const,
};

// features/billing/hooks/use-invoices.ts
export function useInvoices() {
  return useQuery({
    queryKey: billingKeys.invoices(),
    queryFn: billingService.getInvoices,
    staleTime: 60_000,
  });
}
```

### 2.11 React Hook Form

- Standard form library for all forms beyond a single field — uncontrolled-by-default for performance, avoiding per-keystroke re-renders.
- Always paired with a Zod resolver (`@hookform/resolvers/zod`) — validation rules are never written twice (once in the form, once in the API layer).
- Field-level errors are surfaced via `formState.errors`, never via separate manually-managed `useState` error objects.

### 2.12 Zod

- The single source of truth for all "shape of data" concerns: form schemas, API request/response parsing, environment variable validation.
- API responses are parsed through a Zod schema at the service boundary — a malformed backend response fails loudly and visibly in development rather than producing a silent `undefined` deep in a component.
- Schemas are composed/extended (`.extend()`, `.pick()`, `.merge()`) rather than duplicated across related forms (e.g., `createUserSchema` vs `updateUserSchema`).

### 2.13 Axios

- A single configured instance (`api/client.ts`) with `baseURL`, default headers, and interceptors — no ad hoc `axios.get(...)` calls scattered through the codebase.
- Request interceptor attaches the auth token; response interceptor handles global error normalization and the 401 → token-refresh flow (see [§7.6](#76-token-refresh-flow)).
- Every endpoint is wrapped by a typed service function — components and hooks never import `axios` directly.

### 2.14 WebSockets

- Used only for genuinely real-time needs (live notifications, presence, collaborative editing) — not as a substitute for standard request/response data, which stays on REST/GraphQL + Query polling/invalidation.
- Connection lifecycle (connect, reconnect with backoff, heartbeat, clean teardown) is encapsulated in a single custom hook (`useSocket`) — never managed inline in a component.
- Incoming socket events update the TanStack Query cache directly (`queryClient.setQueryData`) rather than maintaining a parallel, separate piece of state.

### 2.15 REST APIs

- Resource-oriented URLs (`/invoices/:id`), correct HTTP verbs and status codes; the frontend never works around a backend that misuses these — it's flagged as a contract bug.
- Pagination, filtering, and sorting follow one consistent query-param convention app-wide (`?page=&limit=&sort=&filter[status]=`).
- API contracts are typed end-to-end — either from an OpenAPI-generated client or hand-written types kept in lockstep with backend contracts and validated at runtime via Zod.

### 2.16 GraphQL

- Used where the product genuinely benefits from client-specified queries (avoiding over/under-fetching across deeply nested dashboard data) — adopted deliberately, not by default alongside REST.
- Codegen (`graphql-codegen`) generates typed hooks from `.graphql` query files — queries are never written as untyped template strings.
- Fragments are colocated with the component that needs the data (fragment colocation pattern), so a component's data dependency is visible next to its JSX.

### 2.17 JWT Authentication

- Access tokens are short-lived (≤15 min); refresh tokens are long-lived and **httpOnly, Secure, SameSite=Strict cookies** — never `localStorage`/`sessionStorage` (see [§8.5](#85-secure-storage-practices)).
- The frontend never decodes a JWT to make authorization/trust decisions about its own claims for security purposes — display-only data (e.g., "welcome back, {name}") may be read from a decoded token, but actual permission checks always go through the backend.
- Token expiry is handled proactively (silent refresh ahead of expiry) and reactively (401 interceptor), never by surfacing a raw auth error to the user mid-action.

### 2.18 OAuth

- Authorization Code flow with PKCE for all OAuth integrations (social login, third-party connectors) — implicit flow is never used.
- The `state` parameter is always validated on callback to prevent CSRF on the OAuth flow itself.
- Provider tokens (Google, GitHub, etc.) are exchanged and stored server-side; the frontend never holds a third-party access token directly.

### 2.19 Framer Motion

- Reserved for interactions that clarify state/spatial change (enter/exit transitions, layout reflows, drag interactions) — not decorative animation on every element.
- `AnimatePresence` for all mount/unmount transitions (modals, toasts, list item removal) so exit animations actually run before DOM removal.
- All animation respects `prefers-reduced-motion` via a shared `useReducedMotion()`-aware variant set — never hardcoded durations that ignore the OS setting.

### 2.20 Shadcn/UI

- The base layer for all primitive components (Button, Dialog, Select, etc.) — copied into `components/ui` and owned/customized by the team, not pulled from `node_modules` as an opaque dependency. Every shadcn component is treated as first-party code once copied in: themed, tested, and documented like any other internal component.
- No direct visual customization happens at the call site via one-off inline styles — variants are added to the component's own `cva` (class-variance-authority) definition.

### 2.21 Radix UI

- The accessibility/behavior engine underneath shadcn and any other custom interactive primitives (dropdowns, dialogs, popovers, tooltips) — never reimplement focus-trapping, roving tabindex, or ARIA wiring by hand when a Radix primitive already solves it correctly.
- Styling is applied via Tailwind on top of Radix's unstyled primitives/data-attributes (`data-[state=open]:...`) — Radix is never fought against with `!important` overrides.

---

## 3. React Architecture

### 3.1 Component architecture

Four tiers, increasing in domain-specificity:

| Tier | Location | Knows about API/business logic? | Example |
|---|---|---|---|
| **Primitive (UI)** | `components/ui` | No | `Button`, `Input`, `Card`, `Dialog` |
| **Shared/Composed** | `components/shared` | No | `EmptyState`, `DataTable`, `ConfirmDialog` |
| **Layout** | `components/layout` | No (structure only) | `AppShell`, `Sidebar`, `Navbar` |
| **Feature** | `features/*/components` | Yes | `InvoiceList`, `BillingForm` |

Data and business logic only ever live in the Feature tier (and the hooks/services it calls) — primitives and shared components are pure, reusable, and product-agnostic.

### 3.2 Smart vs Presentational components

- **Smart (container) components**: orchestrate — call hooks for data/state, handle events, decide what to render. Live in `features/*/components` or directly in `app/.../page.tsx`.
- **Presentational components**: receive data and callbacks purely via props, contain no data-fetching or global-state access, and are trivially testable/storybook-able in isolation.
- Rule of thumb: if a component needs a mock provider (Query client, store) to render in isolation, it's smart; if it renders with just props, it's presentational. Keep the smart layer as thin as possible — push logic into hooks, leave the component mostly JSX.

```tsx
// Smart
function InvoiceListContainer() {
  const { data, isLoading } = useInvoices();
  if (isLoading) return <InvoiceListSkeleton />;
  return <InvoiceList invoices={data} />;
}

// Presentational
function InvoiceList({ invoices }: { invoices: Invoice[] }) {
  return <ul>{invoices.map((inv) => <InvoiceRow key={inv.id} invoice={inv} />)}</ul>;
}
```

### 3.3 Feature-based architecture

Each business capability (`billing`, `auth`, `dashboard`, `settings`) is a self-contained module under `features/`, owning its own components, hooks, services, types, and store slice. Features may depend on `components/`, `hooks/`, `utils/` (the shared layer), but **never on each other directly** — cross-feature communication goes through shared state (Query cache, a shared event bus) or composition at the page level, never a direct import from `features/billing` into `features/dashboard`. This keeps features independently deletable/replaceable, which is the real test of good boundaries.

### 3.4 Custom hooks patterns

- **Data hooks** (`useInvoices`, `useUser`): thin wrappers around TanStack Query, returning typed data + status.
- **Behavior hooks** (`useDebounce`, `useClickOutside`, `useMediaQuery`): generic, side-effect-encapsulating, fully reusable, live in `hooks/`.
- **Orchestration hooks** (`useCheckoutFlow`): compose multiple data/behavior hooks into one feature-level API consumed by a smart component — this is where multi-step business logic lives, kept out of the component body.
- Every hook returns a stable, well-typed object/tuple; hooks that return more than ~5 values are split.

### 3.5 State management strategy

Decision table — pick the **lowest** row that satisfies the need:

| State type | Tool | Example |
|---|---|---|
| Local UI state (single component) | `useState`/`useReducer` | input value, accordion open |
| Cross-component, ephemeral client state | Zustand | sidebar collapsed, active tab |
| Server-originated data | TanStack Query | invoices, user profile, lists |
| Complex, justified client-state machines | Redux Toolkit (ADR required) | multi-entity offline-sync cache |
| Cross-tree, rarely-changing config | Context API | theme, locale, feature flags |

Server state and client state are **never mixed in the same store** — a Zustand store never holds a copy of API data "for convenience."

### 3.6 Context API usage rules

- Context is for **low-frequency-change, broadly-needed** values: theme, locale, authenticated user identity, feature flags. It is not a general state manager.
- Every context is paired with a custom hook (`useTheme()`) that throws a clear error if used outside its provider — consumers never call `useContext` directly.
- Large/frequently-changing values are not put in Context (it has no selector mechanism — every consumer re-renders on any change); such state goes to Zustand instead.
- Providers are composed in a single `providers/app-providers.tsx`, not nested manually in `app/layout.tsx`.

### 3.7 Server Components

- Default for every component in the App Router. Fetch data directly with `async/await` inside the component; no client-side loading spinner needed for the initial render.
- Never import client-only libraries (anything touching `window`, browser storage, or React state/effects) into a Server Component.
- Pass only serializable props down to Client Components (no functions, class instances, or Dates without serialization).

### 3.8 Client Components

- Marked with `'use client'` only at the smallest leaf that needs interactivity (a button, a form, a chart) — never at a whole page level "just in case."
- Own all `useState`/`useEffect`/event handlers/browser API access and any TanStack Query/Zustand usage.
- Receive server-fetched initial data as props (or via Query's `initialData`/hydration) rather than re-fetching on mount when the server already had it.

### 3.9 Suspense

- Used at route and feature-section boundaries (`app/.../loading.tsx`, or manual `<Suspense>` around a slow widget) to stream in independently-loading sections of a page rather than blocking the whole route on the slowest fetch.
- Paired with purpose-built skeleton components matching the final layout's dimensions (prevents layout shift, supports the CLS Core Web Vital).
- TanStack Query's `useSuspenseQuery` is used for components that should genuinely suspend rather than manually branch on `isLoading`.

### 3.10 Error Boundaries

- A top-level Error Boundary at the app shell (Next.js `app/error.tsx`) catches unhandled render errors and shows a recoverable fallback (not a blank white screen).
- Feature-level boundaries (`app/(dashboard)/billing/error.tsx`, or a manual `<ErrorBoundary>` around a risky widget like a chart) isolate failures so one broken widget doesn't take down the whole dashboard.
- Every Error Boundary reports the caught error to the error-tracking service (see [§11.6](#116-error-tracking)) before rendering its fallback.

---

## 4. Performance Optimization

### 4.1 Core Web Vitals

| Metric | Target | Primary levers |
|---|---|---|
| **LCP** (Largest Contentful Paint) | ≤ 2.5s | Server Components, image optimization, font preloading, avoiding render-blocking JS |
| **INP** (Interaction to Next Paint) | ≤ 200ms | Avoiding long tasks, memoization, deferring non-critical work off the main thread |
| **CLS** (Cumulative Layout Shift) | ≤ 0.1 | Explicit width/height on media, skeletons matching final layout, no late-injected banners |
| **TTFB** (Time to First Byte) | ≤ 600ms | Edge/CDN caching, efficient server-side data fetching, avoiding request waterfalls |

CWV are tracked in real-user monitoring (RUM), not just lab/Lighthouse scores — lab data catches regressions pre-merge, RUM confirms real-world impact.

### 4.2 Lazy loading

- Below-the-fold content, secondary modals, and rarely-visited route sections are lazy-loaded with `next/dynamic`.
- Images use `loading="lazy"` by default (Next.js `<Image>` does this automatically) except the LCP image, which is explicitly `priority`.

### 4.3 Dynamic imports

```tsx
const HeavyChart = dynamic(() => import('@/features/analytics/components/heavy-chart'), {
  loading: () => <ChartSkeleton />,
  ssr: false, // only when the dependency genuinely requires the browser (e.g., canvas libs)
});
```

Used for: large third-party libraries (rich text editors, chart libs), modal/dialog content not needed on initial paint, and any feature gated behind a permission/plan tier most users won't hit.

### 4.4 Code splitting

- Automatic per-route via the App Router's file-system routing — no manual route-level splitting needed.
- Manual splitting is reserved for genuinely large, conditionally-used dependencies (PDF generation, spreadsheet export, charting libraries).

### 4.5 Tree shaking

- Import only what's used: `import { debounce } from 'lodash-es'`, never `import _ from 'lodash'`.
- Libraries without ESM builds/proper `sideEffects: false` marking are flagged in dependency review — they silently bloat the bundle.
- Barrel files (`index.ts` re-exporting an entire folder) are used carefully — overly broad barrels can defeat tree-shaking in some bundler configurations; prefer direct imports for large shared folders.

### 4.6 Bundle optimization

- `next build` bundle analyzer (`@next/bundle-analyzer`) run on every significant dependency addition and reviewed in PR for unexpected size jumps.
- A per-route JS budget is enforced in CI (e.g., initial JS ≤ 170KB gzipped for marketing/auth pages, looser budget for the authenticated dashboard shell).
- Shared/vendor chunks are deliberately split so a change to one feature doesn't invalidate the cache for the whole vendor bundle.

### 4.7 Image optimization

- `next/image` exclusively — never a raw `<img>` for product imagery — for automatic responsive `srcset`, lazy loading, and modern format negotiation (AVIF/WebP).
- Explicit `width`/`height` (or `fill` with a sized parent) always provided to prevent CLS.
- The single LCP image on a page gets `priority` and is excluded from lazy loading.

### 4.8 Rendering optimization

- Avoid unnecessary client-side re-renders by keeping state as local as possible (state lifted only as high as actually needed, not by default to the nearest page).
- Expensive list renders are windowed (see [§4.11](#411-virtualized-lists)); expensive computations are memoized (see [§4.9](#49-memoization-strategies)).
- Long-running synchronous work (>50ms) is broken up (e.g., via `requestIdleCallback`/chunked processing) or moved to a Web Worker to protect INP.

### 4.9 Memoization strategies

- `useMemo`/`useCallback` are applied **deliberately**, not reflexively on every value/function — primarily to (a) stabilize props passed to a memoized child, (b) avoid genuinely expensive recomputation (sorting/filtering large arrays), or (c) stabilize dependencies of another hook.
- `React.memo` wraps presentational components that re-render often with unchanged props (e.g., individual rows in a large, frequently-updating table).
- Premature memoization that adds complexity without a measured re-render problem is flagged in review — profile first (`React DevTools Profiler`), memoize second.

### 4.10 React Query caching

- `staleTime`/`gcTime` set deliberately per query based on how fresh the data genuinely needs to be (see [§2.10](#210-tanstack-query)).
- `select` option used to subscribe components to only the slice of a larger query response they actually need, reducing re-renders.
- Prefetching (`queryClient.prefetchQuery`) used for predictable next-navigation data (e.g., prefetch a row's detail view on hover) to make perceived navigation instant.

### 4.11 API request optimization

- Requests that can run in parallel always do (`Promise.all` / parallel Server Component fetches) — request waterfalls are treated as a performance bug in review.
- List endpoints are paginated/cursor-based by default; "fetch everything then filter client-side" is only acceptable for genuinely small, bounded datasets.
- Debounced search inputs (300ms) avoid firing a request per keystroke; in-flight requests are cancelled on new input (`AbortController`, or TanStack Query's automatic cancellation).

### 4.12 Virtualized lists

- Any list/table that can render more than ~100 rows uses a virtualization library (`@tanstack/react-virtual`) so DOM node count stays bounded regardless of data size.
- Virtualized rows maintain a fixed or measured estimated height to keep scroll position stable during async height resolution.

### 4.13 Asset optimization

- Fonts: `next/font` for automatic self-hosting, subsetting, and zero layout-shift font loading (no FOIT/FOUC).
- SVGs are optimized (SVGO) and inlined as React components for icons (`vector-icons`), avoiding extra network requests for small graphics.
- Static assets are served via CDN with long-lived immutable cache headers, using content-hashed filenames for safe cache-busting on deploy.

---

## 5. Folder Structure

```
src/
├── app/                  # Next.js App Router: routes, layouts, route handlers
├── components/
│   ├── ui/               # Primitive design-system components (shadcn-based)
│   ├── shared/            # Reusable composed components, product-agnostic
│   ├── layout/            # Structural shell components (Navbar, Sidebar, AppShell)
│   └── features/          # Cross-feature components not specific to one feature module
├── features/              # Self-contained business domains (billing, auth, dashboard...)
├── hooks/                 # Generic, reusable hooks (not tied to one feature)
├── services/               # Business-logic service layer wrapping API calls
├── api/                    # HTTP client setup, endpoint definitions, interceptors
├── store/                  # Global Zustand/Redux stores (app-wide, not feature-local)
├── providers/               # React context/provider composition (Query, Theme, Auth)
├── types/                   # Shared/global TypeScript types and interfaces
├── constants/                # App-wide constant values, enums, config maps
├── utils/                     # Pure utility/helper functions
├── styles/                     # Global CSS, Tailwind base layer, font-face declarations
├── assets/                      # Static images, icons, fonts not served from /public
├── config/                       # Environment/config loading and validation (Zod-parsed env)
└── tests/                         # Test utilities, mocks, global test setup
```

### Folder responsibilities

| Folder | Responsibility | Rule |
|---|---|---|
| `app/` | Routing, layouts, route-level data fetching, metadata | Contains minimal logic — delegates to `features/` for actual implementation |
| `components/ui/` | Design-system primitives | Zero business logic, zero API awareness, fully reusable across any product |
| `components/shared/` | Reusable composed patterns (DataTable, EmptyState, ConfirmDialog) | Product-aware but feature-agnostic; takes data via props |
| `components/layout/` | App shell structure | Renders navigation/structure, delegates content to children/slots |
| `components/features/` | Components shared *across* multiple features (e.g., a `UserAvatar` used in billing, settings, and dashboard) | Promoted here only once 2+ features need it |
| `features/<name>/` | One business capability end-to-end: `components/`, `hooks/`, `services/`, `types/`, `store/` | Self-contained; no direct imports from sibling features |
| `hooks/` | Generic, feature-agnostic hooks (`useDebounce`, `useMediaQuery`) | If a hook is only meaningful to one feature, it lives in that feature instead |
| `services/` | Business-logic functions wrapping API calls, returning typed domain data | The only layer allowed to call `api/` directly |
| `api/` | Axios/fetch client instance, interceptors, raw endpoint URL builders | No business logic — pure transport layer |
| `store/` | App-wide client state (auth session, global UI flags) | Feature-local state lives inside `features/<name>/store` instead |
| `providers/` | Composition root for all context providers | Single place to see "what wraps the app" |
| `types/` | Shared domain types/interfaces used across 2+ features | Feature-specific types live in `features/<name>/types` |
| `constants/` | Enums, route paths, config maps, fixed lists | No magic strings/numbers duplicated elsewhere in the app |
| `utils/` | Pure, side-effect-free helper functions (formatters, validators) | Every function here is independently unit-testable with no mocking |
| `styles/` | Tailwind base/global CSS, font declarations | No component-specific styling lives here |
| `assets/` | Bundler-processed static assets | Public, unprocessed assets (favicon, robots.txt) stay in `/public` |
| `config/` | Runtime config loading, env variable parsing/validation | Env vars are validated once here via Zod, imported everywhere else as typed config |
| `tests/` | Shared test utilities: custom render with providers, mock factories, MSW handlers | Individual test files live next to the code they test (`*.test.ts(x)`) |

### Feature module internal structure

```
features/billing/
├── components/         # Smart + presentational components for this feature
├── hooks/              # Feature-specific hooks (useInvoices, useCheckoutFlow)
├── services/            # billing-service.ts — API calls for this domain
├── store/                # billing-store.ts — feature-local Zustand state, if needed
├── types/                 # Billing-specific TypeScript types
├── schemas/                 # Zod schemas for billing forms/API payloads
├── utils/                    # Feature-specific helpers
└── index.ts                   # Public API of the feature (explicit exports only)
```

The `index.ts` barrel defines the feature's **public surface** — anything not re-exported there is private to the feature and not importable from outside it (enforced via ESLint `no-restricted-imports` or a tool like `eslint-plugin-boundaries`).

---

## 6. Coding Standards

### 6.1 Naming conventions

| Item | Convention | Example |
|---|---|---|
| Variables/functions | `camelCase` | `getUserInvoices` |
| React components | `PascalCase` | `InvoiceList` |
| Custom hooks | `camelCase`, `use` prefix | `useInvoices` |
| Types/Interfaces | `PascalCase` | `Invoice`, `InvoiceListProps` |
| Constants/enums | `SCREAMING_SNAKE_CASE` for primitive constants, `PascalCase` for enum-like objects | `MAX_RETRY_COUNT`, `InvoiceStatus.Paid` |
| Zustand/Redux stores | `useXStore` / `xSlice` | `useSidebarStore`, `billingSlice` |
| Zod schemas | `camelCase`, `Schema` suffix | `createInvoiceSchema` |
| Boolean variables/props | `is`/`has`/`should` prefix | `isLoading`, `hasError`, `shouldRetry` |
| Event handlers (props) | `on` prefix | `onSubmit`, `onInvoiceSelect` |
| Event handlers (implementation) | `handle` prefix | `handleSubmit`, `handleInvoiceSelect` |

### 6.2 File naming rules

- React component files: `kebab-case.tsx`, matching the component's `PascalCase` export (`invoice-list.tsx` exports `InvoiceList`).
- Hooks: `use-kebab-case.ts` (`use-invoices.ts`).
- Services: `kebab-case-service.ts` (`billing-service.ts`).
- Types: `kebab-case.types.ts`. Schemas: `kebab-case.schema.ts`. Tests: colocated as `*.test.ts(x)` next to the file under test.
- One component (and its tightly-coupled subcomponents, if small) per file — no multiple unrelated exports in one file.

### 6.3 Component naming rules

- Component name = file purpose, no generic names (`List`, `Item`, `Card` alone) — always domain-prefixed (`InvoiceList`, `InvoiceCard`).
- Compound/sub-components use dot or prefix convention consistently within a file group: `InvoiceCard`, `InvoiceCard.Header`, `InvoiceCard.Footer` (or `InvoiceCardHeader` if the team prefers flat naming) — pick one convention per codebase and apply it uniformly.
- Higher-order components are prefixed `with` (`withAuth`); wrapper/provider components are suffixed `Provider` (`ThemeProvider`).

### 6.4 Folder naming rules

- All folders: `kebab-case`, plural for collections of similar items (`components`, `hooks`, `services`), singular for a single concern grouping (`store`, `config`).
- Feature folder names match the business domain, not a technical concept (`billing`, not `payment-components`).

### 6.5 Import organization

Enforced automatically via `eslint-plugin-import` / `@typescript-eslint` import-order rule — never manually maintained:

```ts
// 1. External packages
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';

// 2. Internal absolute imports (aliased)
import { Button } from '@/components/ui/button';
import { useInvoices } from '@/features/billing/hooks/use-invoices';

// 3. Relative imports
import { InvoiceRow } from './invoice-row';

// 4. Types (grouped separately, or inline with `import type`)
import type { Invoice } from '@/features/billing/types';

// 5. Styles (if any module-level CSS)
import './invoice-list.css';
```

Path aliases (`@/components`, `@/features`, `@/hooks`, etc.) are configured in `tsconfig.json` — relative imports never climb more than one directory up (`../../../` is a code smell flagged in review; restructure or alias instead).

### 6.6 TypeScript standards

- No `any`; no implicit returns of `unknown` left unnarrowed at a consuming boundary.
- All API response shapes and form values are typed via inferred Zod schema types — never hand-duplicated interfaces that can drift from runtime validation.
- Discriminated unions for state that has mutually exclusive shapes (e.g., `{ status: 'loading' } | { status: 'error'; error: Error } | { status: 'success'; data: T }`) instead of multiple optional/nullable fields on one type.
- Utility types (`Pick`, `Omit`, `Partial`, `ReturnType`) preferred over redefining a near-identical type from scratch.

### 6.7 Error handling standards

- Every async operation has an explicit error path — no silent `catch {}` blocks.
- Errors are typed/normalized at the service boundary into a consistent `AppError` shape (`{ code, message, statusCode, details? }`) before reaching UI code, so components never branch on raw Axios/fetch error internals.
- User-facing error messages are written in plain, actionable language (per the writing principles in the design skill); raw error stacks/technical messages are logged, never shown to the user.
- Expected, recoverable errors (validation failure, 404) are handled at the point of occurrence; unexpected errors propagate to the nearest Error Boundary.

```ts
// services/billing-service.ts
export async function getInvoices(): Promise<Invoice[]> {
  try {
    const { data } = await apiClient.get('/invoices');
    return invoiceListSchema.parse(data); // throws ZodError on contract mismatch
  } catch (error) {
    throw normalizeError(error); // → AppError
  }
}
```

### 6.8 Logging standards

- A single logging utility (`utils/logger.ts`) wraps `console` so output, formatting, and remote-shipping behavior are centrally controlled — no raw `console.log` in feature code (ESLint-enforced, except inside the logger itself).
- Log levels are used meaningfully: `debug` (dev-only verbose), `info` (notable app events), `warn` (recoverable issues), `error` (always reported to the error tracker).
- No PII or secrets (tokens, passwords, full card numbers) are ever logged, including in `debug` level — this is a security requirement, not a style preference.

---

## 7. API Integration Standards

### 7.1 API layer architecture

Strict three-layer separation (expanding on [§1.8](#18-separation-of-concerns)):

```
api/client.ts        → Axios instance, interceptors, base config (transport only)
services/*.ts        → Typed functions per domain, call the client, parse/validate responses
hooks/use-*.ts        → TanStack Query wrappers around services, consumed by components
```

Components and hooks never import `api/client.ts` directly — only `services/` does.

### 7.2 Service layer pattern

```ts
// api/client.ts
export const apiClient = axios.create({
  baseURL: config.apiBaseUrl,
  timeout: 10_000,
});

// services/invoice-service.ts
export const invoiceService = {
  async list(params: InvoiceListParams): Promise<Invoice[]> {
    const { data } = await apiClient.get('/invoices', { params });
    return invoiceListSchema.parse(data);
  },
  async getById(id: string): Promise<Invoice> {
    const { data } = await apiClient.get(`/invoices/${id}`);
    return invoiceSchema.parse(data);
  },
  async create(payload: CreateInvoiceInput): Promise<Invoice> {
    const { data } = await apiClient.post('/invoices', createInvoiceSchema.parse(payload));
    return invoiceSchema.parse(data);
  },
};
```

Each service function: validates input (for writes), calls the endpoint, validates/parses output, returns a clean domain type. No component ever sees a raw Axios response object.

### 7.3 Error handling (API layer)

- A single response interceptor normalizes all API errors into the shared `AppError` shape (status code, machine-readable code, human message from the backend if provided).
- Network errors (no response received), timeout errors, and HTTP error statuses are each mapped to a distinct, identifiable `AppError.code` so UI code can branch meaningfully (e.g., show a "you're offline" banner vs. a generic error toast).

### 7.4 Request retries

- Idempotent `GET` requests: automatic retry with exponential backoff (TanStack Query's built-in retry, capped at 2–3 attempts) for transient network/5xx failures.
- Non-idempotent `POST`/`PATCH`/`DELETE`: **no automatic retry** by default (risk of duplicate side effects) unless the endpoint is explicitly idempotent (e.g., via an idempotency key supplied by the client).
- Retries always use jittered exponential backoff, never fixed-interval, to avoid thundering-herd retry storms against a recovering backend.

### 7.5 Authentication handling

- The Axios request interceptor attaches `Authorization: Bearer <accessToken>` from in-memory app state (never read from `localStorage` per request — see [§8.5](#85-secure-storage-practices)).
- Auth state (current user, access token) lives in a dedicated `store/auth-store.ts`, hydrated on app load from a secure session check, and is the single source of truth consumed by the interceptor.

### 7.6 Token refresh flow

```ts
// api/client.ts (response interceptor)
let refreshPromise: Promise<string> | null = null;

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      // De-dupe concurrent refresh calls — only one refresh in flight at a time
      refreshPromise ??= authService.refreshAccessToken().finally(() => {
        refreshPromise = null;
      });
      try {
        const newToken = await refreshPromise;
        useAuthStore.getState().setAccessToken(newToken);
        original.headers.Authorization = `Bearer ${newToken}`;
        return apiClient(original); // replay the original request once
      } catch {
        useAuthStore.getState().logout(); // refresh failed → force re-auth
        return Promise.reject(error);
      }
    }
    return Promise.reject(error);
  }
);
```

Key rules: the refresh call itself is de-duplicated (concurrent 401s trigger exactly one refresh, not one per failed request); each original request is retried **at most once**; a failed refresh always results in a clean logout/redirect to sign-in, never a silent retry loop.

---

## 8. Security Best Practices

### 8.1 XSS prevention

- React's default JSX escaping is relied on for all rendered text — `dangerouslySetInnerHTML` is banned by default (ESLint error) and used only for content that has been sanitized server-side or via a vetted client sanitizer (`DOMPurify`), with the sanitization call directly adjacent in code, never assumed upstream.
- User-generated content (comments, bios, rich text) is sanitized at write-time (backend) **and** rendered through a sanitizing renderer — defense in depth, not a single point of trust.
- URLs from user input (e.g., a user-provided link) are validated against an allowed protocol list (`http:`, `https:`) before being used in `href`/`src` to prevent `javascript:` URI injection.

### 8.2 CSRF protection

- Cookie-based auth (refresh token cookie) uses `SameSite=Strict` (or `Lax` if a cross-site redirect flow requires it) plus a backend-issued CSRF token verified on all state-changing requests, per standard double-submit-cookie or synchronizer-token pattern.
- State-changing requests are never made via GET (no GET endpoints with side effects), removing an entire class of CSRF vectors by construction.

### 8.3 Input validation

- All user input is validated client-side (Zod + React Hook Form, for fast feedback) **and** re-validated server-side — client validation is a UX convenience, never the security boundary.
- File uploads validate type, size, and (where feasible) content/magic-bytes client-side before upload, with the same checks enforced authoritatively on the backend.

### 8.4 Secure authentication

- Passwords are never handled, stored, or logged by the frontend beyond the single submission to the auth endpoint over HTTPS — no client-side password hashing pretending to add security (it doesn't; TLS + backend hashing is the real boundary).
- Multi-factor flows store no long-lived secret client-side; session establishment always completes server-side.
- Login/auth forms disable password managers' autofill only when there's a specific documented reason — by default, `autocomplete="current-password"`/`"new-password"` are set correctly to support password managers, which improves security (encourages strong, unique passwords).

### 8.5 Secure storage practices

| Data | Storage | Reason |
|---|---|---|
| Access token | In-memory (React state/store) | Never persisted — cleared on tab close, immune to XSS-via-storage-read |
| Refresh token | `httpOnly`, `Secure`, `SameSite` cookie | Inaccessible to JavaScript entirely, so XSS can't exfiltrate it |
| Non-sensitive UI prefs (theme, sidebar state) | `localStorage` | Acceptable — no security sensitivity |
| Anything secret (API keys, card details) | **Never stored client-side** | Always proxied server-side |

`localStorage`/`sessionStorage` are never used for tokens or PII — this is a hard rule, not a guideline, given both are fully readable by any injected script.

### 8.6 Content Security Policy

- A strict CSP is set via Next.js middleware/headers, default-denying inline scripts (`script-src 'self' 'nonce-<per-request-nonce>'`) and restricting `connect-src`, `img-src`, `frame-ancestors` to known, explicit origins.
- `unsafe-inline`/`unsafe-eval` are not used in production CSP; any third-party script requiring them is evaluated for a CSP-compatible alternative or sandboxed in an iframe with a separately scoped policy.
- CSP is shipped in **report-only mode** in a new environment first, monitored for violations, then flipped to enforcing once clean.

### 8.7 Environment variable management

- All env vars are declared and validated through a single Zod schema (`config/env.ts`) at app startup — a missing/malformed required var fails the build/boot loudly, never silently becomes `undefined` at runtime in production.
- Next.js's `NEXT_PUBLIC_` prefix is used **only** for values genuinely safe to expose to the browser bundle; anything secret (API keys, signing secrets) has no `NEXT_PUBLIC_` counterpart and is only ever read server-side (Route Handlers/Server Components).
- `.env.local`/`.env*.local` are git-ignored; only `.env.example` (with placeholder values) is committed, documenting every required variable.

```ts
// config/env.ts
const envSchema = z.object({
  NEXT_PUBLIC_API_BASE_URL: z.string().url(),
  NEXT_PUBLIC_APP_ENV: z.enum(['development', 'staging', 'production']),
  AUTH_SECRET: z.string().min(32), // server-only, no NEXT_PUBLIC_ prefix
});

export const env = envSchema.parse(process.env);
```

---

## 9. Testing Standards

### 9.1 Testing pyramid

```
        ▲  E2E (Playwright) — few, critical user journeys
       ▲▲▲  Integration (RTL + MSW) — feature flows, component + hook + mocked API
      ▲▲▲▲▲  Unit (Vitest) — pure functions, hooks, individual components
```

A change is properly tested when it has unit coverage on its logic, integration coverage on its user-facing flow if it spans multiple components, and is included in an E2E journey only if it represents a critical, revenue/trust-affecting path (auth, checkout, core CRUD).

### 9.2 Unit testing

- Pure functions (`utils/`), individual hooks (via `renderHook`), and isolated presentational components.
- Every `utils/` function ships with tests covering its happy path, edge cases, and error path — these are the cheapest, fastest tests in the suite and have no excuse for being skipped.

### 9.3 Integration testing

- Tests a feature as a user would experience it: render a smart component tree with real providers (Query client, router) and a mocked API layer (MSW), interact via Testing Library queries, assert on resulting UI state.
- This is the primary layer for verifying forms, data tables, and multi-step flows — it catches the bugs that pure unit tests miss (wiring between hook and component) without the cost/flakiness of full E2E.

### 9.4 End-to-end testing

- Playwright, run against a real (staging or ephemeral preview) deployment, covering only critical journeys: sign-up/login, core product action (e.g., create + pay an invoice), and any flow that has previously caused a production incident (regression-driven E2E growth, not exhaustive E2E from day one).
- E2E suites run on every PR against the critical path and full-suite nightly — kept fast and reliable is prioritized over broad coverage, since flaky E2E erodes trust in CI faster than any other test type.

### 9.5 Jest

- Legacy/compatibility option for teams migrating from a Jest-based codebase. For new projects, Vitest is the default (faster, native ESM/TS support, Vite-aligned config) — Jest is retained only where an existing large suite makes migration not yet worthwhile.

### 9.6 Vitest

- Standard unit/integration test runner for new code: `vitest` for the watch/run loop, `vitest --coverage` (v8 provider) in CI with an enforced minimum coverage threshold on `utils/`, `services/`, and `hooks/` (logic-heavy layers); UI-only components are exempted from raw coverage targets in favor of meaningful assertions.

### 9.7 React Testing Library

- The only way components are tested — queries by role/label/text (`getByRole`, `getByLabelText`), never by implementation detail (`getByTestId` is a last resort, `container.querySelector` is banned).
- Tests assert on what the user sees/does, not on internal component state or prop values — this is what makes RTL tests resilient to safe refactors.

### 9.8 Playwright

- Used for E2E (§9.4) and, optionally, visual regression snapshots on key screens (dashboard, billing, settings) to catch unintended visual drift in the glass/spatial design system.
- Tests run across at minimum Chromium + WebKit in CI to catch Safari-specific rendering issues (notably relevant for `backdrop-filter` support).

---

## 10. Developer Experience

### 10.1 ESLint

- `@typescript-eslint/recommended-type-checked`, `eslint-plugin-react`, `eslint-plugin-react-hooks` (`exhaustive-deps` as an error, not warning), `eslint-plugin-jsx-a11y`, and `eslint-plugin-import` form the base config.
- Project-specific rules added: `no-restricted-imports` to enforce feature boundaries (§5), a ban on `any`/`console.log`/relative imports beyond one level up.
- ESLint runs in CI as a blocking check — no PR merges with lint errors; warnings are tracked and periodically zeroed-out, not allowed to silently accumulate.

### 10.2 Prettier

- Single shared `.prettierrc` (no per-developer formatting opinions); `prettier-plugin-tailwindcss` enabled for automatic class sorting.
- Formatting is never debated in PR review — if Prettier accepts it, it's correct; CI runs `prettier --check` as a blocking gate.

### 10.3 Husky

- Pre-commit hook: `lint-staged` (fast, staged-files-only lint + format).
- Pre-push hook: type-check (`tsc --noEmit`) + unit test run, catching issues before they reach CI and burn shared build minutes.

### 10.4 Lint-staged

```json
{
  "*.{ts,tsx}": ["eslint --fix", "prettier --write"],
  "*.{css,md,json}": ["prettier --write"]
}
```

Only staged files are processed, keeping the pre-commit hook fast (sub-second to a few seconds) so it's never tempting to bypass with `--no-verify`.

### 10.5 Git conventions

- Trunk-based development with short-lived feature branches off `main`; branch names: `feat/invoice-export`, `fix/sidebar-collapse-flicker`, `chore/upgrade-react-query`.
- PRs are small and single-purpose (target < 400 lines changed where reasonable) — large PRs are split by feature slice, not merged as one sprawling change.
- `main` is always deployable; merges happen via squash-merge to keep history linear and each merge commit mapped to one logical change.

### 10.6 Commit message standards

Conventional Commits, enforced via `commitlint` in the Husky `commit-msg` hook:

```
<type>(<scope>): <short summary>

[optional body]

[optional footer: BREAKING CHANGE / closes #123]
```

| Type | Use |
|---|---|
| `feat` | New user-facing capability |
| `fix` | Bug fix |
| `refactor` | Code change with no behavior change |
| `perf` | Performance improvement |
| `test` | Adding/correcting tests |
| `docs` | Documentation only |
| `chore` | Tooling, deps, config |

Example: `feat(billing): add CSV export for invoice history`

---

## 11. Deployment Standards

### 11.1 CI/CD

Pipeline stages, each blocking the next: **install → lint → type-check → unit/integration tests → build → bundle-size check → E2E (critical path) → deploy preview → (manual approval for production) → deploy production → post-deploy smoke test.**

```yaml
# .github/workflows/ci.yml (excerpt)
jobs:
  quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: 'pnpm' }
      - run: pnpm install --frozen-lockfile
      - run: pnpm lint
      - run: pnpm type-check
      - run: pnpm test --coverage
      - run: pnpm build
```

### 11.2 Environment management

- Three standard environments: **development** (local), **staging/preview** (per-PR ephemeral deploy), **production**.
- Environment-specific config is never hardcoded in source — it flows entirely through the validated env schema (§8.7), with values injected per-environment by the CI/CD platform or secrets manager.
- Feature flags (not env vars) gate incomplete/risky features so `main` can ship continuously without exposing unfinished work — this decouples deploy from release.

### 11.3 Docker basics

```dockerfile
# Multi-stage build for a minimal, secure production image
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN corepack enable && pnpm install --frozen-lockfile

FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN corepack enable && pnpm build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup -S nodejs && adduser -S nextjs -G nodejs
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]
```

Uses Next.js's `output: 'standalone'` build target for a minimal runtime image; runs as a non-root user; multi-stage build keeps `devDependencies` and build tooling out of the final image.

### 11.4 Vercel deployment

- Default platform for Next.js: automatic preview deployments per PR (used as the staging gate for design/QA review), production deploys on merge to `main`, with instant rollback to any previous deployment.
- Edge Config / Vercel env variables used for environment-specific config, scoped correctly per environment (Development/Preview/Production) so secrets never leak into preview deployments unless explicitly intended.

### 11.5 Monitoring

- Real User Monitoring (Vercel Analytics, or equivalent) tracks Core Web Vitals from actual production traffic, segmented by route, broken down by device/connection type to catch regressions affecting specific user segments.
- Uptime/synthetic monitoring pings critical routes (login, dashboard, checkout) on an interval independent of real traffic, alerting before users notice an outage.

### 11.6 Error tracking

- All unhandled exceptions, Error Boundary catches, and explicit `logger.error` calls are shipped to an error-tracking service (e.g., Sentry) with source maps uploaded per deploy so stack traces resolve to original TypeScript, not minified bundle code.
- Errors are enriched with context (user ID, route, recent breadcrumbs) but never with PII beyond what's strictly necessary for debugging, per the logging rule in §6.8.
- Alert thresholds are tuned to signal, not noise — a new error type spiking above a baseline triggers an alert; a single isolated occurrence does not page anyone.

### 11.7 Logging (deployment context)

- Structured (JSON) logs in production for machine parseability; human-readable pretty-printing only in local development.
- Logs are shipped to a centralized aggregator, retained per the team's compliance requirements, and never written to client-accessible storage.

---

## 12. Checklists

### 12.1 Frontend development checklist

- [ ] Feature lives under `features/<name>` with no direct cross-feature imports
- [ ] Server Component used unless interactivity genuinely requires `'use client'`
- [ ] Forms use React Hook Form + a Zod schema shared with the API layer
- [ ] All API calls go through a typed `services/` function — no direct `axios`/`fetch` in components
- [ ] Loading, empty, and error states are all explicitly designed and implemented (not just the happy path)
- [ ] No `any`, no unhandled promise rejections, no console statements left in
- [ ] Component is keyboard-operable and screen-reader sane (tested with a quick keyboard-only pass)
- [ ] Strings are user-facing-appropriate (plain language, active voice, per the writing principles)
- [ ] Unit/integration tests added for new logic and user flows

### 12.2 Code review checklist

- [ ] Change is scoped to one logical concern, reasonably sized
- [ ] Naming follows §6.1–6.4 conventions
- [ ] No business logic in presentational/UI-tier components
- [ ] No duplicated logic that should be a shared hook/util
- [ ] Error handling present and meaningful (no empty `catch`, no swallowed rejections)
- [ ] No new `any`, no disabled ESLint rules without an inline justification comment
- [ ] Security-sensitive changes (auth, storage, input handling) reviewed against §8 explicitly
- [ ] Tests cover the new/changed behavior and actually fail if the logic is reverted (sanity-checked, not just present)
- [ ] No secrets, tokens, or `console.log` debugging artifacts left in the diff

### 12.3 Performance checklist

- [ ] No new client-side request waterfalls introduced
- [ ] Images use `next/image` with explicit dimensions or `fill` + sized container
- [ ] Large/rarely-used dependencies are dynamically imported, not in the main bundle
- [ ] Lists over ~100 items are virtualized
- [ ] New `useEffect`/`useMemo`/`useCallback` usage is justified, not reflexive
- [ ] TanStack Query `staleTime`/`gcTime` set deliberately, not left at defaults without thought
- [ ] Bundle analyzer checked if a new dependency was added; no unexpected size jump
- [ ] CWV budgets re-verified (Lighthouse/RUM) for any change touching a high-traffic route

### 12.4 Accessibility checklist

- [ ] Semantic HTML used (landmarks, headings in order, real `<button>`/`<a>`)
- [ ] All interactive elements reachable and operable via keyboard alone
- [ ] Visible focus indicator present on every focusable element (never `outline: none` without a replacement)
- [ ] Color contrast meets WCAG AA (4.5:1 text, 3:1 UI components) — verified against worst-case backdrop for glass surfaces
- [ ] Icon-only controls have `aria-label`; images have meaningful `alt` (or `alt=""` if purely decorative)
- [ ] Forms have associated `<label>`s and clear, programmatically-associated error messages
- [ ] Status updates (toasts, async results) use `aria-live` appropriately
- [ ] `prefers-reduced-motion` and `prefers-reduced-transparency` respected
- [ ] Tested with a screen reader (VoiceOver/NVDA) on at least the primary flow, not just automated axe-core scanning

### 12.5 Production deployment checklist

- [ ] All CI stages green: lint, type-check, unit/integration tests, E2E critical path
- [ ] Env vars validated and present for the target environment (no schema parse failures on boot)
- [ ] Bundle size within budget; no unreviewed large dependency additions
- [ ] CSP, security headers, and auth flows verified on the preview deployment
- [ ] Source maps uploaded to the error tracker for this release
- [ ] Feature flags set correctly for any incomplete/gated work merged but not yet released
- [ ] Rollback plan confirmed (previous deployment identified and ready for instant rollback)
- [ ] Post-deploy smoke test passed (critical paths manually or automatically verified on production)
- [ ] Monitoring dashboards checked in the 30 minutes following deploy for error-rate or CWV regressions