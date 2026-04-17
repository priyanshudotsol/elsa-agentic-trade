namespace ElsaPolymarketAgent.Agents;

/// <summary>
/// Code-first mirror of MarketAgent in appsettings.json. Market YES price is fixed at 0.42 in the prompt.
/// </summary>
public static class MarketAgent
{
    public const string Name = "MarketAgent";

    public const string PromptTemplate =
        "You are a trading strategist. Market YES probability is 0.42. Based on sentiment {{sentiment}} and confidence {{confidence}}, calculate edge = confidence - 0.42 and decide whether to trade.";

    public const string YesPrice = "0.42";
    public const string Question = "Will Trump win 2026?";
}
