/**
 * BNB-QUSD BSC Testnet Automated Contract Deployment & Wiring Engine
 * Deploys QUSD, QUSDVault, QBNBAutomaton, PqcCommitmentGateway, TimelockGovernor to BSC Testnet.
 */

import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { createPublicClient, createWalletClient, http, formatEther, parseEther, getContractAddress } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { bscTestnet } from 'viem/chains';

dotenv.config();

const BUILD_DIR = path.resolve(process.cwd(), 'build');
const DEPLOYMENTS_DIR = path.resolve(process.cwd(), 'deployments');

function getArtifact(name: string) {
  const file = path.join(BUILD_DIR, `${name}.json`);
  if (!fs.existsSync(file)) throw new Error(`Artifact ${name}.json not found in build/`);
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

async function main() {
  console.log('🏛️ ================================================================');
  console.log('   BNB-QUSD BSC TESTNET SMART CONTRACT DEPLOYMENT ENGINE');
  console.log('   Target Chain: BNB Smart Chain Testnet (Chain ID 97)');
  console.log('================================================================\n');

  const privateKey = process.env.DEPLOYER_PRIVATE_KEY as `0x${string}`;
  if (!privateKey) {
    throw new Error('DEPLOYER_PRIVATE_KEY not configured in .env');
  }

  const account = privateKeyToAccount(privateKey);
  const rpcUrl = process.env.BSC_TESTNET_RPC || 'https://data-seed-prebsc-1-s1.binance.org:8545';

  const publicClient = createPublicClient({
    chain: bscTestnet,
    transport: http(rpcUrl),
  });

  const walletClient = createWalletClient({
    account,
    chain: bscTestnet,
    transport: http(rpcUrl),
  });

  const balance = await publicClient.getBalance({ address: account.address });
  const balanceBnb = formatEther(balance);
  const nonce = await publicClient.getTransactionCount({ address: account.address });

  console.log(`👤 Deployer Account: ${account.address}`);
  console.log(`💰 Account Balance:  ${balanceBnb} tBNB`);
  console.log(`🔢 Current Nonce:    ${nonce}\n`);

  const qusdArt = getArtifact('QUSD');
  const vaultArt = getArtifact('QUSDVault');
  const qbnbArt = getArtifact('QBNBAutomaton');
  const pqcArt = getArtifact('PqcCommitmentGateway');
  const timelockArt = getArtifact('TimelockGovernor');

  if (balance < parseEther('0.02')) {
    console.log('⚠️  GAS FUNDING NOTICE:');
    console.log('----------------------------------------------------------------');
    console.log(`Deployer address has ${balanceBnb} tBNB (minimum ~0.02 tBNB recommended for deployment).`);
    console.log(`To obtain free testnet BNB, paste this address into the official faucet:`);
    console.log(`\n   >>>  ${account.address}  <<<\n`);
    console.log(`Faucet URL: https://www.bnbchain.org/en/testnet-faucet`);
    console.log('----------------------------------------------------------------\n');

    // Calculate deterministic contract addresses based on deployer nonce
    console.log('📐 Computing Deterministic Deployment Addresses (CREATE opcode):');
    const predTimelock = getContractAddress({ from: account.address, nonce: BigInt(nonce) });
    const predQusd = getContractAddress({ from: account.address, nonce: BigInt(nonce + 1) });
    const predVault = getContractAddress({ from: account.address, nonce: BigInt(nonce + 2) });
    const predQbnb = getContractAddress({ from: account.address, nonce: BigInt(nonce + 3) });
    const predPqc = getContractAddress({ from: account.address, nonce: BigInt(nonce + 4) });

    const deploymentPlan = {
      network: 'bscTestnet',
      chainId: 97,
      deployer: account.address,
      status: 'AWAITING_GAS_FUNDING',
      targetContracts: {
        TimelockGovernor: { predictedAddress: predTimelock, nonce: nonce },
        QUSD: { predictedAddress: predQusd, nonce: nonce + 1 },
        QUSDVault: { predictedAddress: predVault, nonce: nonce + 2 },
        QBNBAutomaton: { predictedAddress: predQbnb, nonce: nonce + 3 },
        PqcCommitmentGateway: { predictedAddress: predPqc, nonce: nonce + 4 },
      },
      faucetGuide: 'https://www.bnbchain.org/en/testnet-faucet',
      timestamp: new Date().toISOString()
    };

    if (!fs.existsSync(DEPLOYMENTS_DIR)) fs.mkdirSync(DEPLOYMENTS_DIR, { recursive: true });
    fs.writeFileSync(path.join(DEPLOYMENTS_DIR, 'bsc-testnet.json'), JSON.stringify(deploymentPlan, null, 2));
    console.log('📁 Stored deployment plan in deployments/bsc-testnet.json');
    return;
  }

  // Live on-chain deployment if funded
  console.log('🚀 Broadcast: Deploying TimelockGovernor...');
  const timelockTx = await walletClient.deployContract({
    abi: timelockArt.abi,
    bytecode: timelockArt.bytecode,
    args: [account.address, account.address, account.address, 172800n], // 48 hours delay
  });
  const timelockReceipt = await publicClient.waitForTransactionReceipt({ hash: timelockTx });
  const timelockAddress = timelockReceipt.contractAddress!;
  console.log(`✅ TimelockGovernor deployed at: ${timelockAddress} (Tx: ${timelockTx})`);

  console.log('🚀 Broadcast: Deploying QUSD Token...');
  const qusdTx = await walletClient.deployContract({
    abi: qusdArt.abi,
    bytecode: qusdArt.bytecode,
    args: [account.address], // Governor initially deployer
  });
  const qusdReceipt = await publicClient.waitForTransactionReceipt({ hash: qusdTx });
  const qusdAddress = qusdReceipt.contractAddress!;
  console.log(`✅ QUSD deployed at: ${qusdAddress} (Tx: ${qusdTx})`);

  console.log('🚀 Broadcast: Deploying QUSDVault (CDP Engine)...');
  const vaultTx = await walletClient.deployContract({
    abi: vaultArt.abi,
    bytecode: vaultArt.bytecode,
    args: [qusdAddress, account.address],
  });
  const vaultReceipt = await publicClient.waitForTransactionReceipt({ hash: vaultTx });
  const vaultAddress = vaultReceipt.contractAddress!;
  console.log(`✅ QUSDVault deployed at: ${vaultAddress} (Tx: ${vaultTx})`);

  console.log('🚀 Linking QUSD Vault permissions...');
  const linkTx = await walletClient.writeContract({
    address: qusdAddress,
    abi: qusdArt.abi,
    functionName: 'setVault',
    args: [vaultAddress],
  });
  await publicClient.waitForTransactionReceipt({ hash: linkTx });
  console.log(`✅ QUSD vault set to ${vaultAddress}`);

  console.log('🚀 Broadcast: Deploying QBNBAutomaton...');
  const qbnbTx = await walletClient.deployContract({
    abi: qbnbArt.abi,
    bytecode: qbnbArt.bytecode,
    args: [account.address, parseEther('1000000')], // 1,000,000 initial supply
  });
  const qbnbReceipt = await publicClient.waitForTransactionReceipt({ hash: qbnbTx });
  const qbnbAddress = qbnbReceipt.contractAddress!;
  console.log(`✅ QBNBAutomaton deployed at: ${qbnbAddress}`);

  console.log('🚀 Broadcast: Deploying PqcCommitmentGateway...');
  const dummyPqcCommitment = '0x1111111111111111111111111111111111111111111111111111111111111111' as `0x${string}`;
  const pqcTx = await walletClient.deployContract({
    abi: pqcArt.abi,
    bytecode: pqcArt.bytecode,
    args: [account.address, dummyPqcCommitment],
  });
  const pqcReceipt = await publicClient.waitForTransactionReceipt({ hash: pqcTx });
  const pqcAddress = pqcReceipt.contractAddress!;
  console.log(`✅ PqcCommitmentGateway deployed at: ${pqcAddress}`);

  const finalRecord = {
    network: 'bscTestnet',
    chainId: 97,
    deployer: account.address,
    status: 'DEPLOYED_AND_CONFIRMED',
    contracts: {
      TimelockGovernor: { address: timelockAddress, txHash: timelockTx, explorer: `https://testnet.bscscan.com/address/${timelockAddress}` },
      QUSD: { address: qusdAddress, txHash: qusdTx, explorer: `https://testnet.bscscan.com/address/${qusdAddress}` },
      QUSDVault: { address: vaultAddress, txHash: vaultTx, explorer: `https://testnet.bscscan.com/address/${vaultAddress}` },
      QBNBAutomaton: { address: qbnbAddress, txHash: qbnbTx, explorer: `https://testnet.bscscan.com/address/${qbnbAddress}` },
      PqcCommitmentGateway: { address: pqcAddress, txHash: pqcTx, explorer: `https://testnet.bscscan.com/address/${pqcAddress}` },
    },
    timestamp: new Date().toISOString()
  };

  if (!fs.existsSync(DEPLOYMENTS_DIR)) fs.mkdirSync(DEPLOYMENTS_DIR, { recursive: true });
  fs.writeFileSync(path.join(DEPLOYMENTS_DIR, 'bsc-testnet.json'), JSON.stringify(finalRecord, null, 2));
  console.log('\n🎉 ALL 5 CONTRACTS DEPLOYED & WIRED ON BSC TESTNET!');
}

main().catch(err => {
  console.error('Fatal Deployment Error:', err);
  process.exit(1);
});
