# Theme: "Links Minimal"

A coastal, textured minimalism — sand, fog, and driftwood. Quiet confidence
without weight. Every surface has subtle grain; nothing screams.

## Color Palette

| Token | Hex | Usage |
|---|---|---|
| Sand Trap | `#EDE8E0` | Page background |
| Card Cream | `#F5F2EE` | Card / elevated surfaces |
| Driftwood | `#C9C0B6` | Secondary borders, dividers, subtle fills |
| Wet Stone | `#3D3832` | Primary text, solid buttons, logos |
| Fog | `#9E9386` | Muted text, captions, secondary labels |
| Seafoam | `#8BA89B` | Accent color for highlights, badges, indicators |

**Border colors**
- Light border on cards: `#D8D0C8`
- Subtle internal borders: `#C9C0B6`

## Typography

- **Headings**: *Space Grotesk* (weights 300–600) — geometric, modern, slightly
techy but restrained.
- **Body**: *Work Sans* (weights 300–500, italic) — humanist sans, warm and
readable.
- **Scale**: Headings are medium weight (not overly bold), body is light to
regular. Generous line-height (`leading-relaxed` / `leading-snug`).
- **Letter-spacing**: Uppercase labels use `tracking-[0.15em]` to `tracking-[0.2em]`.

## Shape & Radii

- Prefer `rounded-sm` (2 px) for cards, buttons, and containers — sharp enough
to feel architectural, soft enough to avoid harshness.
- Avoid large radii (`rounded-2xl`, `rounded-3xl`) — this theme is flatter and
more editorial.

## Surface & Texture

- **Grain overlay**: A subtle SVG noise layer (`opacity: 0.03`) sits over the
main background. The `.grain` class applies `position: relative` to the parent
and renders the noise via a `::before` pseudo-element with `pointer-events: none`.
- **Shadows**: Very light — `shadow-sm` at most. Surfaces feel pressed into the
page rather than floating.

## Components

### Buttons
- **Primary**: `bg-[#3D3832]`, `text-[#F5F2EE]`, `rounded-sm`, `hover:bg-[#5A534A]`
- **Secondary / Outline**: `border border-[#C9C0B6]`, `text-[#3D3832]`, `rounded-sm`, `hover:border-[#3D3832]`

### Cards
- Background: `bg-[#F5F2EE]`
- Border: `border border-[#D8D0C8]`
- Shadow: `shadow-sm` (optional)
- Padding: generous (`p-8` typical)

### Links
- Default: `text-[#3D3832]` with no underline
- Hover: shift to muted tone or underline subtly

## Overall Vibe

- Earthy, quiet, editorial
- Texture without clutter
- Every element feels intentional and grounded
- Color is desaturated; contrast comes from tone, not saturation
