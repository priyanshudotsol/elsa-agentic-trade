import type { BtcMarketResolution } from "./types.js";

function currentBtcUpDown5mSlotUnixSeconds(): number {
  return Math.floor(Date.now() / 1000 / 300) * 300;
}

function isLiveMarket(m: Record<string, unknown>): boolean {
  if (m.active === false) return false;
  if (m.closed === true) return false;
  if (m.accepting_orders === false) return false;
  return true;
}

function extractClobTokenIds(m: Record<string, unknown>): string[] {
  const raw = m.clobTokenIds;
  if (Array.isArray(raw)) {
    return raw.filter((x): x is string => typeof x === "string" && x.length > 0);
  }
  if (typeof raw === "string") {
    try {
      const arr = JSON.parse(raw) as unknown;
      if (Array.isArray(arr)) {
        return arr.filter((x): x is string => typeof x === "string" && x.length > 0);
      }
    } catch {
      /* ignore */
    }
  }
  return [];
}

async function fetchMidPrice(clobHost: string, tokenId: string): Promise<number | null> {
  const url = `${clobHost.replace(/\/+$/, "")}/midpoint?token_id=${encodeURIComponent(tokenId)}`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const j = (await res.json()) as Record<string, unknown>;
  const mid = j.mid ?? j.mid_price;
  if (typeof mid === "number" && Number.isFinite(mid)) return mid;
  if (typeof mid === "string") {
    const n = Number(mid);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

export async function resolveBtcUpDown5m(opts: {
  gammaBaseUrl: string;
  clobHost: string;
  slugOverride: string;
}): Promise<BtcMarketResolution> {
  const slot = currentBtcUpDown5mSlotUnixSeconds();
  const candidateSlugs = opts.slugOverride
    ? [opts.slugOverride]
    : [`btc-updown-5m-${slot}`, `btc-updown-5m-${slot - 300}`, `btc-updown-5m-${slot + 300}`];

  for (const slug of candidateSlugs) {
    const url = `${opts.gammaBaseUrl.replace(/\/+$/, "")}/events?slug=${encodeURIComponent(slug)}&limit=1`;
    const res = await fetch(url);
    if (!res.ok) continue;

    const arr = (await res.json()) as unknown;
    if (!Array.isArray(arr) || arr.length === 0) continue;
    const ev = arr[0] as Record<string, unknown>;
    const markets = ev.markets;
    if (!Array.isArray(markets)) continue;

    for (const market of markets) {
      const m = market as Record<string, unknown>;
      if (!isLiveMarket(m)) continue;
      const tokens = extractClobTokenIds(m);
      if (tokens.length < 2) continue;

      const yesToken = tokens[0]!;
      const noToken = tokens[1]!;
      const question = typeof m.question === "string" ? m.question : "";
      let mid = await fetchMidPrice(opts.clobHost, yesToken);
      if (mid == null) mid = 0.5;

      return {
        resolvedSlug: slug,
        question,
        yesMidPrice: mid,
        yesTokenId: yesToken,
        noTokenId: noToken,
        ok: true,
      };
    }
  }

  const fallback = candidateSlugs[0] ?? `btc-updown-5m-${slot}`;
  return {
    resolvedSlug: fallback,
    question: "",
    yesMidPrice: 0.5,
    yesTokenId: "",
    noTokenId: "",
    ok: false,
  };
}
