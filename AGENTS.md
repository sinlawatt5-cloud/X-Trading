# AGENTS.md — Alpha Gold Signals

## Project Overview

Personal gold (XAUUSD) trading signals web app with AI-powered analysis using SMC + Wyckoff + Multi-Timeframe methods via LLM (BYOK). Single-user, no auth. Thai + English.

**Status:** Design approved, planning complete, no code scaffolded yet.

## Tech Stack (Planned)

- **Framework:** Next.js 15 (App Router) + TypeScript
- **Styling:** Tailwind CSS + shadcn/ui
- **Chart:** lightweight-charts (TradingView)
- **Database:** Prisma + SQLite (dev) → Postgres (prod)
- **LLM:** Claude / GPT / OpenRouter (BYOK)
- **Market Data:** Twelve Data / Alpha Vantage
- **i18n:** next-intl (th/en)
- **Testing:** Vitest + Playwright
- **Deployment:** Vercel

## Design Direction

**"Handwritten Claymorphism"** — personal notebook feel, not corporate trading platform.

- **Fonts:** Caveat (display/handwritten) + Patrick Hand (body) + JetBrains Mono (data)
- **Light Mode:** Soft Cream `#FFF8F0` bg, Honey Gold `#D4A843` accent
- **Dark Mode:** Deep Night `#1A1A2E` bg, Bright Gold `#F0C75E` accent
- **Cards:** Claymorphism — dual shadow (drop + glow), border-radius 20px
- **Signature:** Clay button press effect (shadow → inset)
- **Banned:** Inter/Roboto fonts, purple/neon gradients, dense terminal layout

## Directory Structure

```
Sinlawat OS/
├── AGENTS.md                    ← You are here
├── .opencode/agents/            ← 73 sub-agents from agency-agents
├── agency-agents/               ← Cloned repo (reference only, don't edit)
├── docs/superpowers/
│   ├── specs/                   ← Design spec (approved)
│   └── plans/                   ← 4 phase implementation plans
└── (project code will be scaffolded here)
```

## Implementation Phases

| Phase | Focus | Weeks |
|-------|-------|-------|
| 1 - MVP | Scaffold, DB, Chart, Settings, Manual signals, i18n | 1-2 |
| 2 - Automation | Vercel Cron, LLM integration, Indicators, Auto-save | 3-4 |
| 3 - Expert Analysis | SMC, Wyckoff, Multi-TF, Confluence scoring | 5-6 |
| 4 - Polish | Calendar, Journal, Notifications, Analytics, E2E tests | 7-8 |

Full plans: `docs/superpowers/plans/`

## Agent Orchestration

This project uses **Atlaz as Main Orchestrator** with sub-agents from `agency-agents`. Key agents:

| Agent | Role |
|-------|------|
| Frontend Developer | UI, Components, Pages |
| Backend Architect | API, Server Logic, Algorithms |
| UI Designer | Design System, Theme |
| AI Engineer | LLM Integration, Prompts |
| Database Optimizer | Schema, Migration |
| Rapid Prototyper | Scaffold, MVP |
| DevOps Automator | Cron, Deployment |
| Evidence Collector | QA, Testing |
| Code Reviewer | Code Review |

## Skills (21 installed)

Located in `~/.claude/skills/`. Key skills for this project:

| Skill | Use For |
|-------|---------|
| `ui-ux-pro-max` | Design system generation (67 styles, 161 palettes) |
| `anthropic-frontend-design` | Distinctive visual design |
| `output-skill` | Complete code output (global — use with ALL agents) |
| `brutalist-skill` | Data-heavy trading UI |
| `find-docs` | Library docs lookup (Next.js, Prisma, etc.) |
| `karpathy-guidelines` | Clean code, avoid over-engineering |
| `systematic-debugging` | Debug root cause before fixing |
| `tdd` | Test-Driven Development |
| `planning-with-files` | File-based planning for complex tasks |
| `anthropic-theme-factory` | Light/dark theme system |
| `anthropic-webapp-testing` | E2E testing with Playwright |

## Commands (when scaffolded)

```bash
# Development
npm run dev          # Start dev server
npm run build        # Production build
npm run lint         # ESLint
npm run typecheck    # TypeScript check

# Database
npx prisma migrate dev --name <name>
npx prisma generate
npx prisma studio

# Testing
npm run test         # Vitest unit tests
npm run test:e2e     # Playwright E2E

# UI UX Pro Max (design system generation)
python3 ~/.claude/skills/ui-ux-pro-max/scripts/search.py "gold trading dashboard" --design-system -p "Alpha Gold Signals"
```

## Conventions

- TypeScript strict mode always
- All API keys stored server-side only (never exposed to client)
- Use `app/` directory routing (Next.js App Router)
- i18n keys in `lib/i18n.ts` — add both `th` and `en`
- Prisma schema in `prisma/schema.prisma` — migrate before coding
- Signal analysis JSON stored as string in `analysis` field
- Cron runs every 15 minutes via Vercel Cron

## Gotchas

- OpenCode agent limit: ~119 agents. Currently using 73 (under limit).
- Prisma SQLite for dev only — switch to Postgres for prod
- `lightweight-charts` requires client-side rendering (`'use client'`)
- LLM responses must be parsed as JSON — handle parse failures gracefully
- Mock data when no API key configured — don't break the UI
