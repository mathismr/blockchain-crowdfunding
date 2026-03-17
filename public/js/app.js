// ===========================================
// Configuration - Chargée dynamiquement
// ===========================================
let FACTORY_ADDRESS = null;

// ===========================================
// État global de l'application
// ===========================================
let web3;
let currentAccount = null;
let factoryContract = null;

// ===========================================
// Initialisation
// ===========================================
window.addEventListener('load', async () => {
    await loadConfig();
    setupRouter();
});

async function loadConfig() {
    try {
        const resp = await fetch('/api/config');
        if (resp.ok) {
            const config = await resp.json();
            FACTORY_ADDRESS = config.factoryAddress;
            console.log('Config chargée :', config);
            return;
        }
    } catch (e) {
        console.warn('API config non disponible, mode manuel.');
    }
    // Fallback : pas de config auto
    if (!FACTORY_ADDRESS) {
        showConfigWarning();
    }
}

function showConfigWarning() {
    const app = document.getElementById('app');
    app.innerHTML = `
        <div class="config-warning">
            <div class="warning-icon">⏳</div>
            <h2>En attente du déploiement</h2>
            <p>Les contrats ne sont pas encore déployés ou le serveur de config n'est pas disponible.</p>
            <p>Si vous utilisez <strong>Docker</strong>, patientez quelques secondes puis rechargez la page.</p>
            <p>En mode <strong>manuel</strong>, déployez la Factory via Remix et créez un fichier <code>config.json</code> :</p>
            <pre>{ "factoryAddress": "0xVOTRE_ADRESSE_ICI" }</pre>
            <button class="btn btn-primary" onclick="window.location.reload()" style="margin-top:1rem;">Recharger</button>
        </div>
    `;
}

// ===========================================
// Connexion MetaMask
// ===========================================
async function connectWallet() {
    if (typeof window.ethereum === 'undefined') {
        showToast('MetaMask non détecté. Veuillez installer MetaMask.', 'error');
        return;
    }
    if (!FACTORY_ADDRESS) {
        showToast('Configuration non chargée. Rechargez la page.', 'error');
        return;
    }

    try {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        web3 = new Web3(window.ethereum);
        currentAccount = accounts[0];
        factoryContract = new web3.eth.Contract(FACTORY_ABI, FACTORY_ADDRESS);

        // Écouter les changements de compte
        window.ethereum.on('accountsChanged', (accounts) => {
            if (accounts.length === 0) {
                currentAccount = null;
                navigateTo('connect');
            } else {
                currentAccount = accounts[0];
                // Recharger la vue courante
                const hash = window.location.hash || '#connect';
                handleRoute(hash);
            }
        });

        window.ethereum.on('chainChanged', () => window.location.reload());

        navigateTo('home');
    } catch (err) {
        showToast('Connexion MetaMask refusée.', 'error');
        console.error(err);
    }
}

function disconnectWallet() {
    currentAccount = null;
    web3 = null;
    factoryContract = null;
    navigateTo('connect');
}

// ===========================================
// Routeur SPA (hash-based)
// ===========================================
function setupRouter() {
    window.addEventListener('hashchange', () => {
        const hash = window.location.hash || '#connect';
        handleRoute(hash);
    });
    const hash = window.location.hash || '#connect';
    handleRoute(hash);
}

function handleRoute(hash) {
    if (!FACTORY_ADDRESS) {
        showConfigWarning();
        return;
    }
    if (!currentAccount && hash !== '#connect') {
        navigateTo('connect');
        return;
    }
    if (hash === '#connect') renderConnect();
    else if (hash === '#home') renderHome();
    else if (hash === '#deploy') renderDeploy();
    else if (hash.startsWith('#campaign/')) {
        const addr = hash.replace('#campaign/', '');
        renderCampaignDetail(addr);
    }
    else if (hash.startsWith('#admin/')) {
        const addr = hash.replace('#admin/', '');
        renderAdmin(addr);
    }
    else renderConnect();
}

function navigateTo(route) {
    window.location.hash = '#' + route;
}

