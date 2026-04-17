import "dotenv/config";

export const defaultBtcTopic =
  process.env.TWITTER_SEARCH_TOPIC ??
  "BTC OR bitcoin OR $BTC -filter:retweets min_faves:5";

export function getOpenAiKey(): string {
  const k = process.env.OPENAI_API_KEY?.trim();
  if (!k) throw new Error("OPENAI_API_KEY is not set");
  return k;
}

export function getOpenAiModel(): string {
  return process.env.OPENAI_MODEL?.trim() || "gpt-4o-mini";
}

export const twitterApiBase =
  process.env.TWITTERAPI_BASE_URL?.trim() || "https://api.twitterapi.io";

export function getTwitterApiKey(): string | undefined {
  return process.env.TWITTERAPI_IO_KEY?.trim() || process.env.TwitterApi__ApiKey?.trim();
}

export const gammaBaseUrl =
  process.env.POLYMARKET_GAMMA_BASE_URL?.trim() || "https://gamma-api.polymarket.com";

export const clobHost =
  process.env.POLYMARKET_CLOB_HOST?.trim() || "https://clob.polymarket.com";

export const btcEventSlugOverride =
  process.env.POLYMARKET_BTC_UP_DOWN_EVENT_SLUG?.trim() || "";

export function polymarketDryRun(): boolean {
  const v = process.env.POLYMARKET_DRY_RUN?.trim().toLowerCase();
  if (v === "false" || v === "0") return false;
  return true;
}

export function polymarketTradeUsd(): number {
  const n = Number(process.env.POLYMARKET_TRADE_USD);
  return Number.isFinite(n) && n > 0 ? n : 5;
}

export function apiPort(): number {
  const n = Number(process.env.PORT);
  return Number.isFinite(n) && n > 0 ? n : 5000;
}

/** ms between pipeline runs when `npm run dev` loops (default 5 min — helps Twitter free-tier + BTC 5m cadence). */
export function agentLoopIntervalMs(): number {
  const n = Number(process.env.AGENT_LOOP_INTERVAL_MS);
  if (Number.isFinite(n) && n >= 5_000) return n;
  return 300_000;
}
