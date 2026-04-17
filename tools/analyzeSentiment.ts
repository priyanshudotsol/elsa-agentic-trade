import axios from "axios";
import type { Sentiment, SentimentAnalysis, Tweet } from "./types.js";

const OPENAI_URL = "https://api.openai.com/v1/chat/completions";

interface OpenAIChatResponse {
  choices?: Array<{ message?: { content?: string | null } }>;
}

/**
 * Tool 1: analyze_sentiment — LLM turns tweet batch into sentiment + confidence + reasoning.
 */
export async function analyzeSentiment(tweets: Tweet[]): Promise<SentimentAnalysis> {
  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_MODEL ?? "gpt-4o-mini";
  if (!apiKey) throw new Error("OPENAI_API_KEY is not set.");

  const block = tweets.map((t, i) => `${i + 1}. @${t.author}: ${t.text}`).join("\n");

  const { data } = await axios.post<OpenAIChatResponse>(
    OPENAI_URL,
    {
      model,
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `Return ONE JSON object: {"sentiment":"bullish"|"bearish"|"neutral","confidence":0-1,"reasoning":"short string"}.
confidence is your estimated P(YES) for the relevant prediction-market outcome (bullish → higher, bearish → lower).`,
        },
        { role: "user", content: `Tweets:\n${block}` },
      ],
    },
    {
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      timeout: 60_000,
    }
  );

  const raw = data?.choices?.[0]?.message?.content;
  if (!raw) throw new Error("OpenAI returned no content for analyze_sentiment");

  const parsed = JSON.parse(raw) as Record<string, unknown>;
  const sentiment = normalizeSentiment(parsed.sentiment);
  const confidence = clamp01(Number(parsed.confidence));
  const reasoning = String(parsed.reasoning ?? "").trim();

  return { sentiment, confidence, reasoning };
}

function normalizeSentiment(s: unknown): Sentiment {
  const x = String(s ?? "").toLowerCase();
  if (x === "bullish" || x === "bearish" || x === "neutral") return x;
  return "neutral";
}

function clamp01(n: number): number {
  if (Number.isNaN(n)) return 0;
  return Math.min(1, Math.max(0, n));
}
