# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.


# Suhas Music — Design System

Design system for **Suhas Padav** (artist name: **SUHAS**), a progressive jazz fusion pianist & composer. The brand centers on his debut single **Fractals** (feat. Ric Fierabracci & Marco Minnemann, 2026). All production materials — the artist site, the `/links` hub, the `/fractals` landing page, press kit, social graphics — live under one visual vocabulary: **midnight black, cyan→blue→indigo neon, tight monospace-geometric type, fractured glass imagery, loop video backgrounds.**

## Sources

- **Codebase** — `suhas-website/` (Vite + React 19 + Tailwind 3 + Framer-less custom reveals; Tone.js piano + Three.js visualizer). Main surfaces: `src/App.jsx` (homepage), `src/pages/LinksPage.jsx`, `src/pages/FractalsPage.jsx`, `src/pages/PressPage.jsx`, `src/components/MusicSection.jsx`.
- **Repo** — `aravind-venaktraman/suhas-website` (GitHub, same content as local mount).
- **Brand uploads** — logos, album art, fractals wordmark, videos, social SVGs, photos of Suhas / Ric / Marco. See `assets/`.
- **Live site** — `https://suhasmusic.com` · `/fractals` · `/links` · `/press`
- **Press kit** — Google Drive (link inside `PressPage.jsx`)

---

## Products represented

| Surface | Purpose | Key files |
|---|---|---|
| **Marketing site** (`/`) | One-pager: hero + loading screen + interactive piano, about, music chapters, connect, footer | `src/App.jsx`, `src/components/MusicSection.jsx` |
| **Links hub** (`/links`) | Linktree-style landing with grouped streaming / social links | `src/pages/LinksPage.jsx` |
| **Fractals landing** (`/fractals`) | Single-purpose "smart link" — pick your streaming service | `src/pages/FractalsPage.jsx` |
| **Press page** (`/press`) | Long-form EPK with bio, facts, collaborators, coverage angles | `src/pages/PressPage.jsx` |

Primary UI kit in this system is the **marketing site** — everything else reuses its component vocabulary.

---

## Content fundamentals

**Voice.** Third person, editorial, unhurried. Suhas is described from outside ("Suhas is a pianist and composer…"). First-person only shows up inside pull-quotes attributed `— Suhas`. Never "we" — the brand is one artist, not a collective.

**Tone.** Serious, craft-forward, a little literary. Copy avoids hype words ("incredible!", "amazing!") and never addresses the reader as "you." Instead it describes the work:
- "A journey into the chaotic symmetry of Jazz."
- "What started as a rhythmic experiment evolved into a musical dialogue once the full trio came together."
- "The track pairs composed structure with improvisation, giving each musician room to respond in real time."

**Casing.** UPPERCASE for every display title, every button, every eyebrow, every label, every nav link. Sentence case inside body paragraphs. Proper nouns (names of collaborators, platforms) preserved exactly: **Ric Fierabracci**, **Marco Minnemann**, **Chick Corea Elektrik Band**.

**Punctuation.** Em-dashes (—) are structural, used for attribution and for breaking up long sentences. Ampersands (&) in titles where space is tight ("Ric Fierabracci & Marco Minnemann"), "and" elsewhere. No Oxford comma rule — prose stays loose. Quotes are straight "..." inside JSX, smart "..." in prose where possible.

**Eyebrows.** Every hero/section starts with a cyan, fully tracked label in ALL CAPS: `OUT NOW` · `FOLLOW THE JOURNEY` · `STAY IN THE LOOP` · `PROGRESSIVE JAZZ FUSION / DEBUT SINGLE / OUT NOW`. Tracking is a dramatic `0.3em`–`0.4em`.

**Emoji.** Almost never. Two exceptions, both glyph-style and treated as icons, not emotion: `⏺` / `▶` / `⏹` on the piano transport, and a checkmark `✓` for inline form-success states. The favicon / imagery fills the decorative role emoji would otherwise serve. **Never** use decorative 🎹 🎵 🔥 — the brand is not that kind of artist.

