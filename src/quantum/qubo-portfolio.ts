/**
 * BNB Chain Quantum Portfolio Optimization Engine — QUBO & Ising Hamiltonian Formulation
 * Tailored for BNB Chain Ecosystem Tokens: WBNB, BTCB, ETH, CAKE, FDUSD, QUSD
 */

export interface AssetMetadata {
  symbol: string;
  name: string;
  expectedAnnualReturn: number; // e.g. 0.18 = 18%
  annualVolatility: number;      // e.g. 0.45 = 45%
}

export interface QuboResult {
  selectedAssets: string[];
  binaryVector: number[];
  hamiltonianEnergy: number;
  portfolioReturn: number;
  portfolioRisk: number;
  sharpeRatio: number;
}

export class QuboPortfolioOptimizer {
  // Canonical BNB Chain Token Basket
  public static readonly ASSETS: AssetMetadata[] = [
    { symbol: 'WBNB', name: 'Wrapped BNB', expectedAnnualReturn: 0.22, annualVolatility: 0.48 },
    { symbol: 'BTCB', name: 'Binance-Peg Bitcoin', expectedAnnualReturn: 0.28, annualVolatility: 0.52 },
    { symbol: 'ETH', name: 'Binance-Peg Ethereum', expectedAnnualReturn: 0.25, annualVolatility: 0.55 },
    { symbol: 'CAKE', name: 'PancakeSwap Token', expectedAnnualReturn: 0.15, annualVolatility: 0.65 },
    { symbol: 'FDUSD', name: 'First Digital USD', expectedAnnualReturn: 0.04, annualVolatility: 0.01 },
    { symbol: 'QUSD', name: 'Quantum USD Stablecoin', expectedAnnualReturn: 0.05, annualVolatility: 0.01 },
  ];

  /**
   * Build Empirical/Target Correlation Matrix across BNB Chain tokens
   */
  public static buildCovarianceMatrix(assets: AssetMetadata[]): number[][] {
    const n = assets.length;
    const cov: number[][] = Array.from({ length: n }, () => Array(n).fill(0));

    // Base correlation approximations
    const correlations: { [key: string]: number } = {
      'WBNB-BTCB': 0.75,
      'WBNB-ETH': 0.78,
      'WBNB-CAKE': 0.68,
      'WBNB-FDUSD': 0.02,
      'WBNB-QUSD': 0.02,
      'BTCB-ETH': 0.82,
      'BTCB-CAKE': 0.60,
      'BTCB-FDUSD': 0.01,
      'BTCB-QUSD': 0.01,
      'ETH-CAKE': 0.64,
      'ETH-FDUSD': 0.01,
      'ETH-QUSD': 0.01,
      'CAKE-FDUSD': 0.02,
      'CAKE-QUSD': 0.02,
      'FDUSD-QUSD': 0.95,
    };

    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        if (i === j) {
          cov[i][j] = assets[i].annualVolatility ** 2;
        } else {
          const pairKey1 = `${assets[i].symbol}-${assets[j].symbol}`;
          const pairKey2 = `${assets[j].symbol}-${assets[i].symbol}`;
          const corr = correlations[pairKey1] || correlations[pairKey2] || 0.5;
          cov[i][j] = corr * assets[i].annualVolatility * assets[j].annualVolatility;
        }
      }
    }
    return cov;
  }

  /**
   * Formulate QUBO Matrix Q where Objective = x^T * Q * x
   * Minimizes: - mu^T * x + (lambda / 2) * x^T * Sigma * x + penalty * (sum(x) - K)^2
   */
  public static buildQuboMatrix(
    assets: AssetMetadata[],
    targetAssetCount: number = 3,
    riskAversionLambda: number = 1.0,
    budgetPenaltyRho: number = 2.0
  ): number[][] {
    const n = assets.length;
    const cov = this.buildCovarianceMatrix(assets);
    const Q: number[][] = Array.from({ length: n }, () => Array(n).fill(0));

    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        if (i === j) {
          // Diagonal term: -mu_i + (lambda/2)*Sigma_ii + rho*(1 - 2*K)
          Q[i][i] = -assets[i].expectedAnnualReturn +
                    (riskAversionLambda / 2) * cov[i][i] +
                    budgetPenaltyRho * (1 - 2 * targetAssetCount);
        } else {
          // Off-diagonal term: (lambda/2)*Sigma_ij + rho
          Q[i][j] = (riskAversionLambda / 2) * cov[i][j] + budgetPenaltyRho;
        }
      }
    }
    return Q;
  }

  /**
   * Solve QUBO over discrete binary states (2^N exact search for N=6)
   */
  public static solveOptimalPortfolio(
    assets: AssetMetadata[] = this.ASSETS,
    targetAssetCount: number = 3,
    riskAversionLambda: number = 1.0,
    budgetPenaltyRho: number = 2.0
  ): QuboResult {
    const n = assets.length;
    const Q = this.buildQuboMatrix(assets, targetAssetCount, riskAversionLambda, budgetPenaltyRho);
    const cov = this.buildCovarianceMatrix(assets);

    let bestEnergy = Infinity;
    let bestVector: number[] = [];

    const totalStates = 1 << n;
    for (let state = 1; state < totalStates; state++) {
      const x: number[] = [];
      for (let i = 0; i < n; i++) {
        x.push((state >> i) & 1);
      }

      // Compute Hamiltonian Energy: E = x^T * Q * x
      let energy = 0;
      for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) {
          energy += x[i] * Q[i][j] * x[j];
        }
      }

      if (energy < bestEnergy) {
        bestEnergy = energy;
        bestVector = x;
      }
    }

    const selectedIndices = bestVector
      .map((val, idx) => (val === 1 ? idx : -1))
      .filter(idx => idx !== -1);
    const selectedAssets = selectedIndices.map(idx => assets[idx].symbol);

    // Equal-weight portfolio among selected assets
    const weight = 1 / selectedIndices.length;
    let portReturn = 0;
    for (const idx of selectedIndices) {
      portReturn += weight * assets[idx].expectedAnnualReturn;
    }

    let portVariance = 0;
    for (const i of selectedIndices) {
      for (const j of selectedIndices) {
        portVariance += weight * weight * cov[i][j];
      }
    }
    const portRisk = Math.sqrt(portVariance);
    const riskFreeRate = 0.04; // 4% US Treasury / FDUSD baseline
    const sharpeRatio = (portReturn - riskFreeRate) / portRisk;

    return {
      selectedAssets,
      binaryVector: bestVector,
      hamiltonianEnergy: bestEnergy,
      portfolioReturn: portReturn,
      portfolioRisk: portRisk,
      sharpeRatio,
    };
  }
}
