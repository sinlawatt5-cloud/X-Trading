'use client';

import { t } from '@/lib/i18n';
import { useLocale } from '@/components/locale-provider';

export default function JournalPage() {
  const { locale } = useLocale();

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <h1 className="font-display mb-8 text-3xl font-bold text-cream-dark dark:text-cream">
        {t('journal.title', locale)}
      </h1>
      <div className="clay-card rounded-2xl p-8">
        <h2 className="font-display mb-4 text-xl font-bold text-honey dark:text-bright-gold">
          {locale === 'th' ? '📓 รายการเทรดของฉัน' : '📓 My Trades'}
        </h2>
        <p className="font-body text-cream-dark/70 dark:text-cream/70">
          จะเพิ่มใน Phase 4 - บันทึกและวิเคราะห์การเทรดของคุณ
        </p>
      </div>
    </div>
  );
}
