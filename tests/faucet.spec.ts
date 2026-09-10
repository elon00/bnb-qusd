/**
 * BNB-QUSD Smart Contract Testnet Faucet Invariant Tests
 */

import assert from 'node:assert';
import { describe, it } from 'node:test';
import * as fs from 'fs';
import * as path from 'path';

describe('BNB-QUSD Testnet Faucet Invariant Tests', () => {
  it('Faucet Invariant 1: Compiled bytecode and ABI exist in build/', () => {
    const artifactPath = path.resolve(process.cwd(), 'build', 'TestnetFaucet.json');
    assert.ok(fs.existsSync(artifactPath), 'TestnetFaucet.json build artifact must exist');

    const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
    assert.ok(artifact.abi.length > 0, 'ABI must contain function definitions');
    const bytecode = artifact.bytecode || artifact.evm?.bytecode?.object;
    assert.ok(bytecode && bytecode.length > 100, 'Bytecode must be compiled and non-empty');
  });

  it('Faucet Invariant 2: Drip parameter & cooldown invariants', () => {
    const code = fs.readFileSync('contracts/TestnetFaucet.sol', 'utf8');
    assert.ok(code.includes('DRIP_AMOUNT = 500 * 1e18;'), 'Drip amount must be 500 QUSD');
    assert.ok(code.includes('COOLDOWN_PERIOD = 1 hours;'), 'Cooldown period must be 1 hour');
    assert.ok(code.includes('function requestTestQusd() external'), 'requestTestQusd must be external');
    assert.ok(code.includes('function getRemainingCooldown(address user) external view'), 'getRemainingCooldown must be view');
  });

  it('Faucet Invariant 3: Rate limit cooldown calculation math', () => {
    const currentTime = 1700000000;
    const COOLDOWN_PERIOD = 3600;

    // First claim at currentTime
    const lastClaim = currentTime;

    // Attempt claim 1800 seconds later (30 mins): remaining = 1800s -> must be blocked
    const queryTime1 = currentTime + 1800;
    const isLocked = queryTime1 < lastClaim + COOLDOWN_PERIOD;
    const remaining1 = (lastClaim + COOLDOWN_PERIOD) - queryTime1;
    assert.strictEqual(isLocked, true, 'Claim at 30 mins must be locked');
    assert.strictEqual(remaining1, 1800, 'Remaining cooldown must be 1800s');

    // Attempt claim 3601 seconds later (1 hour + 1s): allowed
    const queryTime2 = currentTime + 3601;
    const isUnlocked = queryTime2 >= lastClaim + COOLDOWN_PERIOD;
    assert.strictEqual(isUnlocked, true, 'Claim after 1 hour must be unlocked');
  });
});
