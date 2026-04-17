import "dotenv/config";

import { agentLoopIntervalMs, defaultBtcTopic } from "./agent/config.js";
import { runTradingPipeline } from "./agent/tradingPipeline.js";
import { getLastExecutionLog } from "./agent/pipelineMemory.js";

function parseArgs(): { topic: string; runOnce: boolean } {
  const raw = process.argv.slice(2).filter((a) => a !== "--");
  const runOnce =
    raw.includes("--once") ||
    process.env.RUN_ONCE?.trim() === "1" ||
    process.env.RUN_ONCE?.trim()?.toLowerCase() === "true";
  const topicArg = raw.find((a) => !a.startsWith("--"));
  return { topic: (topicArg ?? defaultBtcTopic).trim(), runOnce };
}

/**
 * CLI: runs the pipeline on a loop (stays open) or once with `--once`.
 * HTTP API: `npm run dev:server`
 */
async function main(): Promise<void> {
  const { topic, runOnce } = parseArgs();
  const intervalMs = agentLoopIntervalMs();

  console.log("\n=== Polymarket trading agent (TypeScript) ===\n");
  console.log(`Topic: ${topic}`);
  if (runOnce) {
    console.log("Mode: single run (--once)\n");
  } else {
    console.log(
      `Mode: loop every ${intervalMs / 1000}s (AGENT_LOOP_INTERVAL_MS). Ctrl+C to stop.\n`
    );
  }

  let iteration = 0;

  const runOne = async (): Promise<void> => {
    iteration += 1;
    console.log(`\n──────── Run #${iteration} · ${new Date().toISOString()} ────────\n`);
    await runTradingPipeline(topic);
    console.log("\n[last execution log]", getLastExecutionLog() ?? "(none)");
    console.log("\n─── cycle finished ───\n");
  };

  process.on("SIGINT", () => {
    console.log("\n[agent] stopped (SIGINT)");
    process.exit(0);
  });
  process.on("SIGTERM", () => {
    console.log("\n[agent] stopped (SIGTERM)");
    process.exit(0);
  });

  if (runOnce) {
    await runOne();
    console.log("=== Done ===\n");
    return;
  }

  for (;;) {
    try {
      await runOne();
    } catch (e: unknown) {
      console.error("[agent] run failed:", e);
    }
    console.log(
      `Sleeping ${intervalMs / 1000}s until next run… (change AGENT_LOOP_INTERVAL_MS or use --once)\n`
    );
    await new Promise((r) => setTimeout(r, intervalMs));
  }
}

main().catch((e: unknown) => {
  console.error(e);
  process.exit(1);
});
