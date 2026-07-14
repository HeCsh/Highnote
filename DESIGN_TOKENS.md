# DESIGN_TOKENS.md — extracted from Prototype A

Source: `https://highnote-prototype.lovable.app/` (landing, guest, dashboard).
Extracted from the SSR HTML + the compiled stylesheet `/assets/styles-BKj2s9s2.css`.
Prototype A is a TanStack-Router SSR React app compiled through Tailwind v4; the
`:root` custom-property block below is verbatim from that bundle.

## Palette (verbatim from `:root`)

| Token | Value | Role |
|---|---|---|
| `--background` / `--cream` / `--card` / `--popover` | `#fbf9f4` | app + card surface (warm cream) |
| `--page` | `#142819` | deep forest green — landing & dashboard canvas |
| `--foreground` / `--ink` / `--primary` / `--card-foreground` / `--secondary-foreground` / `--popover-foreground` | `#1e3a2a` | primary text / dark green ink |
| `--gold` | `#f2b441` | brand accent — stars, CTAs, eyebrows |
| `--accent` / `--sage` / `--ring` | `#7fa98b` | sage green — accents, focus ring |
| `--accent-foreground` | `#142819` | text on sage |
| `--muted` / `--secondary` / `--input` / `--border` / `--rule` | `#e4dfd3` | muted stone — borders, chips, rules |
| `--muted-foreground` | `#5b6b5f` | secondary text (muted sage-grey) |
| `--brick` / `--destructive` | `#c4452e` | brick red — destructive / warnings |
| `--destructive-foreground` / `--primary-foreground` | `#fbf9f4` | text on dark/red |

Supporting hexes seen inline in the SSR markup:
`#cddccf` (light sage body text on dark), `#3a5643` (border on dark), `#8ba392` (muted footer text on dark).

### Practical mapping
- **Dark screens** (landing, dashboard canvas): bg `--page #142819`, body text `#cddccf`, headings `--cream`, accent `--gold`.
- **Light cards / guest page card**: bg `--cream #fbf9f4`, text `--ink #1e3a2a`, muted `--muted-foreground #5b6b5f`, borders `--border #e4dfd3`.

## Typography

Google Fonts import (verbatim):
```
family=Fraunces:opsz,wght@9..144,900
family=Archivo:wght@400;500;600;700
family=Courier+Prime:wght@400;700
```

| Family | Var | Usage | Weights |
|---|---|---|---|
| **Fraunces** (serif, optical) | `--font-display` | display headings ("end every meal…", restaurant names, card titles) | 900 (also 400/600/700 in B) |
| **Archivo** (grotesque sans) | `--default-font-family` / `--font-sans` | all body, labels, buttons | 400 500 600 700 |
| **Courier Prime** (mono) | `--default-mono-font-family` | receipt/ticket text, table numbers, eyebrow monospace | 400 700 |

Type scale (Tailwind v4 defaults, confirmed present): xs .75 / sm .875 / base 1 / lg 1.125 / xl 1.25 rem; display headings run `text-6xl`→`text-7xl` with `leading-[0.95]`. Eyebrows use `tracking-[0.3em]` / `tracking-[0.22em]` uppercase.

## Radius, spacing, shadows

- `--radius: .75rem` (12px) — single radius token. Cards use `rounded-md`→`rounded-3xl`; chips are pills (`rounded-full`).
- `--spacing: .25rem` base (Tailwind).
- Shadows = Tailwind default scale (`--tw-shadow` ladder present):
  - sm `0 1px 2px 0 #0000000d`
  - DEFAULT `0 1px 3px 0 #0000001a, 0 1px 2px -1px #0000001a`
  - lg `0 10px 15px -3px #0000001a, 0 4px 6px -4px #0000001a`
  - xl `0 20px 25px -5px #0000001a, 0 8px 10px -6px #0000001a`
  - 2xl `0 25px 50px -12px #00000040` (guest card uses `shadow-2xl`)
- Transitions: default `.15s cubic-bezier(.4,0,.2,1)`; interactive elements use `.2s`/`.3s` with `active:scale-95` / `active:scale-[0.97]` press feedback.

## Signature visual motifs (must replicate for parity)

**Receipt / ticket card** (landing hero preview + guest header) — a cream paper card with torn perforated edges, drawn purely in CSS:
```css
.receipt-edge-top{background:radial-gradient(circle at 8px 0, transparent 6px, var(--cream) 6.5px) repeat-x;background-size:16px 12px;height:12px}
.receipt-edge-bottom{background:radial-gradient(circle at 8px 12px, transparent 6px, var(--cream) 6.5px) repeat-x;background-size:16px 12px;height:12px}
.dashed-rule{background-image:linear-gradient(to right, var(--rule) 60%, transparent 0%);background-position:50%;background-repeat:repeat-x;background-size:8px 1px;height:1px}
```
- Ticket interior is `font-mono` (Courier Prime), centered; restaurant name in Fraunces display; `THANKS FOR DINING · TABLE 12` in `text-[10px] tracking-[0.22em]`.
- **Stars**: gold SVG star path `M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.56 5.82 22 7 14.14 2 9.27l6.91-1.01L12 2z`, filled `var(--gold)`, unselected uses muted cream fill.
- **Tag chips**: pill, `rounded-full px-3 py-1.5 text-xs font-medium border`, emoji + label, `aria-pressed` toggles to filled state; tap target ≥44px via padding.
- **Eyebrows**: uppercase, gold, wide tracking (`REPUTATION ENGINE`, `WHAT STOOD OUT?`, `VOICE OF THE HOUSE`).
- **KPI cards**: cream/translucent cards on dark canvas, uppercase muted label + big Fraunces number + small delta caption.

## Aesthetic summary
Warm, editorial, restaurant-menu feel: deep forest green + cream paper + gold, serif display against clean grotesque sans, tactile receipt/ticket metaphor throughout. Understated, compliance-forward, "premium neighborhood bistro." Never neon, never generic SaaS blue.
