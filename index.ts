import "dotenv/config";

import { runElsaAgent } from "./agent/elsaAgent.js";
import { getLastTrade } from "./agent/memory.js";
import type { Tweet } from "./tools/types.js";

const mockTweets: Tweet[] = [
  { text: "Trump gaining huge support in swing states", author: "user1" },
  { text: "Polls show increasing momentum", author: "user2" },
];

async function main(): Promise<void> {
  console.log("\n=== Elsa-powered Polymarket Trading Agent ===\n");

  const { ctx, finalAssistantText } = await runElsaAgent({ tweets: mockTweets });

  console.log("\n--- Output summary ---\n");

  console.log("[sentiment analysis]");
  if (ctx.sentiment) {
    console.log(JSON.stringify(ctx.sentiment, null, 2));
  } else {
    console.log("(not available — model did not call analyze_sentiment)");
  }

  console.log("\n[market data]");
  if (ctx.market) {
    console.log(JSON.stringify(ctx.market, null, 2));
  } else {
    console.log("(not available — model did not call get_market_data)");
  }

  console.log("\n[decision / execution]");
  if (ctx.lastExecution) {
    const { execution, edge, overridden } = ctx.lastExecution;
    console.log(`edge: ${edge.toFixed(4)}${overridden ? " (runtime aligned action/size to rules)" : ""}`);
    console.log(JSON.stringify(execution, null, 2));
  } else {
    console.log("(no execute_trade yet — check trace logs above)");
  }

  console.log("\n[explanation]");
  console.log(finalAssistantText ?? "(no final assistant text)");

  console.log("\n[memory: last trade]");
  console.log(getLastTrade() ?? "(none)");

  console.log("\n=== Done ===\n");
}

main().catch((e: unknown) => {
  console.error(e);
  process.exit(1);
});
