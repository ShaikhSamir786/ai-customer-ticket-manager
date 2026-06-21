# Stratus Design System
### Frontend Design Skill — Modern SaaS Product Dashboard

> **Theme:** Blue & White · **Style:** Glassmorphism + Spatial Design · **Tier:** Premium / Enterprise-grade

---

## Table of Contents

1. [Design Philosophy & Principles](#1-design-philosophy--principles)
2. [Color System](#2-color-system)
3. [Typography](#3-typography)
4. [Glassmorphism Guidelines](#4-glassmorphism-guidelines)
5. [Spatial Design System](#5-spatial-design-system)
6. [Layout & Responsive Grid](#6-layout--responsive-grid)
7. [Component Guidelines](#7-component-guidelines)
8. [Accessibility (WCAG 2.2 AA)](#8-accessibility-wcag-22-aa)
9. [Micro-interactions & Animation](#9-micro-interactions--animation)
10. [Dark Mode Adaptation](#10-dark-mode-adaptation)
11. [Tailwind CSS Configuration](#11-tailwind-css-configuration)
12. [Design Tokens Reference](#12-design-tokens-reference)

---

## 1. Design Philosophy & Principles

**Stratus** takes its name and metaphor from atmosphere: thin, luminous layers of cloud suspended at different altitudes over a clear blue sky. That is the literal visual model for this dashboard — UI surfaces are panes of frosted glass floating at different "altitudes" above a soft blue canvas, catching and refracting light from the layer below them. Every guideline in this document traces back to that one idea: **the interface has weather, depth, and air between its layers — never a flat stack of opaque boxes.**

### Core principles

1. **Altitude implies importance.** The higher an element floats (more blur, more shadow, more separation from canvas), the more transient or critical its purpose — tooltips and toasts live higher than persistent navigation, which lives higher than the page canvas.
2. **Glass is a privilege, not a default.** Translucency is reserved for surfaces that genuinely float above content: the navbar, sidebar, cards, modals, dropdowns. Dense data (tables, forms) sits on **solid** white surfaces — glass behind a table of numbers destroys scanability. Glass communicates "this is a layer," not "this is decoration."
3. **Blue is structural, not cosmetic.** Blue is used to encode meaning — primary actions, active states, links, focus, data emphasis — never applied indiscriminately. White and near-white neutrals carry the majority of the canvas so blue retains its signal value.
4. **Quiet density, confident scale.** Enterprise dashboards are information-dense by necessity. Counter that density with generous internal padding inside components and tight, deliberate type rather than shrinking everything uniformly. One element per screen (typically the primary KPI or chart) is allowed to be bold; everything around it stays disciplined.
5. **Light has a direction.** All shadows and highlights in this system assume a single light source from the upper-left at roughly 35°. Glass panels get a soft inner highlight along their top edge and a diffused, blue-tinted shadow along their lower-right — never a flat, symmetric drop shadow.
6. **Motion explains structure, not decoration.** Animation exists to clarify what's entering, leaving, expanding, or related — a card lift on hover confirms it's interactive, a modal's blur-in confirms it sits above the page. Motion that doesn't explain a spatial or state change is cut.

### What this system is *not*

- Not heavy, saturated "glassy gradient mesh" hero design — this is a working product, not a marketing landing page.
- Not glass *everywhere*. Tables, form inputs, and code/data blocks are intentionally opaque for legibility.
- Not dark-by-default. The signature mode is bright, airy, and white-forward; dark mode is a faithful adaptation, not the primary identity.

---

## 2. Color System

The palette is built from three custom-tuned blue families plus two atmospheric accents, on top of a near-white "Frost" canvas. Avoid default Tailwind `blue-600` / `indigo-600` — this system uses its own tuned stops.

### 2.1 Primary — "Zenith Blue" (brand, primary actions, links, focus)

| Token | Hex | Usage |
|---|---|---|
| `primary-50` | `#EEF4FF` | Tinted backgrounds, selected-row wash |
| `primary-100` | `#DCE8FF` | Hover background on light surfaces |
| `primary-200` | `#B9D2FF` | Disabled-state accents, chart gridlines |
| `primary-300` | `#8AB2FF` | Secondary chart series, subtle icons |
| `primary-400` | `#5688FA` | Hover state for primary-500 elements |
| `primary-500` | `#2F66F0` | **Brand core.** Primary buttons, active nav, links |
| `primary-600` | `#1D4FD1` | Primary button hover/pressed |
| `primary-700` | `#173FAA` | Pressed/active deep state |
| `primary-800` | `#122F80` | High-contrast text-on-light accents |
| `primary-900` | `#0B1D4D` | Headlines on white, dark-mode canvas base |
| `primary-950` | `#060F2B` | Dark-mode deepest background |

### 2.2 Secondary — "Stratus Gray" (structural neutrals, chrome, borders)

A blue-desaturated steel gray — never a pure neutral gray, which would clash with the blue identity.

| Token | Hex | Usage |
|---|---|---|
| `secondary-50` | `#F4F7FB` | App canvas base |
| `secondary-100` | `#E7EDF5` | Card borders, dividers |
| `secondary-200` | `#CFDAE9` | Input borders (resting) |
| `secondary-300` | `#ADC0D9` | Disabled borders/icons |
| `secondary-400` | `#7E9AC0` | Placeholder text, muted icons |
| `secondary-500` | `#587AA3` | Secondary body text |
| `secondary-600` | `#426085` | Labels, table headers |
| `secondary-700` | `#344C69` | Secondary headings |
| `secondary-800` | `#263851` | Sidebar dark surfaces |
| `secondary-900` | `#1A2738` | Deep chrome / sidebar (dark variant) |

### 2.3 Accents — atmospheric highlights (sparing use only)

| Token | Hex | Usage |
|---|---|---|
| `accent-cirrus` | `#4FD8E8` | Positive metric highlights, sparkline peaks, "new" badges |
| `accent-aurora` | `#7B6EF6` | Premium/Pro plan badges, AI-feature highlights only |

> Rule of thumb: no more than **one accent color per screen**, and never as a primary button fill.

### 2.4 Semantic colors

| Token | Hex | Usage |
|---|---|---|
| `success-500` | `#1FAE71` | Positive deltas, success toasts, "active" status |
| `warning-500` | `#F5A524` | Warnings, approaching-limit states |
| `danger-500` | `#F0473E` | Errors, destructive actions, negative deltas |
| `info-500` | *(= primary-500)* | Informational banners |

Each semantic color also has a `-50` tint (e.g. `success-50: #E9FAF1`) for badge/alert backgrounds, and a `-700` shade for text-on-tint use to maintain contrast.

### 2.5 Background & surface colors

| Token | Hex / Value | Usage |
|---|---|---|
| `bg-canvas` | `#F7F9FC` | App shell background ("the sky") |
| `bg-canvas-gradient` | `radial-gradient(at 20% -10%, #DCE8FF 0%, #F7F9FC 45%)` | Behind hero/empty states only |
| `bg-surface` | `#FFFFFF` | Opaque component surfaces (tables, inputs) |
| `bg-glass-light` | `rgba(255,255,255,0.55)` | Standard glass panel (cards, dropdowns) |
| `bg-glass-heavy` | `rgba(255,255,255,0.78)` | Modals, command palette (needs more legibility) |
| `bg-glass-nav` | `rgba(255,255,255,0.65)` | Navbar / sidebar |
| `bg-overlay-scrim` | `rgba(11,29,77,0.35)` | Modal backdrop scrim, tinted with primary-900 |

### 2.6 Text colors

| Token | Hex | Contrast on `bg-canvas` | Usage |
|---|---|---|---|
| `text-primary` | `#0B1D33` | 14.9:1 | Headings, primary body |
| `text-secondary` | `#4A5A72` | 7.1:1 | Supporting text, descriptions |
| `text-tertiary` | `#8194AC` | 3.4:1 | Timestamps, placeholder (decorative only — not for body copy) |
| `text-inverse` | `#FFFFFF` | — | Text on primary-500+ / dark surfaces |
| `text-link` | `#1D4FD1` (primary-600) | 6.1:1 | Inline links |

Note: `text-primary` is an off-black navy, not `#000000` — pure black against blue-white surfaces reads harshly and breaks the atmospheric palette.

---

## 3. Typography

### 3.1 Typeface roles

| Role | Typeface | Fallback stack | Why |
|---|---|---|---|
| **Display / Headings** | `General Sans` | `'General Sans', 'Segoe UI', sans-serif` | Geometric with a slightly humanist touch — confident at large sizes without feeling like a generic grotesk |
| **Body / UI** | `Inter` | `'Inter', system-ui, sans-serif` | High legibility at small sizes, excellent for dense UI text and form labels |
| **Data / Metrics / Mono** | `JetBrains Mono` | `'JetBrains Mono', ui-monospace, monospace` | Tabular figures, KPI numbers, table cell numerics, code snippets — fixed-width digits prevent layout jitter as numbers update |

Load via self-hosted `@font-face` or Fontshare (General Sans) / Google Fonts (Inter, JetBrains Mono) for licensing-clean, free distribution.

### 3.2 Type scale

A 1.250 (major third) modular scale, expressed as Tailwind-ready `rem` values:

| Token | Size | Line-height | Weight | Use |
|---|---|---|---|---|
| `text-xs` | 0.75rem / 12px | 1.4 | 500 | Badges, table meta, captions |
| `text-sm` | 0.8125rem / 13px | 1.45 | 400/500 | Secondary UI text, form helper text |
| `text-base` | 0.9375rem / 15px | 1.55 | 400 | Body copy, table cells |
| `text-md` | 1.0625rem / 17px | 1.5 | 500 | Card titles, nav items |
| `text-lg` | 1.25rem / 20px | 1.4 | 600 | Section headings, modal titles |
| `text-xl` | 1.5rem / 24px | 1.3 | 600 | Panel headings |
| `text-2xl` | 1.875rem / 30px | 1.25 | 700 | Page titles |
| `text-3xl` | 2.375rem / 38px | 1.15 | 700 | KPI hero numbers |
| `text-4xl` | 3rem / 48px | 1.1 | 700 | Empty-state / onboarding headlines |

**KPI numerals always use `JetBrains Mono` with `font-variant-numeric: tabular-nums`** so that values like `$1,204,381 → $1,289,002` update without horizontal shift.

### 3.3 Hierarchy rules

- Never use more than 3 weights on one screen (typically 400, 500, 600/700).
- Headings use `text-primary`; supporting copy directly beneath a heading uses `text-secondary` — this pairing alone establishes hierarchy without relying on size jumps.
- Letter-spacing: `-0.02em` on headings ≥ `text-xl`, `0` on body, `+0.04em` + uppercase on `text-xs` eyebrow labels/table headers only.

---

## 4. Glassmorphism Guidelines

Glassmorphism here is **structural** (denotes a floating layer) and must always degrade gracefully to a solid surface (see [Accessibility §8.5](#85-reduced-transparency--reduced-motion)).

### 4.1 Blur scale

| Token | `backdrop-filter: blur()` | Used on |
|---|---|---|
| `blur-sheen` | 6px | Hover sheen overlays, skeleton shimmer |
| `blur-sm` | 12px | Inline dropdowns, tooltips |
| `blur-md` | 20px | **Default for cards, sidebar, navbar** |
| `blur-lg` | 32px | Modals, drawers |
| `blur-xl` | 48px | Command palette, full-screen overlays |

### 4.2 Transparency scale (surface alpha over `bg-canvas`)

| Token | Alpha (white) | Effective contrast need |
|---|---|---|
| `glass-1` | 4% | Decorative dividers only — never holds text |
| `glass-2` | 18% | Hover wash on glass elements |
| `glass-3` | 55% | **Standard panel fill** (cards, nav, sidebar) |
| `glass-4` | 70% | Dropdowns, popovers (more legibility needed) |
| `glass-5` | 85% | Modals, forms-on-glass (highest legibility) |

> **Rule:** the more text/data a glass panel holds, the higher its alpha. A KPI card with one big number can sit at `glass-3`; a settings modal with form fields needs `glass-5`.

### 4.3 Borders

Glass panels get a **1px hairline border**, not a heavy stroke, to suggest a glass edge catching light:

```css
border: 1px solid rgba(255, 255, 255, 0.6);
/* Paired with an inner highlight for the "edge-lit" effect: */
box-shadow:
  inset 0 1px 0 rgba(255, 255, 255, 0.8),   /* top edge highlight */
  inset 0 -1px 0 rgba(11, 29, 77, 0.04);    /* bottom edge recession */
```

On non-white backgrounds (e.g., a glass card over a colored gradient), drop the border alpha to `0.35` to avoid a chalky outline.

### 4.4 Shadows (paired with blur, see elevation scale in §5.2)

Shadows are **always blue-tinted**, never neutral black — black shadows on a blue-white palette read muddy and disconnected.

```css
--shadow-color: 217 70% 25%; /* HSL hue/sat/light of primary-900, alpha applied per level */
```

### 4.5 When *not* to use glass

- Data tables (body rows) — solid `bg-surface`.
- Form inputs — solid `bg-surface` with a 1px `secondary-200` border; glass on inputs harms legibility of typed text.
- Chart plotting areas — solid white background so data ink has maximum contrast; the chart's *container card* may be glass, but the plot canvas itself is not.
- Any surface that must render identically in a screenshot/export/PDF (reports, invoices).

---

## 5. Spatial Design System

### 5.1 The altitude model

Six named altitude levels, each pairing a `z-index`, shadow depth, blur, and a hover/focus transform. Think of this as literal distance from the canvas:

| Level | Name | z-index | Shadow | Blur | Hover transform |
|---|---|---|---|---|---|
| 0 | **Ground** | 0 | none | none | — (page canvas, never elevated) |
| 1 | **Surface** | 10 | `shadow-sm` | `blur-md` | translateY(-2px) |
| 2 | **Float** | 20 | `shadow-md` | `blur-md` | translateY(-3px) + shadow-lg |
| 3 | **Overlay** | 30 | `shadow-lg` | `blur-lg` | — (modals don't hover-lift) |
| 4 | **Stratosphere** | 40 | `shadow-xl` | `blur-xl` | slide-in only |
| 5 | **Zenith** | 50 | `shadow-2xl` | `blur-xl` | — (critical/blocking alerts) |

| Layer | Maps to |
|---|---|
| Ground | App canvas, page background |
| Surface | Dashboard cards, sidebar, navbar, table containers |
| Float | Dropdown menus, tooltips, popovers, inline date pickers |
| Overlay | Modals, side drawers, command palette |
| Stratosphere | Toasts, notification stacks |
| Zenith | System-blocking alerts (session expiry, critical errors) |

**Rule:** never show more than 3 altitude levels simultaneously (e.g., Ground + Surface + one Float). Stacking Overlay-on-Overlay (modal-on-modal) is prohibited — use a single modal with internal steps instead.

### 5.2 Shadow values per level

```css
--shadow-sm: 0 1px 2px hsl(217 70% 25% / 0.06), 0 1px 1px hsl(217 70% 25% / 0.04);
--shadow-md: 0 4px 12px hsl(217 70% 25% / 0.08), 0 2px 4px hsl(217 70% 25% / 0.06);
--shadow-lg: 0 12px 32px hsl(217 70% 25% / 0.12), 0 4px 8px hsl(217 70% 25% / 0.06);
--shadow-xl: 0 24px 64px hsl(217 70% 25% / 0.18), 0 8px 16px hsl(217 70% 25% / 0.08);
--shadow-2xl: 0 32px 80px hsl(217 70% 25% / 0.24), 0 12px 24px hsl(217 70% 25% / 0.1);
```

### 5.3 Ambient depth ("sky" background layer)

Behind Ground-level content, place 2–3 large, heavily blurred (80–120px) low-opacity (8–14%) radial color blobs in `primary-200` and `accent-cirrus` — fixed position, very slow drift (or fully static for reduced-motion users). This is what makes glass panels above them feel like they're floating in atmosphere rather than sitting on a flat gray page. Keep these confined to dashboard backgrounds, never behind dense data tables where they'd add visual noise.

### 5.4 Spacing scale

4px base unit (aligns directly with Tailwind's default spacing scale — no custom spacing config needed):

| Token | px | Use |
|---|---|---|
| `space-1` | 4 | Icon-to-label gap |
| `space-2` | 8 | Tight stacks, chip padding |
| `space-3` | 12 | Form field internal padding |
| `space-4` | 16 | Default component padding |
| `space-6` | 24 | Card padding |
| `space-8` | 32 | Section gaps |
| `space-12` | 48 | Major section breaks |
| `space-16` | 64 | Page-level top padding |

### 5.5 Visual hierarchy rules

1. **Size + weight** establish primary hierarchy; color is reserved for *state* (active, error, success), not for arbitrary emphasis.
2. **One bold element per view.** On a dashboard home, that's typically the headline KPI or primary chart — everything else (secondary KPIs, tables) stays visually quiet so the eye has a clear entry point.
3. **Whitespace before borders.** Prefer a `space-6`+ gap to separate sections over adding a visible divider line; reserve dividers for genuinely dense areas (table rows, settings lists).
4. **Saturation budget:** any single screen should have no more than ~15% of its area in saturated color (primary-500, semantic colors); the rest is white, near-white, and text-neutral.

---

## 6. Layout & Responsive Grid

### 6.1 Breakpoints (Tailwind defaults — no override needed)

| Breakpoint | Width | Behavior |
|---|---|---|
| `base` | < 640px | Single column, sidebar becomes bottom-sheet/drawer |
| `sm` | ≥ 640px | 2-col card grid begins |
| `md` | ≥ 768px | Sidebar becomes collapsible rail (icon-only) |
| `lg` | ≥ 1024px | Full sidebar (260px) + 12-col content grid |
| `xl` | ≥ 1280px | 4-col KPI row, 2-col chart row |
| `2xl` | ≥ 1536px | Content max-width caps at 1600px, centered with canvas gutters |

### 6.2 Dashboard shell anatomy

```
┌─────────────────────────────────────────────────────┐
│  Navbar — fixed, 64px, altitude: Surface             │
├───────────┬───────────────────────────────────────────┤
│ Sidebar   │  Main content                              │
│ 260px     │  max-width: 1600px, centered                │
│ (Surface) │  padding: space-8 (32px) / space-6 mobile   │
│           │                                              │
│           │  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐         │
│           │  │ KPI  │ │ KPI  │ │ KPI  │ │ KPI  │  ← 4-col │
│           │  └──────┘ └──────┘ └──────┘ └──────┘         │
│           │  ┌───────────────────┐ ┌─────────────┐       │
│           │  │ Primary chart     │ │ Activity     │ ← 8/4 │
│           │  │ (col-span-8)      │ │ (col-span-4) │       │
│           │  └───────────────────┘ └─────────────┘       │
│           │  ┌─────────────────────────────────────┐     │
│           │  │ Data table (col-span-12)             │     │
│           │  └─────────────────────────────────────┘     │
└───────────┴───────────────────────────────────────────┘
```

### 6.3 Grid implementation

```html
<main class="mx-auto max-w-[1600px] px-6 lg:px-8 py-8">
  <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
    <!-- KPI cards -->
  </div>
  <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">
    <div class="lg:col-span-8"><!-- primary chart --></div>
    <div class="lg:col-span-4"><!-- activity feed --></div>
  </div>
</main>
```

Content never spans edge-to-edge on large monitors — capping at `1600px` keeps line lengths and chart proportions readable on 27"+ displays, a common enterprise setup.

---

## 7. Component Guidelines

### 7.1 Navbar

- **Altitude:** Surface · **Height:** 64px · fixed top, full width, `z-index: 10`
- Background: `bg-glass-nav` (`rgba(255,255,255,0.65)`) + `blur-md`, bottom border `1px solid secondary-100`
- Contents (left → right): logo/workspace switcher, global search (expands on focus, `⌘K` shortcut), divider, notification bell (badge in `danger-500`), avatar menu
- Search field: solid `bg-surface` *inside* the glass navbar (data-entry rule from §4.5) — `rounded-lg`, `secondary-200` border, expands from 240px → 400px on focus with a 200ms ease-out
- On scroll past 8px, navbar shadow transitions from none → `shadow-sm` to reinforce its Surface altitude

```html
<header class="fixed top-0 inset-x-0 h-16 z-10 backdrop-blur-md bg-white/65 border-b border-[#E7EDF5] flex items-center px-6 gap-4">
  <!-- logo, search, actions -->
</header>
```

### 7.2 Sidebar

- **Altitude:** Surface · **Width:** 260px expanded / 72px collapsed (icon-rail) · same glass treatment as navbar
- Active nav item: `primary-50` background pill, `primary-600` text + icon, 3px `primary-500` indicator bar on the left edge (4px border-radius)
- Inactive item: `text-secondary`, hover → `secondary-50` background wash (`glass-2`)
- Section labels (`text-xs`, uppercase, `text-tertiary`, `letter-spacing: 0.04em`) group nav items — no icons on section labels, only on items
- Collapse toggle persists in `localStorage`/app state; collapse animates width over 200ms `cubic-bezier(0.4,0,0.2,1)`, icons stay fixed position so they don't jump
- On mobile (< md), sidebar becomes a Float-altitude drawer sliding from the left with a scrim backdrop

### 7.3 Dashboard cards

- **Altitude:** Surface (default) → Float on hover if interactive (drill-down cards)
- Padding: `space-6` (24px) · Border-radius: `16px` · Background: `glass-3` + `blur-md`
- Structure: eyebrow label (`text-xs`, `text-tertiary`, uppercase) → big metric (`text-3xl`, `JetBrains Mono`, `text-primary`) → delta chip (success/danger background tint, arrow icon, `text-sm`) → optional sparkline anchored bottom
- Hover (only if clickable): `translateY(-2px)`, shadow `sm → md`, border brightens to `rgba(255,255,255,0.8)`, 150ms ease-out
- Loading state: skeleton with `blur-sheen` shimmer sweep, never a spinner inside a KPI card

```html
<div class="rounded-2xl p-6 backdrop-blur-md bg-white/55 border border-white/60
            shadow-[0_4px_12px_hsl(217_70%_25%/0.08)]
            hover:-translate-y-0.5 hover:shadow-[0_12px_32px_hsl(217_70%_25%/0.12)]
            transition-all duration-150 ease-out">
  <p class="text-xs uppercase tracking-wide text-[#8194AC]">Monthly Recurring Revenue</p>
  <p class="font-mono text-3xl font-bold text-[#0B1D33] mt-2">$128,402</p>
  <span class="inline-flex items-center gap-1 text-sm font-medium text-[#1FAE71] bg-[#E9FAF1] rounded-full px-2 py-0.5 mt-2">▲ 12.4%</span>
</div>
```

### 7.4 Data tables

- **Altitude:** Ground/Surface — **always opaque** `bg-surface`, no glass on the row/body area; the table's wrapping card may have a glass header bar above it
- Header row: `secondary-50` background, `text-xs` uppercase labels, sticky on scroll
- Row height: 48px default / 40px "compact" toggle for power users
- Row hover: `primary-50` wash, no shadow (tables stay flat — depth here would impair scanning)
- Row selection: checkbox column, selected rows get persistent `primary-50` background + left `2px primary-500` bar
- Numeric columns: right-aligned, `JetBrains Mono`, `tabular-nums`
- Zebra striping: avoid — use `secondary-100` 1px row dividers instead, which reads cleaner against the blue-white palette
- Empty/loading: skeleton rows, not a centered spinner, to preserve layout stability
- Pagination/footer: sticky bottom bar, `glass-3`, separated by 1px border

### 7.5 Forms

- **Altitude:** Ground — inputs are always opaque `bg-surface` with `secondary-200` border, `8px` radius
- Label above field (`text-sm`, `font-medium`, `text-secondary`), helper text below in `text-xs`/`text-tertiary`, error text replaces helper text in `danger-500` with an inline icon
- Focus state: border → `primary-500`, plus a 3px `primary-200` outer ring (`box-shadow: 0 0 0 3px rgba(47,102,240,0.15)`) — never rely on border color change alone
- Field height: 40px (default), 44px on touch/mobile contexts to meet target-size guidance
- Grouped fields: use `space-4` vertical gap; related fields (e.g., city/state/zip) sit in a grid row with `space-3` gap
- Inline validation on blur, not on every keystroke, to avoid error-flicker while typing

### 7.6 Buttons

| Variant | Background | Text | Border | Use |
|---|---|---|---|---|
| Primary | `primary-500`, hover `primary-600` | `text-inverse` | none | Main CTA, one per view section |
| Secondary | `bg-surface` | `primary-600` | `1px primary-200` | Secondary actions |
| Glass | `glass-3` + `blur-sm` | `text-primary` | `1px rgba(255,255,255,0.6)` | Actions floating over imagery/charts |
| Ghost | transparent | `text-secondary` | none | Tertiary/icon-only actions |
| Danger | `danger-500`, hover darker 10% | `text-inverse` | none | Destructive actions, confirmed via modal |

- Heights: `sm` 32px / `md` 40px / `lg` 48px · Radius: `10px` (matches card radius ratio)
- Press state: `scale(0.98)`, 100ms — gives tactile feedback without feeling bouncy
- Disabled: 40% opacity, `cursor-not-allowed`, no hover transform
- Icon-only buttons: 36×36px hit area minimum, always paired with `aria-label`

### 7.7 Modals

- **Altitude:** Overlay · Background: `bg-glass-heavy` (`glass-5`) + `blur-lg` · Radius: `20px` · max-width 480–640px depending on content
- Backdrop scrim: `bg-overlay-scrim` (`rgba(11,29,77,0.35)`) + `blur-sm` applied to the scrim itself, which throws the *entire page behind it* into soft focus — this is the system's clearest "altitude" cue
- Entrance: scale `0.96 → 1` + opacity `0 → 1` + blur `8px → 0`, 220ms `cubic-bezier(0.16,1,0.3,1)` (decelerate/"spring-ish")
- Exit: reverse, but faster (150ms) — exits should always feel quicker than entrances
- Footer actions right-aligned, destructive action (if any) uses Ghost/Secondary styling on the left, primary action on the right — never put destructive actions in the primary button slot without a secondary confirmation step
- Focus trap mandatory; first focusable element receives focus on open; `Esc` closes unless it's a destructive confirmation requiring explicit choice

### 7.8 Charts & analytics widgets

- Plot area: solid white, never glass (data-ink contrast rule, §4.5)
- Series colors in order: `primary-500`, `accent-cirrus`, `secondary-400`, `accent-aurora`, `success-500` — chosen for distinguishability at a glance, including for common color-vision deficiencies (pair with direct labeling, not color alone — see §8)
- Gridlines: `primary-100`, 1px, horizontal only (vertical gridlines add noise in dense time-series)
- Tooltip on hover: Float altitude, `glass-4`, appears within 100ms, follows cursor with slight lag (8–10% easing) rather than snapping
- Axis labels: `text-xs`, `text-tertiary`, `JetBrains Mono` for numeric axes
- Empty state (no data yet): illustrated placeholder, not just blank axes — pairs with the "empty screen is an invitation to act" copy principle
- Loading: skeleton chart shape (animated low-opacity bars/line), never a spinner replacing the whole widget

### 7.9 Notifications & alerts

| Type | Altitude | Placement | Behavior |
|---|---|---|---|
| Toast | Stratosphere | Bottom-right, stacked | Auto-dismiss 5s (success/info), persists for errors until dismissed; slides in from bottom + fades, `glass-4` |
| Inline banner | Surface | Top of page/section content | Persistent until dismissed or condition resolved; solid tinted background (`warning-50`/`danger-50`), not glass — needs to read clearly at a glance |
| Notification center | Float | Dropdown from navbar bell | `glass-4`, grouped by day, unread indicated by `primary-500` dot, not bold-weight-only |
| Blocking alert | Zenith | Center modal, scrim locked | For session expiry, critical billing/security issues only — used rarely, by design, so it retains urgency |

All non-blocking notifications use `role="status"` / `aria-live="polite"`; blocking alerts use `role="alertdialog"` (see §8).

---

## 8. Accessibility (WCAG 2.2 AA)

### 8.1 Color contrast

- Body text (`text-primary`, `text-secondary`) on `bg-canvas`/`bg-surface` meets ≥ 4.5:1 (verified in §2.6 table).
- `text-tertiary` (3.4:1) is **decorative only** — timestamps, placeholder text — never used for content the user must read to complete a task.
- **Glass surfaces are tested against their worst-case backdrop**, not an assumed white background — since content scrolling behind a glass navbar/sidebar can darken or lighten the effective surface. Where contrast can't be guaranteed (e.g., card floating over the ambient gradient blobs in §5.3), increase glass alpha to `glass-4`+ or add a subtle `bg-surface` text-backing chip behind critical text.
- All semantic colors (success/warning/danger) are paired with an icon and a text label — never color alone — for colorblind users.

### 8.2 Focus & keyboard navigation

- Every interactive element has a visible focus indicator: `box-shadow: 0 0 0 2px bg-canvas, 0 0 0 4px primary-500` (a "halo" ring that works on both glass and solid surfaces).
- Tab order follows visual/DOM order: navbar → sidebar → main content → modal (when open, focus is trapped inside).
- All custom components (dropdowns, date pickers, custom selects) implement full keyboard operability (`Enter`/`Space` to activate, arrow keys to navigate options, `Esc` to close).

### 8.3 Semantics & screen readers

- Tables use real `<table>`/`<th scope="col">` markup (not div-grids) so row/column relationships are announced correctly.
- Icon-only buttons always carry `aria-label`.
- Toasts/inline banners: `aria-live="polite"`; blocking alerts: `role="alertdialog"` + `aria-modal="true"`.
- Charts include a visually-hidden data table or summary (`sr-only` class) as an accessible equivalent to the visual chart.

### 8.4 Touch targets & spacing

- Minimum 44×44px hit area for all primary touch targets (buttons, checkboxes, table row actions) on touch contexts, even if the visual element is smaller (use padding to expand the hit area).
- Adjacent interactive elements (e.g., table row actions) keep ≥ 8px gap to prevent mis-taps.

### 8.5 Reduced transparency & reduced motion

```css
@media (prefers-reduced-transparency: reduce) {
  .glass-surface {
    background-color: var(--color-bg-surface); /* solid fallback */
    backdrop-filter: none;
  }
}

@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.001ms !important;
    transition-duration: 0.001ms !important;
  }
  .ambient-blob { display: none; } /* drifting background blobs */
}
```

Every glass and motion treatment in this system **must** have this fallback path — it's a hard requirement, not an enhancement.

---

## 9. Micro-interactions & Animation

### 9.1 Tokens

```css
--ease-standard: cubic-bezier(0.4, 0, 0.2, 1);
--ease-decelerate: cubic-bezier(0.16, 1, 0.3, 1);  /* entrances */
--ease-accelerate: cubic-bezier(0.7, 0, 0.84, 0);  /* exits */

--duration-instant: 100ms;  /* press states */
--duration-fast: 150ms;     /* hover, small transitions */
--duration-base: 200ms;     /* default UI transitions */
--duration-moderate: 300ms; /* panel/sidebar collapse */
--duration-slow: 500ms;     /* page-level, KPI count-up */
```

### 9.2 Signature interaction patterns

| Interaction | Pattern |
|---|---|
| Dashboard load | KPI cards stagger in: fade + `translateY(8px→0)`, 60ms stagger per card, `ease-decelerate`, 300ms each — the **one orchestrated moment** per the restraint principle; nothing else on the page animates on load |
| KPI value update | Number count-up/down over 500ms using an eased tween, not a hard swap — reinforces that this is *live* data |
| Card hover | `translateY(-2px)` + shadow step-up, 150ms `ease-standard` |
| Button press | `scale(0.98)`, 100ms, returns on release |
| Sidebar collapse | width transition 300ms `ease-standard`; labels fade out at 100ms (before the collapse finishes) to avoid text wrapping mid-animation |
| Modal open/close | See §7.7 |
| Toast enter/exit | slide + fade, 200ms in / 150ms out |
| Skeleton loading | Shimmer sweep using `blur-sheen` gradient moving left→right, 1.4s loop, `ease-standard` |
| Chart draw-in | Line/bar charts animate from baseline on first render only (not on every data refresh — re-renders update in place without re-drawing) |

### 9.3 Restraint checklist

- ✅ One orchestrated entrance moment per page (dashboard load stagger).
- ✅ Hover/press feedback everywhere interactive — quiet, consistent, never bouncy/elastic.
- ❌ No parallax scrolling on dashboard content (reserved only for the static ambient background blobs, and even those should be near-static, not actively scroll-linked).
- ❌ No animated gradients running continuously — implies the page is "alive" when it should imply *calm, premium reliability*.

---

## 10. Dark Mode Adaptation

Dark mode keeps the same atmospheric metaphor — it's midnight sky instead of daytime sky, not an inverted-gray theme.

### 10.1 Adapted tokens

| Token | Light | Dark |
|---|---|---|
| `bg-canvas` | `#F7F9FC` | `#0B1426` |
| `bg-surface` | `#FFFFFF` | `#101B30` |
| `bg-glass-light` | `rgba(255,255,255,0.55)` | `rgba(255,255,255,0.06)` |
| `bg-glass-heavy` | `rgba(255,255,255,0.78)` | `rgba(20,32,56,0.75)` |
| `border (glass)` | `rgba(255,255,255,0.6)` | `rgba(255,255,255,0.10)` |
| `text-primary` | `#0B1D33` | `#EAF1FF` |
| `text-secondary` | `#4A5A72` | `#9FB3CE` |
| `primary-500` | `#2F66F0` | `#5688FA` *(shifted lighter for AA contrast on dark)* |

### 10.2 Key adaptation rules

1. **Glass opacity drops, blur increases.** On dark surfaces, low-opacity white glass (`6–10%`) reads as a barely-there sheen rather than a milky panel — pair with a slightly higher blur (`+4px` over the light-mode value) to keep the frosted effect legible.
2. **Shadows become glows.** A dark shadow on a dark background is invisible. Replace elevation shadows with a soft **primary-tinted glow**:
   ```css
   --shadow-md-dark: 0 0 0 1px rgba(255,255,255,0.06),
                      0 8px 24px rgba(47,102,240,0.15);
   ```
3. **Ambient blobs shift role.** The background blobs (§5.3) move from light blue tints to deeper saturated `primary-700`/`accent-aurora` glows at low opacity (10–16%) — they become the dark sky's "city lights from above" rather than daylight clouds.
4. **Semantic colors brighten** by one step (e.g., `success-500 → success-400` equivalent) to maintain 4.5:1 against the dark canvas.
5. Respect `prefers-color-scheme` for first load, then persist explicit user choice in app settings (don't force dark mode based solely on OS preference if the user has set an explicit in-app preference).

---

## 11. Tailwind CSS Configuration

### 11.1 `tailwind.config.js` extension

```js
/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#EEF4FF', 100: '#DCE8FF', 200: '#B9D2FF', 300: '#8AB2FF',
          400: '#5688FA', 500: '#2F66F0', 600: '#1D4FD1', 700: '#173FAA',
          800: '#122F80', 900: '#0B1D4D', 950: '#060F2B',
        },
        secondary: {
          50: '#F4F7FB', 100: '#E7EDF5', 200: '#CFDAE9', 300: '#ADC0D9',
          400: '#7E9AC0', 500: '#587AA3', 600: '#426085', 700: '#344C69',
          800: '#263851', 900: '#1A2738',
        },
        accent: { cirrus: '#4FD8E8', aurora: '#7B6EF6' },
        success: { 50: '#E9FAF1', 500: '#1FAE71', 700: '#0F7A4E' },
        warning: { 50: '#FEF3E2', 500: '#F5A524', 700: '#B5760D' },
        danger:  { 50: '#FDECEB', 500: '#F0473E', 700: '#B3231B' },
      },
      fontFamily: {
        display: ['"General Sans"', 'sans-serif'],
        body: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      backdropBlur: {
        sheen: '6px', sm: '12px', md: '20px', lg: '32px', xl: '48px',
      },
      borderRadius: {
        lg: '10px', xl: '16px', '2xl': '20px',
      },
      boxShadow: {
        sm: '0 1px 2px hsl(217 70% 25% / 0.06), 0 1px 1px hsl(217 70% 25% / 0.04)',
        md: '0 4px 12px hsl(217 70% 25% / 0.08), 0 2px 4px hsl(217 70% 25% / 0.06)',
        lg: '0 12px 32px hsl(217 70% 25% / 0.12), 0 4px 8px hsl(217 70% 25% / 0.06)',
        xl: '0 24px 64px hsl(217 70% 25% / 0.18), 0 8px 16px hsl(217 70% 25% / 0.08)',
        '2xl': '0 32px 80px hsl(217 70% 25% / 0.24), 0 12px 24px hsl(217 70% 25% / 0.1)',
      },
      keyframes: {
        shimmer: { '0%': { backgroundPosition: '-200% 0' }, '100%': { backgroundPosition: '200% 0' } },
        'fade-up': { from: { opacity: 0, transform: 'translateY(8px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
        'modal-in': {
          from: { opacity: 0, transform: 'scale(0.96)', filter: 'blur(8px)' },
          to: { opacity: 1, transform: 'scale(1)', filter: 'blur(0)' },
        },
      },
      animation: {
        shimmer: 'shimmer 1.4s linear infinite',
        'fade-up': 'fade-up 300ms cubic-bezier(0.16,1,0.3,1) both',
        'modal-in': 'modal-in 220ms cubic-bezier(0.16,1,0.3,1) both',
      },
    },
  },
  plugins: [],
};
```

### 11.2 Reusable utility recipes

```html
<!-- Glass panel (cards, sidebar, navbar) -->
class="backdrop-blur-md bg-white/55 dark:bg-white/[0.06] border border-white/60 dark:border-white/10 rounded-2xl shadow-md"

<!-- Modal panel -->
class="backdrop-blur-lg bg-white/[0.78] dark:bg-[#142038]/75 rounded-2xl shadow-xl animate-modal-in"

<!-- Primary button -->
class="h-10 px-4 rounded-[10px] bg-primary-500 text-white font-medium text-sm hover:bg-primary-600 active:scale-[0.98] transition-all duration-150"

<!-- Focus ring (apply to any interactive element) -->
class="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 focus-visible:ring-offset-canvas"

<!-- KPI numeral -->
class="font-mono tabular-nums text-3xl font-bold text-[#0B1D33] dark:text-[#EAF1FF]"
```

---

## 12. Design Tokens Reference

Complete `:root` / `.dark` CSS custom-property block — the single source of truth for implementation outside Tailwind (charts libraries, third-party embeds, etc.):

```css
:root {
  /* Brand */
  --color-primary-50: #EEF4FF;  --color-primary-100: #DCE8FF;
  --color-primary-200: #B9D2FF; --color-primary-300: #8AB2FF;
  --color-primary-400: #5688FA; --color-primary-500: #2F66F0;
  --color-primary-600: #1D4FD1; --color-primary-700: #173FAA;
  --color-primary-800: #122F80; --color-primary-900: #0B1D4D;

  /* Neutrals */
  --color-secondary-50: #F4F7FB;  --color-secondary-100: #E7EDF5;
  --color-secondary-200: #CFDAE9; --color-secondary-300: #ADC0D9;
  --color-secondary-400: #7E9AC0; --color-secondary-500: #587AA3;
  --color-secondary-600: #426085; --color-secondary-700: #344C69;
  --color-secondary-800: #263851; --color-secondary-900: #1A2738;

  /* Accents */
  --color-accent-cirrus: #4FD8E8;
  --color-accent-aurora: #7B6EF6;

  /* Semantic */
  --color-success-50: #E9FAF1; --color-success-500: #1FAE71; --color-success-700: #0F7A4E;
  --color-warning-50: #FEF3E2; --color-warning-500: #F5A524; --color-warning-700: #B5760D;
  --color-danger-50:  #FDECEB; --color-danger-500:  #F0473E; --color-danger-700:  #B3231B;

  /* Surfaces */
  --bg-canvas: #F7F9FC;
  --bg-surface: #FFFFFF;
  --bg-glass-light: rgba(255,255,255,0.55);
  --bg-glass-heavy: rgba(255,255,255,0.78);
  --bg-glass-nav: rgba(255,255,255,0.65);
  --bg-overlay-scrim: rgba(11,29,77,0.35);

  /* Text */
  --text-primary: #0B1D33;
  --text-secondary: #4A5A72;
  --text-tertiary: #8194AC;
  --text-inverse: #FFFFFF;

  /* Typography */
  --font-display: 'General Sans', 'Segoe UI', sans-serif;
  --font-body: 'Inter', system-ui, sans-serif;
  --font-mono: 'JetBrains Mono', ui-monospace, monospace;

  /* Blur */
  --blur-sheen: 6px; --blur-sm: 12px; --blur-md: 20px; --blur-lg: 32px; --blur-xl: 48px;

  /* Shadows */
  --shadow-sm: 0 1px 2px hsl(217 70% 25% / 0.06), 0 1px 1px hsl(217 70% 25% / 0.04);
  --shadow-md: 0 4px 12px hsl(217 70% 25% / 0.08), 0 2px 4px hsl(217 70% 25% / 0.06);
  --shadow-lg: 0 12px 32px hsl(217 70% 25% / 0.12), 0 4px 8px hsl(217 70% 25% / 0.06);
  --shadow-xl: 0 24px 64px hsl(217 70% 25% / 0.18), 0 8px 16px hsl(217 70% 25% / 0.08);
  --shadow-2xl: 0 32px 80px hsl(217 70% 25% / 0.24), 0 12px 24px hsl(217 70% 25% / 0.1);

  /* Spacing (4px base, mirrors Tailwind defaults) */
  --space-1: 4px; --space-2: 8px; --space-3: 12px; --space-4: 16px;
  --space-6: 24px; --space-8: 32px; --space-12: 48px; --space-16: 64px;

  /* Motion */
  --ease-standard: cubic-bezier(0.4, 0, 0.2, 1);
  --ease-decelerate: cubic-bezier(0.16, 1, 0.3, 1);
  --ease-accelerate: cubic-bezier(0.7, 0, 0.84, 0);
  --duration-instant: 100ms; --duration-fast: 150ms; --duration-base: 200ms;
  --duration-moderate: 300ms; --duration-slow: 500ms;

  /* Elevation z-index */
  --z-ground: 0; --z-surface: 10; --z-float: 20;
  --z-overlay: 30; --z-stratosphere: 40; --z-zenith: 50;
}

.dark {
  --color-primary-500: #5688FA;

  --bg-canvas: #0B1426;
  --bg-surface: #101B30;
  --bg-glass-light: rgba(255,255,255,0.06);
  --bg-glass-heavy: rgba(20,32,56,0.75);
  --bg-glass-nav: rgba(16,27,48,0.65);
  --bg-overlay-scrim: rgba(2,6,16,0.55);

  --text-primary: #EAF1FF;
  --text-secondary: #9FB3CE;
  --text-tertiary: #5E7393;

  --shadow-sm: 0 0 0 1px rgba(255,255,255,0.05), 0 2px 8px rgba(0,0,0,0.3);
  --shadow-md: 0 0 0 1px rgba(255,255,255,0.06), 0 8px 24px rgba(47,102,240,0.15);
  --shadow-lg: 0 0 0 1px rgba(255,255,255,0.08), 0 16px 40px rgba(47,102,240,0.2);
  --shadow-xl: 0 0 0 1px rgba(255,255,255,0.1), 0 24px 64px rgba(47,102,240,0.25);
}
```

---

### Implementation checklist

- [ ] Fonts self-hosted or loaded via `<link rel="preconnect">` for General Sans, Inter, JetBrains Mono
- [ ] `tailwind.config.js` extended per §11.1
- [ ] `:root`/`.dark` tokens from §12 included as a global stylesheet for non-Tailwind contexts (charts, embeds)
- [ ] `prefers-reduced-motion` and `prefers-reduced-transparency` fallbacks implemented globally, not per-component
- [ ] Glass used only on Surface-altitude-and-above components; tables/forms/charts remain opaque
- [ ] All color pairings spot-checked against WCAG AA contrast, including glass-over-content worst cases