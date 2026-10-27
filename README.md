# ⚡ Traverse Protocol (TRV)

> **Cross-chain liquidity, routed by intent.**

> 🪙 **$TRV is live on Solana** — fair launch on pump.fun, October 27, 2026
> CA: `AqYxQFndwosnbXeQXXnqyJUw471YddxbZqkwosDvpump` · [pump.fun](https://pump.fun/coin/AqYxQFndwosnbXeQXXnqyJUw471YddxbZqkwosDvpump) · [Discord](https://discord.gg/xA6KsAnhM) · [X](https://x.com/TRVProtocol)
> Any other "TRV" is not affiliated with this project.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)
[![Solidity](https://img.shields.io/badge/Solidity-0.8.24-363636.svg?logo=solidity)](https://soliditylang.org/)
[![OpenZeppelin](https://img.shields.io/badge/OpenZeppelin-5.x-4E5EE4.svg)](https://www.openzeppelin.com/)
[![Built with Hardhat](https://img.shields.io/badge/Built%20with-Hardhat-FFF100.svg)](https://hardhat.org/)
[![CI](https://github.com/DeveloperDefi/traverse-protocol/actions/workflows/test.yml/badge.svg)](https://github.com/DeveloperDefi/traverse-protocol/actions/workflows/test.yml)
[![Status: Testnet](https://img.shields.io/badge/status-testnet-orange.svg)](#-status)

Traverse is a cross-chain liquidity routing protocol with intent-based execution and competitive solver auctions. Users submit signed intents, solvers compete to provide the best execution, and TRV token coordinates the network.

---

## 🔍 What Problem Does Traverse Solve?

Liquidity in DeFi is fragmented across 60+ blockchains and hundreds of DEXs. Users face:
- High slippage from fragmented order books
- Manual bridge complexity
- Poor execution with no competition

**Traverse unifies this into a single flow:** submit an intent, get the best cross-chain execution automatically.

---

## 🏗️ How It Works

```
User → Signs Intent (EIP-712) → Solver Auction → Best Solver Executes → User Receives Tokens
```

1. **User** submits a signed intent: "I want X token on chain Y, minimum Z output"
2. **Solver Network** (TRV-staked entities) compete in a Dutch auction
3. **Winning Solver** executes the cross-chain transaction atomically
4. **Settlement** delivers tokens to user; protocol collects 0.05% fee

---

## 🪙 TRV Token

| Property | Value |
|---|---|
| Network | Solana (SPL token) |
| Contract | `AqYxQFndwosnbXeQXXnqyJUw471YddxbZqkwosDvpump` |
| Total Supply | 1,000,000,000 TRV (fixed; mint authority revoked) |
| Launch | Fair launch on pump.fun, Oct 27, 2026: no presale, no team or investor allocation |

**Planned utilities (not live yet).** The protocol contracts in this repo target Base (EVM). TRV will be bridged to Base with a supply-preserving bridge, and the utilities below activate only after the contracts and bridge are audited:
- **Solver Staking**: minimum 10,000 TRV as slashable collateral
- **Governance**: 1 staked TRV = 1 vote over fees, parameters, treasury and upgrades
- **Fee Discount**: up to 50% off the 0.05% routing fee by holding TRV
- **Fee Distribution**: proposed share of protocol fees for stakers, subject to legal review and governance

> `contracts/TRV.sol` is the original ERC-20 design and is superseded by the Solana launch. It will be replaced by the bridged TRV representation on Base.

---

## 📁 Repository Structure

```
traverse-protocol/
├── contracts/
│   ├── TRV.sol                # Original ERC-20 design (superseded by Solana launch)
│   ├── TraverseIntent.sol       # Intent structure + EIP-712 signing
│   ├── TraverseRouter.sol       # Core routing + solver competition
│   ├── TraverseStaking.sol      # Staking + revenue distribution
│   ├── TraverseGovernor.sol     # On-chain governance
│   ├── TraverseTimelock.sol     # 48h timelock for governance actions
│   └── TraverseTreasury.sol     # Protocol treasury (governance-controlled)
├── scripts/
│   └── deploy.js              # Hardhat deployment script
├── docs/
│   ├── Traverse_Whitepaper_v2.0.pdf
│   └── Traverse_Tokenomics_TRV_v2.0.pdf
├── hardhat.config.js
├── package.json
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Install Dependencies

```bash
npm install
```

### Configure Environment

```bash
cp .env.example .env
# Fill in your PRIVATE_KEY and RPC URLs
```

### Compile Contracts

```bash
npm run compile
```

### Run Tests

```bash
npm test
```

### Deploy to Testnet (Base Sepolia)

```bash
npm run deploy:base-sepolia
```

### Deploy to Mainnet

```bash
npm run deploy:base
```

---

## 🔐 Security

- All contracts use OpenZeppelin 5.x audited libraries
- ReentrancyGuard on all state-changing external functions
- Checks-Effects-Interactions pattern throughout
- 48-hour Timelock on all governance actions
- Treasury multisig (Safe) + timelock — planned before mainnet
- Independent audit required before mainnet

> ⚠️ **These contracts are unaudited. Do not use in production without a full security audit.**

---

## 📊 Tokenomics

| Bucket | Approx. TRV | Approx. % | Notes |
|---|---|---|---|
| pump.fun bonding curve | ~793,100,000 | ~79.3% | Sold openly on the curve |
| Liquidity reserve | ~206,900,000 | ~20.7% | Migrated to an AMM pool at graduation |
| Team / investors / treasury | 0 | 0% | No pre-allocation. Creator buy at launch: 0 |

**Disclosed team holdings:** after launch the creator bought ~6.22M TRV (~0.62%) on the open curve, wallet [`3q2URVEc95XScuN8g15FndYjntNshgiCMHT7B8ZDHDgN`](https://solscan.io/account/3q2URVEc95XScuN8g15FndYjntNshgiCMHT7B8ZDHDgN). Not locked.

Figures follow pump.fun's standard launch parameters; verify on-chain. Any team position will be disclosed publicly (wallet, amount, lock terms). The project is funded by pump.fun creator fees (paid in SOL). Full details: [TRV Tokenomics v2.0](docs/Traverse_Tokenomics_TRV_v2.0.pdf).

**Proposed protocol fee:** 0.05% of routed volume → 70% stakers / 20% treasury / 10% operations, governance-controlled, and only after audit and legal review.

> **Disclaimer:** Nothing in this repository constitutes investment advice or an offer of securities. TRV has no live protocol utility yet. Contracts are unaudited and in active development.

---

## 🗺️ Roadmap

| Quarter | Milestone |
|---|---|
| Q4 2026 | ✅ TRV fair launch on pump.fun · Public testnet on Base Sepolia · Solver reference bot |
| Q1 2027 | Bridge design + testnet integration with test TRV · Audit scoping |
| Q2 2027 | Independent audit · Bug bounty · Bridge TRV to Base |
| H2 2027 | Mainnet beta on Base (capped volume) · Staking + governance activation |
| 2028 | More chains · Solver SDK · Progressive decentralization |

*Targets, not commitments.*

---

## ⚖️ Competitive Landscape

| Feature | Traverse ✓ | 1inch | Jupiter | LiFi | CoW |
|---|---|---|---|---|---|
| Native cross-chain | ✓ | Partial | ✗ | ✓ | ✗ |
| Solver competition | ✓ | ✗ | ✗ | ✗ | ✓ |
| Intent-based | ✓ | ✗ | ✗ | ✗ | ✓ |
| Multi-chain launch | ✓ | ✗ | Solana only | ✓ | ✗ |
| Staker fee share (planned) | ✓ | ✗ | ✗ | ✗ | Partial |

---

## 📄 Documentation

- [Whitepaper v2.0 (PDF)](docs/Traverse_Whitepaper_v2.0.pdf) · [DOCX](Traverse_Whitepaper_v2.0.docx)
- [TRV Tokenomics v2.0 (PDF)](docs/Traverse_Tokenomics_TRV_v2.0.pdf) · [DOCX](Traverse_Tokenomics_TRV_v2.0.docx)

---

## ⚠️ Disclaimer

This repository is for informational and development purposes only. TRV tokens represent utility and governance rights within the Traverse Protocol. Nothing in this repository constitutes financial, legal, or investment advice. Investments in digital assets carry substantial risk including total loss of capital. Consult qualified legal and financial advisors before making any investment decisions.

---

## 📬 Contact

- Website: [traverse-protocol.netlify.app](https://traverse-protocol.netlify.app)
- X: [@TRVProtocol](https://x.com/TRVProtocol)
- Discord: [discord.gg/xA6KsAnhM](https://discord.gg/xA6KsAnhM)

---

*Built with ❤️ by the Traverse Protocol team*
