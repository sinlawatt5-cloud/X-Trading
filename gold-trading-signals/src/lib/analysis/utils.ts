import type { Candle } from './types';

export function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

export function average(values: number[]) {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

export function standardDeviation(values: number[]) {
  if (values.length === 0) return 0;
  const mean = average(values);
  const variance = average(values.map((value) => (value - mean) ** 2));
  return Math.sqrt(variance);
}

export function range(values: number[]) {
  if (values.length === 0) return 0;
  return Math.max(...values) - Math.min(...values);
}

export function isBullish(candle: Candle) {
  return candle.close >= candle.open;
}

export function bodySize(candle: Candle) {
  return Math.abs(candle.close - candle.open);
}

export function candleRange(candle: Candle) {
  return Math.max(0.0001, candle.high - candle.low);
}

export function movingAverage(values: number[], period: number) {
  if (values.length === 0) return [];

  const output: number[] = [];
  for (let index = 0; index < values.length; index += 1) {
    if (index < period - 1) {
      output.push(values[index]);
      continue;
    }

    const slice = values.slice(index - period + 1, index + 1);
    output.push(average(slice));
  }

  return output;
}

export function exponentialMovingAverage(values: number[], period: number) {
  if (values.length === 0) return [];

  const multiplier = 2 / (period + 1);
  const output: number[] = [values[0]];

  for (let index = 1; index < values.length; index += 1) {
    output.push((values[index] - output[index - 1]) * multiplier + output[index - 1]);
  }

  return output;
}

export function resampleCandles(candles: Candle[], size: number) {
  if (candles.length === 0) return [];

  const groups: Candle[][] = [];
  for (let index = 0; index < candles.length; index += size) {
    groups.push(candles.slice(index, index + size));
  }

  return groups
    .filter((group) => group.length > 0)
    .map((group) => ({
      time: group[0].time,
      open: group[0].open,
      high: Math.max(...group.map((item) => item.high)),
      low: Math.min(...group.map((item) => item.low)),
      close: group[group.length - 1].close,
      volume: group.reduce((sum, item) => sum + item.volume, 0),
    }));
}

export function toTrendLabel(slope: number) {
  if (slope > 0.2) return 'UP';
  if (slope < -0.2) return 'DOWN';
  return 'SIDEWAYS';
}

export function slope(values: number[]) {
  if (values.length < 2) return 0;
  return (values[values.length - 1] - values[0]) / Math.max(1, values.length - 1);
}

export function strengthFromAlignment(alignmentCount: number, totalCount: number) {
  if (totalCount <= 0) return 0;
  return clamp((alignmentCount / totalCount) * 100, 0, 100);
}
