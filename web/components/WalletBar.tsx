'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { base } from 'wagmi/chains';
import {
  useAccount,
  useConnect,
  useConnectors,
  useDisconnect,
  useSwitchChain,
} from 'wagmi';

export function WalletBar() {
  const [mounted, setMounted] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const { address, isConnected, chainId } = useAccount();
  const { connect, isPending: isConnecting } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChain, isPending: isSwitching } = useSwitchChain();
  const connectors = useConnectors();

  const wrongNetwork = isConnected && chainId !== base.id;
  const short = address
    ? `${address.slice(0, 6)}…${address.slice(-4)}`
    : '';

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!sheetOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [sheetOpen]);

  const sheet =
    mounted && sheetOpen
      ? createPortal(
          <div
            className="fixed inset-0 z-[9999] flex items-end justify-center bg-black/70 backdrop-blur-sm"
            role="presentation"
            onClick={() => setSheetOpen(false)}
          >
            <WalletSheet
              connectors={connectors}
              isConnecting={isConnecting}
              onClose={() => setSheetOpen(false)}
              onPick={(connector) => {
                connect({ connector, chainId: base.id });
                setSheetOpen(false);
              }}
            />
          </div>,
          document.body,
        )
      : null;

  return (
    <>
      <div className="wallet-bar safe-bottom">
        {wrongNetwork && (
          <WrongNetworkBanner
            isSwitching={isSwitching}
            onSwitch={() => switchChain({ chainId: base.id })}
          />
        )}
        <div className="flex items-center justify-between gap-3 rounded-xl border border-cyan-500/40 bg-black/60 px-4 py-3 backdrop-blur-md">
          <span className="font-display text-xs uppercase tracking-[0.2em] text-cyan-300/80">
            Wallet
          </span>
          {isConnected ? (
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm text-lime-300">{short}</span>
              <button
                type="button"
                className="btn-ghost text-xs"
                onClick={() => disconnect()}
              >
                Disconnect
              </button>
            </div>
          ) : (
            <button
              type="button"
              className="btn-neon"
              onClick={() => setSheetOpen(true)}
            >
              Connect Wallet
            </button>
          )}
        </div>
      </div>
      {sheet}
    </>
  );
}

function WrongNetworkBanner({
  isSwitching,
  onSwitch,
}: {
  isSwitching: boolean;
  onSwitch: () => void;
}) {
  return (
    <div className="mb-2 rounded-lg border border-magenta-500/50 bg-magenta-950/40 px-3 py-2 text-center text-sm text-magenta-200">
      Wrong network — switch to Base
      <button
        type="button"
        className="btn-neon ml-2 inline-block px-3 py-1 text-xs"
        disabled={isSwitching}
        onClick={onSwitch}
      >
        {isSwitching ? 'Switching…' : 'Switch'}
      </button>
    </div>
  );
}

function WalletSheet({
  connectors,
  isConnecting,
  onClose,
  onPick,
}: {
  connectors: ReturnType<typeof useConnectors>;
  isConnecting: boolean;
  onClose: () => void;
  onPick: (connector: (typeof connectors)[number]) => void;
}) {
  return (
    <div
      className="mb-[env(safe-area-inset-bottom)] w-full max-w-lg rounded-t-2xl border border-cyan-500/30 bg-[#0a0a12] p-4 shadow-[0_0_40px_rgba(0,245,255,0.15)]"
      role="dialog"
      aria-modal="true"
      aria-label="Connect wallet"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-display text-lg text-cyan-300">Connect Wallet</h2>
        <button
          type="button"
          className="btn-ghost px-2"
          aria-label="Close"
          onClick={onClose}
        >
          ✕
        </button>
      </div>
      <ul className="max-h-[50vh] space-y-2 overflow-y-auto">
        {connectors.length === 0 ? (
          <li className="py-4 text-center text-sm text-zinc-400">
            No wallets detected. Open in Base App or install a browser wallet.
          </li>
        ) : (
          connectors.map((c) => (
            <li key={c.uid}>
              <button
                type="button"
                className="w-full rounded-lg border border-violet-500/30 px-4 py-3 text-left text-sm transition hover:border-cyan-400/60 hover:bg-cyan-950/30 disabled:opacity-50"
                disabled={isConnecting}
                onClick={() => onPick(c)}
              >
                {c.name}
              </button>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
