import "dotenv/config";
import cors from "cors";
import express from "express";
import { apiPort, defaultBtcTopic } from "./config.js";
import { getLastExecutionLog } from "./pipelineMemory.js";
import { runTradingPipeline } from "./tradingPipeline.js";

const app = express();
app.use(cors({ origin: true }));
app.use(express.json({ limit: "1mb" }));

app.get("/health", (_req, res) => {
  res.json({ ok: true, service: "elsa-polymarket-agent-ts" });
});

app.post("/api/trading/run", async (req, res) => {
  try {
    const topic =
      typeof req.body?.topic === "string" && req.body.topic.trim()
        ? req.body.topic.trim()
        : defaultBtcTopic;
    const result = await runTradingPipeline(topic);
    res.json({
      workflowStatus: "Finished",
      topic: result.topic,
      lastExecutionLog: getLastExecutionLog(),
      chainLog: result.chainLog,
      summary: {
        resolveLog: result.resolveLog,
        yesPrice: result.yesPrice,
        marketJson: result.marketJson,
        executionLog: result.executionLog,
      },
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error(e);
    res.status(500).json({ error: msg });
  }
});

const port = apiPort();
const server = app.listen(port, () => {
  console.log(`API http://localhost:${port} — POST /api/trading/run (TypeScript agent)`);
});

server.on("error", (err: NodeJS.ErrnoException) => {
  if (err.code === "EADDRINUSE") {
    console.error(
      `\nPort ${port} is already in use (another app or an old dev:server).\n` +
        `  Fix: kill it →  lsof -i :${port}   then   kill <PID>\n` +
        `  Or use another port →  PORT=5001 npm run dev:server\n` +
        `  (If the UI proxy breaks, set API_PROXY=http://localhost:5001 when starting Vite.)\n`
    );
    process.exit(1);
  }
  throw err;
});
