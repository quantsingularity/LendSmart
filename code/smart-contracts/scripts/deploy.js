const hre = require('hardhat');
const fs = require('fs');
const path = require('path');

async function main() {
    const [deployer] = await hre.ethers.getSigners();
    console.log('Deploying contracts with the account:', deployer.address);
    console.log(
        'Account balance:',
        (await hre.ethers.provider.getBalance(deployer.address)).toString(),
    );

    // Define constructor arguments for LoanContract
    // These should be configurable, perhaps from a .env file or a config script for different networks
    const initialOwner = deployer.address; // Or a specific multisig/governance address for production
    const initialFeeRate = 100; // Example: 1.00% (100 / 10000)
    const initialFeeRecipient = deployer.address; // Or a dedicated treasury address

    console.log(`\nDeploying LoanContract with constructor arguments:`);
    console.log(`  Initial Owner: ${initialOwner}`);
    console.log(`  Initial Fee Rate: ${initialFeeRate} (0.01 = 1%)`);
    console.log(`  Initial Fee Recipient: ${initialFeeRecipient}`);

    const LoanContract = await hre.ethers.getContractFactory('LoanContract');
    const loanContract = await LoanContract.deploy(
        initialOwner,
        initialFeeRate,
        initialFeeRecipient,
    );

    await loanContract.waitForDeployment();

    const contractAddress = await loanContract.getAddress();
    console.log('\nLoanContract deployed to:', contractAddress);

    // Save contract address and ABI for frontend/backend integration
    saveFrontendFiles(loanContract, 'LoanContract');
}

function saveFrontendFiles(contract, contractName) {
    const contractsDir = path.join(__dirname, '..', '..', 'web-frontend', 'src', 'contracts');
    const mobileContractsDir = path.join(
        __dirname,
        '..',
        '..',
        'mobile-frontend',
        'src',
        'contracts',
    );

    if (!fs.existsSync(contractsDir)) {
        fs.mkdirSync(contractsDir, { recursive: true });
    }
    if (!fs.existsSync(mobileContractsDir)) {
        fs.mkdirSync(mobileContractsDir, { recursive: true });
    }

    const contractAddress = contract.target; // For ethers v6

    // Save address to a JSON file
    fs.writeFileSync(
        path.join(contractsDir, `${contractName}-address.json`),
        JSON.stringify({ address: contractAddress }, undefined, 2),
    );
    fs.writeFileSync(
        path.join(mobileContractsDir, `${contractName}-address.json`),
        JSON.stringify({ address: contractAddress }, undefined, 2),
    );

    // Save ABI
    const ContractArtifact = hre.artifacts.readArtifactSync(contractName);
    fs.writeFileSync(
        path.join(contractsDir, `${contractName}.json`),
        JSON.stringify(ContractArtifact, null, 2),
    );
    fs.writeFileSync(
        path.join(mobileContractsDir, `${contractName}.json`),
        JSON.stringify(ContractArtifact, null, 2),
    );

    console.log(
        `\nArtifacts for ${contractName} (address and ABI) saved to web and mobile frontend contract directories.`,
    );
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
