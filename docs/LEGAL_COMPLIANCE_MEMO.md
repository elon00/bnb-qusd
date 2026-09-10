# BNB-QUSD Legal Classification & Regulatory Compliance Memorandum

## 1. Executive Legal Assessment & Howey Test Analysis

Under United States securities jurisprudence (*SEC v. W.J. Howey Co.*, 328 U.S. 293 (1946)) and international regulatory guidance (MiCA - Markets in Crypto-Assets EU, VARA Dubai, MAS Singapore), crypto-assets are analyzed across four cumulative prongs:

### 1.1 Prong 1: Investment of Money
- **QUSD Stablecoin**: Users do **not** invest money into a common venture. Users deposit self-custodied BNB/crypto collateral into an immutable, non-custodial smart contract (`QUSDVault.sol`) solely to obtain a decentralized loan of debt-backed QUSD tokens pegged to \$1.00 USD.
- **QBNBAutomaton**: Utility governance token used solely for protocol parameter voting, timelock governance, and cryptographic fee tuning.

### 1.2 Prong 2: Common Enterprise
- The BNB-QUSD protocol is completely non-custodial and autonomous.
- There is no corporate balance sheet, no centralized treasury holding user funds, and no commingling of borrower collateral. Each borrower's vault exists as an isolated balance in smart contract storage.

### 1.3 Prong 3: Reasonable Expectation of Profit
- **QUSD is explicitly engineered as a stable unit of account pegged to \$1.00 USD**. It offers zero native yield, pays zero dividends, and provides no marketing of price appreciation. A rational participant holds QUSD for transaction settlement and decentralized medium-of-exchange utility, not speculative capital gain.

### 1.4 Prong 4: Solely from the Efforts of Others
- Protocol parameters (such as the dynamic stability borrowing fee) are derived algorithmically from mathematical entropy metrics (Conway Cellular Automaton Rule B3/S23) and decentralized price oracles (Chainlink).
- Rebalancing portfolios are generated through open-source Quadratic Unconstrained Binary Optimization (QUBO) and Markowitz convex quadratic solvers. There is no active management team exerting managerial or entrepreneurial efforts to produce investor returns.

### 1.5 Regulatory Conclusion
**Neither QUSD nor QBNBAutomaton constitutes an investment contract or security under the Howey doctrine.** QUSD operates strictly as a decentralized, over-collateralized synthetic commodity and cryptographic unit of exchange.

---

## 2. Non-Custodial Open Source Software Disclosure

1. **Licensing**: BNB-QUSD is provided as free, open-source software under the Apache License 2.0.
2. **Zero Custody**: At no point does the development team, foundation, or administrators hold private keys, custody user funds, or possess unilateral withdrawal rights over deposited collateral.
3. **Smart Contract Invariants**: All deposits, liquidations, and redemptions execute deterministically based on verified EVM bytecode.

---

## 3. OFAC & Global Sanctions Screening Architecture

The `PqcCommitmentGateway.sol` contract and Web4 user terminal enforce compliance by integrating with decentralized screening lists (e.g. Chainalysis Oracle / TRM Labs API), blocking interactions originating from addresses designated on the OFAC Specially Designated Nationals (SDN) list or sanctioned jurisdictions.
