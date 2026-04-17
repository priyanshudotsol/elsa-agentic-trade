export type TwitterTweet = {
  text: string;
  author: string;
  createdAt?: string;
};

export type BtcMarketResolution = {
  resolvedSlug: string;
  question: string;
  yesMidPrice: number;
  yesTokenId: string;
  noTokenId: string;
  ok: boolean;
};

export type TradingPipelineResult = {
  topic: string;
  collectionLog: string;
  tweetsBlock: string;
  newsBlock: string;
  resolveLog: string;
  marketContext: string;
  yesPrice: number;
  yesTokenId: string;
  noTokenId: string;
  sentimentJson: string;
  marketJson: string;
  executionLog: string;
  chainLog: string;
};
