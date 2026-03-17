const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;
const CONFIG_PATH = process.env.CONFIG_PATH || path.join(__dirname, 'config.json');

// API : renvoie la configuration du contrat déployé
app.get('/api/config', (req, res) => {
    try {
        // Vérifier le volume partagé Docker puis le fichier local
        const paths = ['/shared/config.json', CONFIG_PATH];
        for (const p of paths) {
            if (fs.existsSync(p)) {
                const config = JSON.parse(fs.readFileSync(p, 'utf8'));
                return res.json(config);
            }
        }
        res.status(503).json({ error: 'Contrats pas encore déployés. Patientez...' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Servir les fichiers statiques depuis le dossier public
app.use(express.static(path.join(__dirname, 'public')));

// SPA fallback
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n  ╔══════════════════════════════════════╗`);
    console.log(`  ║   CrowdFund DApp                     ║`);
    console.log(`  ║   → http://localhost:${PORT}             ║`);
    console.log(`  ╚══════════════════════════════════════╝\n`);
});
