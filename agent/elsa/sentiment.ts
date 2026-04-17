import { sentimentPrompt } from "../prompts.js";
import { chatWithSystem } from "../openaiChat.js";
import { ELSA_SENTIMENT_SYSTEM } from "./systemPrompts.js";

/** Elsa analyzes tweets + news → sentiment JSON. */
export async function elsaAnalyzeSentiment(
  tweetsBlock: string,
  newsBlock: string
): Promise<string> {
  return chatWithSystem(ELSA_SENTIMENT_SYSTEM, sentimentPrompt(tweetsBlock, newsBlock), 0.2);
}
