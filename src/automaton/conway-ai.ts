/**
 * Conway Cellular Automaton Engine & Algorithmic Monetary Policy Governor
 * Standard: 2D B3/S23 Conway Automaton deriving dynamic Shannon entropy
 */

export interface ConwayState {
  generation: number;
  livingCells: number;
  totalCells: number;
  entropy: number;
  recommendedStabilityFeeBps: number;
  grid: number[][];
}

export class ConwayAutomatonEngine {
  private width: number;
  private height: number;
  private grid: number[][];
  private generation: number;

  constructor(width: number = 18, height: number = 18, seed?: string) {
    this.width = width;
    this.height = height;
    this.generation = 0;
    this.grid = this.initGrid(seed);
  }

  private initGrid(seed?: string): number[][] {
    const g: number[][] = [];
    let state = 123456789;
    if (seed) {
      for (let i = 0; i < seed.length; i++) {
        state = (state ^ seed.charCodeAt(i)) * 1664525 + 1013904223;
      }
    }

    for (let y = 0; y < this.height; y++) {
      const row: number[] = [];
      for (let x = 0; x < this.width; x++) {
        state = (state * 1103515245 + 12345) & 0x7fffffff;
        row.push(state % 100 < 35 ? 1 : 0);
      }
      g.push(row);
    }
    return g;
  }

  public step(): ConwayState {
    const next: number[][] = Array.from({ length: this.height }, () => Array(this.width).fill(0));
    let living = 0;

    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        let neighbors = 0;
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            if (dx === 0 && dy === 0) continue;
            const ny = (y + dy + this.height) % this.height;
            const nx = (x + dx + this.width) % this.width;
            neighbors += this.grid[ny][nx];
          }
        }

        if (this.grid[y][x] === 1) {
          next[y][x] = (neighbors === 2 || neighbors === 3) ? 1 : 0;
        } else {
          next[y][x] = (neighbors === 3) ? 1 : 0;
        }

        if (next[y][x] === 1) living++;
      }
    }

    this.grid = next;
    this.generation++;

    const entropy = this.calculateEntropy();
    // Modulation formula: higher entropy -> lower borrowing fee (min 50 bps = 0.5%, max 300 bps = 3.0%)
    const feeBps = Math.max(50, Math.min(300, Math.round(300 * (1 - entropy / 2.5))));

    return {
      generation: this.generation,
      livingCells: living,
      totalCells: this.width * this.height,
      entropy,
      recommendedStabilityFeeBps: feeBps,
      grid: this.grid,
    };
  }

  private calculateEntropy(): number {
    const blockCounts: { [key: number]: number } = {};
    let totalBlocks = 0;

    for (let y = 0; y < this.height - 1; y += 2) {
      for (let x = 0; x < this.width - 1; x += 2) {
        const pattern =
          (this.grid[y][x] << 3) |
          (this.grid[y][x + 1] << 2) |
          (this.grid[y + 1][x] << 1) |
          this.grid[y + 1][x + 1];
        blockCounts[pattern] = (blockCounts[pattern] || 0) + 1;
        totalBlocks++;
      }
    }

    let h = 0;
    for (const count of Object.values(blockCounts)) {
      const p = count / totalBlocks;
      h -= p * Math.log2(p);
    }
    return Number(h.toFixed(4));
  }

  public getState(): ConwayState {
    const living = this.grid.flat().filter(c => c === 1).length;
    const entropy = this.calculateEntropy();
    const feeBps = Math.max(50, Math.min(300, Math.round(300 * (1 - entropy / 2.5))));
    return {
      generation: this.generation,
      livingCells: living,
      totalCells: this.width * this.height,
      entropy,
      recommendedStabilityFeeBps: feeBps,
      grid: this.grid,
    };
  }
}
