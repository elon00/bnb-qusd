# BNB-QUSD Incident Response, Monitoring & Recovery Runbook

## 1. Threat Matrix & Automated Detection

The BNB-QUSD protocol incorporates continuous telemetry and automated circuit breakers across five critical risk dimensions:

| Risk Category | Automated Trigger Invariant | Mitigation Vector | Recovery Authority |
| :--- | :--- | :--- | :--- |
| **Oracle Flash Manipulation** | Price deviation > 25% within single update window | Automatic rejection via `QUSDVault.syncChainlinkPrice()` | Algorithmic circuit breaker |
| **Oracle Feed Stagnation** | Chainlink `updatedAt` > 3600 seconds old | Freeze new borrowing while maintaining debt repayment & redemption | Governor fallback price update |
| **Collateral Insolvency** | Global collateral ratio < 130% | Liquidators incentivized via 10% bonus (`LIQUIDATION_BONUS_BPS = 1000`) | Permissionless liquidation |
| **Cryptographic Replay** | Out-of-order sequence nonce (`seqno != lastSeqno + 1`) | Immediate transaction revert in `PqcCommitmentGateway.sol` | Fail-closed EVM logic |
| **Black-Swan Smart Contract Exploit** | Anomaly detected in TVL / unusual volume | Instant fail-closed pause invocation (`isPaused = true`) | Any 1 of 3 Timelock Admins |

---

## 2. Emergency Circuit Breaker Protocol (Fail-Closed Freeze)

### 2.1 Instant Emergency Halting
In the event of an identified exploit or zero-day vulnerability:
- **Authorization**: Any single admin from the 2-of-3 multisig can call `TimelockGovernor.emergencyPause()`.
- **Latency**: **Instant (0-delay)**. Does not require the 48-hour timelock window.
- **Contract Impact**:
  - `QUSD`: Token transfers and minting are immediately frozen (`whenNotPaused`).
  - `QUSDVault`: New borrowing is blocked.
  - `TimelockGovernor`: All pending non-emergency proposal executions are halted.

### 2.2 Unpause Multi-Signature Quorum
To unpause the system after remediation:
- **Requirement**: **2-of-3 Multi-Signature Consensus**.
- Both signatures must be submitted via `TimelockGovernor.unpause(hash, sig1, sig2)`.
- Prevents rogue single-key compromise from unpausing an endangered protocol.

---

## 3. Operational Recovery Procedures

### Scenario A: Chainlink Oracle Feed Outage
1. **Diagnosis**: `scripts/monitor-health.ts` flags oracle staleness exceeding 3600 seconds.
2. **Containment**: Vault automatically enters safe mode, preventing under-collateralized borrowing.
3. **Remediation**:
   - Timelock admins queue proposal to update oracle feed:
     `QUSDVault.setChainlinkFeed(newFeedAddress)`.
   - Execute proposal following timelock verification.

### Scenario B: Massive Market Liquidation Cascade
1. **Diagnosis**: High market volatility causes multiple vaults to drop below 130% CR.
2. **Mitigation**:
   - Liquidators repay QUSD debt to seize collateral with 10% bonus.
   - Conway Cellular Automaton entropy engine spikes to maximum entropy, raising stability borrowing fees to 3.0% APR to discourage debt expansion and incentivize collateral fortification.
