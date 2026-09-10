# BNB-QUSD — Quantum-Resilient Stablecoin Research Infrastructure

> **Reality-first CDP, PQC gateway and portfolio-optimization prototype on BNB Chain.**
>
> This repository separates executable evidence from simulations, integrations, and future production claims.

## Reality Status — September 2026

| Area | Reality status | Evidence / limitation |
|---|---|---|
| BSC Testnet lifecycle | 🟢 **REPOSITORY E2E EVIDENCE** | `docs/TESTNET_E2E_EVIDENCE.md` records a BSC Testnet lifecycle at block `130126185` for the configured deployer and reports deposit, mint, repayment, liquidation and circuit-breaker invariants passing. |
| QUSD CDP logic | 🟢 **TESTED** | 150% minimum collateral ratio, 130% liquidation threshold and oracle safeguards are implemented/tested according to the repository evidence. |
| PQC | 🟡 **EXPERIMENTAL / TESTED** | ML-DSA-65 and ML-KEM-768 gateway integration is implemented; this is not a claim of independently audited end-to-end quantum-safe security. |
| Quantum portfolio engine | 🟡 **SIMULATION / NUMERICAL MODEL** | QUBO and Markowitz engines are software/numerical models, not execution on a physical quantum computer. |
| PancakeSwap | 🟡 **INTEGRATION / TESTNET** | Router integration and AMM calculations exist; this does not by itself prove sustained live liquidity or real market activity. |
| Mainnet | 🔒 **NOT CLAIMED** | No mainnet production deployment is claimed here. |
| Production readiness | 🟡 **NOT INDEPENDENTLY CERTIFIED** | Internal tests, static analysis and reality gates are engineering evidence, not an independent security or production certification. |
| Market readiness | 🟡 **NOT PROVEN** | Real users, sustained liquidity/volume, operational history, independent review and applicable legal/compliance requirements remain separate gates. |

## Current Reality Verdict

**BNB-QUSD has substantial testnet-oriented implementation and repository-recorded E2E lifecycle evidence, but this README does not label it as an independently audited, mainnet-live stablecoin or market-proven production system.**

## 🧩 Architecture

- **QUSD** — over-collateralized BEP-20 stablecoin model.
- **QUSDVault** — collateral, debt, repayment and liquidation logic.
- **PqcCommitmentGateway** — ML-DSA-65 / ML-KEM-768 commitment and attestation layer.
- **TimelockGovernor** — 48-hour delay, 2-of-3 governance model and emergency pause logic.
- **Conway engine** — deterministic numerical entropy model for policy experimentation.
- **QUBO / Markowitz** — portfolio optimization research models.
- **PancakeSwap integration** — BSC Testnet AMM integration/quote logic.

## 🔎 Testnet Evidence

`docs/TESTNET_E2E_EVIDENCE.md` records:

- Network: BNB Smart Chain Testnet, Chain ID 97.
- Execution ID: `LIFECYCLE-BSC-1789003307892`.
- Verified block reported by the repository: `130126185`.
- Deployer: `0x7e490297be89C34C1A2F3B90aeE97298a80871eF`.
- Lifecycle stages reported PASS: collateral deposit, stablecoin mint, repayment/redemption, liquidation trigger and circuit-breaker interception.

These records should be independently rechecked against the BSC Testnet explorer before being treated as external production-grade proof.

## 🛡️ Reality Taxonomy

- `REAL_VERIFIED` — specific claim has reproducible external/state evidence.
- `REAL_UNVERIFIED` — implementation exists but external proof is incomplete.
- `EXPERIMENTAL` — prototype/research implementation.
- `SIMULATION` — mathematical model, not live financial execution.
- `ROADMAP` — planned capability.
- `BLOCKED` — intentionally unavailable until evidence requirements pass.

## 🚀 Verification

```bash
npm install
npm run compile
npm test
npm run test:quantum
npm run test:nist
npm run test:fuzz
npm run audit:security
npm run reality:all
npm run lifecycle:e2e
```

**Important:** a passing local test or internal reality gate proves only the assertions covered by that test. It does not create an independent audit, guarantee a $1 peg, or establish market readiness.

## License

Apache-2.0.
