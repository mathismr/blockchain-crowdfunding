const solc = require('solc');
const Web3 = require('web3');
const fs = require('fs');
const path = require('path');

// ========================================
// Configuration
// ========================================
const GANACHE_URL = process.env.GANACHE_URL || 'http://ganache:8545';
const OUTPUT_PATH = process.env.OUTPUT_PATH || '/shared/config.json';
const MAX_RETRIES = 30;
const RETRY_DELAY = 2000;

// ========================================
// Attendre que Ganache soit prêt
// ========================================
async function waitForGanache(web3) {
    for (let i = 0; i < MAX_RETRIES; i++) {
        try {
            const blockNumber = await web3.eth.getBlockNumber();
            console.log(`✅ Ganache prêt (bloc ${blockNumber})`);
            return true;
        } catch (e) {
            console.log(`⏳ Attente de Ganache... (${i + 1}/${MAX_RETRIES})`);
            await new Promise(r => setTimeout(r, RETRY_DELAY));
        }
    }
    throw new Error('Ganache non disponible après ' + MAX_RETRIES + ' tentatives');
}

// ========================================
// Compilation Solidity
// ========================================
function compileSolidity() {
    console.log('🔨 Compilation des contrats...');

    const contractsDir = path.join(__dirname, 'contracts');

    // Résolution des imports (OpenZeppelin depuis node_modules)
    function findImports(importPath) {
        const candidates = [
            path.join(contractsDir, importPath),
            path.join(__dirname, 'node_modules', importPath),
        ];
        for (const p of candidates) {
            if (fs.existsSync(p)) {
                return { contents: fs.readFileSync(p, 'utf8') };
            }
        }
        return { error: `Import non trouvé: ${importPath}` };
    }

    const sources = {};
    const files = fs.readdirSync(contractsDir).filter(f => f.endsWith('.sol'));
    for (const file of files) {
        const filePath = path.join(contractsDir, file);
        sources[file] = { content: fs.readFileSync(filePath, 'utf8') };
    }

    const input = {
        language: 'Solidity',
        sources,
        settings: {
            evmVersion: 'paris',
            optimizer: { enabled: true, runs: 200 },
            outputSelection: {
                '*': { '*': ['abi', 'evm.bytecode.object'] }
            }
        }
    };

    const output = JSON.parse(solc.compile(JSON.stringify(input), { import: findImports }));

    if (output.errors) {
        const fatal = output.errors.filter(e => e.severity === 'error');
        if (fatal.length > 0) {
            console.error('❌ Erreurs de compilation :');
            fatal.forEach(e => console.error(e.formattedMessage));
            process.exit(1);
        }
        // Afficher les warnings
        output.errors
            .filter(e => e.severity === 'warning')
            .forEach(e => console.warn('⚠️', e.formattedMessage.split('\n')[0]));
    }

    console.log('✅ Compilation réussie');
    return output.contracts;
}

// ========================================
// Déploiement
// ========================================
async function deploy() {
    const web3 = new Web3(GANACHE_URL);

    await waitForGanache(web3);

    const contracts = compileSolidity();

    // Trouver le contrat CrowdfundingFactory
    let factoryABI, factoryBytecode;
    for (const file of Object.keys(contracts)) {
        if (contracts[file]['CrowdfundingFactory']) {
            factoryABI = contracts[file]['CrowdfundingFactory'].abi;
            factoryBytecode = '0x' + contracts[file]['CrowdfundingFactory'].evm.bytecode.object;
            break;
        }
    }

    if (!factoryABI || !factoryBytecode) {
        console.error('❌ CrowdfundingFactory non trouvé dans la compilation');
        process.exit(1);
    }

    // Récupérer le premier compte Ganache
    const accounts = await web3.eth.getAccounts();
    const deployer = accounts[0];
    console.log(`📦 Déploiement depuis ${deployer}...`);

    // Déployer la Factory
    const factory = new web3.eth.Contract(factoryABI);
    const deployTx = factory.deploy({ data: factoryBytecode });

    const gasEstimate = await deployTx.estimateGas({ from: deployer });
    const deployed = await deployTx.send({
        from: deployer,
        gas: Math.floor(gasEstimate * 1.2)
    });

    const factoryAddress = deployed.options.address;
    console.log(`✅ CrowdfundingFactory déployé à : ${factoryAddress}`);

    // Vérification rapide
    const count = await deployed.methods.getCampaignCount().call();
    console.log(`✅ Vérification : getCampaignCount() = ${count}`);

    // Écrire la config dans le volume partagé
    const config = {
        factoryAddress,
        ganacheUrl: GANACHE_URL,
        chainId: await web3.eth.getChainId(),
        deployedAt: new Date().toISOString(),
        deployer,
        accounts: accounts.slice(0, 5)
    };

    // Créer le dossier si nécessaire
    const outputDir = path.dirname(OUTPUT_PATH);
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    fs.writeFileSync(OUTPUT_PATH, JSON.stringify(config, null, 2));
    console.log(`📄 Config écrite dans ${OUTPUT_PATH}`);
    console.log('\n🎉 Déploiement terminé avec succès !\n');
    console.log(JSON.stringify(config, null, 2));
}

deploy().catch(err => {
    console.error('❌ Erreur fatale :', err.message);
    process.exit(1);
});
