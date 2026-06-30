# Contributing to Traverse Protocol

Thanks for your interest in contributing. Traverse is an intent-based cross-chain liquidity router, and it gets better with every solver operator, auditor, and developer who gets involved. This document explains how to contribute effectively.

## Ways to Contribute

- **Report bugs** — open an issue (for non-security bugs) with clear reproduction steps.
- **Report vulnerabilities** — privately, per [SECURITY.md](./SECURITY.md). Never in a public issue.
- **Run a solver** — test the network on testnet and share what breaks. See the solver guide.
- **Improve docs** — corrections and clarifications are always welcome.
- **Submit code** — fixes and features via pull request (read below first).

## Before You Start

- Check existing issues and PRs to avoid duplicate work.
- For anything non-trivial, open an issue to discuss the approach **before** writing code. This saves everyone time.
- By contributing, you agree your contributions are licensed under the repository's license.

## Development Setup

```bash
git clone https://github.com/DeveloperDefi/traverse-protocol.git
cd traverse-protocol
npm install
cp .env.example .env   # fill in testnet values; never commit .env
```

Tooling:

- **Solidity** 0.8.24
- **OpenZeppelin** 5.x
- **Hardhat** for compilation, testing, and scripts

Useful commands:

```bash
npx hardhat compile     # compile contracts
npx hardhat test        # run the test suite
npx hardhat coverage    # coverage report
```

## Pull Request Guidelines

1. **Branch** from `main` with a descriptive name (`fix/staking-reward-rounding`, `feat/solver-gas-estimator`).
2. **Keep PRs focused.** One logical change per PR. Smaller is easier to review.
3. **Tests required.** Any change to contract logic must include or update Hardhat tests. PRs that reduce coverage or skip tests for contract changes will not be merged.
4. **All tests must pass** and contracts must compile cleanly before review.
5. **Document behavior changes** — update NatSpec comments and relevant docs.
6. **Describe your change** in the PR: what, why, and how you tested it. Reference any related issue.

## Coding Standards

- Follow the existing style; run the formatter/linter before committing.
- Use clear, descriptive names. Favor readability over cleverness in security-critical code.
- Write NatSpec (`@notice`, `@param`, `@return`) for all public and external functions.
- Be explicit about units, decimals, and rounding direction in financial math.
- Prefer checks-effects-interactions; guard against reentrancy on state-changing external calls.

## Security-Sensitive Areas

Extra scrutiny applies to changes touching:

- Settlement and cross-chain delivery
- Staking, slashing, and the unstake cooldown
- Fee accounting and distribution (70% stakers / 20% treasury / 10% ops)
- Governance and the timelock

Changes here should be small, well-tested, and clearly explained. When in doubt, open an issue first.

## Commit Messages

Write clear, imperative commit messages: `Fix slashing bypass on early unstake`, not `fixed stuff`. Conventional-commit prefixes (`fix:`, `feat:`, `test:`, `docs:`) are encouraged.

## Community & Conduct

Be respectful and constructive. We follow a standard code of conduct: no harassment, no spam, no self-promotion in issues/PRs. Discussion happens in Discord:

- Discord: https://discord.gg/vCAyXMkjf
- Site: https://traverseprotocol.io
- X: https://x.com/TRVProtocol

Thanks for helping build Traverse.
