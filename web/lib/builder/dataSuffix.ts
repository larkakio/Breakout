import { Attribution } from 'ox/erc8021';
import type { Hex } from 'viem';

/** Builder code from base.dev → Settings → Builder Codes */
export const BUILDER_CODE =
  process.env.NEXT_PUBLIC_BUILDER_CODE ?? 'bc_t2oa95ge';

/**
 * ERC-8021 calldata suffix for transaction attribution.
 * @see https://docs.base.org/apps/builder-codes/app-developers
 */
export function resolveDataSuffix(): Hex | undefined {
  const override = process.env.NEXT_PUBLIC_BUILDER_CODE_SUFFIX;
  if (override?.startsWith('0x')) {
    return override as Hex;
  }

  if (!BUILDER_CODE.startsWith('bc_')) {
    return undefined;
  }

  return Attribution.toDataSuffix({ codes: [BUILDER_CODE] });
}
