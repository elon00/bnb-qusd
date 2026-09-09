/**
 * BNB Chain Multi-RPC Health & Operational Telemetry Daemon
 * Monitors BSC Testnet endpoints, block numbers, and latency.
 */

import { createPublicClient, http } from 'viem';
import { bscTestnet } from 'viem/chains';

interface EndpointHealth {
  url: string;
  latencyMs: number;
  blockNumber?: bigint;
  status: 'HEALTHY' | 'DEGRADED' | 'DOWN';
}

const BSC_TESTNET_RPCS = [
  'https://data-seed-prebsc-1-s1.binance.org:8545/',
  'https://bsc-testnet.publicnode.com',
  'https://endpoints.omniatech.io/v1/bsc/testnet/public'
];

async function checkRpc(url: string): Promise<EndpointHealth> {
  const start = Date.now();
  try {
    const client = createPublicClient({
      chain: bscTestnet,
      transport: http(url, { timeout: 4000 }),
    });
    const blockNumber = await client.getBlockNumber();
    return {
      url,
      latencyMs: Date.now() - start,
      blockNumber,
      status: 'HEALTHY',
    };
  } catch (err) {
    return {
      url,
      latencyMs: Date.now() - start,
      status: 'DEGRADED',
    };
  }
}

async function main() {
  console.log('🏛️ ================================================================');
  console.log('   BNB-QUSD OPERATIONAL TELEMETRY & MULTI-RPC HEALTH MONITOR');
  console.log('   Target: BSC Testnet / opBNB Clusters');
  console.log('================================================================\n');

  const results = await Promise.all(BSC_TESTNET_RPCS.map(checkRpc));
  for (const r of results) {
    const icon = r.status === 'HEALTHY' ? '🟢' : '🟡';
    console.log(`   ${icon} [${r.url}] Status: ${r.status} | Latency: ${r.latencyMs}ms | Block: ${r.blockNumber ? r.blockNumber.toString() : 'N/A'}`);
  }

  const healthyCount = results.filter(r => r.status === 'HEALTHY').length;
  console.log(`\n📊 Health Summary: ${healthyCount}/${results.length} endpoints operational.`);
}

main().catch(err => {
  console.error('Fatal health monitor error:', err);
  process.exit(1);
});
