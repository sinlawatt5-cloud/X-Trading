export type Locale = 'en' | 'th';

export const locales: Locale[] = ['en', 'th'];

export const defaultLocale: Locale = 'en';

const translations = {
  en: {
    // App
    'app.name': 'Alpha Gold Signals',
    'app.description': 'AI-powered gold trading signals',

    // Navigation
    'nav.dashboard': 'Dashboard',
    'nav.signals': 'Signals',
    'nav.news': 'News',
    'nav.journal': 'Journal',
    'nav.settings': 'Settings',

    // Signal Types
    'signal.buy': 'BUY',
    'signal.sell': 'SELL',
    'signal.active': 'Active',
    'signal.closed': 'Closed',
    'signal.cancelled': 'Cancelled',
    'signal.entry': 'Entry',
    'signal.takeProfit': 'Take Profit',
    'signal.stopLoss': 'Stop Loss',
    'signal.confidence': 'Confidence',
    'signal.timeframe': 'Timeframe',
    'signal.analysis': 'Analysis',
    'signal.confluence': 'Confluence',
    'signal.created': 'Created',
    'signal.noSignals': 'No signals yet',

    // Settings
    'settings.title': 'Settings',
    'settings.language': 'Language',
    'settings.theme': 'Theme',
    'settings.themeLight': 'Light',
    'settings.themeDark': 'Dark',
    'settings.llmProvider': 'LLM Provider',
    'settings.llmApiKey': 'LLM API Key',
    'settings.marketDataProvider': 'Market Data Provider',
    'settings.marketDataApiKey': 'Market Data API Key',
    'settings.cronEnabled': 'Auto Analysis',
    'settings.cronInterval': 'Analysis Interval (min)',
    'settings.minConfidence': 'Min Confidence',
    'settings.save': 'Save',
    'settings.saved': 'Saved!',
    'settings.languageDescription': 'Choose your preferred language',
    'settings.themeDescription': 'Switch between light and dark mode',

    // Chart
    'chart.price': 'Price',
    'chart.volume': 'Volume',
    'chart.open': 'Open',
    'chart.high': 'High',
    'chart.low': 'Low',
    'chart.close': 'Close',

    // Timeframes
    'tf.15m': '15 Minutes',
    'tf.1h': '1 Hour',
    'tf.4h': '4 Hours',
    'tf.1d': '1 Day',
    'tf.1w': '1 Week',

    // Journal
    'journal.title': 'Trading Journal',
    'journal.newEntry': 'New Entry',
    'journal.date': 'Date',
    'journal.symbol': 'Symbol',
    'journal.direction': 'Direction',
    'journal.entry': 'Entry',
    'journal.exit': 'Exit',
    'journal.pnl': 'P/L',
    'journal.notes': 'Notes',
    'journal.noEntries': 'No journal entries yet',

    // News
    'news.title': 'Market News',
    'news.noNews': 'No news available',

    // Common
    'common.loading': 'Loading...',
    'common.error': 'Error',
    'common.retry': 'Retry',
    'common.cancel': 'Cancel',
    'common.confirm': 'Confirm',
    'common.delete': 'Delete',
    'common.edit': 'Edit',
    'common.add': 'Add',
    'common.search': 'Search...',
    'common.noData': 'No data available',
    'common.success': 'Success',
    'common.pips': 'pips',
  },
  th: {
    // App
    'app.name': 'Alpha Gold Signals',
    'app.description': 'สัญญาณเทรดทองคำ AI',

    // Navigation
    'nav.dashboard': 'แดชบอร์ด',
    'nav.signals': 'สัญญาณ',
    'nav.news': 'ข่าว',
    'nav.journal': 'บันทึกเทรด',
    'nav.settings': 'ตั้งค่า',

    // Signal Types
    'signal.buy': 'ซื้อ',
    'signal.sell': 'ขาย',
    'signal.active': 'ใช้งาน',
    'signal.closed': 'ปิดแล้ว',
    'signal.cancelled': 'ยกเลิก',
    'signal.entry': 'ราคาเข้า',
    'signal.takeProfit': 'กำไรเป้าหมาย',
    'signal.stopLoss': 'ขาดทุนจำกัด',
    'signal.confidence': 'ความมั่นใจ',
    'signal.timeframe': 'กรอบเวลา',
    'signal.analysis': 'การวิเคราะห์',
    'signal.confluence': 'ปัจจัยสนับสนุน',
    'signal.created': 'สร้างเมื่อ',
    'signal.noSignals': 'ยังไม่มีสัญญาณ',

    // Settings
    'settings.title': 'ตั้งค่า',
    'settings.language': 'ภาษา',
    'settings.theme': 'ธีม',
    'settings.themeLight': 'สว่าง',
    'settings.themeDark': 'มืด',
    'settings.llmProvider': 'ผู้ให้บริการ LLM',
    'settings.llmApiKey': 'คีย์ API LLM',
    'settings.marketDataProvider': 'ผู้ให้บริการข้อมูลตลาด',
    'settings.marketDataApiKey': 'คีย์ API ข้อมูลตลาด',
    'settings.cronEnabled': 'วิเคราะห์อัตโนมัติ',
    'settings.cronInterval': 'ช่วงวิเคราะห์ (นาที)',
    'settings.minConfidence': 'ความมั่นใจขั้นต่ำ',
    'settings.save': 'บันทึก',
    'settings.saved': 'บันทึกแล้ว!',
    'settings.languageDescription': 'เลือกภาษาที่ต้องการ',
    'settings.themeDescription': 'สลับระหว่างโหมดสว่างและมืด',

    // Chart
    'chart.price': 'ราคา',
    'chart.volume': 'ปริมาณ',
    'chart.open': 'เปิด',
    'chart.high': 'สูงสุด',
    'chart.low': 'ต่ำสุด',
    'chart.close': 'ปิด',

    // Timeframes
    'tf.15m': '15 นาที',
    'tf.1h': '1 ชั่วโมง',
    'tf.4h': '4 ชั่วโมง',
    'tf.1d': '1 วัน',
    'tf.1w': '1 สัปดาห์',

    // Journal
    'journal.title': 'บันทึกเทรด',
    'journal.newEntry': 'รายการใหม่',
    'journal.date': 'วันที่',
    'journal.symbol': 'สัญลักษณ์',
    'journal.direction': 'ทิศทาง',
    'journal.entry': 'ราคาเข้า',
    'journal.exit': 'ราคาออก',
    'journal.pnl': 'กำไร/ขาดทุน',
    'journal.notes': 'หมายเหตุ',
    'journal.noEntries': 'ยังไม่มีบันทึก',

    // News
    'news.title': 'ข่าวตลาด',
    'news.noNews': 'ยังไม่มีข่าว',

    // Common
    'common.loading': 'กำลังโหลด...',
    'common.error': 'เกิดข้อผิดพลาด',
    'common.retry': 'ลองใหม่',
    'common.cancel': 'ยกเลิก',
    'common.confirm': 'ยืนยัน',
    'common.delete': 'ลบ',
    'common.edit': 'แก้ไข',
    'common.add': 'เพิ่ม',
    'common.search': 'ค้นหา...',
    'common.noData': 'ไม่มีข้อมูล',
    'common.success': 'สำเร็จ',
    'common.pips': 'พิป',
  },
} as const;

export type TranslationKey = keyof (typeof translations)['en'];

export function t(key: TranslationKey, locale: Locale = 'en'): string {
  return translations[locale]?.[key] ?? translations['en'][key] ?? key;
}

export function getTranslations(locale: Locale) {
  return translations[locale] ?? translations['en'];
}
