import { useCallback, useMemo, useState } from "react";
import { createWalletAdapter, ensurePolygon } from "./adapter";
import { HeyElsaChatWidget, syncWalletState, type WalletState } from "./heyelsaCompat";

const defaultTopic = "BTC OR bitcoin OR $BTC -filter:retweets min_faves:5";

export function App() {
  const messagePort = useMemo(() => createWalletAdapter(), []);
  const [topic, setTopic] = useState(defaultTopic);
  const [loading, setLoading] = useState(false);
  const [apiJson, setApiJson] = useState<string>("");
  const [wallet, setWallet] = useState<WalletState>({ isConnected: false });

  const keyId = import.meta.env.VITE_HEYELSA_KEY_ID ?? "replace-with-dashboard-key";

  const connectWallet = useCallback(async () => {
    const eth = (window as unknown as { ethereum?: { request: (x: unknown) => Promise<unknown> } }).ethereum;
    if (!eth) {
      alert("Install a Polygon-capable wallet (MetaMask, Rabby, …).");
      return;
    }
    await ensurePolygon(eth);
    const accounts = (await eth.request({ method: "eth_requestAccounts" })) as string[];
    const chainId = (await eth.request({ method: "eth_chainId" })) as string;
    const address = accounts[0];
    const balance =
      address ? ((await eth.request({ method: "eth_getBalance", params: [address, "latest"] })) as string) : "0x0";
    const next: WalletState = {
      isConnected: true,
      address,
      chainId,
      chainName: chainId === "0x89" ? "Polygon Mainnet" : `chain ${chainId}`,
      balance,
      nativeCurrency: { name: "MATIC", symbol: "MATIC", decimals: 18 },
    };
    setWallet(next);
    syncWalletState(next);
  }, []);

  const runWorkflow = useCallback(async () => {
    setLoading(true);
    setApiJson("");
    try {
      const base = import.meta.env.VITE_API_BASE ?? "";
      const res = await fetch(`${base}/api/trading/run`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic }),
      });
      const data = await res.json();
      setApiJson(JSON.stringify(data, null, 2));
    } catch (e) {
      setApiJson(JSON.stringify({ error: String(e) }, null, 2));
    } finally {
      setLoading(false);
    }
  }, [topic]);

  return (
    <div className="layout">
      <h1>Polymarket agent (TypeScript) · Polygon</h1>
      <p>
        The <strong>Node/TS</strong> service (<code>agent/server.ts</code>) runs Twitter → OpenAI → Polymarket.{" "}
        <strong>HeyElsa</strong>-style chat + wallet: use the same <code>MessagePort</code> adapter when you plug in{" "}
        <code>@heyelsa/chat-widget</code>.
      </p>

      <div className="card">
        <h2>Wallet (Polygon)</h2>
        <p>
          Polymarket CLOB uses <strong>Polygon</strong>. The adapter switches / adds chain <code>0x89</code>.
        </p>
        <button type="button" onClick={connectWallet}>
          Connect wallet
        </button>
        {wallet.isConnected && (
          <pre style={{ marginTop: "0.75rem" }}>
            {JSON.stringify(
              { address: wallet.address, chainId: wallet.chainId, balanceWei: wallet.balance },
              null,
              2
            )}
          </pre>
        )}
      </div>

      <div className="card">
        <h2>Run trading pipeline</h2>
        <p>Calls <code>POST /api/trading/run</code> on the TS API (proxied from Vite in dev).</p>
        <label htmlFor="topic">Twitter search topic</label>
        <input
          id="topic"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          style={{ marginTop: "0.35rem" }}
        />
        <div style={{ marginTop: "0.75rem" }}>
          <button type="button" disabled={loading} onClick={runWorkflow}>
            {loading ? "Running…" : "Run workflow"}
          </button>
        </div>
        {apiJson && (
          <pre style={{ marginTop: "0.75rem" }}>{apiJson}</pre>
        )}
      </div>

      <HeyElsaChatWidget
        keyId={keyId}
        dappName="Polymarket Elsa Agent"
        messagePort={messagePort}
        position="bottom-right"
        customStyles={{ primaryColor: "#6366f1" }}
      />
    </div>
  );
}
