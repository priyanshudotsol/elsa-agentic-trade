using System.Text.Json;
using Elsa.Extensions;
using Elsa.Workflows;
using Elsa.Workflows.Activities;
using Elsa.Workflows.Contracts;
using Elsa.Workflows.Models;
using ElsaPolymarketAgent.Memory;

namespace ElsaPolymarketAgent.Workflows;

/// <summary>
/// Sequential agent workflow: SentimentAgent → MarketAgent → ExecutionAgent.
/// Agent activities are generated at runtime from AgentsOptions (see appsettings.json) as Elsa.Agents.* types.
/// </summary>
public class TradingWorkflow : WorkflowBase
{
    protected override void Build(IWorkflowBuilder builder)
    {
        builder.WithInput<string>("Tweets");

        var sentimentJson = builder.WithVariable<string>("SentimentJson");
        var marketJson = builder.WithVariable<string>("MarketJson");
        var executionLog = builder.WithVariable<string>("ExecutionLog");

        var sentiment = new global::Elsa.Agents.SentimentAgent
        {
            Tweets = new Input<string>(ctx => ctx.GetInput<string>("Tweets") ?? ""),
            Output = new Output<string>(sentimentJson)
        };

        var logSentiment = new WriteLine(new Input<string>(ctx =>
        {
            var raw = sentimentJson.Get(ctx) ?? "";
            Console.WriteLine($"[sentiment] {raw}");
            return $"[sentiment] {raw}";
        }));

        var market = new global::Elsa.Agents.MarketAgent
        {
            Sentiment = new Input<string>(ctx => ReadSentiment(sentimentJson.Get(ctx))),
            Confidence = new Input<double>(ctx => ReadConfidence(sentimentJson.Get(ctx))),
            Output = new Output<string>(marketJson)
        };

        var logMarket = new WriteLine(new Input<string>(ctx =>
        {
            var raw = marketJson.Get(ctx) ?? "";
            Console.WriteLine($"[market] {raw}");
            return $"[market] {raw}";
        }));

        var execution = new global::Elsa.Agents.ExecutionAgent
        {
            Decision = new Input<string>(ctx => ReadDecision(marketJson.Get(ctx))),
            Edge = new Input<double>(ctx => ReadEdge(marketJson.Get(ctx))),
            Output = new Output<string>(executionLog)
        };

        var logExecution = new WriteLine(new Input<string>(ctx =>
        {
            var raw = executionLog.Get(ctx) ?? "";
            LastTradeMemory.Set(raw);
            Console.WriteLine($"[execution] {raw}");
            return $"[execution] {raw}";
        }));

        builder.Root = new Sequence
        {
            Activities =
            {
                sentiment,
                logSentiment,
                market,
                logMarket,
                execution,
                logExecution
            }
        };
    }

    private static string ReadSentiment(string? json)
    {
        var s = TryParseSentiment(json);
        return s?.Sentiment ?? "neutral";
    }

    private static double ReadConfidence(string? json)
    {
        var s = TryParseSentiment(json);
        return s?.Confidence ?? 0d;
    }

    private static string ReadDecision(string? json)
    {
        var m = TryParseMarket(json);
        return m?.Decision ?? "SKIP";
    }

    private static double ReadEdge(string? json)
    {
        var m = TryParseMarket(json);
        return m?.Edge ?? 0d;
    }

    private static SentimentDto? TryParseSentiment(string? json)
    {
        if (string.IsNullOrWhiteSpace(json)) return null;
        try
        {
            return JsonSerializer.Deserialize<SentimentDto>(json, JsonOptions);
        }
        catch
        {
            return null;
        }
    }

    private static MarketDto? TryParseMarket(string? json)
    {
        if (string.IsNullOrWhiteSpace(json)) return null;
        try
        {
            return JsonSerializer.Deserialize<MarketDto>(json, JsonOptions);
        }
        catch
        {
            return null;
        }
    }

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true
    };

    private sealed record SentimentDto(string Sentiment, double Confidence, string Reasoning);

    private sealed record MarketDto(double Edge, string Decision, string Reasoning);
}
