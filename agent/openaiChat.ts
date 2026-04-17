import OpenAI from "openai";
import { getOpenAiKey, getOpenAiModel } from "./config.js";

let client: OpenAI | null = null;

function getClient(): OpenAI {
  if (!client) client = new OpenAI({ apiKey: getOpenAiKey() });
  return client;
}

export async function chatText(
  userContent: string,
  temperature: number
): Promise<string> {
  const openai = getClient();
  const model = getOpenAiModel();
  const res = await openai.chat.completions.create({
    model,
    temperature,
    messages: [{ role: "user", content: userContent }],
  });
  const text = res.choices[0]?.message?.content?.trim() ?? "";
  return text;
}

/** Elsa steps: system = persona, user = task + data. Uses same API key / model as `.env`. */
export async function chatWithSystem(
  systemContent: string,
  userContent: string,
  temperature: number
): Promise<string> {
  const openai = getClient();
  const model = getOpenAiModel();
  const res = await openai.chat.completions.create({
    model,
    temperature,
    messages: [
      { role: "system", content: systemContent },
      { role: "user", content: userContent },
    ],
  });
  return res.choices[0]?.message?.content?.trim() ?? "";
}
