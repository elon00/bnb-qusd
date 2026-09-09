/**
 * BNB Chain Quantum Security Engine — NIST FIPS 203 & 204 PQC Primitives
 * Standard: ML-KEM-768 & ML-DSA-65 Lattice-Based Cryptography
 */

import { ml_dsa65 } from '@noble/post-quantum/ml-dsa.js';
import { ml_kem768 } from '@noble/post-quantum/ml-kem.js';
import { sha256 } from '@noble/hashes/sha256.js';

export interface PqcKeyPair {
  publicKey: Uint8Array;
  secretKey: Uint8Array;
}

export class NistPqcEngine {
  /**
   * Generate Deterministic ML-DSA-65 Keypair from 32-byte seed
   */
  public static generateDsaKeyPair(seed: Uint8Array): PqcKeyPair {
    if (seed.length !== 32) {
      throw new Error('ML-DSA seed must be exactly 32 bytes');
    }
    const keys = ml_dsa65.keygen(seed);
    return {
      publicKey: keys.publicKey,
      secretKey: keys.secretKey,
    };
  }

  /**
   * Sign a message with NIST FIPS 204 ML-DSA-65
   */
  public static signMessage(message: Uint8Array, secretKey: Uint8Array): Uint8Array {
    return ml_dsa65.sign(message, secretKey);
  }

  /**
   * Verify ML-DSA-65 Signature
   */
  public static verifySignature(signature: Uint8Array, message: Uint8Array, publicKey: Uint8Array): boolean {
    return ml_dsa65.verify(signature, message, publicKey);
  }

  /**
   * Compute 32-byte SHA-256 Public Key Commitment Hash for on-chain EVM binding
   */
  public static getPublicKeyCommitment(publicKey: Uint8Array): Uint8Array {
    return sha256(publicKey);
  }

  /**
   * Generate Deterministic ML-KEM-768 Keypair (FIPS 203 requires 64-byte seed: d || z)
   */
  public static generateKemKeyPair(seed: Uint8Array): PqcKeyPair {
    let s64: Uint8Array;
    if (seed.length === 64) {
      s64 = seed;
    } else if (seed.length === 32) {
      s64 = new Uint8Array(64);
      s64.set(seed, 0);
      s64.set(seed, 32);
    } else {
      throw new Error('ML-KEM seed must be 32 or 64 bytes');
    }
    const keys = ml_kem768.keygen(s64);
    return {
      publicKey: keys.publicKey,
      secretKey: keys.secretKey,
    };
  }

  /**
   * Encapsulate Shared Secret (FIPS 203)
   */
  public static encapsulate(publicKey: Uint8Array): { cipherText: Uint8Array; sharedSecret: Uint8Array } {
    return ml_kem768.encapsulate(publicKey);
  }

  /**
   * Decapsulate Shared Secret (FIPS 203)
   */
  public static decapsulate(cipherText: Uint8Array, secretKey: Uint8Array): Uint8Array {
    return ml_kem768.decapsulate(cipherText, secretKey);
  }
}
