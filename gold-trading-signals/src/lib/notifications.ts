'use client';

export type NotificationOptions = {
  body?: string;
  icon?: string;
  badge?: string;
  tag?: string;
  requireInteraction?: boolean;
};

export type SignalPayload = {
  direction: 'BUY' | 'SELL';
  pair: string;
  entry: number;
  confidence: number;
};

/**
 * Request browser notification permission.
 * Returns the resulting permission state.
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    console.warn('[Notifications] Not supported in this environment');
    return 'denied';
  }

  if (Notification.permission === 'granted') {
    return 'granted';
  }

  if (Notification.permission === 'denied') {
    return 'denied';
  }

  const result = await Notification.requestPermission();
  return result;
}

/**
 * Get current notification permission without prompting.
 */
export function getNotificationPermission(): NotificationPermission | 'unsupported' {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }
  return Notification.permission;
}

/**
 * Send a browser notification.
 * Silently fails if permission is not granted.
 */
export function sendNotification(
  title: string,
  body: string,
  options: NotificationOptions = {}
): Notification | null {
  if (typeof window === 'undefined' || !('Notification' in window)) return null;
  if (Notification.permission !== 'granted') return null;

  try {
    const notification = new Notification(title, {
      body,
      icon: options.icon ?? '/favicon.ico',
      badge: options.badge,
      tag: options.tag,
      requireInteraction: options.requireInteraction ?? false,
    });
    return notification;
  } catch (err) {
    console.error('[Notifications] Failed to send:', err);
    return null;
  }
}

/**
 * Notify user about a new trading signal.
 */
export function notifyNewSignal(signal: SignalPayload): Notification | null {
  const emoji = signal.direction === 'BUY' ? '📈' : '📉';
  const title = `${emoji} New ${signal.direction} Signal — ${signal.pair}`;
  const body = `Entry: ${signal.entry.toFixed(2)} | Confidence: ${signal.confidence.toFixed(0)}%`;

  return sendNotification(title, body, {
    tag: `signal-${Date.now()}`,
    requireInteraction: false,
  });
}

/**
 * Notify user about an upcoming high-impact economic event.
 */
export function notifyUpcomingEvent(eventTitle: string, minutesUntil: number): Notification | null {
  const title = `⚠️ Economic Event in ${minutesUntil}m`;
  const body = `${eventTitle} — prepare for volatility on XAUUSD`;

  return sendNotification(title, body, {
    tag: `event-${eventTitle}`,
    requireInteraction: false,
  });
}
