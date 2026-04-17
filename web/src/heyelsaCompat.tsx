/**
 * Drop-in replacements for `@heyelsa/chat-widget` exports until the real package
 * is available from HeyElsa (dashboard / private registry).
 *
 * Replace imports in App.tsx with:
 *   import { HeyElsaChatWidget, syncWalletState } from '@heyelsa/chat-widget';
 */

export type WalletState = {
  isConnected: boolean;
  address?: string;
  chainId?: string;
  chainName?: string;
  balance?: string;
  nativeCurrency?: {
    name: string;
    symbol: string;
    decimals: number;
  };
};

export function syncWalletState(state: WalletState): void {
  if (import.meta.env.DEV) {
    console.debug("[HeyElsa syncWalletState]", state);
  }
}

export type HeyElsaChatWidgetProps = {
  keyId: string;
  dappName: string;
  messagePort: MessagePort;
  position?: "bottom-right" | "bottom-left" | "top-right" | "top-left";
  onClose?: () => void;
  customStyles?: {
    primaryColor?: string;
    backgroundColor?: string;
    textColor?: string;
    borderRadius?: string;
  };
};

/** Minimal floating panel — swap for real <HeyElsaChatWidget /> when you have the package. */
export function HeyElsaChatWidget({
  keyId,
  dappName,
  messagePort,
  customStyles,
}: HeyElsaChatWidgetProps) {
  const primary = customStyles?.primaryColor ?? "#6366f1";
  return (
    <div
      className="widget-stub"
      style={{
        borderColor: primary,
        color: customStyles?.textColor ?? "#e8e8e8",
        background: customStyles?.backgroundColor ?? "#1a1d24",
        borderRadius: customStyles?.borderRadius ?? "12px",
      }}
    >
      <strong style={{ color: primary }}>{dappName}</strong>
      <p style={{ margin: "0.5rem 0" }}>
        Stub UI — install the official <code>@heyelsa/chat-widget</code> when HeyElsa gives you access.
      </p>
      <p style={{ margin: 0, fontSize: "0.75rem", opacity: 0.8 }}>
        keyId: {keyId}
      </p>
      <p style={{ margin: "0.5rem 0 0", fontSize: "0.75rem", opacity: 0.8 }}>
        Wallet bridge uses <code>messagePort</code> (connected).
      </p>
      <span style={{ display: "none" }}>{String(Boolean(messagePort))}</span>
    </div>
  );
}
