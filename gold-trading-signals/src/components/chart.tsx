'use client';

import { useEffect, useRef, useState } from 'react';
import { 
  createChart, 
  CandlestickSeries, 
  BarSeries,
  LineSeries,
  AreaSeries,
  BaselineSeries,
  HistogramSeries, 
  type IChartApi, 
  type ISeriesApi 
} from 'lightweight-charts';
import type { UTCTimestamp } from 'lightweight-charts';
import { useTheme } from 'next-themes';
import { useGoldPrice } from '@/hooks/use-gold-price';

interface ChartProps {
  className?: string;
}

const TIMEFRAMES = ['1m', '5m', '15m', '1h', '4h', '1D'];
const CHART_TYPES = ['Candles', 'Heikin Ashi', 'Bars', 'Line', 'Area', 'Baseline'];

export function Chart({ className = '' }: ChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  // We use any here because the series type changes dynamically
  const mainSeriesRef = useRef<any>(null);
  const volumeSeriesRef = useRef<ISeriesApi<'Histogram'> | null>(null);
  
  const { theme } = useTheme();
  const [interval, setInterval] = useState('1m'); // Default to 1m for fast updates
  const [chartType, setChartType] = useState('Candles');
  const { candles, source, loading, error, refetch } = useGoldPrice(interval);
  
  const isFirstDataLoad = useRef(true);
  useEffect(() => {
    isFirstDataLoad.current = true;
  }, [interval, chartType]);

  // Initialize Chart
  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { color: 'transparent' },
        textColor: theme === 'dark' ? '#F0E8DA' : '#2A2A3E',
        fontFamily: 'var(--font-data)',
      },
      grid: {
        vertLines: { color: theme === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)' },
        horzLines: { color: theme === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)' },
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

    let mainSeries;
    const upColor = theme === 'dark' ? '#4CAF50' : '#2E7D32';
    const downColor = theme === 'dark' ? '#FF6B6B' : '#D32F2F';
    const lineColor = theme === 'dark' ? '#F0C75E' : '#D4A843';

    if (chartType === 'Candles' || chartType === 'Heikin Ashi') {
      mainSeries = chart.addSeries(CandlestickSeries, {
        upColor, downColor, borderUpColor: upColor, borderDownColor: downColor, wickUpColor: upColor, wickDownColor: downColor,
      });
    } else if (chartType === 'Bars') {
      mainSeries = chart.addSeries(BarSeries, {
        upColor, downColor,
      });
    } else if (chartType === 'Line') {
      mainSeries = chart.addSeries(LineSeries, {
        color: lineColor, lineWidth: 2,
      });
    } else if (chartType === 'Area') {
      mainSeries = chart.addSeries(AreaSeries, {
        lineColor: lineColor,
        topColor: theme === 'dark' ? 'rgba(240, 199, 94, 0.4)' : 'rgba(212, 168, 67, 0.4)',
        bottomColor: theme === 'dark' ? 'rgba(240, 199, 94, 0.0)' : 'rgba(212, 168, 67, 0.0)',
      });
    } else if (chartType === 'Baseline') {
      mainSeries = chart.addSeries(BaselineSeries, {
        baseValue: { type: 'price', price: candles.length > 0 ? candles[0].close : 2350 },
        topLineColor: upColor,
        topFillColor1: theme === 'dark' ? 'rgba(76, 175, 80, 0.4)' : 'rgba(46, 125, 50, 0.4)',
        topFillColor2: theme === 'dark' ? 'rgba(76, 175, 80, 0.0)' : 'rgba(46, 125, 50, 0.0)',
        bottomLineColor: downColor,
        bottomFillColor1: theme === 'dark' ? 'rgba(255, 107, 107, 0.0)' : 'rgba(211, 47, 47, 0.0)',
        bottomFillColor2: theme === 'dark' ? 'rgba(255, 107, 107, 0.4)' : 'rgba(211, 47, 47, 0.4)',
      });
    }

    const volumeSeries = chart.addSeries(HistogramSeries, {
      priceFormat: { type: 'volume' },
      priceScaleId: 'volume',
    });

    volumeSeries.priceScale().applyOptions({
      scaleMargins: { top: 0.8, bottom: 0 },
    });

    chartRef.current = chart;
    mainSeriesRef.current = mainSeries;
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
  }, [theme, chartType]); // Re-initialize when chartType changes

  // Update Data
  useEffect(() => {
    if (!mainSeriesRef.current || !volumeSeriesRef.current || !candles.length) return;

    const toChartTime = (time: number | string): UTCTimestamp => {
      if (typeof time === 'number') return time as UTCTimestamp;
      if (typeof time === 'string') {
        return (new Date(time).getTime() / 1000) as UTCTimestamp;
      }
      return Math.floor(Date.now() / 1000) as UTCTimestamp;
    };

    let mainData;
    if (chartType === 'Heikin Ashi') {
      const haData = [];
      for (let i = 0; i < candles.length; i++) {
        const c = candles[i];
        const haClose = (c.open + c.high + c.low + c.close) / 4;
        let haOpen;
        if (i === 0) {
          haOpen = (c.open + c.close) / 2;
        } else {
          haOpen = (haData[i - 1].open + haData[i - 1].close) / 2;
        }
        const haHigh = Math.max(c.high, haOpen, haClose);
        const haLow = Math.min(c.low, haOpen, haClose);
        
        haData.push({
          time: toChartTime(c.time),
          open: haOpen,
          high: haHigh,
          low: haLow,
          close: haClose,
        });
      }
      mainData = haData;
    } else if (chartType === 'Candles' || chartType === 'Bars') {
      mainData = candles.map((candle) => ({
        time: toChartTime(candle.time),
        open: candle.open,
        high: candle.high,
        low: candle.low,
        close: candle.close,
      }));
    } else {
      mainData = candles.map((candle) => ({
        time: toChartTime(candle.time),
        value: candle.close,
      }));
    }

    const volumeData = candles.map((candle) => ({
      time: toChartTime(candle.time),
      value: candle.volume,
      color: candle.close >= candle.open
        ? (theme === 'dark' ? 'rgba(76, 175, 80, 0.5)' : 'rgba(46, 125, 50, 0.5)')
        : (theme === 'dark' ? 'rgba(255, 107, 107, 0.5)' : 'rgba(211, 47, 47, 0.5)'),
    }));

    mainSeriesRef.current.setData(mainData);
    volumeSeriesRef.current.setData(volumeData);

    if (chartRef.current && isFirstDataLoad.current) {
      chartRef.current.timeScale().fitContent();
      isFirstDataLoad.current = false;
    }
  }, [candles, chartType, theme]);

  if (error) {
    return (
      <div className={`clay-card p-6 ${className}`}>
        <div className="flex h-64 items-center justify-center">
          <p className="font-handwritten text-muted-foreground">Error loading chart data</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`clay-card flex flex-col overflow-hidden ${className}`}>
      {/* Header & Toolbar */}
      <div className="border-b border-border p-4">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h3 className="font-display text-lg font-bold text-cream-dark dark:text-cream">
              XAUUSD Price Chart
            </h3>
            {source && (
              <span className={`font-handwritten rounded-full px-2.5 py-0.5 text-xs font-bold ${
                source === 'yfinance' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                source === 'mock' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
              }`}>
                {source === 'yfinance' ? 'Yahoo Finance' : source === 'twelvedata' ? 'Twelve Data' : source === 'alphavantage' ? 'Alpha Vantage' : 'Mock Data'}
              </span>
            )}
          </div>
          {loading && (
            <span className="font-handwritten text-sm text-muted-foreground animate-pulse">
              Updating...
            </span>
          )}
          <button 
            onClick={() => refetch()}
            className="rounded-full p-2 hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
            title="Refresh Data"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-cream-dark dark:text-cream">
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
              <path d="M3 3v5h5"/>
            </svg>
          </button>
        </div>
        
        {/* TradingView-like Toolbar */}
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex bg-black/5 dark:bg-white/5 rounded-lg p-1">
            {TIMEFRAMES.map(tf => (
              <button
                key={tf}
                onClick={() => setInterval(tf)}
                className={`px-3 py-1 rounded text-sm font-bold transition-colors ${
                  interval === tf 
                    ? 'bg-cream-dark text-cream dark:bg-cream dark:text-cream-dark' 
                    : 'text-cream-dark/60 hover:bg-black/5 dark:text-cream/60 dark:hover:bg-white/10'
                }`}
              >
                {tf}
              </button>
            ))}
          </div>
          
          <div className="h-6 w-px bg-border hidden sm:block"></div>
          
          <div className="flex bg-black/5 dark:bg-white/5 rounded-lg p-1">
            {CHART_TYPES.map(type => (
              <button
                key={type}
                onClick={() => setChartType(type)}
                className={`px-3 py-1 rounded text-sm font-bold transition-colors ${
                  chartType === type 
                    ? 'bg-cream-dark text-cream dark:bg-cream dark:text-cream-dark' 
                    : 'text-cream-dark/60 hover:bg-black/5 dark:text-cream/60 dark:hover:bg-white/10'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="relative flex-1">
        <div ref={chartContainerRef} className="h-[500px] w-full" />
        {loading && !candles.length && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/50">
            <div className="text-center">
              <div className="mb-2 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
              <p className="font-handwritten text-sm text-muted-foreground">Loading chart data...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}