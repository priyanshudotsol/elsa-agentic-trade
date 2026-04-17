import type { MarketData } from "./types.js";

/**
 * Tool 2: get_market_data — stubbed Polymarket snapshot for hackathon demo.
 */
export function getMarketData(): MarketData {
  return {
    question: "Will Trump win 2026?",
    yesPrice: 0.42,
  };
}
