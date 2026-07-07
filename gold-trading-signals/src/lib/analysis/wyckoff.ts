import type { Candle, WyckoffResult } from './types';
import { average, clamp, range, slope } from './utils';

export function detectWyckoff(candles: Candle[]): WyckoffResult {
  if (candles.length < 10) {
    return {
      phase: 'UNKNOWN',
      spring: false,
      upthrust: false,
      volumeConfirmation: false,
      score: 35,
    };
  }

  const recent = candles.slice(-Math.min(candles.length, 24));
  const closes = recent.map((candle) => candle.close);
  const volumes = recent.map((candle) => candle.volume);
  const highs = recent.map((candle) => candle.high);
  const lows = recent.map((candle) => candle.low);
  const avgVolume = average(volumes);
  const closeSlope = slope(closes);
  const priceRange = range(closes);
  const avgRange = average(recent.map((candle) => candle.high - candle.low));

  const support = Math.min(...lows.slice(-8));
  const resistance = Math.max(...highs.slice(-8));
  const last = recent.at(-1)!;
  const prev = recent.at(-2)!;

  const spring = prev.low < support && last.close > support && last.close > prev.close;
  const upthrust = prev.high > resistance && last.close < resistance && last.close < prev.close;

  const bullishVolume = recent.filter((candle) => candle.close > candle.open && candle.volume > avgVolume).length;
  const bearishVolume = recent.filter((candle) => candle.close < candle.open && candle.volume > avgVolume).length;
  const volumeConfirmation = bullishVolume > bearishVolume;

  let phase: WyckoffResult['phase'] = 'UNKNOWN';

  if (closeSlope > 0.15 && volumeConfirmation) {
    phase = 'MARKUP';
  } else if (closeSlope < -0.15 && bearishVolume >= bullishVolume) {
    phase = 'MARKDOWN';
  } else if (spring || (closeSlope >= -0.1 && closeSlope <= 0.1 && priceRange < avgRange * 1.2)) {
    phase = 'ACCUMULATION';
  } else if (upthrust || (closeSlope > 0.1 && bearishVolume > bullishVolume)) {
    phase = 'DISTRIBUTION';
  }

  let score = 40;
  if (spring) score += 20;
  if (upthrust) score += 15;
  if (volumeConfirmation) score += 15;
  if (phase === 'MARKUP' || phase === 'MARKDOWN') score += 10;
  if (priceRange < avgRange * 1.1) score += 5;
  if (Math.abs(closeSlope) > 0.2) score += 5;

  return {
    phase,
    spring,
    upthrust,
    volumeConfirmation,
    score: clamp(score, 0, 100),
  };
}
