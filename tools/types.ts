export type Sentiment = "bullish" | "bearish" | "neutral";

export interface Tweet {
  text: string;
  author: string;
}

export interface SentimentAnalysis {
  sentiment: Sentiment;
  confidence: number;
  reasoning: string;
}

export interface MarketData {
  question: string;
  yesPrice: number;
}

export type TradeAction = "BUY_YES" | "BUY_NO" | "DO_NOTHING";

export interface TradeExecution {
  action: TradeAction;
  size: number;
  market: MarketData;
  reasoning: string;
}