**Unicode.** The `+` is the reserved "list bullet" glyph in press-page angles (`+ Debut single featuring three-time Grammy-nominated bassist…`), rendered in `cyan-400`.

**Vibe.** Think: liner notes on a premium album reissue, photographed album art, a producer's website from 2005 rebuilt with 2026 glass/neon chrome. Moody, confident, quiet.

**Copy specimens.**

> "Fractals began as a solo piano improvisation, a recursive rhythmic idea that mirrors its own structure throughout the track."

> "The composition is built on polyrhythmic layers — patterns that feel intricate and unpredictable up close, but resolve into a clear, unified symmetry."

> "Early access + 20% off when the merch store opens"  *(shorter marketing line, still no exclamation)*

> "✓ You're on the list — see you in April!"  *(only place the word "you" appears, inside a confirmation state, and the only exclamation mark allowed)*

---

## Visual foundations

**Canvas.** Pure black (`#000`) for the homepage, zinc-950 (`#09090b`) for secondary pages. There is no light mode. Everything is built for dark.

**Type.** ONE typeface: **Michroma** (Google Fonts, single weight 400). It runs on every element from 10px eyebrows to 5.5rem hero titles. Weight is faked with `font-weight: 700/800` (browsers synthesize) plus letter-spacing shifts: display titles use negative tracking (`-0.04em`), small labels use very positive tracking (`0.3–0.4em`). Inter is the body-copy fallback when Michroma is too heavy for dense paragraphs. There is no serif, no second sans, no mono anywhere except the scroll-progress percentage `{progress}%` label.

**Color.** Cyan → blue → indigo is **THE** gradient. It lives on: CTA buttons (`from-cyan-500 to-blue-600`), the fixed scroll-progress bar, the loading-screen progress track, section dividers, icon-chip accents, text-selection. Occasional purple / rose / red appear only as hover accents on specific social cards (Instagram = purple/pink, YouTube = red, Apple Music = rose). There is **never** a primary purple-pink hero gradient — that's a trope to avoid.

**Backgrounds.** Three rhythms:
1. **Full-bleed looping webm video** — `Shards_Video_Loop.webm` (hero + connect) and `Fractals Video for Website BG.webm` (music section). Always muted, autoplay, `playsInline`, mobile gets a lighter 720p variant. Opacity `0.25–0.85` over a dark gradient scrim.
2. **Full-bleed photography** — full-size suhas4/suhas6 photos used as immersive backgrounds with a bottom-up black gradient scrim and `brightness(0.7–0.92)`. Desktop side-by-side, mobile scroll-over-sticky parallax.
3. **Soft blurred bloom orbs** — two or three `rounded-full bg-cyan-500/10 blur-[100px]` dots drift behind glass tiles for color without structure.

**Imagery vibe.** Cool. Saturated cyan + magenta + blue. A lot of refracted light, prisms, shards of glass, piano keys through cracked mirrors. Photos of Suhas are desaturated warm-neutrals (dark navy backgrounds, warm skin tones) which lets the cool palette do the "contemporary" work. Album art is 1:1, heavily stylized, high-contrast glass/neon illustration.

**Animation.** Subtle, purposeful, never bouncy. The ingredients:
- `RevealOnScroll` — fade in + 1px up, `duration-150 ease-out`, staggered `delay={i * 80–150}`. Once-only, cached in sessionStorage.
- Loading-screen logo reveal: `cubic-bezier(0.22, 1, 0.36, 1)` over 700ms, a 1.15 scale-up as it fades out.
- Marquee: 60s linear infinite translateX(-50%) on a `-skew-y-1` band with an animated gradient background behind it.
- Scroll indicator: a 2s ease-in-out bounce of 8px.
- Zero bounce, zero spring, zero parallax 3D tilt.
- Hover transitions are 300–500ms `ease` on color/border/bg only.

**Hover states.** Two families.
- **Buttons** (filled cyan gradient CTA): `hover:brightness-110 hover:scale-105 active:scale-[0.97]`. Glow deepens via a larger colored shadow.
- **Glass tiles** (connect cards, link rows, stream buttons): border goes from `white/10` to `cyan-500/50` (or platform-specific tint), background from `white/[0.03]` to `white/[0.1]`, a colored blur blob enters from the bottom-right corner. Scale up 1.05.
- **Text links**: underline swipe — `absolute bottom-0 w-0 group-hover:w-full` cyan bar.