// ===========================================
// Utilitaires d'affichage
// ===========================================
function shortAddr(addr) {
    return addr.substring(0, 6) + '...' + addr.substring(38);
}

function weiToEth(wei) {
    if (!web3) return '0';
    return web3.utils.fromWei(wei.toString(), 'ether');
}

function formatTimeLeft(seconds) {
    const s = Number(seconds);
    if (s <= 0) return 'Terminée';
    const d = Math.floor(s / 86400);
    const h = Math.floor((s % 86400) / 3600);
    const m = Math.floor((s % 3600) / 60);
    if (d > 0) return `${d}j ${h}h ${m}m`;
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
}

function showToast(message, type = 'info') {
    const existing = document.querySelector('.toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `<span>${message}</span>`;
    document.body.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('show'));
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

function renderHeader() {
    if (!currentAccount) return '';
    return `
        <header class="app-header">
            <div class="header-left" onclick="navigateTo('home')" style="cursor:pointer;">
                <div class="logo-mark">CF</div>
                <span class="logo-text">CrowdFund</span>
            </div>
            <nav class="header-nav">
                <a href="#home" class="nav-link">Campagnes</a>
                <a href="#deploy" class="nav-link">Déployer</a>
            </nav>
            <div class="header-right">
                <div class="account-chip">
                    <span class="account-dot"></span>
                    <span>${shortAddr(currentAccount)}</span>
                </div>
                <button class="btn btn-sm btn-outline" onclick="disconnectWallet()">Déconnexion</button>
            </div>
        </header>
    `;
}

// ===========================================
// VUE : Connexion
// ===========================================
function renderConnect() {
    const app = document.getElementById('app');
    app.innerHTML = `
        <div class="connect-page">
            <div class="connect-card">
                <div class="connect-logo">
                    <div class="logo-mark large">CF</div>
                </div>
                <h1>CrowdFund <span class="accent">DApp</span></h1>
                <p class="connect-desc">Plateforme décentralisée de financement participatif sur Ethereum.<br>Connectez votre portefeuille MetaMask pour commencer.</p>
                <button class="btn btn-primary btn-lg" onclick="connectWallet()">
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M17.5 3.5L11 8.5l1.2-2.8L17.5 3.5z" fill="#E2761B"/><path d="M2.5 3.5l6.4 5.1L7.8 5.7 2.5 3.5z" fill="#E4761B"/><path d="M15.2 13.5l-1.7 2.6 3.7 1 1-3.5-3-.1zM1.8 13.6l1 3.5 3.7-1-1.7-2.6-3 .1z" fill="#E4761B"/></svg>
                    Connecter MetaMask
                </button>
                <p class="connect-hint">Assurez-vous que MetaMask est connecté au réseau Ganache (127.0.0.1:7545)</p>
            </div>
        </div>
    `;
}

// ===========================================
// Diagnostic de connexion au contrat
// ===========================================
async function runDiagnostic() {
    const results = [];
    try {
        // 1. Vérifier la connexion Web3
        const networkId = await web3.eth.net.getId();
        const chainId = await web3.eth.getChainId();
        const blockNumber = await web3.eth.getBlockNumber();
        results.push(`✅ Réseau connecté — Network ID: ${networkId}, Chain ID: ${chainId}, Bloc: ${blockNumber}`);

        // 2. Vérifier que l'adresse contient du code
        const code = await web3.eth.getCode(FACTORY_ADDRESS);
        if (code === '0x' || code === '0x0') {
            results.push(`❌ AUCUN contrat trouvé à l'adresse ${FACTORY_ADDRESS} — l'adresse est vide !`);
        } else {
            results.push(`✅ Contrat trouvé à ${FACTORY_ADDRESS} (${code.length} caractères de bytecode)`);
        }

        // 3. Essayer un appel bas niveau
        try {
            const count = await factoryContract.methods.getCampaignCount().call();
            results.push(`✅ getCampaignCount() → ${count}`);
        } catch (e) {
            results.push(`❌ getCampaignCount() échoue : ${e.message}`);
        }

        // 4. Essayer getCampaigns
        try {
            const campaigns = await factoryContract.methods.getCampaigns().call();
            results.push(`✅ getCampaigns() → [${campaigns.length} campagne(s)]`);
        } catch (e) {
            results.push(`❌ getCampaigns() échoue : ${e.message}`);
        }

    } catch (e) {
        results.push(`❌ Erreur générale : ${e.message}`);
    }
    return results;
}

// ===========================================
// VUE : Accueil - Liste des campagnes
// ===========================================
async function renderHome() {
    const app = document.getElementById('app');
    app.innerHTML = renderHeader() + `
        <main class="main-content">
            <div class="page-title-row">
                <h1>Campagnes actives</h1>
                <div>
                    <button class="btn btn-outline btn-sm" onclick="showDiagnostic()" id="diag-btn">🔍 Diagnostic</button>
                    <button class="btn btn-primary" onclick="navigateTo('deploy')">+ Nouvelle campagne</button>
                </div>
            </div>
            <div id="diagnostic-panel" style="display:none; margin-bottom:1.5rem;"></div>
            <div id="campaigns-grid" class="campaigns-grid">
                <div class="loading-spinner"><div class="spinner"></div><p>Chargement des campagnes...</p></div>
            </div>
        </main>
    `;

    try {
        const campaigns = await factoryContract.methods.getCampaigns().call();
        const grid = document.getElementById('campaigns-grid');

        if (campaigns.length === 0) {
            grid.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">📭</div>
                    <h3>Aucune campagne</h3>
                    <p>Soyez le premier à créer une campagne de crowdfunding !</p>
                    <button class="btn btn-primary" onclick="navigateTo('deploy')">Créer une campagne</button>
                </div>
            `;
            return;
        }

        let cardsHTML = '';
        for (const addr of campaigns) {
            try {
                const contract = new web3.eth.Contract(CROWDFUNDING_ABI, addr);
                const [target, total, timeLeft, isActive, isFinished, owner, tiers] = await Promise.all([
                    contract.methods.getTargetAmount().call(),
                    contract.methods.getTotalContributions().call(),
                    contract.methods.getTimeLeft().call(),
                    contract.methods.getIsCampaignActive().call(),
                    contract.methods.getIsCampaignFinished().call(),
                    contract.methods.owner().call(),
                    contract.methods.getTiers().call()
                ]);

                const pct = Number(target) > 0 ? Math.min(100, (Number(total) * 100) / Number(target)) : 0;
                const isOwner = owner.toLowerCase() === currentAccount.toLowerCase();

                let statusClass = 'status-active';
                let statusText = 'Active';
                if (isFinished) { statusClass = 'status-finished'; statusText = 'Terminée'; }
                else if (!isActive) { statusClass = 'status-closed'; statusText = 'Fermée'; }
                else if (Number(timeLeft) === 0) { statusClass = 'status-expired'; statusText = 'Expirée'; }

                cardsHTML += `
                    <div class="campaign-card" onclick="navigateTo('campaign/${addr}')">
                        <div class="card-header-row">
                            <span class="status-badge ${statusClass}">${statusText}</span>
                            ${isOwner ? '<span class="owner-badge">Propriétaire</span>' : ''}
                        </div>
                        <div class="card-address">${shortAddr(addr)}</div>
                        <div class="card-tiers">${tiers.length} tier${tiers.length > 1 ? 's' : ''}</div>
                        <div class="progress-section">
                            <div class="progress-bar"><div class="progress-fill" style="width:${pct}%"></div></div>
                            <div class="progress-row">
                                <span>${weiToEth(total)} ETH</span>
                                <span class="target-label">sur ${weiToEth(target)} ETH</span>
                            </div>
                        </div>
                        <div class="card-footer">
                            <span class="time-left">⏱ ${formatTimeLeft(timeLeft)}</span>
                            ${isOwner ? `<button class="btn btn-sm btn-accent" onclick="event.stopPropagation(); navigateTo('admin/${addr}')">Gérer</button>` : ''}
                        </div>
                    </div>
                `;
            } catch (e) {
                console.error('Erreur lecture campagne', addr, e);
            }
        }
        grid.innerHTML = cardsHTML;
    } catch (err) {
        console.error(err);
        document.getElementById('campaigns-grid').innerHTML = `
            <div class="error-state">
                <p><strong>Erreur de chargement</strong></p>
                <p style="font-size:0.85rem; margin-top:0.5rem; color:var(--text-secondary);">${err.message}</p>
                <p style="font-size:0.85rem; margin-top:0.75rem;">Cliquez sur <strong>🔍 Diagnostic</strong> ci-dessus pour plus d'informations.</p>
            </div>`;
        // Lancer automatiquement le diagnostic en cas d'erreur
        showDiagnostic();
    }
}

async function showDiagnostic() {
    const panel = document.getElementById('diagnostic-panel');
    panel.style.display = 'block';
    panel.innerHTML = `<div class="detail-section"><h3>Diagnostic en cours...</h3></div>`;
    const results = await runDiagnostic();
    panel.innerHTML = `
        <div class="detail-section">
            <h3>Résultat du diagnostic</h3>
            <div style="font-family:var(--font-mono); font-size:0.82rem; line-height:1.8; margin-top:0.75rem;">
                <div style="margin-bottom:0.3rem; color:var(--text-muted);">Factory: ${FACTORY_ADDRESS}</div>
                ${results.map(r => `<div>${r}</div>`).join('')}
            </div>
        </div>
    `;
}

// ===========================================
// VUE : Détail d'une campagne
// ===========================================
async function renderCampaignDetail(addr) {
    const app = document.getElementById('app');
    app.innerHTML = renderHeader() + `
        <main class="main-content">
            <div class="loading-spinner"><div class="spinner"></div><p>Chargement de la campagne...</p></div>
        </main>
    `;

    try {
        const contract = new web3.eth.Contract(CROWDFUNDING_ABI, addr);
        const [target, total, timeLeft, isActive, isFinished, owner, tiers, myContrib] = await Promise.all([
            contract.methods.getTargetAmount().call(),
            contract.methods.getTotalContributions().call(),
            contract.methods.getTimeLeft().call(),
            contract.methods.getIsCampaignActive().call(),
            contract.methods.getIsCampaignFinished().call(),
            contract.methods.owner().call(),
            contract.methods.getTiers().call(),
            contract.methods.getMyContribution().call({ from: currentAccount })
        ]);

        const pct = Number(target) > 0 ? Math.min(100, (Number(total) * 100) / Number(target)) : 0;
        const isOwner = owner.toLowerCase() === currentAccount.toLowerCase();
        const expired = Number(timeLeft) === 0;
        const canContribute = isActive && !expired && !isFinished;
        const canRefund = (!isActive || expired) && Number(total) < Number(target) && Number(myContrib) > 0;
        const canClaimNFT = isFinished && Number(myContrib) > 0;

        let statusClass = 'status-active';
        let statusText = 'Active';
        if (isFinished) { statusClass = 'status-finished'; statusText = 'Terminée avec succès'; }
        else if (!isActive) { statusClass = 'status-closed'; statusText = 'Fermée par le propriétaire'; }
        else if (expired) { statusClass = 'status-expired'; statusText = 'Deadline dépassée'; }

        // Tiers HTML
        let tiersHTML = '';
        if (tiers.length > 0) {
            tiersHTML = tiers.map((t, i) => `
                <div class="tier-card">
                    <div class="tier-name">${t.name}</div>
                    <div class="tier-amount">Min: ${weiToEth(t.minAmount)} ETH</div>
                    <div class="tier-slots">${t.contributorCount} / ${t.maxContributors} places</div>
                    <div class="tier-progress-bar"><div class="tier-progress-fill" style="width:${Number(t.maxContributors) > 0 ? (Number(t.contributorCount)*100/Number(t.maxContributors)) : 0}%"></div></div>
                </div>
            `).join('');
        } else {
            tiersHTML = '<p class="muted">Aucun tier défini pour cette campagne.</p>';
        }

        app.innerHTML = renderHeader() + `
        <main class="main-content">
            <button class="btn btn-outline btn-back" onclick="navigateTo('home')">← Retour</button>
            
            <div class="detail-header">
                <div>
                    <h1>Campagne</h1>
                    <div class="detail-address">${addr}</div>
                </div>
                <div class="detail-badges">
                    <span class="status-badge ${statusClass}">${statusText}</span>
                    ${isOwner ? '<span class="owner-badge">Vous êtes le propriétaire</span>' : ''}
                </div>
            </div>

            <div class="detail-grid">
                <div class="detail-main">
                    <!-- Progression -->
                    <div class="detail-section">
                        <h2>Progression</h2>
                        <div class="big-progress">
                            <div class="big-progress-bar"><div class="progress-fill" style="width:${pct}%"></div></div>
                            <div class="big-progress-info">
                                <span class="big-amount">${weiToEth(total)} ETH</span>
                                <span class="big-target">/ ${weiToEth(target)} ETH (${pct.toFixed(1)}%)</span>
                            </div>
                        </div>
                        <div class="stats-row">
                            <div class="stat-box">
                                <div class="stat-value">⏱ ${formatTimeLeft(timeLeft)}</div>
                                <div class="stat-label">Temps restant</div>
                            </div>
                            <div class="stat-box">
                                <div class="stat-value">${tiers.reduce((a, t) => a + Number(t.contributorCount), 0)}</div>
                                <div class="stat-label">Contributeurs</div>
                            </div>
                            <div class="stat-box">
                                <div class="stat-value">${weiToEth(myContrib)} ETH</div>
                                <div class="stat-label">Ma contribution</div>
                            </div>
                        </div>
                    </div>

                    <!-- Tiers -->
                    <div class="detail-section">
                        <h2>Tiers de contribution</h2>
                        <div class="tiers-grid">${tiersHTML}</div>
                    </div>
                </div>

                <div class="detail-sidebar">
                    <!-- Actions -->
                    ${canContribute ? `
                    <div class="action-card">
                        <h3>Contribuer</h3>
                        <p class="muted">Envoyez des ETH correspondant au tier souhaité.</p>
                        <div class="input-group">
                            <input type="number" id="contribute-amount" placeholder="Montant en Wei" min="1" class="input-field" />
                            <button class="btn btn-primary btn-block" onclick="doContribute('${addr}')">Envoyer</button>
                        </div>
                    </div>
                    ` : ''}

                    ${canRefund ? `
                    <div class="action-card">
                        <h3>Remboursement</h3>
                        <p class="muted">La campagne a échoué. Récupérez votre contribution de ${weiToEth(myContrib)} ETH.</p>
                        <button class="btn btn-warning btn-block" onclick="doRefund('${addr}')">Se faire rembourser</button>
                    </div>
                    ` : ''}

                    ${canClaimNFT ? `
                    <div class="action-card">
                        <h3>Réclamer votre NFT</h3>
                        <p class="muted">La campagne est un succès ! Réclamez votre NFT de contributeur.</p>
                        <button class="btn btn-accent btn-block" onclick="doClaimNFT('${addr}')">Réclamer NFT</button>
                    </div>
                    ` : ''}

                    ${isOwner ? `
                    <div class="action-card">
                        <h3>Administration</h3>
                        <button class="btn btn-outline btn-block" onclick="navigateTo('admin/${addr}')">Gérer cette campagne</button>
                    </div>
                    ` : ''}

                    ${!canContribute && !canRefund && !canClaimNFT && !isOwner ? `
                    <div class="action-card">
                        <h3>Aucune action disponible</h3>
                        <p class="muted">Aucune action n'est disponible pour cette campagne avec votre compte actuel.</p>
                    </div>
                    ` : ''}
                </div>
            </div>
        </main>
        `;
    } catch (err) {
        console.error(err);
        app.innerHTML = renderHeader() + `
            <main class="main-content">
                <button class="btn btn-outline btn-back" onclick="navigateTo('home')">← Retour</button>
                <div class="error-state">Erreur de chargement de la campagne. Vérifiez l'adresse.</div>
            </main>
        `;
    }
}

// ===========================================
// VUE : Admin d'une campagne
// ===========================================
async function renderAdmin(addr) {
    const app = document.getElementById('app');
    app.innerHTML = renderHeader() + `
        <main class="main-content">
            <div class="loading-spinner"><div class="spinner"></div><p>Chargement...</p></div>
        </main>
    `;

    try {
        const contract = new web3.eth.Contract(CROWDFUNDING_ABI, addr);
        const [target, total, timeLeft, isActive, isFinished, owner, tiers] = await Promise.all([
            contract.methods.getTargetAmount().call(),
            contract.methods.getTotalContributions().call(),
            contract.methods.getTimeLeft().call(),
            contract.methods.getIsCampaignActive().call(),
            contract.methods.getIsCampaignFinished().call(),
            contract.methods.owner().call(),
            contract.methods.getTiers().call()
        ]);

        if (owner.toLowerCase() !== currentAccount.toLowerCase()) {
            app.innerHTML = renderHeader() + `
                <main class="main-content">
                    <button class="btn btn-outline btn-back" onclick="navigateTo('home')">← Retour</button>
                    <div class="error-state">Vous n'êtes pas le propriétaire de cette campagne.</div>
                </main>
            `;
            return;
        }

        const pct = Number(target) > 0 ? Math.min(100, (Number(total) * 100) / Number(target)) : 0;
        const expired = Number(timeLeft) === 0;
        const canClaim = expired && Number(total) >= Number(target) && isActive;

        let tiersHTML = tiers.map((t, i) => `
            <tr>
                <td>${t.name}</td>
                <td>${weiToEth(t.minAmount)} ETH</td>
                <td>${t.contributorCount} / ${t.maxContributors}</td>
                <td class="tier-uri" title="${t.tokenURI}">${t.tokenURI.length > 30 ? t.tokenURI.substring(0,30)+'...' : t.tokenURI}</td>
            </tr>
        `).join('');

        if (tiers.length === 0) {
            tiersHTML = '<tr><td colspan="4" class="muted">Aucun tier</td></tr>';
        }

        app.innerHTML = renderHeader() + `
        <main class="main-content">
            <button class="btn btn-outline btn-back" onclick="navigateTo('campaign/${addr}')">← Détail campagne</button>
            
            <div class="detail-header">
                <div>
                    <h1>Administration</h1>
                    <div class="detail-address">${addr}</div>
                </div>
            </div>

            <div class="admin-grid">
                <!-- Résumé -->
                <div class="detail-section">
                    <h2>Résumé</h2>
                    <div class="stats-row">
                        <div class="stat-box">
                            <div class="stat-value">${weiToEth(target)} ETH</div>
                            <div class="stat-label">Objectif</div>
                        </div>
                        <div class="stat-box">
                            <div class="stat-value">${weiToEth(total)} ETH (${pct.toFixed(1)}%)</div>
                            <div class="stat-label">Collecté</div>
                        </div>
                        <div class="stat-box">
                            <div class="stat-value">${formatTimeLeft(timeLeft)}</div>
                            <div class="stat-label">Temps restant</div>
                        </div>
                        <div class="stat-box">
                            <div class="stat-value">${isActive ? '✅ Active' : '❌ Inactive'}</div>
                            <div class="stat-label">Statut</div>
                        </div>
                    </div>
                </div>

                <!-- Gestion statut -->
                <div class="detail-section">
                    <h2>Contrôle de la campagne</h2>
                    <div class="admin-actions">
                        ${isActive ? `
                            <button class="btn btn-warning" onclick="doSetActive('${addr}', false)">Désactiver la campagne</button>
                        ` : `
                            <button class="btn btn-primary" onclick="doSetActive('${addr}', true)">Réactiver la campagne</button>
                        `}
                        ${canClaim ? `
                            <button class="btn btn-accent" onclick="doClaimFunds('${addr}')">Réclamer les fonds (${weiToEth(total)} ETH)</button>
                        ` : ''}
                    </div>
                </div>

                <!-- Tiers existants -->
                <div class="detail-section">
                    <h2>Tiers de contribution</h2>
                    <table class="data-table">
                        <thead><tr><th>Nom</th><th>Min</th><th>Places</th><th>Token URI</th></tr></thead>
                        <tbody>${tiersHTML}</tbody>
                    </table>
                </div>

                <!-- Ajouter un tier -->
                ${Number(total) === 0 ? `
                <div class="detail-section">
                    <h2>Ajouter un tier</h2>
                    <div class="form-grid">
                        <div class="form-group">
                            <label>Nom du tier</label>
                            <input type="text" id="tier-name" placeholder="Ex: Bronze" class="input-field" />
                        </div>
                        <div class="form-group">
                            <label>Montant minimum (Wei)</label>
                            <input type="number" id="tier-min" placeholder="Ex: 1000000000000000000" class="input-field" />
                        </div>
                        <div class="form-group">
                            <label>Nombre max de contributeurs</label>
                            <input type="number" id="tier-max" placeholder="Ex: 100" class="input-field" />
                        </div>
                        <div class="form-group">
                            <label>Token URI (métadonnées NFT)</label>
                            <input type="text" id="tier-uri" placeholder="ipfs://..." class="input-field" />
                        </div>
                    </div>
                    <button class="btn btn-primary" onclick="doAddTier('${addr}')" style="margin-top:1rem;">Ajouter le tier</button>
                </div>
                ` : `
                <div class="detail-section">
                    <p class="muted">⚠️ Les tiers ne peuvent plus être modifiés car des contributions ont déjà été reçues.</p>
                </div>
                `}
            </div>
        </main>
        `;
    } catch (err) {
        console.error(err);
        app.innerHTML = renderHeader() + `
            <main class="main-content">
                <button class="btn btn-outline btn-back" onclick="navigateTo('home')">← Retour</button>
                <div class="error-state">Erreur de chargement. Vérifiez votre connexion.</div>
            </main>
        `;
    }
}

// ===========================================
// VUE : Déployer une nouvelle campagne
// ===========================================
function renderDeploy() {
    const app = document.getElementById('app');
    app.innerHTML = renderHeader() + `
    <main class="main-content">
        <button class="btn btn-outline btn-back" onclick="navigateTo('home')">← Retour</button>
        <div class="deploy-card">
            <h1>Créer une campagne</h1>
            <p class="muted">Déployez un nouveau contrat de crowdfunding sur la blockchain.</p>
            <div class="form-grid">
                <div class="form-group">
                    <label>Objectif (en Wei)</label>
                    <input type="number" id="deploy-target" placeholder="Ex: 5000000000000000000 (= 5 ETH)" class="input-field" min="1" />
                    <small class="input-hint">Entrez le montant en Wei. 1 ETH = 1000000000000000000 Wei</small>
                </div>
                <div class="form-group">
                    <label>Durée (en jours)</label>
                    <input type="number" id="deploy-days" placeholder="Entre 1 et 30" class="input-field" min="1" max="30" />
                    <small class="input-hint">La campagne sera active pendant ce nombre de jours (max 30).</small>
                </div>
            </div>
            <button class="btn btn-primary btn-lg" onclick="doDeploy()" id="deploy-btn" style="margin-top:1.5rem;">
                Déployer la campagne
            </button>
        </div>
    </main>
    `;
}

// ===========================================
// Actions blockchain
// ===========================================
async function doDeploy() {
    const target = document.getElementById('deploy-target').value;
    const days = document.getElementById('deploy-days').value;

    if (!target || Number(target) <= 0) return showToast('Objectif invalide.', 'error');
    if (!days || Number(days) < 1 || Number(days) > 30) return showToast('Durée invalide (1-30 jours).', 'error');

    const btn = document.getElementById('deploy-btn');
    btn.disabled = true;
    btn.textContent = 'Déploiement en cours...';

    try {
        const tx = await factoryContract.methods.createCampaign(target, days).send({ from: currentAccount, gas: 5000000 });
        const event = tx.events.CampaignCreated;
        const newAddr = event ? event.returnValues.campaignAddress : null;
        showToast('Campagne déployée avec succès !', 'success');
        if (newAddr) navigateTo('admin/' + newAddr);
        else navigateTo('home');
    } catch (err) {
        console.error(err);
        showToast('Erreur lors du déploiement : ' + (err.message || err), 'error');
        btn.disabled = false;
        btn.textContent = 'Déployer la campagne';
    }
}

async function doContribute(addr) {
    const amount = document.getElementById('contribute-amount').value;
    if (!amount || Number(amount) <= 0) return showToast('Montant invalide.', 'error');

    try {
        const contract = new web3.eth.Contract(CROWDFUNDING_ABI, addr);
        await contract.methods.contribute().send({ from: currentAccount, value: amount, gas: 300000 });
        showToast('Contribution envoyée !', 'success');
        renderCampaignDetail(addr);
    } catch (err) {
        console.error(err);
        showToast('Erreur : ' + extractRevertReason(err), 'error');
    }
}

async function doRefund(addr) {
    try {
        const contract = new web3.eth.Contract(CROWDFUNDING_ABI, addr);
        await contract.methods.refund().send({ from: currentAccount, gas: 300000 });
        showToast('Remboursement effectué !', 'success');
        renderCampaignDetail(addr);
    } catch (err) {
        console.error(err);
        showToast('Erreur : ' + extractRevertReason(err), 'error');
    }
}

async function doClaimNFT(addr) {
    try {
        const contract = new web3.eth.Contract(CROWDFUNDING_ABI, addr);
        await contract.methods.claimNFT().send({ from: currentAccount, gas: 300000 });
        showToast('NFT réclamé avec succès !', 'success');
        renderCampaignDetail(addr);
    } catch (err) {
        console.error(err);
        showToast('Erreur : ' + extractRevertReason(err), 'error');
    }
}

async function doClaimFunds(addr) {
    try {
        const contract = new web3.eth.Contract(CROWDFUNDING_ABI, addr);
        await contract.methods.claimFunds().send({ from: currentAccount, gas: 300000 });
        showToast('Fonds réclamés avec succès !', 'success');
        renderAdmin(addr);
    } catch (err) {
        console.error(err);
        showToast('Erreur : ' + extractRevertReason(err), 'error');
    }
}

async function doSetActive(addr, status) {
    try {
        const contract = new web3.eth.Contract(CROWDFUNDING_ABI, addr);
        await contract.methods.setIsCampaignActive(status).send({ from: currentAccount, gas: 200000 });
        showToast(status ? 'Campagne réactivée.' : 'Campagne désactivée.', 'success');
        renderAdmin(addr);
    } catch (err) {
        console.error(err);
        showToast('Erreur : ' + extractRevertReason(err), 'error');
    }
}

async function doAddTier(addr) {
    const name = document.getElementById('tier-name').value;
    const min = document.getElementById('tier-min').value;
    const max = document.getElementById('tier-max').value;
    const uri = document.getElementById('tier-uri').value;

    if (!name) return showToast('Nom du tier requis.', 'error');
    if (!min || Number(min) <= 0) return showToast('Montant minimum invalide.', 'error');
    if (!max || Number(max) <= 0) return showToast('Nombre max invalide.', 'error');
    if (!uri) return showToast('Token URI requis.', 'error');

    try {
        const contract = new web3.eth.Contract(CROWDFUNDING_ABI, addr);
        await contract.methods.addTier(name, min, max, uri).send({ from: currentAccount, gas: 300000 });
        showToast('Tier ajouté !', 'success');
        renderAdmin(addr);
    } catch (err) {
        console.error(err);
        showToast('Erreur : ' + extractRevertReason(err), 'error');
    }
}

function extractRevertReason(err) {
    if (err && err.message) {
        const match = err.message.match(/reason string '(.+?)'/);
        if (match) return match[1];
        if (err.message.includes('User denied')) return 'Transaction refusée par l\'utilisateur.';
    }
    return 'Transaction échouée.';
}
