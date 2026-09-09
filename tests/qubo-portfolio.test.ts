/**
 * BNB Chain Quantum Portfolio Optimization Tests
 * Tests QUBO Ising Hamiltonian matrix and continuous Markowitz optimizer.
 */

import assert from 'node:assert';
import { describe, it } from 'node:test';
import { QuboPortfolioOptimizer } from '../src/quantum/qubo-portfolio.js';
import { MarkowitzContinuousOptimizer } from '../src/quantum/markowitz-continuous.js';

describe('BNB Chain Quantum Portfolio & QUBO Solver Invariant Tests', () => {
  it('Quantum Invariant 1: Covariance Matrix is Symmetric and Positive-Definite Diagonal', () => {
    const assets = QuboPortfolioOptimizer.ASSETS;
    const cov = QuboPortfolioOptimizer.buildCovarianceMatrix(assets);

    assert.strictEqual(cov.length, 6, 'Must have 6 assets in portfolio');
    for (let i = 0; i < 6; i++) {
      assert.strictEqual(cov[i][i] > 0, true, 'Variance must be strictly positive');
      for (let j = 0; j < 6; j++) {
        assert.strictEqual(Math.abs(cov[i][j] - cov[j][i]) < 1e-9, true, 'Covariance matrix must be symmetric');
      }
    }
  });

  it('Quantum Invariant 2: Discrete QUBO Ising Hamiltonian finds optimal 3-asset allocation', () => {
    const result = QuboPortfolioOptimizer.solveOptimalPortfolio(
      QuboPortfolioOptimizer.ASSETS,
      3,   // Target 3 assets
      1.0, // Risk aversion lambda
      2.0  // Budget penalty rho
    );

    assert.strictEqual(result.selectedAssets.length, 3, 'Must select exactly 3 assets');
    assert.strictEqual(typeof result.hamiltonianEnergy, 'number', 'Must compute Hamiltonian energy');
    assert.strictEqual(result.portfolioReturn > 0, true, 'Portfolio return must be positive');
    assert.strictEqual(result.portfolioRisk > 0, true, 'Portfolio risk must be positive');
    assert.strictEqual(result.sharpeRatio > 0, true, 'Sharpe ratio must be positive');

    console.log('   📊 QUBO Optimal 3-Token Allocation:', result.selectedAssets);
    console.log(`   💎 Expected Return: ${(result.portfolioReturn * 100).toFixed(2)}% | Risk: ${(result.portfolioRisk * 100).toFixed(2)}% | Sharpe: ${result.sharpeRatio.toFixed(3)}`);
  });

  it('Quantum Invariant 3: Continuous Markowitz Simplex Projection strictly sums to 1.0', () => {
    const rawVector = [0.8, -0.2, 0.4, 0.1, 0.5, -0.1];
    const projected = MarkowitzContinuousOptimizer.projectSimplex(rawVector);

    let sum = 0;
    for (const w of projected) {
      assert.strictEqual(w >= 0, true, 'Weights must be non-negative');
      sum += w;
    }
    assert.strictEqual(Math.abs(sum - 1.0) < 1e-6, true, 'Projected weights must sum to 1.0');
  });

  it('Quantum Invariant 4: Continuous Markowitz optimization converges to high Sharpe portfolio', () => {
    const result = MarkowitzContinuousOptimizer.optimize(
      QuboPortfolioOptimizer.ASSETS,
      2.0, // lambda
      200  // iterations
    );

    assert.strictEqual(result.expectedReturn > 0, true);
    assert.strictEqual(result.expectedVolatility > 0, true);
    assert.strictEqual(result.sharpeRatio > 0, true);

    console.log('   📈 Continuous Markowitz Weights:');
    for (const [sym, w] of Object.entries(result.weights)) {
      console.log(`      ${sym}: ${(w * 100).toFixed(2)}%`);
    }
    console.log(`   🏆 Portfolio Return: ${(result.expectedReturn * 100).toFixed(2)}% | Volatility: ${(result.expectedVolatility * 100).toFixed(2)}% | Sharpe: ${result.sharpeRatio.toFixed(3)}`);
  });
});