**Press states.** Everything is `active:scale-[0.97]` — a uniform 3% shrink. Piano keys additionally do `active:translate-y-0.5` + an inset shadow to simulate depression.

**Borders.** Hairline `1px rgba(255,255,255,0.06)` is the default everywhere. Activate state bumps to `cyan-500/50`. Thicker borders (`2px`) only on piano white keys and social-tile rings. Section rules are a `1px solid zinc-900` (`#18181b`) horizontal divider.

**Shadows.** Two kinds:
- **Black drop shadows** under content `shadow-lg shadow-black/80` on piano black keys and press-photo ovals.
- **Colored neon glows** — `shadow-lg shadow-cyan-500/25` under CTA buttons; `shadow-[0_0_20px_rgba(34,211,238,0.6)]` under active piano keys. The hover-grow pattern deepens glow rather than adding new light direction.

**No protection gradients on images.** Images get a `from-black via-black/40 to-transparent` gradient at the top or bottom instead of being cropped with capsules. Protection scrim direction: `to-t` when text sits above image, `to-b` when text sits below.

**Layout rules.**
- Fixed nav bar, top, full width. Scrolled state adds `bg-black/80 backdrop-blur-md py-4` (collapsed) vs `py-6` (expanded).
- Fixed 2px scroll-progress bar at `top:0` running the cyan→blue→indigo gradient.
- Container: `container mx-auto px-6` (24px side padding). Max inner widths: `max-w-3xl` (text blocks), `max-w-4xl` (press content), `max-w-6xl` (grids), `max-w-7xl` (music chapters).
- Section vertical rhythm: `min-h-screen` for hero-sized blocks; `py-24` / `py-28` for contained sections; `mb-16` / `mb-20` between stacked press content blocks.
- Grid: 2-column side-by-side on desktop, single-column mobile. Chapter sections on the music page use sticky video background + stacked content via CSS Grid overlap (`gridRow: 1/-1; gridColumn: 1/-1`).

**Transparency & blur.** Two levels.
- `backdrop-blur-md` (12px) on the scrolled nav and modal menus.
- `backdrop-blur-xl` (24px) on glass tiles inside dark sections — creates the "frosted card on refracted video" aesthetic.
Glass bg is always `rgba(255,255,255,0.03–0.06)` with a `rgba(255,255,255,0.06–0.1)` border. Never colored glass.

**Corner radii.** Everything is either very rounded (`rounded-3xl` for connect tiles, `rounded-2xl` for content cards) or fully round (`rounded-full` for buttons, inputs, social icons, scroll-progress rail, piano key bottoms via `rounded-b-lg`). Sharp corners only on store item images (`aspect-square` with no radius — evokes a vinyl/CD cover).

**Cards.**
- Content card: `rounded-2xl p-6 sm:p-8 border border-white/[0.06] bg-[rgba(255,255,255,0.03)] backdrop-blur-[12px]`.
- Connect tile: `rounded-3xl p-7 border-2 border-white/[0.08] hover:border-{platform}/50 hover:bg-white/[0.05] hover:scale-105`.
- Link row (links page): `rounded-xl px-4 py-4 bg-white/[0.06] border border-white/[0.1]`.
- Never a left-border accent stripe. Never a colored card background.

**Iconography container.** Social icons sit inside a 40–56px square with `bg-white/[0.04] border border-white/[0.06] rounded-xl`, or inside a `bg-{platform}/22 text-{platform}` colored-tint chip on the links page.

**Selection state.** Text selection is `bg-cyan-500 text-black` — an inverted, high-contrast flash.

---

## Iconography

**Brand-owned SVGs** in `assets/icons/`:
- `spotify.svg`, `applemusic.svg`, `youtube.svg`, `instagram.svg`, `tiktok.svg`

