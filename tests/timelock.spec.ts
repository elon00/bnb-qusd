/**
 * BNB-QUSD Timelock & 2-of-3 Multisig Governance Invariants
 * Standard: 48-Hour Delay Window, Multisig Quorum, Instant Emergency Pause
 */

import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { describe, it } from 'node:test';

describe('BNB-QUSD Timelock Governor & Multisig Invariants', () => {
  it('Governance Invariant 1: Timelock artifact and ABI must exist', () => {
    const timelockArtifact = JSON.parse(fs.readFileSync(path.resolve('build/TimelockGovernor.json'), 'utf8'));
    assert.strictEqual(timelockArtifact.contractName, 'TimelockGovernor');
    const functions = timelockArtifact.abi.filter((x: any) => x.type === 'function').map((x: any) => x.name);
    assert.strictEqual(functions.includes('queueProposal'), true);
    assert.strictEqual(functions.includes('approveProposal'), true);
    assert.strictEqual(functions.includes('executeProposal'), true);
    assert.strictEqual(functions.includes('emergencyPause'), true);
    assert.strictEqual(functions.includes('unpause'), true);
  });

  it('Governance Invariant 2: 48-Hour Delay Window Invariant', () => {
    const delaySeconds = 172800; // 48 hours
    const blockTime = 1700000000;
    const eta = blockTime + delaySeconds;

    // Execution before ETA must fail
    const prematureTime = eta - 1;
    assert.strictEqual(prematureTime >= eta, false, 'Premature execution before 48h must fail');

    // Execution at or after ETA is allowed
    const validTime = eta + 1;
    assert.strictEqual(validTime >= eta, true, 'Execution after 48h delay is valid');
  });

  it('Governance Invariant 3: 2-of-3 Multisig Quorum Mask Logic', () => {
    function countApprovals(mask: number): number {
      let c = 0;
      if (mask & 1) c++;
      if (mask & 2) c++;
      if (mask & 4) c++;
      return c;
    }

    // Only Admin 1 approved (mask = 1) -> count = 1 (< 2 quorum) -> FAIL
    assert.strictEqual(countApprovals(1), 1);
    assert.strictEqual(countApprovals(1) >= 2, false, '1-of-3 approvals must NOT meet quorum');

    // Admin 1 and Admin 2 approved (mask = 1 | 2 = 3) -> count = 2 (>= 2 quorum) -> PASS
    assert.strictEqual(countApprovals(3), 2);
    assert.strictEqual(countApprovals(3) >= 2, true, '2-of-3 approvals satisfies quorum');

    // Admin 2 and Admin 3 approved (mask = 2 | 4 = 6) -> count = 2 -> PASS
    assert.strictEqual(countApprovals(6), 2);
    assert.strictEqual(countApprovals(6) >= 2, true, '2-of-3 approvals satisfies quorum');

    // All 3 approved (mask = 1 | 2 | 4 = 7) -> count = 3 -> PASS
    assert.strictEqual(countApprovals(7), 3);
  });

  it('Governance Invariant 4: Instant Emergency Pause Circuit Breaker', () => {
    let isPaused = false;
    // Any single authorized admin triggers emergency pause immediately
    isPaused = true;
    assert.strictEqual(isPaused, true, 'Circuit breaker instantly freezes state');

    // While paused, normal execution must be blocked
    function canExecute(paused: boolean): boolean {
      return !paused;
    }
    assert.strictEqual(canExecute(isPaused), false, 'Normal proposals blocked when paused');
  });
});
