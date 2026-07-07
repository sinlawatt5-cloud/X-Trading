'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTheme } from 'next-themes';
import { useCallback, useEffect, useState, useSyncExternalStore } from 'react';
import { cn } from '@/lib/utils';
import { t } from '@/lib/i18n';
import { useLocale } from '@/components/locale-provider';
import { requestNotificationPermission, getNotificationPermission } from '@/lib/notifications';

const navItems = ['dashboard', 'signals', 'analytics', 'news', 'journal', 'settings'] as const;

function useMounted() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
}

export function Header() {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const mounted = useMounted();
  const { locale, setLocale } = useLocale();

  const [notifPermission, setNotifPermission] = useState<NotificationPermission | 'unsupported'>('default');

  useEffect(() => {
    setNotifPermission(getNotificationPermission());
  }, []);

  const handleNotificationBell = useCallback(async () => {
    const result = await requestNotificationPermission();
    setNotifPermission(result);
  }, []);

  const notifBellLabel = {
    granted: locale === 'th' ? 'การแจ้งเตือนเปิดใช้งาน' : 'Notifications enabled',
    denied: locale === 'th' ? 'การแจ้งเตือนถูกปฏิเสธ' : 'Notifications denied',
    default: locale === 'th' ? 'เปิดใช้การแจ้งเตือน' : 'Enable notifications',
    unsupported: locale === 'th' ? 'ไม่รองรับ' : 'Not supported',
  } as const;

  const notifBellColor = {
    granted: 'text-gold-dark dark:text-gold-bright',
    denied: 'text-destructive',
    default: 'text-cream-dark dark:text-cream',
    unsupported: 'text-muted-foreground',
  } as const;

  const toggleLocale = () => {
    setLocale(locale === 'en' ? 'th' : 'en');
  };

  return (
    <header className="clay-header sticky top-0 z-50">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2">
          <span className="font-display text-2xl font-bold text-gold-dark dark:text-gold-bright">
            Alpha Gold
          </span>
          <span className="font-display text-2xl font-bold text-cream-dark dark:text-cream">
            Signals
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {navItems.map((item) => {
            const isActive = pathname === `/${item}` || (item === 'dashboard' && pathname === '/');

            return (
              <Link
                key={item}
                href={item === 'dashboard' ? '/' : `/${item}`}
                className={cn(
                  'rounded-xl px-4 py-2 font-body text-sm transition-all',
                  isActive
                    ? 'bg-gold/10 text-gold-dark font-semibold dark:text-gold-bright'
                    : 'text-cream-dark hover:bg-gold/5 dark:text-cream hover:text-gold-dark dark:hover:text-gold-bright'
                )}
              >
                {t(`nav.${item}`, locale)}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          {/* Notification Bell */}
          {mounted && (
            <button
              onClick={handleNotificationBell}
              disabled={notifPermission === 'unsupported'}
              className={cn(
                'clay-btn flex h-10 w-10 items-center justify-center rounded-xl text-lg transition-all',
                notifBellColor[notifPermission]
              )}
              aria-label={notifBellLabel[notifPermission]}
              title={notifBellLabel[notifPermission]}
            >
              {notifPermission === 'granted' ? '🔔' : notifPermission === 'denied' ? '🔕' : '🔔'}
            </button>
          )}

          <button
            onClick={toggleLocale}
            className="clay-btn flex h-10 w-10 items-center justify-center rounded-xl font-body text-sm font-semibold transition-all"
            aria-label="Toggle language"
          >
            {locale === 'en' ? 'TH' : 'EN'}
          </button>

          {mounted && (
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="clay-btn flex h-10 w-10 items-center justify-center rounded-xl text-lg transition-all"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>
          )}

          <button
            className="clay-btn flex h-10 w-10 items-center justify-center rounded-xl text-lg transition-all md:hidden"
            aria-label="Menu"
          >
            ☰
          </button>
        </div>
      </div>
    </header>
  );
}
