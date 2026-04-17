export type SentimentParsed = {
  sentiment: string;
  confidence: number;
  reasoning?: string;
};

/** Strips markdown fences and grabs the first `{...}` block so the model can chatter slightly. */
export function extractFirstJsonObject(raw: string): string {
  const t = raw.trim();
  const unfenced = t.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
  const start = unfenced.indexOf("{");
  const end = unfenced.lastIndexOf("}");
  if (start >= 0 && end > start) return unfenced.slice(start, end + 1);
  return unfenced;
}

export function parseSentimentJson(raw: string): SentimentParsed | null {
  try {
    const slice = extractFirstJsonObject(raw);
    const o = JSON.parse(slice) as Record<string, unknown>;
    const sentiment = String(o.sentiment ?? "neutral");
    const confidence = Number(o.confidence);
    return {
      sentiment,
      confidence: Number.isFinite(confidence) ? confidence : 0,
      reasoning: typeof o.reasoning === "string" ? o.reasoning : undefined,
    };
  } catch {
    return null;
  }
}

export function readSentimentLabel(json: string | undefined): string {
  return parseSentimentJson(json ?? "")?.sentiment ?? "neutral";
}

export function readConfidence(json: string | undefined): number {
  return parseSentimentJson(json ?? "")?.confidence ?? 0;
}

export function readDecision(marketJson: string | undefined): string {
  if (!marketJson?.trim()) return "SKIP";
  try {
    const slice = extractFirstJsonObject(marketJson);
    const o = JSON.parse(slice) as Record<string, unknown>;
    const d = String(o.decision ?? "").trim().toUpperCase();
    if (d === "BUY_YES" || d === "BUY_NO" || d === "SKIP") return d;
  } catch {
    /* ignore */
  }
  return "SKIP";
}

export function readEdge(marketJson: string | undefined): number {
  if (!marketJson?.trim()) return 0;
  try {
    const slice = extractFirstJsonObject(marketJson);
    const o = JSON.parse(slice) as Record<string, unknown>;
    const e = o.edge;
    if (typeof e === "number" && Number.isFinite(e)) return e;
    if (typeof e === "string") {
      const n = Number(e);
      return Number.isFinite(n) ? n : 0;
    }
  } catch {
    /* ignore */
  }
  return 0;
}
