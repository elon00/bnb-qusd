/**
 * BSC Testnet Deployer Wallet Manager
 * Generates or loads deployer account and verifies balance on BSC Testnet.
 */

import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { createPublicClient, http, formatEther } from 'viem';
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';
import { bscTestnet } from 'viem/chains';

dotenv.config();

const ENV_PATH = path.resolve(process.cwd(), '.env');
const RPC_URL = process.env.BSC_TESTNET_RPC || 'https://data-seed-prebsc-1-s1.binance.org:8545';

async function main() {
  console.log('🏛️ ================================================================');
  console.log('   BNB-QUSD TESTNET DEPLOYER WALLET SETUP & AUDIT');
  console.log('================================================================\n');

  let privateKey = process.env.DEPLOYER_PRIVATE_KEY as `0x${string}`;

  if (!privateKey) {
    // Generate fresh secure private key
    privateKey = generatePrivateKey();
    const envLine = `\nDEPLOYER_PRIVATE_KEY=${privateKey}\nBSC_TESTNET_RPC=${RPC_URL}\n`;
    if (fs.existsSync(ENV_PATH)) {
      fs.appendFileSync(ENV_PATH, envLine);
    } else {
      fs.writeFileSync(ENV_PATH, envLine);
    }
    console.log('🔑 New Deployer Private Key generated and saved to .env (gitignored).');
  }

  const account = privateKeyToAccount(privateKey);
  console.log(`👤 Deployer Address: ${account.address}`);

  const publicClient = createPublicClient({
    chain: bscTestnet,
    transport: http(RPC_URL),
  });

  const balanceWei = await publicClient.getBalance({ address: account.address });
  const balanceBnb = formatEther(balanceWei);
  const blockNumber = await publicClient.getBlockNumber();

  console.log(`🌐 Network:          BNB Smart Chain Testnet (Chain ID 97)`);
  console.log(`🧱 Latest Block:    #${blockNumber}`);
  console.log(`💰 Account Balance:  ${balanceBnb} tBNB`);

  if (balanceWei === 0n) {
    console.log('\n⚠️  INSUFFICIENT FUNDS FOR TESTNET GAS');
    console.log('----------------------------------------------------------------');
    console.log('To deploy and execute on-chain transactions on BSC Testnet:');
    console.log(`1. Visit BNB Chain Discord Faucet or Web Faucet:`);
    console.log(`   https://www.bnbchain.org/en/testnet-faucet`);
    console.log(`2. Request testnet tBNB for address:`);
    console.log(`   ${account.address}`);
    console.log('----------------------------------------------------------------\n');
  } else {
    console.log('\n✅ Deployer wallet funded and ready for on-chain execution.\n');
  }

  // Export metadata for scripts
  const walletMeta = {
    address: account.address,
    balanceBnb,
    balanceWei: balanceWei.toString(),
    blockNumber: blockNumber.toString(),
    network: 'bscTestnet',
    chainId: 97,
    timestamp: new Date().toISOString()
  };

  const metaDir = path.resolve(process.cwd(), 'deployments');
  if (!fs.existsSync(metaDir)) fs.mkdirSync(metaDir, { recursive: true });
  fs.writeFileSync(path.join(metaDir, 'deployer-wallet.json'), JSON.stringify(walletMeta, null, 2));
  console.log(`📁 Saved wallet metadata to deployments/deployer-wallet.json`);
}

main().catch(err => {
  console.error('Fatal Wallet Setup Error:', err);
  process.exit(1);
});
