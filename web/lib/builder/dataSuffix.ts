import { Attribution } from 'ox/erc8021';
import type { Hex } from 'viem';

export function resolveDataSuffix(): Hex | undefined {
  const override = process.env.NEXT_PUBLIC_BUILDER_CODE_SUFFIX;
  if (override?.startsWith('0x')) {
    return override as Hex;
  }

  const code = process.env.NEXT_PUBLIC_BUILDER_CODE;
  if (!code?.startsWith('bc_')) {
    return undefined;
  }

  return Attribution.toDataSuffix({ codes: [code] });
}
