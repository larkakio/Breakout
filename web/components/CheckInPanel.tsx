'use client';

import { useMemo, useState } from 'react';
import { encodeFunctionData } from 'viem';
import { base } from 'wagmi/chains';
import {
  getWalletClient,
  reconnect,
  switchChain,
  waitForTransactionReceipt,
  writeContract,
} from 'wagmi/actions';
import { useAccount, useReadContract } from 'wagmi';
import { checkInAbi } from '@/lib/abi/checkIn';
import { resolveDataSuffix } from '@/lib/builder/dataSuffix';
import {
  CHECK_IN_CONTRACT_ADDRESS,
  isCheckInConfigured,
} from '@/lib/contracts/checkInAddress';
import { config } from '@/lib/wagmi/config';

const BASE_ID = base.id;

function formatError(err: unknown): string {
  if (err instanceof Error) {
    const msg = err.message;
    if (msg.includes('User rejected') || msg.includes('user rejected')) {
      return 'Transaction cancelled in wallet.';
    }
    if (msg.includes('already today') || msg.includes('CheckIn: already')) {
      return 'Already synced today. Try again tomorrow.';
    }
    if (msg.includes('Connector not connected')) {
      return 'Wallet disconnected. Tap Connect Wallet, then try again.';
    }
    return msg.length > 140 ? `${msg.slice(0, 140)}…` : msg;
  }
  return 'Transaction failed. Check wallet and Base network.';
}

export function CheckInPanel() {
  const { address, isConnected, chainId, status } = useAccount();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [statusLine, setStatusLine] = useState<string | null>(null);

  const contract = CHECK_IN_CONTRACT_ADDRESS;
  const noContract = !isCheckInConfigured();

  const today = useMemo(
    () => Math.floor(Date.now() / 1000 / 86400),
    [],
  );

  const { data: lastDay, refetch: refetchLastDay } = useReadContract({
    address: contract,
    abi: checkInAbi,
    functionName: 'lastCheckInDay',
    args: address ? [address] : undefined,
    chainId: BASE_ID,
    query: { enabled: Boolean(address && !noContract) },
  });

  const { data: streak, refetch: refetchStreak } = useReadContract({
    address: contract,
    abi: checkInAbi,
    functionName: 'streak',
    args: address ? [address] : undefined,
    chainId: BASE_ID,
    query: { enabled: Boolean(address && !noContract) },
  });

  const checkedInToday =
    lastDay !== undefined && Number(lastDay) >= today;

  const walletReady =
    isConnected && status === 'connected' && Boolean(address);

  async function handleSync() {
    setError(null);
    setStatusLine(null);
    setTxHash(null);

    if (!walletReady || !address) {
      setError('Connect your wallet first.');
      return;
    }
    if (noContract) {
      setError('Check-in contract address is not configured.');
      return;
    }
    if (checkedInToday) {
      setError('Already synced today.');
      return;
    }
    if (busy) return;

    setBusy(true);
    setStatusLine('Preparing…');

    try {
      await reconnect(config);

      if (chainId !== BASE_ID) {
        setStatusLine('Switching to Base…');
        await switchChain(config, { chainId: BASE_ID });
      }

      setStatusLine('Confirm in wallet…');

      const data = encodeFunctionData({
        abi: checkInAbi,
        functionName: 'checkIn',
      });

      const dataSuffix = resolveDataSuffix();
      let hash: `0x${string}`;

      try {
        hash = await writeContract(config, {
          address: contract,
          abi: checkInAbi,
          functionName: 'checkIn',
          chainId: BASE_ID,
          account: address,
          ...(dataSuffix ? { dataSuffix } : {}),
        });
      } catch (writeErr) {
        if (!dataSuffix) throw writeErr;
        setStatusLine('Retrying without builder tag…');
        const walletClient = await getWalletClient(config, { chainId: BASE_ID });
        if (!walletClient) {
          throw new Error('Wallet client unavailable. Reconnect and try again.');
        }
        hash = await walletClient.sendTransaction({
          to: contract,
          data,
          chain: base,
          account: address,
        });
      }

      setTxHash(hash);
      setStatusLine('Waiting for confirmation…');

      await waitForTransactionReceipt(config, {
        hash,
        chainId: BASE_ID,
      });

      await Promise.all([refetchLastDay(), refetchStreak()]);
      setStatusLine(null);
    } catch (err) {
      setStatusLine(null);
      setError(formatError(err));
    } finally {
      setBusy(false);
    }
  }

  let label = 'Daily Sync';
  if (!walletReady) label = 'Connect to Sync';
  else if (noContract) label = 'Contract Not Set';
  else if (checkedInToday) label = 'Synced Today';
  else if (busy) label = statusLine ?? 'Confirm in wallet…';

  return (
    <section className="checkin-panel rounded-lg border border-violet-500/35 bg-black/50 p-2.5 backdrop-blur-md">
      <CheckInHeader streak={streak} checkedInToday={checkedInToday} />
      <button
        type="button"
        className="btn-neon mt-2 w-full"
        disabled={!walletReady || noContract || checkedInToday || busy}
        onClick={() => void handleSync()}
      >
        {label}
      </button>
      {statusLine && busy && !error && (
        <p className="mt-2 text-center text-xs text-cyan-400/80">{statusLine}</p>
      )}
      {error && (
        <p className="mt-2 text-center text-xs text-magenta-400">{error}</p>
      )}
      {txHash && !error && !busy && (
        <p className="mt-2 break-all text-center text-xs text-lime-400/90">
          Synced!{' '}
          <a
            href={`https://basescan.org/tx/${txHash}`}
            target="_blank"
            rel="noreferrer"
            className="underline"
          >
            View tx
          </a>
        </p>
      )}
    </section>
  );
}

function CheckInHeader({
  streak,
  checkedInToday,
}: {
  streak: bigint | undefined;
  checkedInToday: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h2 className="font-display text-sm uppercase tracking-widest text-violet-300">
          Daily Sync
        </h2>
        <p className="text-xs text-zinc-400">On-chain streak on Base</p>
      </div>
      <div className="text-right">
        <span className="font-mono text-2xl text-lime-400">
          {streak !== undefined ? Number(streak) : '—'}
        </span>
        <p className="text-[10px] uppercase text-zinc-500">
          {checkedInToday ? 'Active' : 'Streak'}
        </p>
      </div>
    </div>
  );
}
