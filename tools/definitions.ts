/**
 * OpenAI tool schemas for the Elsa agent (names match user spec).
 */
export const elsaToolDefinitions = [
  {
    type: "function" as const,
    function: {
      name: "analyze_sentiment",
      description:
        "Analyze tweet text and return sentiment (vs YES), confidence as estimated P(YES) in [0,1], and short reasoning.",
      parameters: {
        type: "object",
        properties: {
          tweets: {
            type: "array",
            description: "Tweets with text and author",
            items: {
              type: "object",
              properties: {
                text: { type: "string" },
                author: { type: "string" },
              },
              required: ["text", "author"],
            },
          },
        },
        required: ["tweets"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "get_market_data",
      description: "Fetch current Polymarket snapshot (stubbed): question and YES price.",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "execute_trade",
      description:
        "ONLY after you explained reasoning in natural language. Submit intended action/size; runtime enforces edge rules.",
      parameters: {
        type: "object",
        properties: {
          reasoning: {
            type: "string",
            description: "Concise rationale tying sentiment confidence to market price",
          },
          action: { type: "string", enum: ["BUY_YES", "BUY_NO", "DO_NOTHING"] },
          size: { type: "number", description: "Position size (e.g. confidence * 100)" },
        },
        required: ["reasoning", "action", "size"],
      },
    },
  },
];
