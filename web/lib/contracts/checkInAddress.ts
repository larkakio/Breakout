export const CHECK_IN_CONTRACT_ADDRESS =
  (process.env.NEXT_PUBLIC_CHECK_IN_CONTRACT_ADDRESS ??
    '0x4bABd6c59335610705D29586f922f5c089BB1437') as `0x${string}`;

export const ZERO_ADDRESS =
  '0x0000000000000000000000000000000000000000' as const;

export function isCheckInConfigured(): boolean {
  return (
    CHECK_IN_CONTRACT_ADDRESS.length > 0 &&
    CHECK_IN_CONTRACT_ADDRESS !== ZERO_ADDRESS
  );
}
