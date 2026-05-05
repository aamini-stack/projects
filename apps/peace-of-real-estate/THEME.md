# Peace of Real Estate Theme

Visual identity for Peace of Real Estate. The direction is **Calm Precision**:
professional, trustworthy, human, and quietly premium. The product should feel
like a guided matching experience, not a construction site, dashboard, or lead
form.

## Logo

### Primary Logo

The primary logo combines the logomark with the logotype. Use this version
whenever space allows.

- **Full Color on Light**: For white, porcelain, or light gray backgrounds
- **Light on Dark**: For navy or dark backgrounds

### Logo Variants

- **Logomark Only**: For small spaces, favicons, app icons
- **Logomark Light**: For dark backgrounds

Maintain clear space around the logo equal to the height of the "P" in
"Peace". Never stretch, rotate, or alter the logo colors outside approved
variants.

## Color Palette

### Brand Colors

| Name  | Hex       | Usage |
| ----- | --------- | ----- |
| Navy  | `#024A70` | Primary actions, trust anchors, selected states |
| Sky   | `#74D4FF` | Atmospheric accents, soft highlights, links |
| Amber | `#FFB86A` | Human warmth, agent accents, gentle emphasis |
| Gray  | `#CAD5E2` | Supporting neutral only |

### Theme Surfaces

| Name       | Hex       | Usage |
| ---------- | --------- | ----- |
| Porcelain  | `#F8FAFC` | App background |
| White      | `#FFFFFF` | Cards, nav, forms |
| Warm White | `#FFFDF8` | Hero/CTA gradients |
| Sky Wash   | `#F0F9FF` | Secondary surfaces, hover states |
| Ink        | `#0F172A` | Primary text |
| Slate      | `#64748B` | Secondary text |
| Border     | `#E2E8F0` | Soft separators and card borders |

### Extended Sky Scale

| Shade | Hex       |
| ----- | --------- |
| 50    | `#F0F9FF` |
| 100   | `#E0F2FE` |
| 200   | `#BAE6FD` |
| 300   | `#7DD3FC` |
| 400   | `#38BDF8` |
| 500   | `#0EA5E9` |
| 600   | `#0284C7` |
| 700   | `#0369A1` |
| 800   | `#075985` |
| 900   | `#0C4A6E` |

### Extended Slate Scale

| Shade | Hex       |
| ----- | --------- |
| 50    | `#F8FAFC` |
| 100   | `#F1F5F9` |
| 200   | `#E2E8F0` |
| 300   | `#CBD5E1` |
| 400   | `#94A3B8` |
| 500   | `#64748B` |
| 600   | `#475569` |
| 700   | `#334155` |
| 800   | `#1E293B` |
| 900   | `#0F172A` |

### Semantic Colors

| Name             | Hex       |
| ---------------- | --------- |
| Success          | `#22c55e` |
| Warning/Negative | `#f97316` |

## Typography

### Typefaces

- **TT Commons Pro**: Headings, buttons, navigation. Weight: 500-600. Source: Adobe Typekit. Feature: `ss02`.
- **DM Sans**: Body text, paragraphs, UI elements. Weight: 400-600. Source: Google Fonts.

If TT Commons Pro is unavailable, the theme should still feel close to showcase
direction #1: clean, soft, precise, with generous spacing and low visual noise.

### Type Scale

| Element | Size | Line Height | Letter Spacing |
| ------- | ---- | ----------- | -------------- |
| H1 | 48 / 36 / 30px | 1.05-1.2 | -0.02em |
| H2 | 30 / 24px | 1.2 | -0.02em |
| H3 | 24 / 20px | 1.2 | -0.02em |
| Body | 18px | 1.7 | -0.01em |
| Small | 14px | 1.5 | - |
| Nav | 15px | - | - |

## Shape And Layout

- Default radius: `12px`.
- Large panels: `16px`.
- Icon tokens: circular, softly tinted, bordered at low opacity.
- Cards: white or translucent white, soft border, subtle shadow.
- Backgrounds: porcelain with sky/amber radial glows.
- Avoid hard table grids, blueprint grids, construction motifs, sharp boxes, and noisy patterns.

## Component Language

- Primary buttons use navy, white text, `10px` radius, and subtle lift on hover.
- Secondary buttons use white translucent surfaces and soft borders.
- Forms and quiz options use rounded cards with calm selected states.
- Selected states should feel like a good match, not an engineering checkbox.
- Beta/private access should feel invitational, not "under construction".

## CSS Variables

```css
--brand-navy: #024A70;
--brand-sky: #74D4FF;
--brand-amber: #FFB86A;
--brand-gray: #CAD5E2;

--background: #F8FAFC;
--surface: #FFFFFF;
--surface-warm: #FFFDF8;
--surface-cool: #F0F9FF;
--foreground: #0F172A;
--muted-foreground: #64748B;
--border: #E2E8F0;
--radius: 0.75rem;

--font-heading: "tt-commons-pro", system-ui, sans-serif;
--font-body: "DM Sans", system-ui, sans-serif;
```

## Font Imports

```html
<link href="https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="https://use.typekit.net/whm7mgx.css">
```
