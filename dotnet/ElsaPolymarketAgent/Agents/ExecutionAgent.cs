namespace ElsaPolymarketAgent.Agents;

/// <summary>
/// Code-first mirror of ExecutionAgent in appsettings.json (simulated execution narrative).
/// </summary>
public static class ExecutionAgent
{
    public const string Name = "ExecutionAgent";

    public const string PromptTemplate =
        "You are a trading execution agent. Execute the trade decision: {{decision}} with edge {{edge}}. Print a clean execution log.";
}
