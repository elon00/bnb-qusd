# BNB-QUSD: Cryptographic Tokenomics & Quantitative Monetary Policy

## 1. Executive Summary & Resolution of the Dual-Constraint Invariant

The BNB-QUSD protocol resolves the foundational economic paradox between **unconditional stable value ($1.00 USD peg)** and **expansionary utility ("unlimited supply")** by architecting a **dual-token collateralized monetary system**:

1. **`QUSD` (Autonomous Over-Collateralized Stablecoin)**:
   - **Peg Target**: Strictly \$1.00 USD.
   - **Supply Dynamic**: Elastic and debt-backed. Supply can expand indefinitely to satisfy market liquidity demand, but *only* under the condition that every 1.00 QUSD minted is backed by at least \$1.50 (150%) of verified crypto collateral (WBNB, BTCB, ETH).
   - **Invariant**: If collateral drops below 130%, the vault enters automatic liquidation with a 10% liquidator bonus.

2. **`QBNBAutomaton` (Ecosystem Governance & Algorithmic Utility Token)**:
   - **Utility**: Protocol governance, timelock voting, Conway automaton parameter setting, and portfolio rebalancing staking.
   - **Supply Dynamic**: Controlled expansion with an invariant hard ceiling: **Maximum 2.0% per 30-day epoch (`MAX_EPOCH_MINT_BPS = 200`)**, modulated by the Shannon entropy of the Conway Cellular Automaton.

---

## 2. Mathematical CDP Vault Mechanics

### 2.1 Over-Collateralization Ratio (CR)
For an individual vault with collateral balance $C$, collateral market price $P_c$ (USD), and minted debt $D$ (QUSD):

$$\text{CR} = \frac{C \cdot P_c}{D}$$

The protocol enforces:
- **Minimum Mint Collateral Ratio (MCR)**: $\text{CR}_{\min} = 150\%$ (`15,000` basis points)
- **Liquidation Threshold**: $\text{CR}_{\text{liq}} = 130\%$ (`13,000` basis points)
- **Liquidation Bonus**: $\beta_{\text{liq}} = 10\%$ (`1,000` basis points)

### 2.2 Liquidation Invariant
When $\text{CR} < \text{CR}_{\text{liq}}$, any liquidator can repay debt $D_{\text{repay}}$ in exchange for collateral:

$$C_{\text{seized}} = \frac{D_{\text{repay}} \cdot (1 + \beta_{\text{liq}})}{P_c}$$

This ensures that liquidators are economically incentivized to liquidate under-collateralized vaults before solvency is compromised, maintaining the \$1.00 USD peg through all market downturns.

---

## 3. Conway Cellular Automaton Dynamic Stability Fee

Unlike static stability fees in legacy MakerDAO deployments, BNB-QUSD derives its borrowing rate dynamically from a 2D toroidal Conway Cellular Automaton ($N \times N = 100$ cells, rule B3/S23):

1. **Shannon Entropy Formulation**:
   $$p_1 = \frac{\sum_{i,j} S_{i,j}}{N^2}, \quad p_0 = 1 - p_1$$
   $$H(S) = - \left( p_0 \log_2(p_0) + p_1 \log_2(p_1) \right)$$

2. **Stability Fee Modulation**:
   The annual borrowing stability fee $r_{\text{fee}}$ is modulated between **0.50% (50 bps)** and **3.00% (300 bps)**:

   $$r_{\text{fee}} = r_{\min} + \frac{H(S)}{H_{\max}} \cdot (r_{\max} - r_{\min})$$

   High network entropy (activity, volatility) raises stability fees to encourage debt repayment and collateral fortification; low entropy lowers fees to stimulate credit expansion.

---

## 4. Quantum Portfolio Optimization Models

BNB-QUSD integrates both discrete and continuous quantitative models across 6 primary BNB Chain reserve assets: `WBNB`, `BTCB`, `ETH`, `CAKE`, `FDUSD`, and `QUSD`.

### 4.1 Discrete Ising QUBO Hamiltonian
Formulated for quantum annealers (D-Wave, IBM Q, or verified classical simulation):

$$\min_{x \in \{0, 1\}^n} \mathcal{H}(x) = - \mu^T x + \frac{\gamma}{2} x^T \Sigma x + \lambda \left( \sum_{i=1}^n x_i - K \right)^2$$

- $\mu$: Vector of expected historical asset returns.
- $\Sigma$: Covariance matrix of asset price fluctuations.
- $\gamma$: Risk-aversion penalty parameter.
- $\lambda$: Lagrange multiplier strictly enforcing target asset cardinality $K=3$.

### 4.2 Continuous Markowitz Efficient Frontier
Solved via projected gradient ascent on the standard probability simplex:

$$\max_{w} \text{Sharpe}(w) = \frac{w^T \mu - r_f}{\sqrt{w^T \Sigma w}}$$
$$\text{subject to } \sum_{i=1}^n w_i = 1, \quad w_i \ge 0$$
