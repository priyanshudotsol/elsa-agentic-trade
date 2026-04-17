import type { TwitterTweet } from "./types.js";

export async function advancedSearchTweets(
  query: string,
  maxTweets: number,
  apiKey: string | undefined,
  baseUrl: string
): Promise<TwitterTweet[]> {
  if (!apiKey?.length) {
    console.warn("[twitter] TWITTERAPI_IO_KEY not set — empty tweet list.");
    return [];
  }

  const collected: TwitterTweet[] = [];
  let cursor: string | undefined;
  let pages = 0;

  while (collected.length < maxTweets && pages < 5) {
    pages++;
    let url = `${baseUrl.replace(/\/+$/, "")}/twitter/tweet/advanced_search?query=${encodeURIComponent(query)}&queryType=Latest`;
    if (cursor) url += `&cursor=${encodeURIComponent(cursor)}`;

    const res = await fetch(url, { headers: { "x-api-key": apiKey } });
    const json = (await res.json()) as Record<string, unknown>;
    if (!res.ok) {
      console.error("[twitter] error", res.status, JSON.stringify(json).slice(0, 500));
      break;
    }

    const tweetsRaw = json.tweets;
    if (Array.isArray(tweetsRaw)) {
      for (const t of tweetsRaw) {
        const row = t as Record<string, unknown>;
        const text = typeof row.text === "string" ? row.text : "";
        let author = "unknown";
        const au = row.author as Record<string, unknown> | undefined;
        if (au) {
          if (typeof au.userName === "string") author = au.userName;
          else if (typeof au.screenName === "string") author = au.screenName;
        }
        const createdAt = typeof row.createdAt === "string" ? row.createdAt : undefined;
        if (!text.trim()) continue;
        collected.push({ text, author, createdAt });
        if (collected.length >= maxTweets) break;
      }
    }

    const hasNext = json.has_next_page === true;
    const nextCursor = typeof json.next_cursor === "string" ? json.next_cursor : undefined;
    if (!hasNext || !nextCursor) break;
    cursor = nextCursor;
  }

  return collected;
}

export function formatTweetBlock(tweets: TwitterTweet[]): string {
  return tweets.map((t, i) => `${i + 1}. @${t.author} [${t.createdAt ?? "?"}]: ${t.text}`).join("\n");
}
