import solc from 'solc';
import fs from 'node:fs';
import path from 'node:path';

async function main() {
  console.log('🏛️ Compiling BNB-QUSD Smart Contracts via solc (Solidity 0.8.28)...');

  const root = process.cwd();
  const contractsDir = path.resolve(root, 'contracts');
  const buildDir = path.resolve(root, 'build');
  fs.mkdirSync(buildDir, { recursive: true });

  const contractFiles = fs.readdirSync(contractsDir).filter(f => f.endsWith('.sol'));
  console.log(`📦 Found ${contractFiles.length} Solidity source files:`, contractFiles);

  const sources = {};
  for (const file of contractFiles) {
    sources[file] = {
      content: fs.readFileSync(path.join(contractsDir, file), 'utf8')
    };
  }

  const input = {
    language: 'Solidity',
    sources,
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      },
      outputSelection: {
        '*': {
          '*': ['abi', 'evm.bytecode.object', 'evm.deployedBytecode.object']
        }
      }
    }
  };

  const output = JSON.parse(solc.compile(JSON.stringify(input)));

  let hasErrors = false;
  if (output.errors) {
    for (const error of output.errors) {
      if (error.severity === 'error') {
        console.error('❌ Solidity Error:', error.formattedMessage);
        hasErrors = true;
      } else {
        console.warn('⚠️ Solidity Warning:', error.formattedMessage);
      }
    }
  }

  if (hasErrors) {
    throw new Error('Solidity compilation failed with errors');
  }

  for (const [sourceFile, contracts] of Object.entries(output.contracts)) {
    for (const [contractName, artifact] of Object.entries(contracts)) {
      const artifactPath = path.join(buildDir, `${contractName}.json`);
      fs.writeFileSync(
        artifactPath,
        JSON.stringify(
          {
            contractName,
            sourceFile,
            abi: artifact.abi,
            bytecode: '0x' + artifact.evm.bytecode.object,
            deployedBytecode: '0x' + artifact.evm.deployedBytecode.object
          },
          null,
          2
        )
      );
      console.log(`✅ Compiled ${contractName} -> build/${contractName}.json (bytecode: ${artifact.evm.bytecode.object.length / 2} bytes)`);
    }
  }

  console.log('🏁 All 5 smart contracts compiled cleanly to EVM bytecode!');
}

main().catch(err => {
  console.error('Fatal compile error:', err);
  process.exit(1);
});
