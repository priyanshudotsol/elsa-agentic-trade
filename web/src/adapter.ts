/**
 * HeyElsa-style MessagePort bridge to the browser wallet (MetaMask, Rabby, etc.).
 * Forces Polygon mainnet for Polymarket CLOB (USDC + outcome tokens on Polygon).
 *
 * When you obtain `@heyelsa/chat-widget` from HeyElsa, pass this port as `messagePort`
 * — the API matches their docs.
 */

/** Polygon mainnet — EIP-155 chain id */
export const POLYGON_CHAIN_ID_HEX = "0x89";

type WalletRequest = {
  requestId: string;
  action: string;
  params?: {
    address?: string;
    message?: string;
    transaction?: Record<string, unknown>;
    chainId?: string;
  };
};

type WalletResponse = {
  requestId: string;
  success: boolean;
  data: unknown;
  error?: string;
};

function getEthereum(): unknown {
  return (window as unknown as { ethereum?: unknown }).ethereum;
}

/** Add Polygon to the wallet if missing, then switch. */
export async function ensurePolygon(ethereum: {
  request: (a: { method: string; params?: unknown[] }) => Promise<unknown>;
}) {
  try {
    await ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: POLYGON_CHAIN_ID_HEX }],
    });
  } catch (e: unknown) {
    const code = (e as { code?: number })?.code;
    if (code === 4902) {
      await ethereum.request({
        method: "wallet_addEthereumChain",
        params: [
          {
            chainId: POLYGON_CHAIN_ID_HEX,
            chainName: "Polygon Mainnet",
            nativeCurrency: { name: "MATIC", symbol: "MATIC", decimals: 18 },
            rpcUrls: ["https://polygon-rpc.com"],
            blockExplorerUrls: ["https://polygonscan.com"],
          },
        ],
      });
      return;
    }
    throw e;
  }
}

export function createWalletAdapter(): MessagePort {
  const channel = new MessageChannel();

  channel.port1.onmessage = async (event: MessageEvent<WalletRequest>) => {
    const request = event.data;
    const response: WalletResponse = {
      requestId: request.requestId,
      success: false,
      data: null,
    };

    try {
      const ethereum = getEthereum() as
        | {
            request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
          }
        | undefined;

      if (!ethereum) throw new Error("No injected wallet (window.ethereum)");

      let result: unknown;

      switch (request.action) {
        case "CONNECT_WALLET":
          await ensurePolygon(ethereum);
          result = await ethereum.request({ method: "eth_requestAccounts" });
          break;
        case "DISCONNECT_WALLET":
          result = true;
          break;
        case "GET_ACCOUNTS":
          result = await ethereum.request({ method: "eth_accounts" });
          break;
        case "GET_CHAIN_ID":
          result = await ethereum.request({ method: "eth_chainId" });
          break;
        case "GET_BALANCE": {
          const addr = request.params?.address;
          if (!addr) throw new Error("GET_BALANCE requires params.address");
          result = await ethereum.request({
            method: "eth_getBalance",
            params: [addr, "latest"],
          });
          break;
        }
        case "SIGN_MESSAGE":
          result = await ethereum.request({
            method: "personal_sign",
            params: [request.params?.message, request.params?.address],
          });
          break;
        case "SIGN_TRANSACTION":
          result = await ethereum.request({
            method: "eth_signTransaction",
            params: [request.params?.transaction],
          });
          break;
        case "BROADCAST_TRANSACTION":
          result = await ethereum.request({
            method: "eth_sendTransaction",
            params: [request.params?.transaction],
          });
          break;
        case "SWITCH_NETWORK":
          await ensurePolygon(ethereum);
          result = true;
          break;
        default:
          throw new Error(`Unsupported action: ${request.action}`);
      }

      response.success = true;
      response.data = result;
    } catch (error: unknown) {
      response.error = error instanceof Error ? error.message : String(error);
    }

    channel.port1.postMessage(response);
  };

  return channel.port2;
}
