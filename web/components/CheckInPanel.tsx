'use client';

import { useMemo } from 'react';
import { base } from 'wagmi/chains';
import {
  useAccount,
  useReadContract,
  useSwitchChain,
  useWriteContract,
} from 'wagmi';
import { checkInAbi } from '@/lib/abi/checkIn';
import { resolveDataSuffix } from '@/lib/builder/dataSuffix';

const ZERO = '0x0000000000000000000000000000000000000000' as const;

export function CheckInPanel() {
  const { address, isConnected, chainId } = useAccount();
  const { switchChainAsync, isPending: isSwitching } = useSwitchChain();
  const { writeContractAsync, isPending: isWriting } = useWriteContract();

  const contract = process.env.NEXT_PUBLIC_CHECK_IN_CONTRACT_ADDRESS as
    | `0x${string}`
    | undefined;

  const today = useMemo(
    () => Math.floor(Date.now() / 1000 / 86400),
    [],
  );

  const { data: lastDay } = useReadContract({
    address: contract,
    abi: checkInAbi,
    functionName: 'lastCheckInDay',
    args: address ? [address] : undefined,
    query: { enabled: Boolean(contract && address) },
  });

  const { data: streak } = useReadContract({
    address: contract,
    abi: checkInAbi,
    functionName: 'streak',
    args: address ? [address] : undefined,
    query: { enabled: Boolean(contract && address) },
  });

  const checkedInToday =
    lastDay !== undefined && Number(lastDay) >= today;

  const noContract = !contract || contract === ZERO;

  async function handleSync() {
    if (!isConnected || !address || noContract) return;

    const baseId = base.id;
    if (chainId !== baseId) {
      await switchChainAsync({ chainId: baseId });
    }

    const dataSuffix = resolveDataSuffix();
    await writeContractAsync({
      address: contract!,
      abi: checkInAbi,
      functionName: 'checkIn',
      chainId: baseId,
      ...(dataSuffix ? { dataSuffix } : {}),
    });
  }

  const busy = isSwitching || isWriting;
  let label = 'Daily Sync';
  if (!isConnected) label = 'Connect to Sync';
  else if (noContract) label = 'Contract Not Set';
  else if (checkedInToday) label = 'Synced Today';
  else if (busy) label = isSwitching ? 'Switching…' : 'Signing…';

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
