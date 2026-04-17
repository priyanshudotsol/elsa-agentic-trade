import { executionPrompt } from "../prompts.js";
import { chatWithSystem } from "../openaiChat.js";
import { ELSA_EXECUTION_SYSTEM } from "./systemPrompts.js";

/** Elsa narrates execution after the decision is fixed. */
export async function elsaExecutionNarrative(
  decision: string,
  edge: number,
  confidence: number
): Promise<string> {
  return chatWithSystem(
    ELSA_EXECUTION_SYSTEM,
    executionPrompt(decision, edge, confidence),
    0.2
  );
}
