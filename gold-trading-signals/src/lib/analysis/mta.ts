import type { Candle, MTAResult, TimeframeAnalysis } from './types';
import { average, clamp, movingAverage, resampleCandles, slope, strengthFromAlignment, toTrendLabel } from './utils';

function analyzeTimeframe(candles: Candle[]): TimeframeAnalysis {
  if (candles.length < 3) {
    return {
      trend: 'SIDEWAYS',
      alignment: 'NEUTRAL',
      strength: 0,
    };
  }

  const closes = candles.map((candle) => candle.close);
  const lastClose = closes.at(-1)!;
  const ema = movingAverage(closes, Math.min(8, Math.max(3, Math.floor(closes.length / 3))));
  const avgClose = average(closes);
  const slopeValue = slope(closes);
  const trendLabel = toTrendLabel(slopeValue);

  let alignment: TimeframeAnalysis['alignment'] = 'NEUTRAL';
  if (trendLabel === 'UP' && lastClose >= avgClose && lastClose >= ema.at(-1)!) alignment = 'BULLISH';
  if (trendLabel === 'DOWN' && lastClose <= avgClose && lastClose <= ema.at(-1)!) alignment = 'BEARISH';

  const distanceFromAverage = Math.abs(lastClose - avgClose);
  const rawStrength = alignment === 'NEUTRAL'
    ? 30 + Math.max(0, 20 - distanceFromAverage)
    : 60 + Math.min(35, Math.abs(slopeValue) * 100);

  return {
    trend: trendLabel,
    alignment,
    strength: clamp(rawStrength, 0, 100),
  };
}

function majorityAlignment(analyses: TimeframeAnalysis[]) {
  const bullish = analyses.filter((item) => item.alignment === 'BULLISH').length;
  const bearish = analyses.filter((item) => item.alignment === 'BEARISH').length;
  if (bullish > bearish) return 'BULLISH';
  if (bearish > bullish) return 'BEARISH';
  return 'NEUTRAL';
}

export function detectMTA(candles: Candle[]): MTAResult {
  const m15 = analyzeTimeframe(candles);
  const h1 = analyzeTimeframe(resampleCandles(candles, 4));
  const h4 = analyzeTimeframe(resampleCandles(candles, 16));
  const d1 = analyzeTimeframe(resampleCandles(candles, 96));

  const analyses = [m15, h1, h4, d1];
  const dominant = majorityAlignment(analyses);
  const alignedCount = analyses.filter((item) => item.alignment === dominant && dominant !== 'NEUTRAL').length;
  const score = dominant === 'NEUTRAL'
    ? 45
    : strengthFromAlignment(alignedCount, analyses.length);

  return {
    d1,
    h4,
    h1,
    m15,
    score,
  };
}
