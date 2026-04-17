import type { MarketData, SentimentAnalysis, TradeAction, TradeExecution } from "./types.js";

const EDGE = 0.2;

export interface ExecuteTradeInput {
  sentiment: SentimentAnalysis;
  market: MarketData;
  /** Model-proposed values; execution layer may override to keep rules deterministic */
  proposedAction: TradeAction;
  proposedSize: number;
  reasoning: string;
}

export interface ExecuteTradeResult {
  execution: TradeExecution;
  edge: number;
  overridden: boolean;
}

/**
 * Tool 3: execute_trade — simulated fill + deterministic edge check.
 */
export function executeTradeSimulated(input: ExecuteTradeInput): ExecuteTradeResult {
  const { sentiment, market, reasoning } = input;
  const confidence = clamp01(sentiment.confidence);
  const yesPrice = clamp01(market.yesPrice);
  const edge = confidence - yesPrice;

  let action: TradeAction = "DO_NOTHING";
  if (edge > EDGE) action = "BUY_YES";
  else if (edge < -EDGE) action = "BUY_NO";

  const size = action === "DO_NOTHING" ? 0 : Math.round(confidence * 100);
  const overridden = input.proposedAction !== action || input.proposedSize !== size;

  const execution: TradeExecution = {
    action,
    size,
    market,
    reasoning,
  };

  console.log("[execute_trade] Simulated execution");
  console.log(`  action : ${action}`);
  console.log(`  size   : ${size}`);
  console.log(`  market : ${market.question} (YES @ ${market.yesPrice})`);

  return { execution, edge, overridden };
}

function clamp01(x: number): number {
  if (Number.isNaN(x)) return 0;
  return Math.min(1, Math.max(0, x));
}
