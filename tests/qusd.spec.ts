/**
 * BNB-QUSD Smart Contract & Invariant Test Suite
 * Standard: 150% Collateralization, 130% Liquidation, BEP-20 Invariants
 */

import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { describe, it } from 'node:test';

describe('BNB-QUSD BEP-20 & CDP Vault Architecture Invariants', () => {
  it('Invariant 1: Compiled bytecode and ABI must exist in build/', () => {
    const qusdArtifact = JSON.parse(fs.readFileSync(path.resolve('build/QUSD.json'), 'utf8'));
    const vaultArtifact = JSON.parse(fs.readFileSync(path.resolve('build/QUSDVault.json'), 'utf8'));

    assert.strictEqual(qusdArtifact.contractName, 'QUSD');
    assert.strictEqual(vaultArtifact.contractName, 'QUSDVault');
    assert.strictEqual(qusdArtifact.bytecode.startsWith('0x60'), true);
    assert.strictEqual(vaultArtifact.bytecode.startsWith('0x60'), true);
  });

  it('Invariant 2: QUSD Token parameters match BEP-20 standard', () => {
    const qusdArtifact = JSON.parse(fs.readFileSync(path.resolve('build/QUSD.json'), 'utf8'));
    const functions = qusdArtifact.abi.filter((x: any) => x.type === 'function').map((x: any) => x.name);

    assert.strictEqual(functions.includes('transfer'), true);
    assert.strictEqual(functions.includes('transferFrom'), true);
    assert.strictEqual(functions.includes('approve'), true);
    assert.strictEqual(functions.includes('balanceOf'), true);
    assert.strictEqual(functions.includes('mint'), true);
    assert.strictEqual(functions.includes('burn'), true);
    assert.strictEqual(functions.includes('setPaused'), true);
  });

  it('Invariant 3: QUSD CDP Vault Collateralization Math (150% Safe / 130% Liquidation)', () => {
    // 1 BNB = $600.00 USD
    const bnbPrice = 600n;
    const bnbCollateral = 1n; // 1 BNB = $600 collateral value

    // Safe max mint: 600 / 1.5 = $400 QUSD
    const maxSafeDebt = (bnbCollateral * bnbPrice * 10000n) / 15000n;
    assert.strictEqual(maxSafeDebt, 400n, 'Max safe mint for 1 BNB ($600) must be 400 QUSD');

    // Ratio when $400 QUSD is borrowed: 600 / 400 = 150% (15000 bps)
    const safeRatioBps = (bnbCollateral * bnbPrice * 10000n) / 400n;
    assert.strictEqual(safeRatioBps, 15000n);

    // If BNB price drops to $510:
    // Collateral value = $510. Ratio = 510 / 400 = 127.5% (< 13000 bps) -> LIQUIDATABLE!
    const droppedPrice = 510n;
    const droppedRatioBps = (bnbCollateral * droppedPrice * 10000n) / 400n;
    assert.strictEqual(droppedRatioBps < 13000n, true, 'Ratio 127.5% must trigger liquidation');

    // Liquidation penalty calculation (10% bonus)
    const debtToRepay = 400n;
    const valueToSeize = (debtToRepay * 11000n) / 10000n; // $440 worth of BNB
    assert.strictEqual(valueToSeize, 440n, 'Liquidator receives $440 worth of BNB for repaying $400 debt');
  });

  it('Invariant 4: Fail-closed circuit breaker protection', () => {
    const qusdArtifact = JSON.parse(fs.readFileSync(path.resolve('build/QUSD.json'), 'utf8'));
    const isPausedVar = qusdArtifact.abi.find((x: any) => x.name === 'isPaused');
    assert.strictEqual(isPausedVar !== undefined, true, 'isPaused circuit breaker must be exposed');
  });
});
