# CrowdFund DApp

Application web décentralisée de crowdfunding avec NFT, utilisant Solidity, Web3.js, MetaMask et Ganache.

> [!NOTE]
> Projet académique réalisé dans le cadre de la matière Blockchain 
> 
> L'objectif de ce projet était l'apprentissage du langage Solidity et la rédaction de contrats
> 
> Usage d'Opus 4.6 Extended pour le déploiement local, la dockerisation du projet et une partie du front-end

---

## Démarrage rapide avec Docker

Une seule commande pour tout lancer :

```bash
docker compose up --build
```

Cela démarre automatiquement :
1. **Ganache** — blockchain locale sur le port 7545
2. **Deployer** — compile et déploie la CrowdfundingFactory
3. **Web** — interface web sur http://localhost:3000

### Configurer MetaMask

Ajoutez le réseau Ganache dans MetaMask :
- **Nom** : Ganache Docker
- **RPC URL** : `http://127.0.0.1:7545`
- **Chain ID** : `1337`
- **Symbole** : ETH

Pour importer des comptes de test, récupérez les clés privées dans les logs Ganache :

```bash
docker logs crowdfund-ganache
```


---

## Installation manuelle (sans Docker)

### Prérequis

- **Node.js** (v16+)
- **Ganache** (GUI ou CLI) lancé sur `127.0.0.1:7545`
- **MetaMask** connecté au réseau Ganache (Chain ID: 1337)
- **Remix IDE** (https://remix.ethereum.org)

### Étapes

```bash
cd crowdfunding-dapp
npm install
```

1. Ouvrez Remix IDE, copiez les fichiers du dossier `contracts/`
2. Compilez avec Solidity 0.8.x, **EVM Version: paris**
3. Déployez `CrowdfundingFactory` via Web3 Provider (`http://127.0.0.1:7545`)
4. Créez un fichier `config.json` à la racine du projet :

```json
{ "factoryAddress": "0xVOTRE_ADRESSE_FACTORY" }
```

5. Lancez le serveur :

```bash
npm start
```

6. Ouvrez http://localhost:3000

---

## Fonctionnalités

### Connexion
Cliquez sur **Connecter MetaMask** pour relier votre portefeuille.

### Créer une campagne
1. Cliquez sur **Déployer** dans la barre de navigation
2. Entrez l'objectif en **Wei** et la durée en jours
3. Confirmez la transaction MetaMask

### Administrer une campagne (propriétaire)
- Ajouter des tiers (nom, montant min, places, token URI)
- Activer / désactiver la campagne
- Réclamer les fonds après succès

### Contribuer
1. Cliquez sur une campagne depuis la page d'accueil
2. Entrez un montant en **Wei** correspondant à un tier
3. Confirmez la transaction

### Remboursement
Disponible si la campagne échoue ou est désactivée.

### Réclamer un NFT
Disponible après le succès de la campagne et la réclamation des fonds.

---
