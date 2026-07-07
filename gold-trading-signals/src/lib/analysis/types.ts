export type Candle = {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

export type OrderBlock = {
  type: 'BULLISH' | 'BEARISH';
  startIndex: number;
  endIndex: number;
  price: number;
  strength: number;
};

export type FVG = {
  type: 'BULLISH' | 'BEARISH';
  index: number;
  gapHigh: number;
  gapLow: number;
  size: number;
};

export type LiquidityZone = {
  type: 'BUY_SIDE' | 'SELL_SIDE';
  price: number;
  index: number;
  swept: boolean;
};

export type MarketStructure = {
  trend: 'BULLISH' | 'BEARISH' | 'RANGING';
  lastHH: number;
  lastHL: number;
  lastLH: number;
  lastLL: number;
  broken: boolean;
};

export type SMCResult = {
  orderBlocks: OrderBlock[];
  fvgs: FVG[];
  liquidityZones: LiquidityZone[];
  structure: MarketStructure;
  score: number;
};

export type WyckoffResult = {
  phase: 'ACCUMULATION' | 'MARKUP' | 'DISTRIBUTION' | 'MARKDOWN' | 'UNKNOWN';
  spring: boolean;
  upthrust: boolean;
  volumeConfirmation: boolean;
  score: number;
};

export type TimeframeAnalysis = {
  trend: string;
  alignment: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  strength: number;
};

export type MTAResult = {
  d1: TimeframeAnalysis;
  h4: TimeframeAnalysis;
  h1: TimeframeAnalysis;
  m15: TimeframeAnalysis;
  score: number;
};

export type ExpertAnalysis = {
  smc: SMCResult;
  wyckoff: WyckoffResult;
  mta: MTAResult;
  indicatorScore: number;
  newsScore: number;
  confluence: number;
  signal: 'BUY' | 'SELL' | 'NEUTRAL';
  entry: number;
  takeProfit: number;
  stopLoss: number;
  confidence: number;
  reasoning: string;
};
