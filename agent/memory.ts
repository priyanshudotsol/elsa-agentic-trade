import type { TradeExecution } from "../tools/types.js";

/**
 * Bonus: tiny in-process memory of the last simulated trade (hackathon demo).
 */
let lastTrade: TradeExecution | null = null;

export function getLastTrade(): TradeExecution | null {
  return lastTrade;
}

export function setLastTrade(t: TradeExecution | null): void {
  lastTrade = t;
}
