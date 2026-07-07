'use client';

import { useEffect, useRef } from 'react';

export function useAutoRefresh(
  callback: () => void,
  intervalMs: number,
  enabled: boolean = true
) {
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    if (!enabled || intervalMs <= 0) {
      return;
    }

    const trigger = () => {
      callbackRef.current();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        trigger();
      }
    };

    const intervalId = window.setInterval(trigger, intervalMs);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [enabled, intervalMs]);
}
