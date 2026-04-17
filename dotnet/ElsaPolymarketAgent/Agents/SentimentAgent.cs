namespace ElsaPolymarketAgent.Agents;

/// <summary>
/// Code-first mirror of the SentimentAgent entry in appsettings.json (Agents:Agents).
/// Elsa loads the real definition via AgentsOptions; this class documents inputs/outputs for the team.
/// </summary>
public static class SentimentAgent
{
    public const string Name = "SentimentAgent";

    public const string PromptTemplate =
        "You are a financial sentiment analyst. Analyze the following tweets and determine overall sentiment and confidence: {{tweets}}";

    public const string InputName = "tweets";
    public const string OutputName = "SentimentJson";
}
