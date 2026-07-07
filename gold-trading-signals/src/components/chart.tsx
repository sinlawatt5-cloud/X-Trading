'use client';

import { useEffect, useRef } from 'react';
import { createChart, CandlestickSeries, HistogramSeries, type IChartApi, type ISeriesApi } from 'lightweight-charts';
import type { UTCTimestamp } from 'lightweight-charts';
import { useTheme } from 'next-themes';
import { useGoldPrice } from '@/hooks/use-gold-price';

interface ChartProps {
  className?: string;
}

export function Chart({ className = '' }: ChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candlestickSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<'Histogram'> | null>(null);
  const { theme } = useTheme();
  const { candles, loading, error } = useGoldPrice();

  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { color: 'transparent' },
        textColor: theme === 'dark' ? '#F0E8DA' : '#2A2A3E',
        fontFamily: 'var(--font-data)',
      },
      grid: {
        vertLines: {
          color: theme === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
        },
        horzLines: {
          color: theme === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
        },
      },
      crosshair: {
        vertLine: {
          color: theme === 'dark' ? '#F0C75E' : '#D4A843',
          width: 1,
          style: 2,
          labelBackgroundColor: theme === 'dark' ? '#F0C75E' : '#D4A843',
        },
        horzLine: {
          color: theme === 'dark' ? '#F0C75E' : '#D4A843',
          width: 1,
          style: 2,
          labelBackgroundColor: theme === 'dark' ? '#F0C75E' : '#D4A843',
        },
      },
      rightPriceScale: {
        borderColor: theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
      },
      timeScale: {
        borderColor: theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
        timeVisible: true,
        secondsVisible: false,
      },
    });

    const candlestickSeries = chart.addSeries(CandlestickSeries, {
      upColor: theme === 'dark' ? '#4CAF50' : '#2E7D32',
      downColor: theme === 'dark' ? '#FF6B6B' : '#D32F2F',
      borderUpColor: theme === 'dark' ? '#4CAF50' : '#2E7D32',
      borderDownColor: theme === 'dark' ? '#FF6B6B' : '#D32F2F',
      wickUpColor: theme === 'dark' ? '#4CAF50' : '#2E7D32',
      wickDownColor: theme === 'dark' ? '#FF6B6B' : '#D32F2F',
    });

    const volumeSeries = chart.addSeries(HistogramSeries, {
      priceFormat: { type: 'volume' },
      priceScaleId: 'volume',
    });

    volumeSeries.priceScale().applyOptions({
      scaleMargins: {
        top: 0.8,
        bottom: 0,
      },
    });

    chartRef.current = chart;
    candlestickSeriesRef.current = candlestickSeries;
    volumeSeriesRef.current = volumeSeries;

    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({
          width: chartContainerRef.current.clientWidth,
          height: chartContainerRef.current.clientHeight,
        });
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, [theme]);

  useEffect(() => {
    if (!candlestickSeriesRef.current || !volumeSeriesRef.current) return;
    if (!candles.length) return;

    const toChartTime = (time: number | string): UTCTimestamp => {
      if (typeof time === 'number') return time as UTCTimestamp;
      if (typeof time === 'string') {
        if (time.includes('T')) return (new Date(time).getTime() / 1000) as UTCTimestamp;
        return (new Date(time).getTime() / 1000) as UTCTimestamp;
      }
      return Math.floor(Date.now() / 1000) as UTCTimestamp;
    };

    const candleData = candles.map((candle) => ({
      time: toChartTime(candle.time),
      open: candle.open,
      high: candle.high,
      low: candle.low,
      close: candle.close,
    }));

    const volumeData = candles.map((candle) => ({
      time: toChartTime(candle.time),
      value: candle.volume,
      color: candle.close >= candle.open
        ? (theme === 'dark' ? 'rgba(76, 175, 80, 0.5)' : 'rgba(46, 125, 50, 0.5)')
        : (theme === 'dark' ? 'rgba(255, 107, 107, 0.5)' : 'rgba(211, 47, 47, 0.5)'),
    }));

    candlestickSeriesRef.current.setData(candleData);
    volumeSeriesRef.current.setData(volumeData);

    if (chartRef.current) {
      chartRef.current.timeScale().fitContent();
    }
  }, [candles, theme]);

  if (error) {
    return (
      <div className={`clay-card p-6 ${className}`}>
        <div className="flex h-64 items-center justify-center">
          <p className="font-handwritten text-muted-foreground">
            Error loading chart data
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`clay-card overflow-hidden ${className}`}>
      <div className="border-b border-border p-4">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-lg font-bold text-cream-dark dark:text-cream">
            XAUUSD Price Chart
          </h3>
          {loading && (
            <span className="font-handwritten text-sm text-muted-foreground">
              Updating...
            </span>
          )}
        </div>
      </div>
      <div className="relative">
        <div
          ref={chartContainerRef}
          className="h-[400px] w-full"
        />
        {loading && !candles.length && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/50">
            <div className="text-center">
              <div className="mb-2 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
              <p className="font-handwritten text-sm text-muted-foreground">
                Loading chart data...
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}