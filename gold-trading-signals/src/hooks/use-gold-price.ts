'use client';

import { useCallback } from 'react';
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

export function useGoldPrice(refreshInterval = 15 * 60 * 1000) {
  const { data, error, isLoading, mutate } = useSWR<PriceResponse>(
    '/api/prices',
    fetcher,
    {
      refreshInterval,
      revalidateOnFocus: true,
      dedupingInterval: 60000,
    }
  );

  const refetch = useCallback(() => {
    return mutate();
  }, [mutate]);

  return {
    candles: data?.data ?? [],
    source: data?.source ?? 'unknown',
    loading: isLoading,
    error: error ? error.message : null,
    refetch,
  };
}