# XP & Gold Learning View Design

## Overview

A new view for learning about Dota 2's XP/level system, creep scaling formulas,
and neutral camp gold values. Single scrollable page with three flowing
sections.

## Structure

**View Registration**

- ID: `xp-gold`
- Name: "XP & Gold"
- Location: `src/components/views/xp-gold/index.tsx`
- Data: Static game data (no `heroDictionary` needed)

**Three Sections**

1. Hero Levels - XP curve chart + table
2. Creep Scaling - Formulas for lane creep gold/XP scaling
3. Neutral Gold - Flat list of all neutrals sorted by gold

## Aesthetic Direction

**Tone: Dark Fantasy Strategy Guide**

Feels like opening an ancient tome of game wisdom. Dark, moody, with gold
accents tying into the XP/gold theme.

- **Typography**: Distinctive serif/display font for headings, clean readable
  body font
- **Colors**: Deep slate/charcoal background, warm gold/amber for XP data, muted
  green for gold values, subtle texture for depth
- **Layout**: Generous whitespace between sections, chart as hero visual element
- **Motion**: Fade-in on scroll, XP chart line animates drawing on load
- **Signature Detail**: XP curve gradient shifting from cool (low levels) to
  warm gold (high levels)

## Section 1: Hero Levels

### XP Chart

- Area chart using existing Chart component (Recharts)
- X-axis: Level (1-30), Y-axis: Cumulative XP
- Gradient fill: cool blue/purple at level 1 → warm gold at level 30
- Animated line draw on load
- Tooltip on hover showing exact XP

### XP Table

- 3 columns: Level | XP for This Level | Total XP
- "XP for This Level" shows delta to gain that specific level
- Subtle gold accent on alternating rows
- Levels 1-30

### Data

Hardcoded XP values from Dota's level system:

- Level 1: 0 XP
- Level 2: 240 XP
- ... (known game values through level 30)

## Section 2: Creep Scaling Formulas

### Content

- Intro text: "Lane creeps upgrade every 7.5 minutes (max 30 stacks)"
- Four creep types: Melee, Ranged, Siege, Flagbearer

### Per Creep Display

- Base gold/XP values
- Formula: `Gold = base + (stacks × bonus_per_stack)`
- Same pattern for XP

### Visual Treatment

- Formulas in monospace font with subtle background
- Each creep type as a small card
- Gold values in muted green, XP values in gold/amber
- Data from `stats.json` (`upgradeGoldPerInterval`, `upgradeXpPerInterval`
  fields)

## Section 3: Neutral Creeps Gold

### Layout

- Flat list sorted by gold value (highest to lowest)
- Each row: Creep name | Gold bounty
- Subtle tier indicator (small/medium/large/ancient) as secondary text

### Visual Treatment

- Clean table/list with subtle separators
- Gold values in muted green
- No icons - names and gold for quick scanning

### Data

- Pull from `stats.json` neutral creep data
- All tiers: small, medium, large, ancient camps

## Technical Notes

- Uses existing shadcn components: Card, Chart
- Follows existing view pattern in `src/components/views/`
- CSS variables for color consistency
- Scroll-triggered fade animations via CSS or Framer Motion
