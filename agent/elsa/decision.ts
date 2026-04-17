/**
 * Elsa decides: BUY_YES | BUY_NO | SKIP (+ edge JSON).
 * Uses `OPENAI_API_KEY` / `OPENAI_MODEL` or optional `ELSA_DECISION_URL`.
 */
import { marketPrompt } from "../prompts.js";
import { chatWithSystem } from "../openaiChat.js";
import { ELSA_DECISION_SYSTEM } from "./systemPrompts.js";

export type ElsaDecisionInput = {
  marketContext: string;
  sentimentLabel: string;
  confidence: number;
};

function getElsaDecisionUrl(): string | undefined {
  const u = process.env.ELSA_DECISION_URL?.trim();
  return u?.length ? u : undefined;
}

export async function elsaDecideTrade(input: ElsaDecisionInput): Promise<string> {
  const remote = getElsaDecisionUrl();
  if (remote) return elsaDecideViaRemote(remote, input);
  return elsaDecideViaOpenAI(input);
}

async function elsaDecideViaOpenAI(input: ElsaDecisionInput): Promise<string> {
  const user = marketPrompt(input.marketContext, input.sentimentLabel, input.confidence);
  return chatWithSystem(ELSA_DECISION_SYSTEM, user, 0.1);
}

async function elsaDecideViaRemote(url: string, input: ElsaDecisionInput): Promise<string> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      sentiment: input.sentimentLabel,
      confidence: input.confidence,
      marketContext: input.marketContext,
    }),
  });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`ELSA_DECISION_URL failed: HTTP ${res.status} ${text.slice(0, 500)}`);
  }
  try {
    const data = JSON.parse(text) as Record<string, unknown>;
    if (typeof data.marketJson === "string") return data.marketJson;
    if (typeof data.decision === "string" && typeof data.edge === "number") {
      return JSON.stringify({
        decision: data.decision,
        edge: data.edge,
        takeTrade: data.takeTrade ?? true,
        reasoning: data.reasoning ?? "",
      });
    }
  } catch {
    /* raw JSON */
  }
  const trimmed = text.trim();
  if (trimmed.startsWith("{")) return trimmed;
  throw new Error("ELSA_DECISION_URL: expected JSON with marketJson or decision/edge fields");
}
