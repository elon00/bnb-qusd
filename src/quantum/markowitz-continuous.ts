/**
 * Continuous Markowitz Mean-Variance Portfolio Optimizer
 * Implements projected gradient descent over the continuous simplex.
 */

import { QuboPortfolioOptimizer, AssetMetadata } from './qubo-portfolio.js';

export interface ContinuousAllocation {
  weights: { [symbol: string]: number };
  expectedReturn: number;
  expectedVolatility: number;
  sharpeRatio: number;
}

export class MarkowitzContinuousOptimizer {
  /**
   * Project weights onto the probability simplex: sum(w) = 1, w_i >= 0
   */
  public static projectSimplex(v: number[]): number[] {
    const n = v.length;
    const u = [...v].sort((a, b) => b - a);
    let rho = 0;
    let sum = 0;
    for (let i = 0; i < n; i++) {
      sum += u[i];
      if (u[i] - (sum - 1) / (i + 1) > 0) {
        rho = i;
      }
    }
    const theta = (u.slice(0, rho + 1).reduce((a, b) => a + b, 0) - 1) / (rho + 1);
    return v.map(x => Math.max(0, x - theta));
  }

  /**
   * Optimize portfolio weights to maximize Sharpe Ratio
   */
  public static optimize(
    assets: AssetMetadata[] = QuboPortfolioOptimizer.ASSETS,
    riskAversionLambda: number = 2.0,
    maxIterations: number = 300,
    learningRate: number = 0.05
  ): ContinuousAllocation {
    const n = assets.length;
    const cov = QuboPortfolioOptimizer.buildCovarianceMatrix(assets);
    const returns = assets.map(a => a.expectedAnnualReturn);

    // Initial uniform weights
    let w = Array(n).fill(1 / n);

    for (let iter = 0; iter < maxIterations; iter++) {
      // Gradient of Sharpe / Objective: mu - lambda * Sigma * w
      const grad: number[] = Array(n).fill(0);
      for (let i = 0; i < n; i++) {
        let riskTerm = 0;
        for (let j = 0; j < n; j++) {
          riskTerm += cov[i][j] * w[j];
        }
        grad[i] = returns[i] - riskAversionLambda * riskTerm;
      }

      // Gradient ascent step + projection onto simplex
      const nextW = w.map((val, i) => val + learningRate * grad[i]);
      w = this.projectSimplex(nextW);
    }

    let expReturn = 0;
    let expVariance = 0;
    for (let i = 0; i < n; i++) {
      expReturn += w[i] * returns[i];
      for (let j = 0; j < n; j++) {
        expVariance += w[i] * w[j] * cov[i][j];
      }
    }
    const expVolatility = Math.sqrt(expVariance);
    const sharpe = (expReturn - 0.04) / (expVolatility || 1);

    const weightsObj: { [symbol: string]: number } = {};
    assets.forEach((a, i) => {
      weightsObj[a.symbol] = Number(w[i].toFixed(4));
    });

    return {
      weights: weightsObj,
      expectedReturn: expReturn,
      expectedVolatility: expVolatility,
      sharpeRatio: sharpe,
    };
  }
}
