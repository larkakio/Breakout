import { createConfig, createStorage, cookieStorage, http } from 'wagmi';
import { base, mainnet } from 'wagmi/chains';
import { baseAccount, injected } from 'wagmi/connectors';
import { resolveDataSuffix } from '@/lib/builder/dataSuffix';

export const config = createConfig({
  chains: [base, mainnet],
  connectors: [
    injected(),
    baseAccount({
      appName: 'Neon Breakout',
    }),
  ],
  storage: createStorage({ storage: cookieStorage }),
  ssr: true,
  transports: {
    [base.id]: http(),
    [mainnet.id]: http(),
  },
  dataSuffix: resolveDataSuffix(),
});

declare module 'wagmi' {
  interface Register {
    config: typeof config;
  }
}
