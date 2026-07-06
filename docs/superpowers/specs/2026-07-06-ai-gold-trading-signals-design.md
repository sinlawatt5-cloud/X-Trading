# AI Gold Trading Signals Platform - Design Spec

**Date:** 2026-07-06
**Status:** Approved
**Author:** Wendy (AI Assistant) + Games (Human Partner)

---

## 🎯 Overview

เว็บแอปสำหรับ **ส่งสัญญาณเทรดทอง (XAUUSD) อัตโนมัติ** ด้วย AI ระดับ Expert โดยใช้หลักการวิเคราะห์แบบ **SMC + Wyckoff + Multi-Timeframe** ผ่าน LLM

---

## 🎯 Goals & Non-Goals

### ✅ Goals
- ส่งสัญญาณเทรดทองอัตโนมัติ ทุก 15 นาที
- ใช้หลักการวิเคราะห์ระดับ Expert (SMC, Wyckoff, MTA)
- ให้ user เลือก LLM provider เอง (BYOK - Bring Your Own Key)
- UI Modern Minimal ใช้งานง่าย รองรับ 2 ภาษา (ไทย/อังกฤษ)
- สร้างแบบ Iterative เริ่ม MVP แล้วขยาย

### ❌ Non-Goals
- ไม่ทำ Auto-trading (เชื่อมกับ broker ส่ง order อัตโนมัติ)
- ไม่รองรับ Crypto/Forex อื่น (เน้นทองอย่างเดียว)
- ไม่ทำ Multi-user / Auth system (ใช้ส่วนตัว)
- ไม่ train ML model เอง (ใช้ LLM API)

---

## 🛠️ Tech Stack

| Layer | Technology | เหตุผล |
|-------|-----------|--------|
| **Framework** | Next.js 15 (App Router) + TypeScript | AI generate ง่าย, มี API routes, SSR |
| **Styling** | Tailwind CSS + shadcn/ui | Modern Minimal ได้ง่าย |
| **Chart** | lightweight-charts (TradingView) | ฟรี, เร็ว, professional |
| **Database** | SQLite (dev) → Postgres (prod) + Prisma | Type-safe, dev ง่าย |
| **LLM** | Claude / GPT / OpenRouter (user เลือก) | ยืดหยุ่น, user คุม key เอง |
| **Market Data** | Twelve Data / Alpha Vantage | ฟรี tier, ข้อมูลครบ |
| **Cron** | Vercel Cron | ฟรี tier, integrate กับ Next.js ง่าย |
| **i18n** | next-intl | รองรับ ไทย + อังกฤษ |
| **Notification** | Web Push API | ฟรี, browser-native |
| **Testing** | Vitest + Playwright | Standard, ครบ |
| **Deployment** | Vercel | ฟรี tier, deploy ง่าย |

---

## 🏗️ Architecture

### High-Level

```
┌─────────────────────────────────────────────────┐
│  👤 User (Browser)                              │
│  - Next.js Frontend (Vercel-style UI)           │
│  - Modern Minimal (Tailwind + shadcn/ui)        │
│  - Dark/Light mode, i18n (ไทย/EN)               │
└─────────────────────────────────────────────────┘
                    ↕️
┌─────────────────────────────────────────────────┐
│  🌐 Next.js App (API Routes)                    │
│  - /api/signals (CRUD)                          │
│  - /api/analyze (LLM)                           │
│  - /api/prices (Gold data)                      │
│  - /api/journal (Trade journal)                 │
└─────────────────────────────────────────────────┘
                    ↕️
┌─────────────────────────────────────────────────┐
│  ⏰ Cron Job (Loop Engineering)                 │
│  - Vercel Cron                                  │
│  - ทุก 15 นาที                                  │
│  - ดึงราคา → LLM วิเคราะห์ → บันทึก DB         │
└─────────────────────────────────────────────────┘
                    ↕️
┌─────────────────────────────────────────────────┐
│  🗄️ Database (Prisma + SQLite/Postgres)         │
│  - Signals    - Journal                         │
│  - Settings   - News                            │
└─────────────────────────────────────────────────┘
                    ↕️
┌─────────────────────────────────────────────────┐
│  🤖 External APIs                               │
│  - LLM (Claude/GPT/OpenRouter - BYOK)           │
│  - Twelve Data / Alpha Vantage (ราคาทอง)        │
│  - ForexFactory / Investing (news/calendar)     │
└─────────────────────────────────────────────────┘
```

---

## 🧩 Core Components

| Component | หน้าที่ | Tech |
|-----------|--------|------|
| **Chart** | กราฟแท่งเทียน Real-time, เลือก timeframe | lightweight-charts |
| **Signal Dashboard** | แสดงสัญญาณซื้อ/ขาย, เหตุผล, confidence | React + shadcn |
| **Indicator Panel** | RSI, MACD, MA, BB, Volume | Custom calculation |
| **News Feed** | ข่าว + Economic Calendar | External API |
| **Journal** | บันทึกผลเทรด + analytics | Form + DB |
| **Settings** | API keys, LLM provider, language | Form + DB |
| **Notification** | แจ้งเตือนเมื่อมีสัญญาณใหม่ | Web Push |
| **Cron Worker** | Auto polling ทุก 15 นาที | Vercel Cron |

