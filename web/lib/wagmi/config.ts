import { createConfig, createStorage, cookieStorage, http } from 'wagmi';
import { base, mainnet } from 'wagmi/chains';
import { baseAccount, injected } from 'wagmi/connectors';
export const config = createConfig({
  chains: [base, mainnet],
  connectors: [
    baseAccount({
      appName: 'Neon Breakout',
    }),
    injected(),
  ],
  storage: createStorage({ storage: cookieStorage }),
  ssr: true,
  transports: {
    [base.id]: http(),
    [mainnet.id]: http(),
  },
});

declare module 'wagmi' {
  interface Register {
    config: typeof config;
  }
}