These were authored as part of the site — **always use these files** for platform marks. They're already color-accurate, already sized to the design system (20–26px rendered at `rounded-[3px]`/`rounded-[4px]`/`rounded-full` clipping to match each platform's corner philosophy — Spotify is a circle, Apple Music + Instagram rounded square, YouTube rounded rectangle, TikTok square).

**UI icons** come from **Lucide React** (`lucide-react`, pinned 0.562.0). The set used in production:
- `Menu`, `X` — nav toggle + modal close
- `ArrowRight` — CTA affordance
- `ArrowLeft` — back buttons
- `ExternalLink` — secondary streaming links / link-row end
- `ChevronRight`, `ChevronDown` — list affordance, scroll indicator
- `Mail` — press contact
- `Download` — press kit
- `Link2`, `Check` — share button states

Stroke weight is always Lucide default `1.5`–`1.8px`. Icons are 14–24px. Never recolored at a component level — they inherit `text-zinc-*` or `text-cyan-400` on active.

**Emoji / unicode.** See "Content fundamentals" — `+` is the cyan bullet, `✓` is success, `⏺ ▶ ⏹ − +` are piano transport. Nothing else.

**Never** draw custom SVGs for platform or UI icons. If you need something not in Lucide, ask for a real asset.

---

## File index

```
/
├── README.md                      ← you are here
├── SKILL.md                       ← skill manifest (Agent Skills compatible)
├── colors_and_type.css            ← CSS variables for color + type tokens
├── assets/
│   ├── logos/                     ← SUHAS wordmark, favicons
│   ├── brand/                     ← Fractals wordmark, album art, t-shirt, CD
│   ├── icons/                     ← platform SVGs (Spotify, Apple Music, YT, IG, TikTok)
│   ├── photos/                    ← artist + collaborator photography
│   └── video/                     ← looping webm backgrounds (+ mobile variants)
├── preview/                       ← design-system cards (shown in Design System tab)
│   ├── type-display.html          ← Michroma display scale
│   ├── type-body.html             ← body + caption
│   ├── type-eyebrows.html         ← cyan eyebrows, labels, rules
│   ├── color-primary.html         ← cyan → blue → indigo gradient
│   ├── color-neutrals.html        ← canvas + text ramps
│   ├── color-accents.html         ← platform brand accents
│   ├── shadows-borders.html       ← glass, neon glows, hairlines
│   ├── radii-spacing.html         ← radii + 4pt grid
│   ├── buttons.html               ← CTA / ghost / disabled
│   ├── forms.html                 ← email input, success, error
│   ├── connect-tiles.html         ← rounded-3xl social tiles
│   ├── link-rows.html             ← platform-tinted link rows
│   ├── piano.html                 ← signature piano element
│   ├── logo.html                  ← logo on black / inverted / gradient
│   ├── platform-icons.html        ← Spotify, Apple Music, YouTube, IG, TikTok
│   ├── album-art.html             ← Fractals cover
│   ├── photography.html           ← artist portraits
│   ├── video-bg.html              ← full-bleed Shards loop
│   └── marquee.html               ← skewed sub-hero marquee
└── ui_kits/
    └── website/                   ← component recreation of suhasmusic.com
        ├── README.md              ← kit conventions + simplifications
        ├── index.html             ← interactive homepage demo
        └── components.jsx         ← Nav, Hero, AbstractPiano, StreamRow,
                                     SkewMarquee, AboutSection, MusicChapter,
                                     ConnectSection, ConnectTile, EmailCapture,
                                     Footer + primitives (Eyebrow, CyanRule,
                                     CtaButton, GhostButton, Heading)
```

---

## Caveats / known limitations

- **Fonts.** Michroma is loaded from Google Fonts at runtime — there is no local `.ttf` in the codebase to copy into `fonts/`. If the design system needs to go fully offline, grab the woff2 from `https://fonts.googleapis.com/css2?family=Michroma&display=swap`. Inter is a substitute for dense body paragraphs that Michroma can't carry.
- **Tailwind CSS.** The site is built on Tailwind 3. This design system exposes both raw CSS variables (`colors_and_type.css`) and a Tailwind-style class reference inside the UI kit. If you're porting to plain CSS, prefer the variables.
