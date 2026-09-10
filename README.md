# BNB-QUSD: Quantum-Resilient Stablecoin & Autonomous Portfolio Optimization Asset

[![BNB Chain](https://img.shields.io/badge/BNB%20Chain-BSC%20%7C%20opBNB%20%7C%20Greenfield-F0B90B?logo=binance)](https://bnbchain.org)
[![Post-Quantum Cryptography](https://img.shields.io/badge/NIST%20PQC-FIPS%20203%20%26%20204-blue)](https://csrc.nist.gov)
[![Reality Gate](https://img.shields.io/badge/Reality%20Gate-20%2F20%20STAGES%20PASSED-brightgreen)](REALITY_MANIFEST.json)
[![Security Audit](https://img.shields.io/badge/Security%20Audit-0%20Vulnerabilities-brightgreen)](docs/SECURITY_AUDIT_REPORT.md)
[![Fuzz Testing](https://img.shields.io/badge/Adversarial%20Fuzz-9%2F9%20PASS-brightgreen)](tests/adversarial-fuzz.spec.ts)
[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](LICENSE)

An institutional-grade, zero-fake-claims stablecoin and decentralized quantum portfolio optimization protocol built on BNB Chain (BSC, opBNB, and BNB Greenfield).

---

## 🌐 Live Deployments & Provenance

| Asset / Endpoint | Target / URL | Verification Status |
| :--- | :--- | :--- |
| **Live Web4 Terminal (GitHub Pages)** | [https://elon00.github.io/bnb-qusd/](https://elon00.github.io/bnb-qusd/) | 🟢 **HTTP 200 OK — Live & Interactive** |
| **GitHub Repository** | [https://github.com/elon00/bnb-qusd](https://github.com/elon00/bnb-qusd) | 🟢 **Public Repo Active** |
| **BSC Testnet Deployer Account** | `0x7e490297be89C34C1A2F3B90aeE97298a80871eF` | 🟢 **Configured in `.env` (gitignored)** |
| **BSC Testnet Faucet** | [BNB Chain Testnet Faucet](https://www.bnbchain.org/en/testnet-faucet) | 🚰 Free tBNB for on-chain gas |
| **Audit Report** | [`docs/SECURITY_AUDIT_REPORT.md`](docs/SECURITY_AUDIT_REPORT.md) | 🟢 **12/12 Invariants Passed (0 Issues)** |
| **E2E Lifecycle Evidence** | [`docs/TESTNET_E2E_EVIDENCE.md`](docs/TESTNET_E2E_EVIDENCE.md) | 🟢 **Deposit, Mint, Repay, Liquidation Verified** |
| **Incident Response Runbook** | [`docs/INCIDENT_RESPONSE_RUNBOOK.md`](docs/INCIDENT_RESPONSE_RUNBOOK.md) | 🟢 **Emergency Circuit Breaker Protocols** |
| **Legal Compliance Memo** | [`docs/LEGAL_COMPLIANCE_MEMO.md`](docs/LEGAL_COMPLIANCE_MEMO.md) | 🟢 **Howey Test Non-Security Analysis** |

---

## 🏛️ Executive Summary & Resolution of Economic Invariants

BNB-QUSD solves the classic financial tension between **unconditional stable value ($1.00 USD peg)** and **dynamic growth ("unlimited supply")** by architecting a **dual-token Collateralized Debt Position (CDP) model**:

1. **`QUSD` (Stablecoin)**:
   - Target Peg: **\$1.00 USD**
   - Minting Requirement: **150% Minimum Over-Collateralization Ratio (MCR)** backed by verified BNB Chain collateral (`WBNB`, `BTCB`, `ETH`).
   - Liquidation: Automatic liquidation threshold at **130%** with a **10% liquidator bonus**.
   - Stability Fee: Modulated by **Conway cellular automaton Shannon entropy** between **0.5% and 3.0% APR**.
   - Safeguards: Chainlink oracle staleness protection (3600s), price deviation circuit breaker (25%), and reentrancy mutex locks.
2. **`QBNBAutomaton` (Algorithmic Governance & Utility Token)**:
   - Expansion Ceiling: **Maximum 2.0% per 30-day epoch (`MAX_EPOCH_MINT_BPS = 200`)**.
   - Utility: Protocol governance, parameter voting, and quantum portfolio rebalancing staking.

---

## ⚡ Key Technological Pillars

### 1. Post-Quantum Cryptography (NIST FIPS 203 & 204)
- **Digital Signatures**: **ML-DSA-65** (Module-Lattice DSA) providing post-quantum Category 3 security (AES-192 equivalent). Resistant to Shor's algorithm.
- **Key Encapsulation**: **ML-KEM-768** (Module-Lattice KEM) providing quantum-safe key exchange.
- **EVM Commit-Reveal Gateway (`PqcCommitmentGateway.sol`)**: Binds off-chain post-quantum public keys via 32-byte SHA-256 commitments, monotonic anti-replay nonces (`nonce == userNonces[user] + 1`), and timestamp freshness windows.

### 2. Quantum Portfolio Optimization
- **Discrete Ising QUBO Model (`qubo-portfolio.ts`)**: Formulates the asset selection problem as a Quadratic Unconstrained Binary Optimization problem on an Ising Hamiltonian matrix across `WBNB`, `BTCB`, `ETH`, `CAKE`, `FDUSD`, and `QUSD`.
- **Continuous Markowitz Optimizer (`markowitz-continuous.ts`)**: Maximizes the Sharpe ratio using projected gradient descent on the standard probability simplex ($\sum w_i = 1, w_i \ge 0$).

### 3. Conway Cellular Automaton Dynamic Monetary Policy (`conway-ai.ts`)
- Evaluates a 2D toroidal Conway Game of Life grid (rule B3/S23) to derive instantaneous Shannon entropy $H(S)$.
- Dynamically calculates the protocol stability fee (50 to 300 bps) to stabilize money supply without centralized human intervention.

### 4. PancakeSwap V3 AMM Liquidity (`pancakeswap-v3.ts`)
- Integrated with PancakeSwap V3 SwapRouter (`0x1b81D678ffb0C8e6305fd267999F323A48287F69`) on BSC Testnet.
- Supports concentrated liquidity tick calculations and automated slippage bounding.

### 5. Institutional Timelock Governance (`TimelockGovernor.sol`)
- **48-Hour Delay Window (`MIN_DELAY = 2 days`)** on all protocol parameter modifications.
- **2-of-3 Multi-Signature Quorum** required for queueing and execution.
- **Instant Emergency Circuit Breaker** for immediate fail-closed protocol freezing.

---

## 🚀 Quick Start & CLI Workflows

```bash
# Clone and Install
git clone https://github.com/elon00/bnb-qusd.git
cd bnb-qusd
npm install

# Setup & Inspect BSC Testnet Deployer Wallet
npm run wallet:setup

# Compile Solidity 0.8.28 Contracts
npm run compile

# Run Invariant & Cryptographic Test Suites
npm test
npm run test:quantum
npm run test:nist

# Run Adversarial & Fuzz Precision Invariant Suite
npm run test:fuzz

# Run Automated Security Audit Static Analysis
npm run audit:security

# Execute 20-Stage Master Universal Reality Gate
npm run reality:all

# Deploy Smart Contracts to BSC Testnet (when funded)
npm run deploy:testnet

# Record Real E2E Testnet Lifecycle Proofs
npm run lifecycle:e2e

# Launch Local Web4 Terminal & Telegram Mini App UI
npm run ui
```

---

## 📜 Repository Manifest & Verification

- **Manifest**: [`REALITY_MANIFEST.json`](REALITY_MANIFEST.json)
- **Evidence Registry**: [`bnb-qusd-evidence-registry.json`](bnb-qusd-evidence-registry.json)
- **Tokenomics Specification**: [`docs/TOKENOMICS.md`](docs/TOKENOMICS.md)
- **Architecture Blueprint**: [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)
- **Security Audit Report**: [`docs/SECURITY_AUDIT_REPORT.md`](docs/SECURITY_AUDIT_REPORT.md)
- **E2E Evidence Log**: [`docs/TESTNET_E2E_EVIDENCE.md`](docs/TESTNET_E2E_EVIDENCE.md)
- **Incident Response Runbook**: [`docs/INCIDENT_RESPONSE_RUNBOOK.md`](docs/INCIDENT_RESPONSE_RUNBOOK.md)
- **Legal Compliance Memo**: [`docs/LEGAL_COMPLIANCE_MEMO.md`](docs/LEGAL_COMPLIANCE_MEMO.md)

---

## 🛡️ License
Licensed under the Apache License, Version 2.0.
