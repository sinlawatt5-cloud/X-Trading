# Agent & Skill Configuration — Alpha Gold Signals

**Date:** 2026-07-06
**Status:** Active
**Author:** Atlaz (Orchestrator) + Games (Human Partner)

---

## 🤖 Sub-Agents (from agency-agents)

73 agents installed from [agency-agents](https://github.com/msitarzewski/agency-agents). 11 key agents selected for this project:

| Agent | Role | Phase Used |
|-------|------|------------|
| 🖥️ **Frontend Developer** | UI, Components, Pages | All |
| 🏗️ **Backend Architect** | API, Server Logic, Algorithms | All |
| 🤖 **AI Engineer** | LLM Integration, Prompts | 2, 3 |
| 🚀 **Rapid Prototyper** | Scaffold, MVP Setup | 1 |
| 🎯 **UI Designer** | Design System, Theme | 1 |
| 🗄️ **Database Optimizer** | Schema, Migration | 1, 2 |
| 🚀 **DevOps Automator** | Cron, Deployment | 2, 4 |
| 📸 **Evidence Collector** | QA, Testing | 4 |
| 👁️ **Code Reviewer** | Code Review, Security | 1, 4 |
| 📚 **Technical Writer** | Documentation | 4 |
| 🎬 **Studio Producer** | Task Orchestration | 1, 4 |

### Agent Location

```
.opencode/agents/
├── frontend-developer.md
├── backend-architect.md
├── ai-engineer.md
├── rapid-prototyper.md
├── ui-designer.md
├── database-optimizer.md
├── devops-automator.md
├── evidence-collector.md
├── code-reviewer.md
├── technical-writer.md
├── studio-producer.md
└── ... (73 total)
```

---

## 🏷️ Custom Skills (21 installed)

### From Anthropic (Official)

| # | Skill | Description | Location |
|---|-------|-------------|----------|
| 1 | 🆕 **anthropic-frontend-design** | Distinctive visual design — design lead mindset | `~/.claude/skills/anthropic-frontend-design/` |
| 2 | 🧪 **anthropic-webapp-testing** | E2E testing with Playwright, browser QA | `~/.claude/skills/anthropic-webapp-testing/` |
| 3 | 🎨 **anthropic-theme-factory** | Theme system generation, light/dark mode | `~/.claude/skills/anthropic-theme-factory/` |
| 4 | 🏷️ **anthropic-brand-guidelines** | Brand identity, color system | `~/.claude/skills/anthropic-brand-guidelines/` |

### From Community

| # | Skill | Description | Location |
|---|-------|-------------|----------|
| 5 | 🎨 **taste-skill** | Anti-slop frontend, landing pages | `~/.claude/skills/taste-skill/` |
| 6 | 💀 **brutalist-skill** | Data-heavy trading UI, terminal aesthetics | `~/.claude/skills/brutalist-skill/` |
| 7 | 📄 **minimalist-skill** | Clean editorial interfaces | `~/.claude/skills/minimalist-skill/` |
| 8 | ✨ **soft-skill** | High-end motion choreography | `~/.claude/skills/soft-skill/` |
| 9 | 📝 **output-skill** | Complete code output, no truncation (GLOBAL) | `~/.claude/skills/output-skill/` |
| 10 | 🕸️ **graphify** | Knowledge graph for codebase analysis | `~/.claude/skills/graphify/` |
| 11 | 🖼️ **image-to-code** | Image-first design to code pipeline | `~/.claude/skills/image-to-code-skill/` |
| 12 | 🔄 **redesign-skill** | Upgrade existing projects to premium | `~/.claude/skills/redesign-skill/` |
| 13 | 🪡 **stitch-skill** | DESIGN.md generation for Google Stitch | `~/.claude/skills/stitch-skill/` |
| 14 | 🎬 **gpt-tasteskill** | GSAP motion engineering | `~/.claude/skills/gpt-tasteskill/` |
| 15 | 📦 **taste-skill-v1** | Original v1 backward compatibility | `~/.claude/skills/taste-skill-v1/` |

### From ok-skills

| # | Skill | Description | Location |
|---|-------|-------------|----------|
| 16 | 📋 **planning-with-files** | File-based planning (task_plan.md) | `~/.claude/skills/planning-with-files/` |
| 17 | 📚 **find-docs** | Library docs lookup via Context7 CLI | `~/.claude/skills/find-docs/` |
| 18 | 🐛 **systematic-debugging** | Debug root cause before fixing | `~/.claude/skills/systematic-debugging/` |
| 19 | 🧪 **tdd** | Test-Driven Development | `~/.claude/skills/tdd/` |
| 20 | 📐 **karpathy-guidelines** | Clean code, avoid over-engineering | `~/.claude/skills/karpathy-guidelines/` |

### From nextlevelbuilder (101k stars)

| # | Skill | Description | Location |
|---|-------|-------------|----------|
| 21 | 🏆 **ui-ux-pro-max** | 67 styles, 161 palettes, 57 fonts, 99 UX rules, 161 reasoning rules | `~/.claude/skills/ui-ux-pro-max/` |

### UI UX Pro Max — Capabilities

```
📊 Data: 67 styles + 161 palettes + 57 fonts + 99 UX rules + 25 charts
🧠 AI: 161 reasoning rules for design system generation
🔍 Search: Python search engine for best match
🎨 Design System: Generate instantly by product type
🛠️ Stack: React, Next.js, shadcn/ui supported
```

#### Design System Generation Command

```bash
# Generate design system for gold trading dashboard
python3 ~/.claude/skills/ui-ux-pro-max/scripts/search.py "gold trading dashboard" --design-system -p "Alpha Gold Signals"

# Domain-specific search
python3 ~/.claude/skills/ui-ux-pro-max/scripts/search.py "glassmorphism" --domain style
python3 ~/.claude/skills/ui-ux-pro-max/scripts/search.py "elegant serif" --domain typography
python3 ~/.claude/skills/ui-ux-pro-max/scripts/search.py "dashboard" --domain chart

# Stack-specific guidelines
python3 ~/.claude/skills/ui-ux-pro-max/scripts/search.py "form validation" --stack react
python3 ~/.claude/skills/ui-ux-pro-max/scripts/search.py "responsive layout" --stack nextjs
```

### Skills Not Used

| Skill | Reason |
|-------|--------|
| 🖼️ image-to-code | โปรเจคนี้ไม่ได้แปลงรูปเป็น code |
| 📦 taste-skill-v1 | ใช้ v2 (taste-skill) แทน |

---

## 📊 Skill-to-Agent Matrix

| Agent | Skills |
|-------|--------|
| 🖥️ Frontend Developer | anthropic-frontend-design + brutalist-skill + output-skill + ui-ux-pro-max + find-docs + gpt-tasteskill |
| 🏗️ Backend Architect | output-skill + karpathy-guidelines + find-docs |
| 🤖 AI Engineer | output-skill + find-docs + systematic-debugging |
| 🎯 UI Designer | anthropic-frontend-design + taste-skill + stitch-skill + ui-ux-pro-max + brand-guidelines + theme-factory |
| 🗄️ Database Optimizer | output-skill + find-docs + karpathy-guidelines |
| 🚀 Rapid Prototyper | output-skill + planning-with-files |
| 🚀 DevOps Automator | output-skill + karpathy-guidelines + find-docs |
| 📸 Evidence Collector | output-skill + webapp-testing + tdd |
| 👁️ Code Reviewer | graphify + output-skill + karpathy-guidelines + systematic-debugging |
| 📚 Technical Writer | output-skill + find-docs |
| 🎬 Studio Producer | graphify + planning-with-files |

---

## 📦 Phase-by-Phase Assignment

### Phase 1 — MVP (Week 1-2)

| Task | Agent | Skills |
|------|-------|--------|
| Scaffold Next.js | 🚀 Rapid Prototyper | output-skill + planning-with-files |
| Generate Design System | 🎯 UI Designer | ui-ux-pro-max + brand-guidelines + stitch-skill |
| Light/Dark Theme | 🎯 UI Designer | ui-ux-pro-max + theme-factory |
| Layout + Header | 🖥️ Frontend Developer | ui-ux-pro-max + anthropic-frontend-design + output-skill + find-docs |
| Chart Component | 🖥️ Frontend Developer | ui-ux-pro-max + anthropic-frontend-design + gpt-tasteskill + find-docs |
| Settings API | 🏗️ Backend Architect | output-skill + karpathy-guidelines + find-docs |
| Price API | 🏗️ Backend Architect | output-skill + karpathy-guidelines |
| Signals API | 🏗️ Backend Architect | output-skill + karpathy-guidelines |
| Analyze API | 🏗️ Backend Architect | output-skill + karpathy-guidelines |
| Prisma Schema | 🗄️ Database Optimizer | output-skill + find-docs + karpathy-guidelines |
| Signal Card | 🖥️ Frontend Developer | ui-ux-pro-max + anthropic-frontend-design + output-skill |
| Signal Generator | 🖥️ Frontend Developer | ui-ux-pro-max + anthropic-frontend-design + output-skill |
| Dashboard | 🖥️ Frontend Developer | ui-ux-pro-max + anthropic-frontend-design + brutalist-skill + output-skill |
| Signals List | 🖥️ Frontend Developer | ui-ux-pro-max + anthropic-frontend-design + minimalist-skill + output-skill |
| News Placeholder | 🖥️ Frontend Developer | ui-ux-pro-max + minimalist-skill + output-skill |
| Journal Placeholder | 🖥️ Frontend Developer | ui-ux-pro-max + minimalist-skill + output-skill |
| Code Review | 👁️ Code Reviewer | graphify + output-skill + karpathy-guidelines |

### Phase 2 — Automation (Week 3-4)

| Task | Agent | Skills |
|------|-------|--------|
| Vercel Cron | 🚀 DevOps Automator | output-skill + karpathy-guidelines + find-docs |
| LLM Integration | 🤖 AI Engineer | output-skill + find-docs + systematic-debugging |
| Indicators | 🏗️ Backend Architect | output-skill + karpathy-guidelines |
| Auto-save | 🏗️ Backend Architect | output-skill + karpathy-guidelines |
| Auto-refresh | 🖥️ Frontend Developer | output-skill + find-docs |
| Cron Settings | 🖥️ Frontend Developer | ui-ux-pro-max + anthropic-frontend-design + output-skill |
| Indicators API | 🏗️ Backend Architect | output-skill + find-docs |

### Phase 3 — Expert Analysis (Week 5-6)

| Task | Agent | Skills |
|------|-------|--------|
| SMC Detection | 🏗️ Backend Architect | output-skill + karpathy-guidelines |
| Wyckoff Analysis | 🏗️ Backend Architect | output-skill + karpathy-guidelines |
| Multi-TF | 🏗️ Backend Architect | output-skill + karpathy-guidelines |
| Confluence Score | 🏗️ Backend Architect | output-skill + karpathy-guidelines |
| Enhanced Prompts | 🤖 AI Engineer | output-skill + find-docs + systematic-debugging |
| Confluence Gauge | 🖥️ Frontend Developer | ui-ux-pro-max + anthropic-frontend-design + brutalist-skill + gpt-tasteskill |
| Analysis Panel | 🖥️ Frontend Developer | ui-ux-pro-max + anthropic-frontend-design + brutalist-skill |

### Phase 4 — Polish (Week 7-8)

| Task | Agent | Skills |
|------|-------|--------|
| Calendar API | 🏗️ Backend Architect | output-skill + karpathy-guidelines |
| Calendar UI | 🖥️ Frontend Developer | ui-ux-pro-max + anthropic-frontend-design + minimalist-skill |
| Journal CRUD | 🏗️ Backend + 🖥️ Frontend | output-skill + karpathy-guidelines + ui-ux-pro-max |
| Notifications | 🖥️ Frontend Developer | output-skill + find-docs |
| Stats API | 🏗️ Backend Architect | output-skill + karpathy-guidelines |
| Analytics Dashboard | 🖥️ Frontend Developer | ui-ux-pro-max + brutalist-skill + anthropic-frontend-design + gpt-tasteskill |
| Performance | 🏗️ Backend + 🚀 DevOps | output-skill + karpathy-guidelines |
| E2E Tests | 📸 Evidence Collector | webapp-testing + tdd + output-skill |
| Bug Fixes | ใด agent | systematic-debugging + tdd |
| Documentation | 📚 Technical Writer | output-skill + find-docs |
| Final Review | 👁️ Code Reviewer | graphify + redesign-skill + output-skill + karpathy-guidelines |

---

## 📊 Skill Usage Summary

| Skill | Tasks Used | Global? |
|-------|-----------|---------|
| 📝 output-skill | 45 | ✅ Yes |
| 🏆 ui-ux-pro-max | 20 | No |
| 🆕 anthropic-frontend-design | 12 | No |
| 📚 find-docs | 10 | No |
| 📐 karpathy-guidelines | 10 | No |
| 💀 brutalist-skill | 6 | No |
| 🐛 systematic-debugging | 6 | No |
| 📋 planning-with-files | 5 | No |
| 📄 minimalist-skill | 5 | No |
| 🧪 tdd | 4 | No |
| 🎬 gpt-tasteskill | 4 | No |
| 🎨 anthropic-theme-factory | 3 | No |
| 🧪 anthropic-webapp-testing | 3 | No |
| 🕸️ graphify | 3 | No |
| 🏷️ anthropic-brand-guidelines | 2 | No |
| 🎨 taste-skill | 1 | No |
| 🪡 stitch-skill | 1 | No |
| ✨ soft-skill | 1 | No |
| 🔄 redesign-skill | 1 | No |
| 🖼️ image-to-code | 0 | No |
| 📦 taste-skill-v1 | 0 | No |

---

## 🔧 Installation Commands

### agency-agents (73 sub-agents)

```bash
# Clone
git clone https://github.com/msitarzewski/agency-agents.git

# Convert for OpenCode
cd agency-agents
wsl bash -c "./scripts/convert.sh --tool opencode"

# Install (6 divisions)
wsl bash -c "./scripts/install.sh --tool opencode --division engineering,design,security,testing,product,project-management --no-interactive"

# Copy to workspace
cp -r .opencode/agents/* ../.opencode/agents/
```

### Custom Skills (21 skills)

```bash
# Anthropic skills
# Already installed at ~/.claude/skills/

# UI UX Pro Max
npm install -g ui-ux-pro-max-cli
uipro init --ai opencode --global
cp -r ~/.opencode/skills/ui-ux-pro-max ~/.claude/skills/
```

---

## 📝 Notes

- OpenCode agent limit: ~119 agents (currently using 73 — under limit)
- `📝 output-skill` is GLOBAL — apply to ALL agents
- `🏆 ui-ux-pro-max` requires Python 3.x for search scripts
- `📚 find-docs` uses Context7 CLI (`npx ctx7@latest`)
- Skills in `~/.claude/skills/` are shared across all projects
- Agent files in `.opencode/agents/` are project-scoped
