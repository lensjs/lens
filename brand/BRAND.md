# Lens.js — Brand Identity

Framework-agnostic observability for Node.js. This guide defines the visual identity: the mark, lockups, color, type, and rules for using them. Optimize for clarity and longevity over trend.

Assets live in this `brand/` folder; the in-product implementation is [`LensLogo.tsx`](../packages/core/src/ui/src/components/LensLogo.tsx) and [`favicon.svg`](../packages/core/src/ui/public/favicon.svg).

---

## 1. The mark — "Focal Frame"

An abstract, purely geometric glyph: a **rounded square** with a **diamond aperture** cut through the center as negative space.

```
┌───────────┐
│     ◇     │   rounded square = a bounded system / the frame you observe
│           │   diamond aperture = focus · precision · looking in
└───────────┘
```

It is one shape (a single path, one color). No eye, telescope, magnifying glass, radar, target, camera, chart, dashboard, hexagon, infinity, or bare "L".

Canonical path (24×24 grid, `fill-rule: evenodd`):

```
M7.5 2.5 H16.5 A5 5 0 0 1 21.5 7.5 V16.5 A5 5 0 0 1 16.5 21.5 H7.5 A5 5 0 0 1 2.5 16.5 V7.5 A5 5 0 0 1 7.5 2.5 Z  M12 7.4 L16.6 12 L12 16.6 L7.4 12 Z
```

### Logo rationale (why each decision)

- **Rounded square (the frame).** Observability is about giving a system structure and boundaries you can reason about. A square is the most stable, neutral, "systemic" primitive; the generous corner radius keeps it modern and friendly (Linear/Vercel family) rather than industrial.
- **Diamond aperture (negative space).** A rotated square set inside an orthogonal one creates optical tension that pulls the eye to the center — *focus* and *insight* expressed as geometry, not as an eyeball or a lens. Rendering it as a hole (negative space) means the mark reads as "seeing through into the core," and negative-space marks are what make identities feel premium and timeless.
- **Single color.** Encoding the whole idea in one shape guarantees it works in emerald, pure white, pure black, and any monochrome print — a hard requirement for favicons, CLIs, and stickers.
- **Optical balance.** The aperture is ~48% of the mark width so it survives at 16px without closing up; border mass is even on every diagonal so the silhouette stays balanced at any size.
- **Originality.** The specific pairing (orthogonal rounded frame + rotated aperture, via negative space) is uncommon and ownable, while remaining simple enough to last a decade.

---

## 2–11. Logo variants

| # | Variant | Asset | Use |
| --- | --- | --- | --- |
| 2 | Icon only (emerald) | [`lens-mark.svg`](lens-mark.svg) | Default symbol on neutral surfaces |
| 5 | Monochrome | [`lens-mark-mono.svg`](lens-mark-mono.svg) | Print, single-color contexts (swap fill `#FFFFFF` / `#0A0A0B`) |
| 6 | Dark mode | emerald or white mark on `#0A0A0B` | Dark UIs (product default) |
| 7 | Light mode | `#0A0A0B` mark on white, or emerald on white | Docs, light READMEs |
| 3 | Horizontal lockup | [`lens-lockup-horizontal.svg`](lens-lockup-horizontal.svg) | Headers, docs, READMEs |
| 4 | Vertical lockup | [`lens-lockup-vertical.svg`](lens-lockup-vertical.svg) | Splash, centered contexts |
| 1 | Primary logo | Horizontal lockup (mark + wordmark) | The default representation |
| 8 | Favicon | [`../packages/core/src/ui/public/favicon.svg`](../packages/core/src/ui/public/favicon.svg) | Browser tab (mark on tile) |
| 9 | App icon | [`lens-app-icon.svg`](lens-app-icon.svg) (512, tile) | Desktop/CLI app icon |
| 10 | GitHub avatar | `lens-app-icon.svg` | Org/repo avatar (already tiled) |
| 11 | npm icon | `lens-app-icon.svg` | Package art |

The **primary logo** is the horizontal lockup; the **icon** is the mark alone. The app tile (icon 9–11) is the emerald mark centered on the `#0A0A0B` canvas with a 22% corner radius.

---

## 12. Clear space

Reserve clear space equal to the **aperture width (≈ ¼ of the mark height, `1×`)** on all sides of the mark, and to the **cap height of the wordmark** around a lockup. Nothing (text, edges, other logos) enters this zone.

## 13. Minimum sizing

- Mark: **16px** (favicon) minimum; **20px** in UI chrome.
- Horizontal lockup: **96px** wide minimum (below this, use the mark alone).
- Never render the mark below 16px or the diamond aperture will close.

## 14. Brand colors

Dark-first. The palette is neutral + a single emerald accent (the accent is the only chromatic color in the system).

| Token | Hex | Role |
| --- | --- | --- |
| Emerald (accent) | `#10B981` | Primary brand / focus / interactive |
| Emerald hover | `#34D399` | Hover / highlight |
| Canvas | `#0A0A0B` | Page / tile background (dark) |
| Surface | `#141416` | Cards |
| Border | `#26262A` | Hairlines |
| Foreground | `#FAFAFA` | Primary text |
| Muted | `#A1A1AA` | Secondary text |
| Dim | `#71717A` | Tertiary text / `.js` in wordmark |

Semantic (product, non-brand): success `#10B981`, warning `#F59E0B`, danger `#FB7185`, info `#A78BFA`. These match the product's design tokens in [`index.css`](../packages/core/src/ui/src/index.css), so identity and UI stay one system.

## 15. Typography

- **Primary — Geist** (by Vercel): the wordmark and UI. It is geometric, neutral, and built for developer products, pairing perfectly with the geometric mark.
- **Mono — Geist Mono**: code, logs, durations, IDs — everything Lens displays.
- **Fallback — Inter** (then `-apple-system, "Segoe UI", sans-serif`) for environments without Geist.

Wordmark spec: `Lens` in Foreground + `.js` in Dim, **weight 600**, letter-spacing **-0.02em** (`-0.6` at 22px). Never bold the whole wordmark; the tonal split is the point.

## 16. Usage guidelines

Do:
- Use the emerald mark on dark, or the mono mark on solid backgrounds.
- Keep the mark single-color; keep clear space; align the wordmark's optical center to the mark's center.
- Use the app-icon tile for any avatar/app/npm context.

Don't:
- Add gradients, shadows, glows, bevels, or textures to the mark.
- Recolor the aperture, rotate the mark, stretch/skew, or outline it.
- Place the mark inside another rounded tile (it *is* the tile) or on a busy/low-contrast background.
- Recreate the wordmark in a different typeface, or bold the whole word.

## 17. Success check

Seen cold, the mark should read as *"a premium developer tool"* — in the family of Linear, Vercel, Supabase, and Sentry — not as "another monitoring dashboard." It is geometry, one color, and one idea: **bring a system into focus.**
