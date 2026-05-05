# Peace of Real Estate Brand Style Guide

Visual identity guidelines for Peace of Real Estate

## Logo

### Primary Logo

The primary logo combines the logomark with the logotype. Use this version whenever space allows.

- **Full Color on Light**: For white or light gray backgrounds
- **Light on Dark**: For dark backgrounds

### Logo Variants

- **Logomark Only**: For small spaces, favicons, app icons
- **Logomark (Light)**: For dark backgrounds

Maintain clear space around the logo equal to the height of the "P" in "Peace". Never stretch, rotate, or alter the logo colors outside of approved variants.

## Color Palette

### Brand Colors

| Name         | Hex       | Usage                            |
| ------------ | --------- | -------------------------------- |
| Navy         | `#024A70` | Primary brand color              |
| Sky          | `#74D4FF` | Accent                           |
| Amber        | `#FFB86A` | Accent                           |
| Gray         | `#CAD5E2` | Neutral                          |

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

Used for backgrounds, links, interactive states.

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

Used for text, borders, backgrounds.

### Semantic Colors

| Name            | Hex       |
| --------------- | --------- |
| Success         | `#22c55e` |
| Warning/Negative| `#f97316` |

## Typography

### Typefaces

- **TT Commons Pro**: Headings, buttons, navigation. Weight: 500-600. Source: Adobe Typekit. Feature: ss02 (alternate characters)
- **DM Sans**: Body text, paragraphs, UI elements. Weight: 400-600. Source: Google Fonts

### Type Scale

Sizes are responsive. Values shown are desktop / tablet / mobile.

| Element | Size (desktop / tablet / mobile) | Line Height | Letter Spacing |
| ------- | -------------------------------- | ----------- | -------------- |
| H1      | 48 / 36 / 30px                   | 1.2         | -0.02em        |
| H2      | 30 / 24px                        | 1.2         | -0.02em        |
| H3      | 24 / 20px                        | 1.2         | -0.02em        |
| Body    | 18px                             | 1.7         | -              |
| Small   | 14px                             | 1.5         | -              |
| Nav     | 15px                             | -           | -              |

## CSS Variables

```css
/* Brand Colors */
--brand-navy: #024A70;
--brand-sky: #74D4FF;
--brand-amber: #FFB86A;
--brand-gray: #CAD5E2;

/* Typography */
--font-heading: "tt-commons-pro", system-ui, sans-serif;
--font-body: "DM Sans", system-ui, sans-serif;
```

## Font Imports

```html
<!-- Google Fonts -->
<link href="https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&display=swap" rel="stylesheet">

<!-- Adobe Typekit -->
<link rel="stylesheet" href="https://use.typekit.net/whm7mgx.css">
```
