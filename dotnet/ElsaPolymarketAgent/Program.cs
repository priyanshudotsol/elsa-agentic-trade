using Elsa.Agents.Models;
using Elsa.Extensions;
using Elsa.Persistence.EFCore.Extensions;
using Elsa.Persistence.EFCore.Modules.Management;
using Elsa.Persistence.EFCore.Modules.Runtime;
using Elsa.Workflows;
using Elsa.Workflows.Models;
using ElsaPolymarketAgent.Memory;
using ElsaPolymarketAgent.Workflows;

var builder = WebApplication.CreateBuilder(args);

builder.Configuration.AddEnvironmentVariables(prefix: "ELSA_");
builder.Configuration.AddEnvironmentVariables();

var sqlite = builder.Configuration.GetConnectionString("Elsa")
             ?? "Data Source=elsa.sqlite.db;Cache=Shared;";

// Elsa workflow + agents. OpenAI is wired via Agents:Services: OpenAIChatCompletion (Semantic Kernel connector).
builder.Services.AddElsa(elsa =>
{
    elsa
        .UseWorkflowManagement(management =>
            management.UseEntityFrameworkCore(ef =>
            {
                ef.UseSqlite(sqlite);
                ef.RunMigrations = true;
            }))
        .UseWorkflowRuntime(runtime =>
            runtime.UseEntityFrameworkCore(ef =>
            {
                ef.UseSqlite(sqlite);
                ef.RunMigrations = true;
            }))
        .UseAgentActivities();

    elsa.AddWorkflow<TradingWorkflow>();
});

builder.Services.Configure<AgentsOptions>(builder.Configuration.GetSection("Agents"));

// OPENAI_API_KEY env var fills Agents:ApiKeys:OpenAI without editing JSON
builder.Services.PostConfigure<AgentsOptions>(opts =>
{
    var key = builder.Configuration["OPENAI_API_KEY"];
    if (string.IsNullOrWhiteSpace(key)) return;
    if (opts.ApiKeys is null) return;
    foreach (var k in opts.ApiKeys)
    {
        if (k.Name == "OpenAI")
            k.Value = key;
    }
});

var app = builder.Build();

var tweets = new[]
{
    "Trump gaining strong support in recent polls",
    "Momentum increasing among voters",
    "Opposition weakening"
};

var tweetBlock = string.Join("\n", tweets.Select((t, i) => $"{i + 1}. {t}"));

using var scope = app.Services.CreateScope();
var runner = scope.ServiceProvider.GetRequiredService<IWorkflowRunner>();

Console.WriteLine("=== AI Trading Agent Workflow (Elsa Agents) ===\n");

var result = await runner.RunAsync(new TradingWorkflow(), new RunWorkflowOptions
{
    Input = new Dictionary<string, object>
    {
        ["Tweets"] = tweetBlock
    }
});

Console.WriteLine($"\nWorkflow finished: {result.WorkflowState.Status}");
Console.WriteLine($"Last execution log (memory): {LastTradeMemory.LastLogLine ?? "(none)"}");

return;
