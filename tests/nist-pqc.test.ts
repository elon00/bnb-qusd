/**
 * NIST FIPS 203 & 204 Post-Quantum Cryptography & Wycheproof Invariant Tests
 */

import assert from 'node:assert';
import { describe, it } from 'node:test';
import { NistPqcEngine } from '../src/crypto/nist-pqc-engine.js';

describe('NIST FIPS 203 & 204 Lattice Cryptography Invariant Tests', () => {
  it('NIST Invariant 1: ML-DSA-65 Keypair Generation & Deterministic Dimensions', () => {
    const seed = new Uint8Array(32).fill(0x11);
    const keys = NistPqcEngine.generateDsaKeyPair(seed);

    assert.strictEqual(keys.publicKey.length, 1952, 'ML-DSA-65 public key must be 1,952 bytes');
    assert.strictEqual(keys.secretKey.length, 4032, 'ML-DSA-65 secret key must be 4,032 bytes');

    // Reproducibility check: same seed yields identical keys
    const keys2 = NistPqcEngine.generateDsaKeyPair(seed);
    assert.deepStrictEqual(keys.publicKey, keys2.publicKey, 'Key generation must be strictly deterministic');
  });

  it('NIST Invariant 2: ML-DSA-65 Signing & Successful Verification', () => {
    const seed = new Uint8Array(32).fill(0x22);
    const keys = NistPqcEngine.generateDsaKeyPair(seed);
    const message = new TextEncoder().encode('BNB_CHAIN_QUSD_SETTLEMENT_2026');

    const signature = NistPqcEngine.signMessage(message, keys.secretKey);
    assert.strictEqual(signature.length, 3309, 'ML-DSA-65 signature must be 3,309 bytes');

    const valid = NistPqcEngine.verifySignature(signature, message, keys.publicKey);
    assert.strictEqual(valid, true, 'Valid signature must verify successfully');
  });

  it('NIST Invariant 3 (Wycheproof): Tampered signature is strictly rejected', () => {
    const seed = new Uint8Array(32).fill(0x33);
    const keys = NistPqcEngine.generateDsaKeyPair(seed);
    const message = new TextEncoder().encode('TRANSFER_1000_QUSD');

    const signature = NistPqcEngine.signMessage(message, keys.secretKey);

    // Tamper with signature by flipping a bit
    const tamperedSignature = new Uint8Array(signature);
    tamperedSignature[100] ^= 0x01;

    const valid = NistPqcEngine.verifySignature(tamperedSignature, message, keys.publicKey);
    assert.strictEqual(valid, false, 'Tampered signature must be rejected');
  });

  it('NIST Invariant 4: ML-KEM-768 Encapsulation & Decapsulation Convergence', () => {
    const seed = new Uint8Array(32).fill(0x44);
    const keys = NistPqcEngine.generateKemKeyPair(seed);

    assert.strictEqual(keys.publicKey.length, 1184, 'ML-KEM-768 public key must be 1,184 bytes');
    assert.strictEqual(keys.secretKey.length, 2400, 'ML-KEM-768 secret key must be 2,400 bytes');

    const { cipherText, sharedSecret: senderSecret } = NistPqcEngine.encapsulate(keys.publicKey);
    assert.strictEqual(cipherText.length, 1088, 'ML-KEM-768 ciphertext must be 1,088 bytes');
    assert.strictEqual(senderSecret.length, 32, 'Shared secret must be 32 bytes');

    const receiverSecret = NistPqcEngine.decapsulate(cipherText, keys.secretKey);
    assert.deepStrictEqual(senderSecret, receiverSecret, 'Sender and receiver shared secrets must converge byte-for-byte');
  });
});
