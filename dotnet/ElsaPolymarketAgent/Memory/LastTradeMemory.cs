namespace ElsaPolymarketAgent.Memory;

/// <summary>
/// Hackathon bonus: in-process memory of the last execution log line.
/// </summary>
public static class LastTradeMemory
{
    public static string? LastLogLine { get; private set; }

    public static void Set(string? line) => LastLogLine = line;
}
