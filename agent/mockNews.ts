/** Optional headlines (same idea as the old C# MockNewsClient). */
export function mockHeadlines(topic: string): string[] {
  const t = topic.trim();
  return [
    `Macro desks watch positioning and flows around: ${t}`,
    "Risk assets react to liquidity and rate expectations",
    "Crypto volatility: short-term narratives vs. spot flow",
  ];
}
