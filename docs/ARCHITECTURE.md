# BNB-QUSD: Complete System Architecture & Engineering Blueprint

## 1. Architectural Topology

```
                       +-----------------------------------+
                       |    Web4 Terminal & TMA Interface  |
                       | (Binance Web3 / MetaMask / Trust) |
                       +-----------------+-----------------+
                                         |
                                         v
                       +-----------------------------------+
                       |   Post-Quantum Cryptography Engine|
                       | NIST FIPS 204 (ML-DSA-65 Sign)    |
                       | NIST FIPS 203 (ML-KEM-768 Encap)  |
                       +-----------------+-----------------+
                                         |
               +-------------------------+-------------------------+
               |                                                   |
               v                                                   v
+------------------------------+                 +-----------------------------------+
|     EVM On-Chain Gateway     |                 |    Autonomous Quantitative AI     |
| - PqcCommitmentGateway.sol   |                 | - Discrete QUBO Ising Optimizer   |
| - TimelockGovernor.sol (48h) |                 | - Continuous Markowitz Simplex    |
| - QUSD.sol (BEP-20 Pegged)   |                 | - Conway Cellular Automaton B3/S23|
| - QUSDVault.sol (150% MCR)   |                 +-----------------+-----------------+
| - QBNBAutomaton.sol (Gov)    |                                   |
+--------------+---------------+                                   |
               |                                                   |
               +-------------------------+-------------------------+
                                         |
                                         v
                       +-----------------------------------+
                       |    BNB Chain Multi-Layer Fabric   |
                       | - BSC Testnet (Settlement L1)     |
                       | - opBNB Testnet (High-Speed L2)   |
                       | - Greenfield (AI Weights/Storage) |
                       | - PancakeSwap V3 AMM Liquidity    |
                       +-----------------------------------+
```

---

## 2. Core Subsystems

### 2.1 Smart Contracts (`contracts/`)
1. **`QUSD.sol`**:
   - Standard: BEP-20 token standard on BNB Smart Chain.
   - Access Control: Only the `QUSDVault` contract is authorized to call `mint()` or `burn()`.
   - Emergency Circuit Breaker: Instant pause capability inherited from `Pausable` for black-swan containment.

2. **`QUSDVault.sol`**:
   - Collateralization: 150% Minimum Collateral Ratio (MCR).
   - Liquidation Threshold: 130% Collateral Ratio.
   - Liquidator Incentive: 10% bonus on seized collateral.
   - Stability Fee: Modulated by Conway entropy from 0.5% to 3.0% APR.

3. **`QBNBAutomaton.sol`**:
   - Protocol utility and governance token.
   - Supply Invariant: Hard cap of 2.0% maximum issuance per 30-day epoch.

4. **`PqcCommitmentGateway.sol`**:
   - Trustless bridge between off-chain post-quantum cryptographic primitives and on-chain EVM state.
   - Enforces 32-byte SHA-256 public key commitment storage, strict monotonic nonces (`userNonces[user] + 1`), and block timestamp expiration windows.

5. **`TimelockGovernor.sol`**:
   - 48-Hour delay on all administrative parameter updates.
   - 2-of-3 multi-signature quorum for transaction queuing and execution.
   - Instant fail-closed emergency circuit breaker for immediate protocol halting.

---

### 2.2 Post-Quantum Cryptographic Engine (`src/crypto/`)
- **NIST FIPS 204 (ML-DSA-65)**: Module-Lattice Digital Signature Algorithm providing Category 3 security (equivalent to AES-192). Public key: 1,952 bytes; signature: 3,309 bytes. Tested against Wycheproof bit-tampering vectors.
- **NIST FIPS 203 (ML-KEM-768)**: Module-Lattice Key Encapsulation Mechanism for quantum-resistant shared secret negotiation. Public key: 1,184 bytes; ciphertext: 1,088 bytes; shared secret: 32 bytes.

---

### 2.3 Quantitative & Autonomous Engines (`src/quantum/` & `src/automaton/`)
1. **Discrete QUBO Optimizer (`qubo-portfolio.ts`)**:
   - Builds $6 \times 6$ Ising Hamiltonian matrix across `WBNB`, `BTCB`, `ETH`, `CAKE`, `FDUSD`, and `QUSD`.
   - Employs simulated annealing with quadratic penalty functions $\lambda \left(\sum x_i - 3\right)^2$ to strictly select an optimal 3-asset subset minimizing covariance risk while maximizing expected return.

2. **Continuous Markowitz Optimizer (`markowitz-continuous.ts`)**:
   - Executes projected gradient ascent on the standard simplex ($\sum w_i = 1, w_i \ge 0$).
   - Maximizes Sharpe Ratio against BNB Chain risk-free rates.

3. **Conway Automaton Governor (`conway-ai.ts`)**:
   - 2D toroidal cellular automaton ($18 \times 18$) evaluating $2 \times 2$ block configurations to compute instantaneous Shannon entropy.
   - Translates network complexity into real-time stability fee basis points (50 bps to 300 bps).

---

### 2.4 DEX Market Liquidity (`src/dex/`)
- Integrates PancakeSwap V3 Factory and SwapRouter (`0x1b81D678ffb9C0263b24A97847620C99d213eB14`) on BSC Testnet across fee tiers (0.01%, 0.05%, 0.25%, 1.00%).
- Implements concentrated liquidity tick-math and slippage tolerance boundaries.
