# Elsa Agent

TypeScript stack that combines **Twitter / market context**, an **LLM “Elsa” layer** (sentiment, trade decision, execution narrative), and **optional Polymarket execution** on **Polygon**. The repo has two main pieces: a **root agent** (pipeline + HTTP API) and a **`polymarket/`** backend (live WebSocket ingestion, strategy, CLOB).

## Features

- **Root agent**: Twitter search → BTC 5m Polymarket market resolution → OpenAI (`agent/elsa/`) → optional on-chain trade via built Polymarket script when `POLYMARKET_DRY_RUN` is off.
- **HTTP API**: `GET /health`, `POST /api/trading/run` (see `agent/server.ts`).
- **`polymarket/`**: Gamma + CLOB WebSocket, candle storage (Prisma/Postgres), strategy signals, **paper** or **real** trading with confidence/EV gates and `DRY_RUN` safety.

## Prerequisites

- **Node.js** ≥ 18  
- **pnpm** (recommended for `polymarket/`)  
- **PostgreSQL** for the `polymarket` app (Prisma)  
- API keys: **OpenAI**, **twitterapi.io** (for Twitter), and Polygon/Polymarket credentials if you enable real execution

## Quick start (root agent)

```bash
cp .env.example .env
# Edit .env: OPENAI_API_KEY, TWITTERAPI_IO_KEY, etc.

npm install
npm run dev          # loop (default interval: AGENT_LOOP_INTERVAL_MS, 300s)
npm run dev:once     # single run
```

## Environment (root)

Copy from `.env.example`. Important variables:

| Variable | Purpose |
|----------|---------|
| `OPENAI_API_KEY` | Required for Elsa steps |
| `TWITTERAPI_IO_KEY` | Twitter search |
| `AGENT_LOOP_INTERVAL_MS` | Loop cadence (default `300000`) |
| `PORT` | API server port (default `5000`) |
| `POLYMARKET_DRY_RUN` | `true` (default) = no real CLOB orders from root pipeline |
| `POLYGON_PRIVATE_KEY`, `POLYGON_RPC_URL` | Real execution when dry-run is off |
| `ELSA_DECISION_URL` | Optional: delegate only the decision step to an HTTP service |

## Scripts (root `package.json`)

| Script | Description |
|--------|-------------|
| `npm run dev` | Run pipeline in a loop |
| `npm run dev:once` | One pipeline run |
| `npm run dev:server` | Express API only |
| `npm run dev:all` | API + Vite web (`web/`) concurrently |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm run setup:polymarket` | Install, Prisma generate, build inside `polymarket/` |

## Polymarket backend (`polymarket/`)

Separate app: **ingestion**, **strategy**, **paper/real trading**. Use when you want a continuous WebSocket bot connected to Polymarket.

```bash
cd polymarket
# Create polymarket/.env with DATABASE_URL, DIRECT_DATABASE_URL, Polygon keys, etc.
pnpm install
pnpm exec prisma generate
pnpm run prisma:migrate:dev   # first-time DB setup; adjust per your workflow
pnpm run dev                  # tsx watch index.ts
```

Configure `TRADING_MODE` (`paper` | `real` | `off`), `DRY_RUN`, `PAPER_MIN_CONFIDENCE`, `PAPER_EV_THRESHOLD`, and Polygon/Polymarket variables in `polymarket/.env`.

## Web UI (`web/`)

Vite + React. Proxies `/api` to the root agent server by default. Optional env in `web/.env.example` (`VITE_API_BASE`, `VITE_HEYELSA_KEY_ID`).

```bash
npm install --prefix web
npm run dev --prefix web
```

## Security

- **Never commit** `.env` or private keys.  
- Rotate keys if they were exposed in logs or chat.  
- **Test with `DRY_RUN` / `POLYMARKET_DRY_RUN`** before live size.

## License

ISC (or as specified in each subpackage’s `package.json`).
