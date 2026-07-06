# Design System — Alpha Gold Signals

**Date:** 2026-07-06
**Status:** Active
**Author:** Atlaz (Orchestrator) + Games (Human Partner)

---

## 🎨 Design Direction: "Handwritten Claymorphism"

> *"A personal gold signals notebook-app that feels like your own notebook — handwritten warmth meets modern clay UI."*

**ไม่ใช่ trading terminal ไม่ใช่ corporate dashboard** — แต่เป็น **minimal signals app** ที่มี clay-like softness, ดู premium แต่ไม่ heavy

---

## ✍️ Typography

| Role | Font | Use For |
|------|------|---------|
| 📝 Display | **Caveat** | Headings, signal labels — ลายมือชัด อ่านง่าย |
| 📄 Body | **Patrick Hand** | Descriptions, reasoning — ลายมือเบาๆ สบายตา |
| 🔢 Data | **JetBrains Mono** | Prices, indicators, numbers — monospace สำหรับตัวเลข |

### Font Import

```css
@import url('https://fonts.googleapis.com/css2?family=Caveat:wght@400;500;600;700&family=Patrick+Hand&family=JetBrains+Mono:wght@400;500;600&display=swap');
```

### Type Scale

- **Display:** `text-2xl` / `font-semibold` / `tracking-tight` / `font-caveat`
- **Body:** `text-sm` / `leading-relaxed` / `font-patrick`
- **Data:** `text-sm` / `font-mono` / `tabular-nums` / `font-jetbrains`

### Font CSS Variables

```css
:root {
  --font-display: 'Caveat', cursive;
  --font-body: 'Patrick Hand', cursive;
  --font-data: 'JetBrains Mono', monospace;
}
```

---

## 🌓 Light Mode

| Color Name | Hex | Use |
|------------|-----|-----|
| Soft Cream | `#FFF8F0` | Background หลัก |
| Snow White | `#FFFFFF` | Card surface |
| Warm Sand | `#F0E6D8` | Shadow, divider, inset |
| Honey Gold | `#D4A843` | Accent หลัก |
| Light Honey | `#FFF3D6` | Hover, highlight |
| Soft Teal | `#5BA4A4` | Secondary accent |
| Deep Charcoal | `#3D3D3D` | Text หลัก |
| Warm Gray | `#9A9590` | Text รอง |
| Soft Green | `#4CAF7D` | BUY signal |
| Soft Coral | `#E8735A` | SELL signal |
| Soft Lavender | `#9B8EC4` | NEUTRAL signal |

---

## 🌑 Dark Mode

| Color Name | Hex | Use |
|------------|-----|-----|
| Deep Night | `#1A1A2E` | Background หลัก |
| Dark Clay | `#252540` | Card surface |
| Shadow Purple | `#2D2D4A` | Shadow, divider |
| Bright Gold | `#F0C75E` | Accent หลัก |
| Dim Gold | `#3D3520` | Hover, highlight |
| Muted Teal | `#7BC4C4` | Secondary accent |
| Light Cream | `#E8E4DC` | Text หลัก |
| Muted Gray | `#8A8690` | Text รอง |
| Bright Green | `#6CD49A` | BUY signal |
| Bright Coral | `#FF8A75` | SELL signal |
| Bright Lavender | `#B8A8E0` | NEUTRAL signal |

---

## 🏗️ Claymorphism

### Card — Light Mode

```css
.clay-card {
  background: #FFFFFF;
  border-radius: 20px;
  padding: 24px;
  box-shadow:
    8px 8px 16px #F0E6D8,
    -8px -8px 16px #FFFFFF;
  border: 1px solid rgba(240, 230, 216, 0.5);
}
```

### Card — Dark Mode

```css
.clay-card-dark {
  background: #252540;
  border-radius: 20px;
  padding: 24px;
  box-shadow:
    8px 8px 16px #15152A,
    -8px -8px 16px #35355A;
  border: 1px solid rgba(255, 255, 255, 0.05);
}
```

### Card — Inset (for indicators)

