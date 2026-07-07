import type { Candle, FVG, LiquidityZone, MarketStructure, OrderBlock, SMCResult } from './types';
import { average, bodySize, clamp, isBullish } from './utils';

function detectMarketStructure(candles: Candle[]): MarketStructure {
  if (candles.length < 8) {
    return { trend: 'RANGING', lastHH: 0, lastHL: 0, lastLH: 0, lastLL: 0, broken: false };
  }

  const pivotHighs: Array<{ index: number; value: number }> = [];
  const pivotLows: Array<{ index: number; value: number }> = [];

  for (let index = 2; index < candles.length - 2; index += 1) {
    const candle = candles[index];
    const previous = candles.slice(index - 2, index);
    const next = candles.slice(index + 1, index + 3);
    if (candle.high > Math.max(...previous.map((item) => item.high)) && candle.high > Math.max(...next.map((item) => item.high))) {
      pivotHighs.push({ index, value: candle.high });
    }
    if (candle.low < Math.min(...previous.map((item) => item.low)) && candle.low < Math.min(...next.map((item) => item.low))) {
      pivotLows.push({ index, value: candle.low });
    }
  }

  const lastHH = pivotHighs.at(-1)?.value ?? 0;
  const prevHH = pivotHighs.at(-2)?.value ?? lastHH;
  const lastHL = pivotLows.at(-1)?.value ?? 0;
  const prevHL = pivotLows.at(-2)?.value ?? lastHL;
  const lastLH = pivotHighs.at(-1)?.value ?? 0;
  const prevLH = pivotHighs.at(-2)?.value ?? lastLH;
  const lastLL = pivotLows.at(-1)?.value ?? 0;
  const prevLL = pivotLows.at(-2)?.value ?? lastLL;

  const bullish = lastHH > prevHH && lastHL > prevHL;
  const bearish = lastLH < prevLH && lastLL < prevLL;

  let trend: MarketStructure['trend'] = 'RANGING';
  if (bullish) trend = 'BULLISH';
  else if (bearish) trend = 'BEARISH';

  const lastClose = candles.at(-1)?.close ?? 0;
  const broken = trend === 'BULLISH'
    ? lastClose > lastHH
    : trend === 'BEARISH'
      ? lastClose < lastLL
      : false;

  return { trend, lastHH, lastHL, lastLH, lastLL, broken };
}

function detectOrderBlocks(candles: Candle[]): OrderBlock[] {
  const blocks: OrderBlock[] = [];
  const bodies = candles.map((candle) => bodySize(candle));
  const avgBody = average(bodies) || 1;

  for (let index = 2; index < candles.length; index += 1) {
    const prev = candles[index - 1];
    const curr = candles[index];
    const prev2 = candles[index - 2];
    const bullishDisplacement = !isBullish(prev) && isBullish(curr) && curr.close > prev.high;
    const bearishDisplacement = isBullish(prev) && !isBullish(curr) && curr.close < prev.low;

    if (bullishDisplacement) {
      const sweep = prev.low < Math.min(...candles.slice(Math.max(0, index - 5), index).map((item) => item.low));
      const strength = clamp(((bodySize(curr) / avgBody) * 30) + (sweep ? 35 : 15), 10, 100);
      blocks.push({
        type: 'BULLISH',
        startIndex: index - 1,
        endIndex: index,
        price: prev.high,
        strength,
      });
    }

    if (bearishDisplacement) {
      const sweep = prev.high > Math.max(...candles.slice(Math.max(0, index - 5), index).map((item) => item.high));
      const strength = clamp(((bodySize(curr) / avgBody) * 30) + (sweep ? 35 : 15), 10, 100);
      blocks.push({
        type: 'BEARISH',
        startIndex: index - 1,
        endIndex: index,
        price: prev.low,
        strength,
      });
    }

    if (prev2 && bodySize(prev2) > avgBody * 1.2 && !isBullish(prev2) && bullishDisplacement) {
      blocks.push({
        type: 'BULLISH',
        startIndex: index - 2,
        endIndex: index,
        price: prev2.high,
        strength: 70,
      });
    }
  }

  return blocks.slice(-8);
}

function detectFVG(candles: Candle[]): FVG[] {
  const gaps: FVG[] = [];

  for (let index = 2; index < candles.length; index += 1) {
    const first = candles[index - 2];
    const third = candles[index];

    if (first.high < third.low) {
      gaps.push({
        type: 'BULLISH',
        index,
        gapHigh: third.low,
        gapLow: first.high,
        size: third.low - first.high,
      });
    }

    if (first.low > third.high) {
      gaps.push({
        type: 'BEARISH',
        index,
        gapHigh: first.low,
        gapLow: third.high,
        size: first.low - third.high,
      });
    }
  }

  return gaps.slice(-8);
}

function detectLiquidityZones(candles: Candle[], structure: MarketStructure): LiquidityZone[] {
  const zones: LiquidityZone[] = [];
  const tolerance = 0.35;

  for (let index = 3; index < candles.length; index += 1) {
    const window = candles.slice(Math.max(0, index - 6), index);
    const highs = window.map((candle) => candle.high);
    const lows = window.map((candle) => candle.low);

    const highMatches = highs.filter((value) => Math.abs(value - candles[index - 1].high) <= tolerance);
    const lowMatches = lows.filter((value) => Math.abs(value - candles[index - 1].low) <= tolerance);

    if (highMatches.length >= 2) {
      const swept = candles[index].high > candles[index - 1].high && candles[index].close < candles[index - 1].high;
      zones.push({
        type: 'BUY_SIDE',
        price: candles[index - 1].high,
        index,
        swept,
      });
    }

    if (lowMatches.length >= 2) {
      const swept = candles[index].low < candles[index - 1].low && candles[index].close > candles[index - 1].low;
      zones.push({
        type: 'SELL_SIDE',
        price: candles[index - 1].low,
        index,
        swept,
      });
    }
  }

  if (structure.trend === 'BULLISH' && candles.length >= 2) {
    zones.push({
      type: 'BUY_SIDE',
      price: candles.at(-2)?.high ?? candles.at(-1)?.high ?? 0,
      index: candles.length - 1,
      swept: structure.broken,
    });
  }

  return zones.slice(-8);
}

export function detectSMC(candles: Candle[]): SMCResult {
  const structure = detectMarketStructure(candles);
  const orderBlocks = detectOrderBlocks(candles);
  const fvgs = detectFVG(candles);
  const liquidityZones = detectLiquidityZones(candles, structure);

  const lastClose = candles.at(-1)?.close ?? 0;
  let score = 40;

  const alignedBlocks = orderBlocks.filter((block) => Math.abs(block.price - lastClose) < 12);
  score += alignedBlocks.length * 10;

  const unfilledFvg = fvgs.filter((fvg) => {
    const path = candles.slice(fvg.index);
    return fvg.type === 'BULLISH'
      ? path.every((candle) => candle.low > fvg.gapLow)
      : path.every((candle) => candle.high < fvg.gapHigh);
  });
  score += unfilledFvg.length * 8;

  const sweptLiquidity = liquidityZones.filter((zone) => zone.swept).length;
  score += sweptLiquidity * 5;

  if (structure.broken) score += 12;
  if (structure.trend !== 'RANGING') score += 8;
  if (alignedBlocks.some((block) => block.strength > 75)) score += 10;

  return {
    orderBlocks,
    fvgs,
    liquidityZones,
    structure,
    score: clamp(score, 0, 100),
  };
}
