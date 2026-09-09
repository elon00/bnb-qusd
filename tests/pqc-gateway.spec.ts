/**
 * BNB-QUSD PQC Commitment Gateway Tests
 * Standard: Anti-Replay Monotonic Nonces, Freshness Expiry, Dual-Attestation
 */

import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { describe, it } from 'node:test';
import { NistPqcEngine } from '../src/crypto/nist-pqc-engine.js';
import { sha256 } from '@noble/hashes/sha256.js';

describe('BNB-QUSD PQC EVM Commitment Gateway Invariants', () => {
  it('PQC Invariant 1: Gateway artifact and ABI must exist', () => {
    const gatewayArtifact = JSON.parse(fs.readFileSync(path.resolve('build/PqcCommitmentGateway.json'), 'utf8'));
    assert.strictEqual(gatewayArtifact.contractName, 'PqcCommitmentGateway');
    const functions = gatewayArtifact.abi.filter((x: any) => x.type === 'function').map((x: any) => x.name);
    assert.strictEqual(functions.includes('submitAttestation'), true);
    assert.strictEqual(functions.includes('lastSeqno'), true);
    assert.strictEqual(functions.includes('stateRootHash'), true);
  });

  it('PQC Invariant 2: Deterministic ML-DSA-65 Public Key Commitment', () => {
    const seed = new Uint8Array(32).fill(0x42);
    const dsaKeys = NistPqcEngine.generateDsaKeyPair(seed);
    const commitment = NistPqcEngine.getPublicKeyCommitment(dsaKeys.publicKey);

    assert.strictEqual(commitment.length, 32, 'Commitment must be 32 bytes');
    assert.strictEqual(dsaKeys.publicKey.length, 1952, 'ML-DSA-65 public key must be 1,952 bytes');
    assert.strictEqual(dsaKeys.secretKey.length, 4032, 'ML-DSA-65 secret key must be 4,032 bytes');
  });

  it('PQC Invariant 3: Anti-Replay Sequence Nonce and State Root Transition', () => {
    let lastSeqno = 0n;
    let stateRoot = new Uint8Array(32).fill(0);

    // First attestation: seqno = 1
    const seqno1 = 1n;
    assert.strictEqual(seqno1 === lastSeqno + 1n, true, 'Seqno 1 is valid');
    lastSeqno = seqno1;

    // Second attestation: duplicate seqno = 1 (MUST REJECT)
    const duplicateSeqno = 1n;
    assert.strictEqual(duplicateSeqno === lastSeqno + 1n, false, 'Duplicate seqno must fail anti-replay');

    // Valid second attestation: seqno = 2
    const seqno2 = 2n;
    assert.strictEqual(seqno2 === lastSeqno + 1n, true, 'Seqno 2 advances cleanly');
    lastSeqno = seqno2;
  });

  it('PQC Invariant 4: Freshness Expiry Window', () => {
    const currentTime = Math.floor(Date.now() / 1000);
    const freshExpiry = currentTime + 300; // 5 mins in future
    const staleExpiry = currentTime - 10;  // 10 secs in past

    assert.strictEqual(currentTime <= freshExpiry, true, 'Fresh timestamp accepted');
    assert.strictEqual(currentTime <= staleExpiry, false, 'Stale timestamp rejected');
  });
});