```css
.clay-card-inset {
  background: #FFF8F0;
  border-radius: 16px;
  padding: 20px;
  box-shadow:
    inset 4px 4px 8px #F0E6D8,
    inset -4px -4px 8px #FFFFFF;
}
```

### Button — Primary (Honey Gold)

```css
.clay-btn-primary {
  background: #D4A843;
  color: #FFFFFF;
  border-radius: 12px;
  padding: 12px 28px;
  font-weight: 600;
  font-family: 'Patrick Hand', cursive;
  box-shadow:
    4px 4px 8px #F0E6D8,
    -4px -4px 8px #FFFFFF;
  transition: all 200ms ease;
  cursor: pointer;
}

.clay-btn-primary:hover {
  background: #C99B35;
  box-shadow:
    2px 2px 4px #F0E6D8,
    -2px -2px 4px #FFFFFF;
  transform: translateY(1px);
}

.clay-btn-primary:active {
  box-shadow:
    inset 2px 2px 4px rgba(0,0,0,0.08),
    inset -2px -2px 4px rgba(255,255,255,0.15);
}
```

### Button — Secondary (Soft Teal)

```css
.clay-btn-secondary {
  background: #5BA4A4;
  color: #FFFFFF;
  border-radius: 12px;
  padding: 12px 28px;
  box-shadow:
    4px 4px 8px #F0E6D8,
    -4px -4px 8px #FFFFFF;
}
```

### Shadow Logic

```
Light Mode:
  Drop shadow = #F0E6D8 (warm sand, darker)
  Glow shadow = #FFFFFF (white, lighter)

Dark Mode:
  Drop shadow = #15152A (deep night, darker)
  Glow shadow = #35355A (lighter purple)

Light source: top-left
```

---

## 🌓 Theme Toggle

### CSS Variables

```css
:root {
  /* Light Mode (default) */
  --bg-primary: #FFF8F0;
  --bg-card: #FFFFFF;
  --bg-inset: #FFF8F0;
  --shadow-dark: #F0E6D8;
  --shadow-light: #FFFFFF;
  --accent: #D4A843;
  --accent-hover: #C99B35;
  --secondary: #5BA4A4;
  --text-primary: #3D3D3D;
  --text-secondary: #9A9590;
  --signal-buy: #4CAF7D;
  --signal-sell: #E8735A;
  --signal-neutral: #9B8EC4;
  --border: rgba(240, 230, 216, 0.5);
}

[data-theme="dark"] {
  --bg-primary: #1A1A2E;
  --bg-card: #252540;
  --bg-inset: #1E1E35;
  --shadow-dark: #15152A;
  --shadow-light: #35355A;
  --accent: #F0C75E;
  --accent-hover: #E0B74E;
  --secondary: #7BC4C4;
  --text-primary: #E8E4DC;
  --text-secondary: #8A8690;
  --signal-buy: #6CD49A;
  --signal-sell: #FF8A75;
  --signal-neutral: #B8A8E0;
  --border: rgba(255, 255, 255, 0.05);
}
```

### Toggle Implementation

```typescript
// Theme stored in localStorage
// Smooth transition 300ms between modes
// Toggle button: ☀️ / 🌙 (clay style)
```

---

## ✨ Motion

| Element | Animation | Duration |
|---------|-----------|----------|
| Card hover | Shadow เล็ก + translateY(2px) | 200ms ease |
| Button press | Clay press (shadow → inset) | 150ms ease |
| Signal entry | Fade in + slide up | 300ms ease-out |
| Theme toggle | Cross-fade colors | 300ms ease |
| Indicator bar fill | Width transition | 400ms ease |
| Toast | Slide up + fade in | 250ms ease-out |

### Motion CSS

```css
/* Card hover */
.clay-card:hover {
  box-shadow:
    4px 4px 8px var(--shadow-dark),
    -4px -4px 8px var(--shadow-light);
  transform: translateY(2px);
  transition: all 200ms ease;
}

/* Theme transition */
* {
  transition: background-color 300ms ease, color 300ms ease, box-shadow 300ms ease;
}
```

---

