import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { polymarketDryRun, polymarketTradeUsd } from "./config.js";
import { readDecision } from "./jsonParse.js";

/**
 * Runs `polymarket/dist/scripts/elsaExecuteTrade.js` (stdin JSON) when not dry-run.
 * Expect `process.cwd()` = repo root when the server/agent runs.
 */
export async function maybeExecutePolymarketTrade(opts: {
  marketJson: string;
  confidence: number;
  yesTokenId: string;
  noTokenId: string;
}): Promise<string> {
  const decision = readDecision(opts.marketJson);
  if (decision !== "BUY_YES" && decision !== "BUY_NO") {
    return "[chain] SKIP — no BUY_YES/BUY_NO from Market agent.";
  }

  if (!opts.yesTokenId || !opts.noTokenId) {
    return "[chain] SKIP — missing outcome token ids (resolve market first).";
  }

  if (polymarketDryRun()) {
    const usd = polymarketTradeUsd();
    return `[chain] DRY_RUN=1 — would ${decision} ~$${usd.toFixed(2)} USDC (confidence=${opts.confidence.toFixed(3)}). Set POLYMARKET_DRY_RUN=false and POLYGON_PRIVATE_KEY to execute.`;
  }

  const scriptPath = path.join(
    process.cwd(),
    "polymarket/dist/scripts/elsaExecuteTrade.js"
  );

  if (!fs.existsSync(scriptPath)) {
    return `[chain] ERROR: script not found: ${scriptPath}. Run pnpm install && pnpm run build in polymarket/.`;
  }

  const payload = JSON.stringify({
    decision,
    usdAmount: polymarketTradeUsd(),
    tokenIdYes: opts.yesTokenId,
    tokenIdNo: opts.noTokenId,
    dryRun: false,
  });

  return await new Promise((resolve, reject) => {
    const proc = spawn("node", [scriptPath], {
      stdio: ["pipe", "pipe", "pipe"],
      env: process.env,
    });

    let stdout = "";
    let stderr = "";
    proc.stdout?.on("data", (chunk: Buffer) => {
      stdout += chunk.toString();
    });
    proc.stderr?.on("data", (chunk: Buffer) => {
      stderr += chunk.toString();
    });
    proc.on("error", reject);
    proc.on("close", (code) => {
      const line =
        code === 0
          ? `[chain] ok exit=${code} ${stdout.trim()}`
          : `[chain] FAIL exit=${code} stderr=${stderr.trim()} stdout=${stdout.trim()}`;
      resolve(line);
    });

    proc.stdin?.write(payload);
    proc.stdin?.end();
  });
}