---

## 📊 Data Models

### Signal

```typescript
type Signal = {
  id: string;
  type: 'BUY' | 'SELL' | 'NEUTRAL';
  timeframe: 'M15' | 'H1' | 'H4';
  entry: number;          // ราคาเข้า
  takeProfit: number;     // TP
  stopLoss: number;       // SL
  confidence: number;     // 0-100
  confluence: number;     // 0-100 (multi-factor score)
  reasoning: string;      // เหตุผล
  analysis: {
    smc: object;          // Order Block, FVG, Liquidity
    wyckoff: object;      // Phase, volume
    mta: object;          // Multi-TF alignment
    indicators: object;   // RSI, MACD, MA, BB
  };
  status: 'PENDING' | 'HIT_TP' | 'HIT_SL' | 'EXPIRED';
  createdAt: Date;
  closedAt?: Date;
}
```

### JournalEntry

```typescript
type JournalEntry = {
  id: string;
  signalId?: string;      // link กับ signal
  date: Date;
  symbol: 'XAUUSD';
  direction: 'BUY' | 'SELL';
  entry: number;
  exit: number;
  stopLoss: number;
  takeProfit: number;
  pips: number;
  pnl: number;            // profit/loss in $
  notes: string;
  screenshot?: string;    // path
}
```

### Settings

```typescript
type Settings = {
  id: string;
  llmProvider: 'claude' | 'openai' | 'openrouter';
  llmApiKey: string;      // encrypted
  marketDataProvider: 'twelvedata' | 'alphavantage';
  marketDataApiKey: string;
  language: 'th' | 'en';
  theme: 'light' | 'dark' | 'system';
  cronEnabled: boolean;
  cronInterval: number;   // minutes
  minConfidence: number;  // ส่งแจ้งเตือนเมื่อ confidence > X
}
```

---

## 🔄 Data Flow & Loop (Auto Polling)

### Cron Job (ทุก 15 นาที)

```
⏰ CRON TRIGGER (ทุก 15 นาที)
        ↓
📡 STEP 1: ดึงข้อมูลหลายชั้น
   ├─ XAUUSD: M15, H1, H4, D1
   ├─ DXY (ดอลลาร์ index)
   ├─ Economic Calendar (วันนี้/พรุ่งนี้)
   └─ News sentiment
        ↓
🧮 STEP 2: คำนวณ Indicators + Structure
   ├─ RSI(14), MACD, MA(20,50,200), BB
   ├─ Volume Profile
   ├─ Market Structure (HH, HL, LH, LL)
   └─ Liquidity zones
        ↓
📐 STEP 3: วิเคราะห์ SMC
   ├─ หา Order Block (OB)
   ├─ หา Fair Value Gap (FVG)
   ├─ ตรวจ Liquidity Sweep
   └─ ดู Break of Structure (BOS/CHoCH)
        ↓
🌊 STEP 4: วิเคราะห์ Wyckoff Phase
   ├─ อยู่ใน Accumulation?
   ├─ อยู่ใน Distribution?
   ├─ มี Spring/Upthrust?
   └─ Volume ยืนยันไหม?
        ↓
⏰ STEP 5: Multi-Timeframe Confluence
   ├─ D1: ทิศทางหลัก (Bull/Bear)
   ├─ H4: โซนสำคัญ
   ├─ H1: Setup
   └─ M15: Entry
        ↓
🤖 STEP 6: เรียก LLM (ใส่ context ทั้งหมด)
   Prompt: "คุณเป็น Expert Trader...
   - SMC: OB/FVG/Liquidity
   - Wyckoff: Phase
   - MTA: Confluence
   - DXY impact
   - News impact
   วิเคราะห์แล้วให้ JSON signal"
        ↓
💾 STEP 7: บันทึก Signal
   - entry, TP, SL
   - confidence (0-100)
   - confluence (0-100)
   - reasoning (อธิบาย)
   - SMC zones, Wyckoff phase
        ↓
🔔 STEP 8: แจ้งเตือน
   - confluence > 75
   - ไม่มีข่าวใหญ่ใน 1 ชม.
        ↓
🔁 กลับไป STEP 1
```

### 🎯 Confluence Score

| Factor | Weight |
|--------|--------|
| 📐 SMC setup ชัดเจน | 30% |
| 🌊 Wyckoff phase ตรง | 20% |
| ⏰ Multi-TF ตรงกัน | 25% |
| 🧮 Indicators ยืนยัน | 15% |
| 📰 ไม่มีข่าวร้าย | 10% |

**Signal จะถูกส่งเมื่อ confluence > 75%**

---

## 🗺️ UI Pages