## 📝 Writing Guidelines

| Location | ✅ Use | ❌ Don't Use |
|----------|--------|-------------|
| Signal type | `BUY` / `SELL` | `Long Entry Opportunity` |
| Button | `วิเคราะห์สัญญาณ` | `Click to generate signal` |
| Status | `Active` / `Waiting` | `System Operational` |
| Empty | `ยังไม่มีสัญญาณ กดวิเคราะห์เลย!` | `No signals available at this time` |
| Error | `เชื่อมต่อไม่ได้ ลองอีกครั้ง` | `An error occurred` |
| Loading | `กำลังโหลด...` | `Please wait` |

---

## ❌ Banned Patterns

| Pattern | Why |
|---------|-----|
| Inter, Roboto, Open Sans fonts | ไม่มี character เลย |
| Purple/neon gradients | ดู generic AI |
| Dense terminal layout | ไม่ใช่ platform |
| Hard drop shadows | ไม่ claymorphism |
| Corporate language | ไม่เป็นมิตร |
| `height: 100vh` | ใช้ `min-h-[100dvh]` แทน (iOS Safari bug) |
| Pure `#000000` background | ใช้ off-black แทน |
| Pure `#FFFFFF` background | ใช้ Soft Cream แทน |

---

## 🎨 Component Examples

### Signal Card

```
┌──────────────────────────────────────┐
│ ▌ BUY  │  H1  │ 85% confidence     │
│                                      │
│  Entry   $2,650.42                   │
│  TP      $2,680.42  (+30.0p)         │
│  SL      $2,635.42  (-15.0p)         │
│                                      │
│  RSI oversold + OB zone              │
│  ตรงกับ Wyckoff accumulation         │
│                                      │
│  15:32 · H1                          │
└──────────────────────────────────────┘

Style:
- border-left: 3px solid var(--signal-buy)
- Clay card effect
- Font: Caveat (labels) + Patrick Hand (reasoning) + JetBrains Mono (numbers)
```

### Indicator Panel

```
┌──────────────────────────────────────┐
│  RSI(14)     ████████████░░  65.2   │
│  MACD        ██████████████  +0.45  │
│  SMA20       $2,648.30              │
│  BB Upper    $2,695.00              │
└──────────────────────────────────────┘

Style:
- Inset clay card
- Background: var(--bg-inset)
- Numbers: JetBrains Mono
```

### Quick Stats

```
┌──────────┐ ┌──────────┐ ┌──────────┐
│ 📊 12    │ │ ✅ 67%   │ │ 💰 +45p  │
│ Signals  │ │ Win Rate │ │ Total    │
└──────────┘ └──────────┘ └──────────┘

Style: 3 equal clay cards, accent-colored numbers
```

---

## 📐 Layout

```
┌──────────────────────────────────────────────┐
│  🥇 Alpha Gold Signals                       │
├──────────────────────────────────────────────┤
│                                              │
│  ┌─────────────────┐  ┌─────────────────┐   │
│  │  📊 CHART       │  │  🎯 SIGNAL      │   │
│  │  (60% width)    │  │  (40% width)    │   │
│  └─────────────────┘  └─────────────────┘   │
│                                              │
│  ┌──────────────────────────────────────┐   │
│  │  📈 INDICATORS (full width)          │   │
│  └──────────────────────────────────────┘   │
│                                              │
│  ┌──────────────────────────────────────┐   │
│  │  📋 SIGNAL HISTORY (full width)      │   │
│  └──────────────────────────────────────┘   │
│                                              │
└──────────────────────────────────────────────┘

Layout Rules:
- 2-column unequal (60/40) for chart + signal
- Full-width for indicators + history
- Generous padding: 24-32px around cards
- Gap: 20-24px between cards
- Max-width: 1200px centered
```

---

## 🎯 Design Read Summary

> *"Reading this as: a personal gold signals notebook-app for a Thai trader, with a handwritten-warm language, leaning toward Caveat + Patrick Hand typography + claymorphism cards + honey gold accent + light/dark dual theme + inviting micro-interactions."*
