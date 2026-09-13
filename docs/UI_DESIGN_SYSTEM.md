# UI Design System

Reference implementation: `frontend/src/styles/variables.css` + `global.css`.

## Visual Language

Inspired by Linear's restraint, Stripe Dashboard's data density, and Zoho
Inventory's operational clarity — premium but not decorative. Every visual
flourish (glass panels, soft shadows, rounded cards) is used to establish
**hierarchy**, not decoration for its own sake.

## Color System

| Token | Hex | Usage |
|---|---|---|
| `--color-primary` | `#4F46E5` | Primary actions, active nav, links, focus rings |
| `--color-secondary` | `#22C55E` | Success states, "in stock", completed orders |
| `--color-danger` | `#EF4444` | Destructive actions, out-of-stock, cancelled |
| `--color-warning` | `#F59E0B` | Low stock, pending states |
| `--color-bg` | `#F8FAFC` | App background |
| `--color-surface` | `#FFFFFF` | Cards, tables, modals |

Every semantic color has a paired `-light` background token (e.g.
`--color-primary-light: #EEF2FF`) used for chip backgrounds, so status badges
never use a saturated color as a fill — only as text/icon color on a tinted
background. This is what keeps dense tables (order lists, product tables)
readable instead of looking like a slot machine.

## Typography

- **Font:** Inter (falls back to system UI stack) — chosen for excellent
  numeral legibility, critical for a billing/inventory system full of prices
  and stock counts.
- **Scale:** 12 / 14 / 16 / 18 / 20 / 24 / 30 / 36 px, defined as rem tokens
  so a user's browser zoom/accessibility settings still scale correctly.
- **Weights used:** 400 body, 500 labels, 600 headings/buttons, 700 hero numbers
  (dashboard stat cards only).

## Spacing & Radius

4px base spacing scale (`--space-1` = 4px up to `--space-16` = 64px) — every
margin/padding/gap in the app should come from this scale, never an arbitrary
pixel value, so rhythm stays consistent across 14 phases built at different times.

Radius scale: `sm` (6px, inputs/small chips) → `md` (10px, buttons) → `lg`
(16px, cards) → `xl` (24px, modals/hero panels) → `full` (badges/avatars).

## Elevation (Shadows)

Layered, low-opacity shadows (`--shadow-sm` through `--shadow-xl`) rather than
single hard drop-shadows — this is what makes cards read as "soft" per the
brief rather than skeuomorphic. Dark theme redefines these with higher black
opacity since colored shadows disappear on dark backgrounds.

## Glassmorphism

Reserved for **exactly two** contexts to avoid overuse: the admin login card
and floating dashboard quick-action panels. Implemented via `--glass-bg`
(translucent white/navy) + `backdrop-filter: blur(16px)` + a 1px translucent
border for edge definition. Regular cards are NOT glass — glass is used
sparingly per the design brief.

## Dark Mode Strategy

Implemented purely through CSS variable overrides on `[data-theme='dark']` at
`:root` — components never write `if (theme === 'dark')` conditional class
logic. `ThemeContext` (Phase 2+) just toggles the `data-theme` attribute on
`<html>` and persists the preference. This means every component built in
every future phase gets dark mode for free as long as it uses tokens instead
of hardcoded hex values.

## Component Inventory (built as `common/` components starting Phase 2)

- `Button` (primary/secondary/danger/outline/ghost × sm/md/lg)
- `Card` (default / hoverable / glass variants)
- `Modal` + `ConfirmDialog` (used for the double-confirmation offline sale flow)
- `Table` (with built-in pagination, sort, empty state)
- `Badge` (status chip, maps order/stock status strings → the right badge class)
- `Input`, `Select`, `Textarea` (React Hook Form–bound, with `form-error` slot)
- `Skeleton` (via react-loading-skeleton, styled to match card radii)
- `EmptyState` (icon + message + optional CTA)
- `Toast` (via react-toastify, themed to match palette)
- `StatCard` (dashboard KPI tile — icon, label, big number, trend delta)

## Responsiveness Rules

- **Desktop-first** build order (per brief) with breakpoints at `1024px`
  (tablet) and `640px` (mobile) defined once in `global.css`.
- Admin sidebar: full 260px labeled nav → collapses to 84px icon rail on
  tablet → becomes a slide-over drawer on mobile.
- All data tables get `overflow-x: auto` inside `.table-wrapper` rather than
  breaking layout on small screens.
- Product grids use CSS Grid with `repeat(auto-fill, minmax(220px, 1fr))` so
  columns respond fluidly instead of fixed breakpoint-specific column counts.

## Motion (Framer Motion, applied from Phase 3 onward)

- Page transitions: fade + 8px slide-up, 200ms.
- Modals: scale from 0.95 → 1 + fade, 180ms.
- List items (orders, products): staggered fade-in, 30ms stagger delay.
- Micro-interactions (button press, card hover lift) are pure CSS
  (`transition` tokens above) — Framer Motion is reserved for
  layout/mount transitions to keep bundle work proportional to effect.