```
🏠 / (Dashboard)
   ├─ 📊 Chart (XAUUSD real-time)
   ├─ 🤖 Latest Signal
   ├─ 📈 Indicators
   └─ 🔔 Active Alerts

📋 /signals
   ├─ 📜 All signals (filter by date/TF/confidence)
   ├─ 📊 Win rate stats
   └─ 🔍 Detail view

📰 /news
   ├─ 📅 Economic Calendar
   ├─ 📰 Latest news
   └─ ⚠️ Upcoming events

📓 /journal
   ├─ ➕ New trade
   ├─ 📊 My trades
   └─ 📈 Performance analytics

⚙️ /settings
   ├─ 🔑 API Keys (LLM, market data)
   ├─ 🎛️ LLM provider
   ├─ ⏰ Cron frequency
   └─ 🌏 Language
```

---

## ⚠️ Error Handling

| Error | Handling |
|-------|----------|
| ❌ API key ไม่ถูก | แจ้ง user + หยุด loop ชั่วคราว |
| ❌ Rate limit | Retry + exponential backoff |
| ❌ Network fail | เก็บ log + retry |
| ❌ LLM timeout | ใช้สัญญาณเก่าล่าสุดแทน |
| ❌ DB error | Retry + alert |
| ❌ Invalid signal format | Skip + log |

---

## 🧪 Testing Strategy

| Type | Tool | Coverage |
|------|------|----------|
| **Unit** | Vitest | Functions, calculations (indicators, SMC detection) |
| **Integration** | Vitest | API routes, DB queries |
| **E2E** | Playwright | Critical flows (chart load, signal generation) |
| **Type** | TypeScript strict | Type safety |

---

## 🚀 Deployment

| Service | ใช้ทำอะไร | Cost |
|---------|----------|------|
| **Vercel** | Frontend + API + Cron | Free tier |
| **Neon/Supabase** | Postgres DB | Free tier |
| **Vercel Cron** | Scheduled tasks (ทุก 15 นาที) | Free tier (hobby) |
| **Web Push** | Browser notifications | Free |

### 💰 Cost Estimate (ต่อเดือน)

| Service | Free Tier | ถ้าเกิน |
|---------|-----------|---------|
| Vercel | 100GB bandwidth | $20/mo |
| Neon DB | 0.5GB | $19/mo |
| LLM API | - | ~$5-20 (ขึ้นกับ usage) |
| Twelve Data | 800 req/day | $18/mo |
| **รวม** | **~$0-5** (ถ้าใช้ free tier) | **~$50-80** |

---

## 🔒 Security

- 🔑 API keys เก็บใน DB (encrypted with AES-256)
- 🌐 HTTPS only
- 🚫 Rate limiting (API routes)
- 🛡️ Input validation (Zod schemas)
- 🚫 ไม่ expose API keys ไป client (เก็บ server-side only)
- 🔒 CORS configured
- 📝 Audit log สำหรับ cron runs

---

## 🚀 Iterative Roadmap (8 สัปดาห์)

### 📦 **Phase 1 - MVP (Week 1-2)** 🎯
- [x] Design approval
- [ ] Next.js + Tailwind + shadcn setup
- [ ] DB schema (Prisma + SQLite)
- [ ] Chart (lightweight-charts)
- [ ] Settings page (API keys)
- [ ] Manual signal generation
- [ ] Signals list page
- [ ] i18n setup (ไทย/EN)

### 📦 **Phase 2 - Automation (Week 3-4)** ⏰
- [ ] Vercel Cron setup
- [ ] LLM integration (BYOK)
- [ ] Indicators calculation
- [ ] Auto-save signals
- [ ] Basic UI for signals

### 📦 **Phase 3 - Expert Analysis (Week 5-6)** 🧠
- [ ] SMC detection (Order Block, FVG, Liquidity)
- [ ] Wyckoff analysis (Phase detection)
- [ ] Multi-TF confluence
- [ ] Confluence score system
- [ ] Enhanced LLM prompts

### 📦 **Phase 4 - Polish (Week 7-8)** ✨
- [ ] News + Economic Calendar
- [ ] Trading Journal
- [ ] Browser notifications
- [ ] Analytics dashboard
- [ ] Performance optimization
- [ ] E2E tests

---

## 📊 Success Metrics

| Metric | Target |
|--------|--------|
| ⚡ Page load | < 2s |
| ⏰ Cron latency | < 30s per run |
| 🤖 Signal generation | < 60s per signal |
| 💰 Monthly cost | < $10 (free tier) |
| 🎯 Win rate | > 55% (ตามทฤษฎี SMC) |
| 📊 Signals/day | 5-15 (ขึ้นกับตลาด) |

---

## 🔮 Future Enhancements (YAGNI - ไม่ทำตอนนี้)

- 📱 Mobile app
- 🔗 Auto-trading (broker API)
- 🪙 Crypto/Forex อื่น
- 👥 Multi-user + Auth
- 📊 ML model trained on signals history
- 🤝 Social trading (share signals)
- 💬 Community chat

---

## 📝 Open Questions (None - ตอบครบแล้ว)

---

## ✅ Approval

- [x] พี่เกมส์ (Games) - Approved on 2026-07-06
- [x] เวนดีีี้ (Wendy) - Documented on 2026-07-06
