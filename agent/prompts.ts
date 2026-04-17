/** User-message bodies for Elsa (system persona is in `agent/elsa/systemPrompts.ts`). */

export function sentimentPrompt(tweetsBlock: string, newsBlock: string): string {
  return `Focus on BITCOIN (BTC) price direction and catalysts. Using the tweets and news below, estimate short-term directional bias for BTC.

Tweets:
${tweetsBlock}

News:
${newsBlock}

Respond with JSON ONLY on one line: {"sentiment":"bullish|bearish|neutral","confidence":0.0,"reasoning":"short"}. Use confidence as your subjective probability (0–1) that BTC will move UP over the next few minutes, consistent with the narrative.`;
}

export function marketPrompt(
  marketContext: string,
  sentimentLabel: string,
  confidence: number
): string {
  return `You are the ONLY trading decision maker for this Polymarket BTC short-term "Up or Down" market. Use sentiment, numeric confidence (rough P(up)), and live context below.

${marketContext}

Sentiment label: ${sentimentLabel}
Confidence (0-1, from prior step): ${confidence}

Decide: buy YES (bet UP), buy NO (bet DOWN), or SKIP. Use judgment — trade only when edge vs the current YES midpoint is meaningful; otherwise SKIP.

Respond with JSON ONLY on one line: {"edge":0.0,"decision":"BUY_YES|BUY_NO|SKIP","takeTrade":true,"reasoning":"short"} where edge = your confidence minus the stated YES midpoint (rough EV-style check).`;
}

export function executionPrompt(decision: string, edge: number, confidence: number): string {
  return `The trade decision is already fixed.
Decision: ${decision}
Edge: ${edge}
Confidence: ${confidence}
If decision is SKIP, say you are flat. Otherwise describe the intended trade; position size hint = round(confidence * 100).
Produce ONE line execution log. No JSON.`;
}
