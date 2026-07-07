'use client';

import { useCallback, useEffect } from 'react';
import useSWR from 'swr';

interface Candle {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface PriceResponse {
  data: Candle[];
  source: string;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function useGoldPrice(interval: string = '15m', customRefreshInterval?: number) {
  const refreshInterval = customRefreshInterval ?? (
    interval === '1m' ? 10000 : 
    interval === '5m' ? 60000 : 
    interval === '15m' ? 60000 * 5 : 
    60000 * 15 
  );

  const dedupingInterval = interval === '1m' ? 5000 : 30000;

  const { data, error, isLoading, mutate } = useSWR<PriceResponse>(
    `/api/prices?interval=${interval}`,
    fetcher,
    {
      refreshInterval,
      revalidateOnFocus: true,
      dedupingInterval,
    }
  );

  const refetch = useCallback(() => {
    return mutate();
  }, [mutate]);

  useEffect(() => {
    const handleRefresh = () => {
      mutate();
    };

    window.addEventListener('gold-price:refresh', handleRefresh);
    return () => window.removeEventListener('gold-price:refresh', handleRefresh);
  }, [mutate]);

  return {
    candles: data?.data ?? [],
    source: data?.source ?? 'unknown',
    loading: isLoading,
    error: error ? error.message : null,
    refetch,
  };
}
