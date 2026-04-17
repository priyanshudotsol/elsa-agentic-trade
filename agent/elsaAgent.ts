import axios from "axios";
import { elsaToolDefinitions } from "../tools/definitions.js";
import { analyzeSentiment } from "../tools/analyzeSentiment.js";
import { getMarketData } from "../tools/getMarketData.js";
import { executeTradeSimulated } from "../tools/executeTrade.js";
import type { MarketData, SentimentAnalysis, TradeAction, Tweet } from "../tools/types.js";
import type { ExecuteTradeResult } from "../tools/executeTrade.js";
import { createTrace, traceLog, type TraceEntry } from "./trace.js";
import { setLastTrade } from "./memory.js";

const OPENAI_URL = "https://api.openai.com/v1/chat/completions";

const SYSTEM_PROMPT = `You are Elsa, the execution and reasoning layer for a Polymarket trading agent.

Objective: Find mismatches between sentiment-derived confidence (treat as estimated P(YES)) and the market's YES price. Only trade when the gap is larger than 0.2.

Rules (deterministic):
- If confidence >> yes price (edge > 0.2) → BUY YES
- If confidence << yes price (edge < -0.2) → BUY NO
- Otherwise → DO_NOTHING

Constraints:
- Call tools in order: analyze_sentiment → get_market_data.
- In your NEXT assistant message, explain reasoning clearly (before any execute_trade).
- Then call execute_trade with reasoning + your best-guess action/size (the tool enforces the rules).
- Do not invent tools. Only use: analyze_sentiment, get_market_data, execute_trade.`;

interface ToolCall {
  id: string;
  type: "function";
  function: { name: string; arguments: string };
}

interface ChatMessage {
  role: "system" | "user" | "assistant" | "tool";
  content: string | null;
  tool_calls?: ToolCall[];
  tool_call_id?: string;
}

interface OpenAIChatResponse {
  choices?: Array<{
    finish_reason?: string;
    message?: {
      role?: string;
      content?: string | null;
      tool_calls?: ToolCall[];
    };
  }>;
}

export interface AgentContext {
  sentiment: SentimentAnalysis | null;
  market: MarketData | null;
  lastExecution: ExecuteTradeResult | null;
}

export interface ElsaRunResult {
  trace: TraceEntry[];
  ctx: AgentContext;
  finalAssistantText: string | null;
}

export async function runElsaAgent(input: { tweets: Tweet[] }): Promise<ElsaRunResult> {
  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_MODEL ?? "gpt-4o-mini";
  if (!apiKey) throw new Error("OPENAI_API_KEY is not set.");

  const ctx: AgentContext = {
    sentiment: null,
    market: null,
    lastExecution: null,
  };

  const trace = createTrace();
  const messages: ChatMessage[] = [
    { role: "system", content: SYSTEM_PROMPT },
    {
      role: "user",
      content: `Run the workflow on these mock tweets:\n${JSON.stringify(input.tweets, null, 2)}`,
    },
  ];

  let finalAssistantText: string | null = null;

  for (let turn = 0; turn < 16; turn++) {
    const { data } = await axios.post<OpenAIChatResponse>(
      OPENAI_URL,
      {
        model,
        temperature: 0.2,
        messages,
        tools: elsaToolDefinitions,
        tool_choice: "auto",
      },
      {
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        timeout: 120_000,
      }
    );

    const choice = data.choices?.[0];
    const msg = choice?.message;
    if (!msg) throw new Error("OpenAI returned no message");

    const toolNames = msg.tool_calls?.map((t) => t.function.name) ?? [];
    traceLog(trace, {
      kind: "assistant",
      content: msg.content ?? null,
      toolCalls: toolNames.length ? toolNames : undefined,
    });

    if (msg.content?.trim()) finalAssistantText = msg.content;

    if (msg.tool_calls?.length) {
      messages.push({
        role: "assistant",
        content: msg.content ?? null,
        tool_calls: msg.tool_calls,
      });

      for (const tc of msg.tool_calls) {
        const name = tc.function.name;
        let args: Record<string, unknown>;
        try {
          args = JSON.parse(tc.function.arguments || "{}") as Record<string, unknown>;
        } catch {
          args = {};
        }

        traceLog(trace, { kind: "tool_call", name, args });

        const result = await dispatch(name, args, ctx);
        traceLog(trace, { kind: "tool_result", name, result });

        messages.push({
          role: "tool",
          tool_call_id: tc.id,
          content: JSON.stringify(result),
        });
      }
      continue;
    }

    break;
  }

  return { trace, ctx, finalAssistantText };
}

async function dispatch(
  name: string,
  args: Record<string, unknown>,
  ctx: AgentContext
): Promise<Record<string, unknown>> {
  if (name === "analyze_sentiment") {
    const tweets = args.tweets as Tweet[] | undefined;
    if (!Array.isArray(tweets) || tweets.length === 0) {
      return { ok: false, error: "tweets[] required" };
    }
    const s = await analyzeSentiment(tweets);
    ctx.sentiment = s;
    return { ok: true, ...s };
  }

  if (name === "get_market_data") {
    const m = getMarketData();
    ctx.market = m;
    return { ok: true, ...m };
  }

  if (name === "execute_trade") {
    if (!ctx.sentiment || !ctx.market) {
      return { ok: false, error: "Call analyze_sentiment and get_market_data first." };
    }
    const reasoning = String(args.reasoning ?? "").trim();
    if (!reasoning) {
      return { ok: false, error: "reasoning is required before execution." };
    }

    const proposedAction = parseAction(args.action);
    const proposedSize = Number(args.size);

    const exec = executeTradeSimulated({
      sentiment: ctx.sentiment,
      market: ctx.market,
      proposedAction,
      proposedSize: Number.isFinite(proposedSize) ? proposedSize : 0,
      reasoning,
    });

    ctx.lastExecution = exec;
    setLastTrade(exec.execution.action === "DO_NOTHING" ? null : exec.execution);

    return {
      ok: true,
      edge: exec.edge,
      overridden: exec.overridden,
      execution: exec.execution,
    };
  }

  return { ok: false, error: `Unknown tool: ${name}` };
}

function parseAction(x: unknown): TradeAction {
  const s = String(x ?? "");
  if (s === "BUY_YES" || s === "BUY_NO" || s === "DO_NOTHING") return s;
  return "DO_NOTHING";
}
