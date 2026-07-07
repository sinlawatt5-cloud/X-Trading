import type { Candle, ExpertAnalysis, MTAResult, SMCResult, WyckoffResult } from './types';
import { clamp } from './utils';

type AnalysisInputs = {
  smc: SMCResult;
  wyckoff: WyckoffResult;
  mta: MTAResult;
  indicatorScore: number;
  newsScore: number;
  candles: Candle[];
};

function directionFromScores(smc: SMCResult, wyckoff: WyckoffResult, mta: MTAResult) {
  const bullish =
    (smc.structure.trend === 'BULLISH' ? 1 : 0) +
    (wyckoff.phase === 'ACCUMULATION' || wyckoff.phase === 'MARKUP' ? 1 : 0) +
    (mta.h1.alignment === 'BULLISH' ? 1 : 0) +
    (mta.h4.alignment === 'BULLISH' ? 1 : 0) +
    (mta.d1.alignment === 'BULLISH' ? 1 : 0);

  const bearish =
    (smc.structure.trend === 'BEARISH' ? 1 : 0) +
    (wyckoff.phase === 'DISTRIBUTION' || wyckoff.phase === 'MARKDOWN' ? 1 : 0) +
    (mta.h1.alignment === 'BEARISH' ? 1 : 0) +
    (mta.h4.alignment === 'BEARISH' ? 1 : 0) +
    (mta.d1.alignment === 'BEARISH' ? 1 : 0);

  if (bullish > bearish) return 'BUY' as const;
  if (bearish > bullish) return 'SELL' as const;
  return 'NEUTRAL' as const;
}

export function buildExpertAnalysis(inputs: AnalysisInputs): ExpertAnalysis {
  const { smc, wyckoff, mta, indicatorScore, newsScore, candles } = inputs;
  const confluence = clamp(
    smc.score * 0.3 +
      wyckoff.score * 0.2 +
      mta.score * 0.25 +
      indicatorScore * 0.15 +
      newsScore * 0.1,
    0,
    100
  );

  const signal = confluence >= 75 ? directionFromScores(smc, wyckoff, mta) : 'NEUTRAL';
  const lastClose = candles.at(-1)?.close ?? 0;
  const averageRange =
    candles.length > 0
      ? candles.slice(-Math.min(14, candles.length)).reduce((sum, candle) => sum + (candle.high - candle.low), 0) /
        Math.min(14, candles.length)
      : 0;

  const trendBias = signal === 'NEUTRAL' ? directionFromScores(smc, wyckoff, mta) : signal;
  const takeProfit =
    trendBias === 'BUY'
      ? lastClose + Math.max(8, averageRange * 2)
      : trendBias === 'SELL'
        ? lastClose - Math.max(8, averageRange * 2)
        : lastClose;
  const stopLoss =
    trendBias === 'BUY'
      ? lastClose - Math.max(5, averageRange * 1.2)
      : trendBias === 'SELL'
        ? lastClose + Math.max(5, averageRange * 1.2)
        : lastClose;

  const confidence = clamp(
    confluence * 0.65 + smc.score * 0.1 + wyckoff.score * 0.1 + mta.score * 0.1 + indicatorScore * 0.05,
    0,
    100
  );

  const reasoningParts = [
    `SMC ${smc.structure.trend.toLowerCase()} with score ${smc.score.toFixed(0)}`,
    `Wyckoff ${wyckoff.phase.toLowerCase()} score ${wyckoff.score.toFixed(0)}`,
    `MTA ${mta.score.toFixed(0)}% aligned`,
    `Indicators ${indicatorScore.toFixed(0)}%`,
    `News ${newsScore.toFixed(0)}%`,
  ];

  return {
    smc,
    wyckoff,
    mta,
    indicatorScore,
    newsScore,
    confluence,
    signal,
    entry: lastClose,
    takeProfit,
    stopLoss,
    confidence,
    reasoning: reasoningParts.join(' | '),
  };
}
