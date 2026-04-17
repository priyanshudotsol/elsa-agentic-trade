export type TraceEntry =
  | { kind: "assistant"; content: string | null; toolCalls?: string[] }
  | { kind: "tool_call"; name: string; args: unknown }
  | { kind: "tool_result"; name: string; result: unknown };

export function createTrace(): TraceEntry[] {
  return [];
}

export function traceLog(trace: TraceEntry[], entry: TraceEntry): void {
  trace.push(entry);
  if (entry.kind === "tool_call") {
    console.log(`[trace] tool_call  ${entry.name}`, JSON.stringify(entry.args));
  } else if (entry.kind === "tool_result") {
    console.log(`[trace] tool_result ${entry.name}`, JSON.stringify(entry.result));
  } else if (entry.kind === "assistant") {
    const tc = entry.toolCalls?.length ? ` tools=[${entry.toolCalls.join(", ")}]` : "";
    console.log(`[trace] assistant${tc}`, entry.content ?? "");
  }
}
