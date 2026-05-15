'use client';

import { useMemo, useState } from 'react';
import { base } from 'wagmi/chains';
import {
  simulateContract,
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

function formatError(err: unknown): string {
  if (err instanceof Error) {
    const msg = err.message;
    if (msg.includes('User rejected') || msg.includes('user rejected')) {
      return 'Transaction cancelled in wallet.';
    }
    if (msg.includes('already today')) {
      return 'Already synced today. Try again tomorrow.';
    }
    return msg.length > 120 ? `${msg.slice(0, 120)}…` : msg;
  }
  return 'Transaction failed. Check wallet and network.';
}

export function CheckInPanel() {
  const { address, isConnected, chainId } = useAccount();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);

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
    chainId: base.id,
    query: { enabled: Boolean(address && !noContract) },
  });

  const { data: streak, refetch: refetchStreak } = useReadContract({
    address: contract,
    abi: checkInAbi,
    functionName: 'streak',
    args: address ? [address] : undefined,
    chainId: base.id,
    query: { enabled: Boolean(address && !noContract) },
  });

  const checkedInToday =
    lastDay !== undefined && Number(lastDay) >= today;

  async function handleSync() {
    if (!isConnected || !address || noContract || checkedInToday || busy) {
      return;
    }

    setBusy(true);
    setError(null);
    setTxHash(null);

    const baseId = base.id;

    try {
      if (chainId !== baseId) {
        await switchChain(config, { chainId: baseId });
      }

      const dataSuffix = resolveDataSuffix();

      const { request } = await simulateContract(config, {
        address: contract,
        abi: checkInAbi,
        functionName: 'checkIn',
        chainId: baseId,
        account: address,
      });

      const hash = await writeContract(config, {
        ...request,
        chainId: baseId,
        ...(dataSuffix ? { dataSuffix } : {}),
      });

      setTxHash(hash);

      await waitForTransactionReceipt(config, {
        hash,
        chainId: baseId,
      });

      await Promise.all([refetchLastDay(), refetchStreak()]);
    } catch (err) {
      setError(formatError(err));
    } finally {
      setBusy(false);
    }
  }

  let label = 'Daily Sync';
  if (!isConnected) label = 'Connect to Sync';
  else if (noContract) label = 'Contract Not Set';
  else if (checkedInToday) label = 'Synced Today';
  else if (busy) label = 'Confirm in wallet…';

  return (
    <section className="checkin-panel rounded-lg border border-violet-500/35 bg-black/50 p-2.5 backdrop-blur-md">
      <CheckInHeader streak={streak} checkedInToday={checkedInToday} />
      <button
        type="button"
        className="btn-neon mt-2 w-full"
        disabled={
          !isConnected || noContract || checkedInToday || busy
        }
        onClick={() => void handleSync()}
      >
        {label}
      </button>
      {error && (
        <p className="mt-2 text-center text-xs text-magenta-400">{error}</p>
      )}
      {txHash && !error && (
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
      {noContract && (
        <p className="mt-2 text-center text-xs text-zinc-500">
          Set NEXT_PUBLIC_CHECK_IN_CONTRACT_ADDRESS after deploy
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
