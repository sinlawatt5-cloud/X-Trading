# Alpha Gold Signals

แอปสัญญาณเทรดทองคำ XAUUSD สำหรับใช้งานส่วนตัว ใช้ AI ช่วยวิเคราะห์แนวโน้มและสร้างสัญญาณ พร้อมรองรับภาษาไทย/อังกฤษ และธีมแบบ handwritten claymorphism ที่ตั้งใจให้ดูเป็นสมุดจดส่วนตัวมากกว่าหน้าแดชบอร์ดเทรดแบบองค์กร

## สถานะปัจจุบัน

- Phase 1 ปิดครบแล้ว
- Phase 2 ปิดแกนหลักแล้ว
- พร้อมใช้งานในระดับ MVP และต่อยอดไป Phase 3 ได้

## สิ่งที่ระบบทำได้ตอนนี้

- แสดงกราฟราคา XAUUSD แบบ candlestick ด้วย `lightweight-charts`
- ดึงราคาจากผู้ให้บริการตลาด หรือใช้ mock data ถ้าไม่มี API key
- สร้างสัญญาณเทรดด้วย AI ผ่าน `LLM` แบบ BYOK
- เก็บสัญญาณลงฐานข้อมูลด้วย Prisma
- ตั้งค่า provider, language, theme, cron และ confidence ได้ในหน้า Settings
- สลับภาษาไทย/อังกฤษได้ทันที
- สลับ light / dark theme ได้ทันที
- รีเฟรชข้อมูลหน้า Dashboard อัตโนมัติ
- ใช้ Vercel Cron เพื่อรัน `/api/cron/analyze` ทุก 15 นาที
- มีหน้า Signals, News, Journal และ Settings ครบ

## Tech Stack

- Next.js 16 App Router
- TypeScript
- Tailwind CSS 4
- shadcn/ui
- Prisma
- SQLite สำหรับ dev
- `lightweight-charts`
- `next-intl`
- `next-themes`
- SWR
- Vercel Cron

## โครงสร้างโปรเจกต์

```text
gold-trading-signals/
├── src/
│   ├── app/
│   │   ├── api/
│   │   ├── journal/
│   │   ├── news/
│   │   ├── settings/
│   │   └── signals/
│   ├── components/
│   ├── hooks/
│   └── lib/
├── prisma/
├── public/
├── docs/
└── vercel.json
```

## หน้าหลักของระบบ

| หน้า / API | หน้าที่ |
| --- | --- |
| `/` | Dashboard หลัก แสดงกราฟ สัญญาณล่าสุด และตัวสร้างสัญญาณ |
| `/signals` | ประวัติสัญญาณ พร้อมตัวกรองและสรุปสถิติ |
| `/settings` | ตั้งค่า provider, language, theme, cron, confidence |
| `/news` | พื้นที่ข่าวและปฏิทินเศรษฐกิจสำหรับ Phase 4 |
| `/journal` | พื้นที่บันทึกเทรดสำหรับ Phase 4 |
| `/api/prices` | ดึงข้อมูลราคา XAUUSD |
| `/api/analyze` | สร้างสัญญาณใหม่แบบ manual |
| `/api/cron/analyze` | รันการวิเคราะห์อัตโนมัติตาม cron |
| `/api/indicators` | ส่ง snapshot ของ indicator ล่าสุด |
| `/api/settings` | อ่าน/บันทึกการตั้งค่าระบบ |
| `/api/signals` | อ่าน/สร้างสัญญาณ |

## เริ่มใช้งาน

### 1) ติดตั้ง dependency

```bash
npm install
```

### 2) เตรียมไฟล์ environment

โปรเจกต์ใช้ `.env` ที่ root ของ `gold-trading-signals`

```env
DATABASE_URL="file:./dev.db"
CRON_SECRET="change-me-for-cron"
```

ถ้าจะใช้ข้อมูลจริงจากตลาดหรือ LLM ให้ใส่ API key เพิ่มในหน้า Settings หลังรันแอป

### 3) สร้าง Prisma client / migrate

```bash
npx prisma generate
npx prisma migrate dev
```

### 4) รันโปรเจกต์

```bash
npm run dev
```

เปิดเว็บที่

```text
http://localhost:3000
```

## คำสั่งที่ใช้บ่อย

```bash
npm run dev
npm run build
npm run lint
npm run start
```

## Environment Variables

| ตัวแปร | ใช้ทำอะไร |
| --- | --- |
| `DATABASE_URL` | ชี้ไปที่ฐานข้อมูล SQLite หรือฐานข้อมูล production |
| `CRON_SECRET` | ใช้ตรวจสอบความถูกต้องของ cron request |

ถ้าจะเชื่อม API จริงจากหน้า Settings ให้ตั้งค่า provider และ API key ผ่านหน้าเว็บได้เลย ระบบจะเก็บไว้ฝั่งเซิร์ฟเวอร์

## Design Direction

แนวทาง UI ของโปรเจกต์นี้คือ

- handwritten
- claymorphism
- โทนอุ่นแบบสมุดโน้ตส่วนตัว
- ใช้ฟอนต์ `Caveat`, `Patrick Hand`, และ `JetBrains Mono`

สิ่งที่หลีกเลี่ยง

- ฟอนต์ corporate แบบ Inter / Roboto
- ม่วงนีออนหรือกราเดียนท์จัด ๆ
- layout แบบ terminal หนาแน่นเกินไป
- เงาแข็ง ๆ แบบกล่ององค์กร

## Roadmap

### Phase 1

- Scaffold โปรเจกต์
- Prisma + SQLite
- Chart
- Settings
- Manual signal generation
- Signals list
- i18n

### Phase 2

- Vercel Cron
- Indicators API
- Auto-refresh
- LLM / BYOK integration
- Auto-save signal flow

### Phase 3

- SMC
- Wyckoff
- Multi-Timeframe analysis
- Confluence scoring

### Phase 4

- Calendar
- Journal
- Notifications
- Analytics
- E2E tests

## หมายเหตุสำคัญ

- ถ้าไม่มี API key ระบบจะ fallback ไปใช้ mock data เพื่อไม่ให้ UI พัง
- Cron จะทำงานได้จริงเมื่อ deploy บน Vercel และตั้ง `CRON_SECRET` ไว้ถูกต้อง
- โปรเจกต์นี้เป็น single-user และไม่มีระบบ auth
- ส่วนที่เกี่ยวกับ journal / calendar / notifications ยังเป็นพื้นที่สำหรับ Phase 4

## พัฒนาเพิ่มเติม

ถ้าจะต่อจากสถานะปัจจุบัน เส้นทางที่แนะนำคือ

1. เพิ่ม LLM prompt ให้ฉลาดขึ้นและแยก provider ให้ชัด
2. ทำ SMC / Wyckoff / Multi-Timeframe analysis ให้ลึกขึ้น
3. เพิ่ม Journal CRUD
4. เพิ่ม notification และ analytics dashboard
5. เขียน E2E tests ครอบ flow หลัก

## แหล่งอ้างอิง

- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Vercel Cron Jobs](https://vercel.com/docs/cron-jobs)
- [lightweight-charts](https://github.com/tradingview/lightweight-charts)

