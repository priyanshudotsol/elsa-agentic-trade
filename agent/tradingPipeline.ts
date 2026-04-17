import {
  btcEventSlugOverride,
  clobHost,
  defaultBtcTopic,
  gammaBaseUrl,
  getTwitterApiKey,
  twitterApiBase,
} from "./config.js";
import { resolveBtcUpDown5m } from "./btcMarket.js";
import {
  readConfidence,
  readDecision,
  readEdge,
  readSentimentLabel,
} from "./jsonParse.js";
import { mockHeadlines } from "./mockNews.js";
import {
  elsaAnalyzeSentiment,
  elsaDecideTrade,
  elsaExecutionNarrative,
} from "./elsa/index.js";
import { maybeExecutePolymarketTrade } from "./onChain.js";
import { advancedSearchTweets, formatTweetBlock } from "./twitterSearch.js";
import type { TradingPipelineResult } from "./types.js";
import { setLastExecutionLog } from "./pipelineMemory.js";

export async function runTradingPipeline(topic?: string): Promise<TradingPipelineResult> {
  const t = (topic ?? defaultBtcTopic).trim();

  const tweets = await advancedSearchTweets(t, 25, getTwitterApiKey(), twitterApiBase);
  const tweetsBlock = formatTweetBlock(tweets);
  const headlines = mockHeadlines(t);
  const newsBlock = headlines.map((h, i) => `${i + 1}. ${h}`).join("\n");
  const collectionLog = `Fetched ${tweets.length} tweets and ${headlines.length} headlines for topic "${t}".`;

  console.log(`[1-fetch] ${collectionLog}`);

  const btc = await resolveBtcUpDown5m({
    gammaBaseUrl,
    clobHost,
    slugOverride: btcEventSlugOverride,
  });

  const marketContext =
    `Polymarket BTC 5-minute Up/Down window. Event slug: ${btc.resolvedSlug}. Market: ${btc.question || "(unknown)"}. ` +
    `Current YES token midpoint price (0–1): ${btc.yesMidPrice.toFixed(4)}. ` +
    (btc.ok ? "Market data resolved successfully." : "WARNING: Could not resolve a live market — prices are a fallback; consider SKIP.");

  const resolveLog = btc.ok
    ? `Resolved ${btc.resolvedSlug} | YES mid=${btc.yesMidPrice.toFixed(4)}`
    : `FAILED to resolve live BTC 5m market (slug tried: ${btc.resolvedSlug}). Using placeholder context.`;

  console.log(`[2-btc-market] ${resolveLog} | YES mid=${btc.yesMidPrice.toFixed(4)}`);

  const sentimentRaw = await elsaAnalyzeSentiment(tweetsBlock, newsBlock);
  console.log(`[3-elsa-sentiment] ${sentimentRaw}`);

  const sentimentLabel = readSentimentLabel(sentimentRaw);
  const confidence = readConfidence(sentimentRaw);

  /** Elsa = trade yes/no gate (`agent/elsa/decision.ts`). */
  const marketJson = await elsaDecideTrade({
    marketContext,
    sentimentLabel,
    confidence,
  });
  const d = readDecision(marketJson);
  const e = readEdge(marketJson);
  const edgeStr = `${e >= 0 ? "+" : ""}${e.toFixed(3)}`;
  console.log(`[4-elsa-decision] decision=${d} edge=${edgeStr} json=${marketJson}`);

  const decision = readDecision(marketJson);
  const edge = readEdge(marketJson);
  const conf = readConfidence(sentimentRaw);

  const executionLog = await elsaExecutionNarrative(decision, edge, conf);
  console.log(`[5-elsa-execution] ${executionLog}`);
  console.log(`[trace] Position size hint (confidence×100): ${Math.round(conf * 100)}`);

  setLastExecutionLog(executionLog);

  const chainLog = await maybeExecutePolymarketTrade({
    marketJson,
    confidence: conf,
    yesTokenId: btc.yesTokenId,
    noTokenId: btc.noTokenId,
  });
  console.log(`[6-on-chain] ${chainLog}`);

  return {
    topic: t,
    collectionLog,
    tweetsBlock,
    newsBlock,
    resolveLog,
    marketContext,
    yesPrice: btc.yesMidPrice,
    yesTokenId: btc.yesTokenId,
    noTokenId: btc.noTokenId,
    sentimentJson: sentimentRaw,
    marketJson,
    executionLog,
    chainLog,
  };
}
