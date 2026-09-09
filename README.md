# BNB-QUSD: Quantum-Resilient Stablecoin & Autonomous Portfolio Optimization Asset

[![BNB Chain](https://img.shields.io/badge/BNB%20Chain-BSC%20%7C%20opBNB%20%7C%20Greenfield-F0B90B?logo=binance)](https://bnbchain.org)
[![Post-Quantum Cryptography](https://img.shields.io/badge/NIST%20PQC-FIPS%20203%20%26%20204-blue)](https://csrc.nist.gov)
[![Reality Gate](https://img.shields.io/badge/Reality%20Gate-16%2F16%20STAGES%20PASSED-brightgreen)](REALITY_MANIFEST.json)
[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](LICENSE)

An institutional-grade, zero-fake-claims stablecoin and decentralized portfolio optimization protocol built on BNB Chain (BSC, opBNB, and BNB Greenfield).

---

## 🏛️ Executive Summary & Resolution of Economic Invariants

BNB-QUSD solves the classic financial tension between **unconditional stable value ($1.00 USD peg)** and **dynamic growth ("unlimited supply")** by architecting a **dual-token Collateralized Debt Position (CDP) model**:

1. **`QUSD` (Stablecoin)**:
   - Target Peg: **\$1.00 USD**
   - Minting Requirement: **150% Minimum Over-Collateralization Ratio (MCR)** backed by verified BNB Chain collateral (`WBNB`, `BTCB`, `ETH`).
   - Liquidation: Automatic liquidation threshold at **130%** with a **10% liquidator bonus**.
   - Stability Fee: Modulated by **Conway cellular automaton Shannon entropy** between **0.5% and 3.0% APR**.
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

## 🚀 Quick Start

### Prerequisites
- Node.js >= 20.0.0
- npm >= 10.0.0

### Installation
```bash
git clone https://github.com/elon00/bnb-qusd.git
cd bnb-qusd
npm install
```

### Compile Smart Contracts
```bash
npm run compile
```

### Run Automated Invariant Tests
```bash
npm test
npm run test:quantum
npm run test:nist
```

### Run 16-Stage Master Universal Reality Gate
```bash
npm run reality:all
```

### Launch Web4 Terminal & Telegram Mini App UI
```bash
npm run ui
# Visit http://localhost:3001
```

---

## 📜 Repository Manifest & Verification

- **Manifest**: [`REALITY_MANIFEST.json`](REALITY_MANIFEST.json)
- **Evidence Registry**: [`bnb-qusd-evidence-registry.json`](bnb-qusd-evidence-registry.json)
- **Tokenomics Specification**: [`docs/TOKENOMICS.md`](docs/TOKENOMICS.md)
- **Architecture Blueprint**: [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)

---

## 🛡️ License
Licensed under the Apache License, Version 2.0.
