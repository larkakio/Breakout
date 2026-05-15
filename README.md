# Neon Breakout — Base App

Mobile-first cyberpunk Breakout with swipe controls, 8 levels, and daily on-chain check-in on Base mainnet.

## Stack

- **Web:** Next.js (App Router), TypeScript, Tailwind, Canvas game engine
- **Chain:** Foundry `CheckIn.sol`, wagmi + viem + `@base-org/account`, ERC-8021 builder codes via `ox`

## Setup

```bash
# Web
cd web && npm install && cp .env.example .env.local

# Contracts
cd contracts && forge test
```

Deploy contract:

```bash
cd contracts
forge script script/Deploy.s.sol --rpc-url $BASE_RPC_URL --broadcast
```

**Deployed CheckIn (Base mainnet):** `0x4bABd6c59335610705D29586f922f5c089BB1437`  
Set `NEXT_PUBLIC_CHECK_IN_CONTRACT_ADDRESS` in Vercel / `web/.env.local` (already in `.env.example`).

**Production:** https://breakout-tau-black.vercel.app  
**Base App ID:** `6a06c69b036192ebadae2851`  
**Builder Code:** `bc_t2oa95ge` (ERC-8021 via `ox` → wagmi `dataSuffix`)

Register on [base.dev](https://base.dev) — upload `web/public/app-icon.jpg` and `app-thumbnail.jpg`.

## Vercel

- Root Directory: `web`
- Env: all `NEXT_PUBLIC_*` variables

## Verify

```bash
cd contracts && forge test
cd web && npm run build
```

- Play level 1 → clear bricks → tap overlay → level 2 loads
- Connect wallet → Daily Sync (Base mainnet, gas only)
- View page source for `<meta name="base:app_id" …>`

## Docs

- [Migrate to Standard Web App](https://docs.base.org/apps/guides/migrate-to-standard-web-app)
- [Builder Codes](https://docs.base.org/apps/builder-codes/builder-codes)
