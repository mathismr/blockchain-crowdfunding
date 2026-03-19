// ===========================================
// ABI pour le contrat CrowdfundingFactory
// ===========================================
const FACTORY_ABI = [
    {
        "inputs": [
            { "name": "_title", "type": "string" },
            { "name": "_description", "type": "string" },
            { "name": "_targetAmount", "type": "uint256" },
            { "name": "_nbDays", "type": "uint256" }
        ],
        "name": "createCampaign",
        "outputs": [{ "name": "", "type": "address" }],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "getCampaigns",
        "outputs": [{ "name": "", "type": "address[]" }],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "getCampaignCount",
        "outputs": [{ "name": "", "type": "uint256" }],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [{ "name": "_user", "type": "address" }],
        "name": "getUserCampaigns",
        "outputs": [{ "name": "", "type": "address[]" }],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "anonymous": false,
        "inputs": [
            { "indexed": true, "name": "creator", "type": "address" },
            { "indexed": false, "name": "campaignAddress", "type": "address" },
            { "indexed": false, "name": "title", "type": "string" },
            { "indexed": false, "name": "targetAmount", "type": "uint256" },
            { "indexed": false, "name": "nbDays", "type": "uint256" }
        ],
        "name": "CampaignCreated",
        "type": "event"
    }
];

// ===========================================
// ABI pour le contrat Crowdfunding
// ===========================================
const CROWDFUNDING_ABI = [
    // --- View functions ---
    {
        "inputs": [],
        "name": "getTitle",
        "outputs": [{ "name": "", "type": "string" }],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "getDescription",
        "outputs": [{ "name": "", "type": "string" }],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "title",
        "outputs": [{ "name": "", "type": "string" }],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "description",
        "outputs": [{ "name": "", "type": "string" }],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "getTotalContributions",
        "outputs": [{ "name": "", "type": "uint256" }],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "getTimeLeft",
        "outputs": [{ "name": "", "type": "uint256" }],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "getIsCampaignActive",
        "outputs": [{ "name": "", "type": "bool" }],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "getMyContribution",
        "outputs": [{ "name": "", "type": "uint256" }],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "getIsCampaignFinished",
        "outputs": [{ "name": "", "type": "bool" }],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "getDeadline",
        "outputs": [{ "name": "", "type": "uint256" }],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "getTargetAmount",
        "outputs": [{ "name": "", "type": "uint256" }],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "targetAmount",
        "outputs": [{ "name": "", "type": "uint256" }],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "deadline",
        "outputs": [{ "name": "", "type": "uint256" }],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "getTiers",
        "outputs": [{
            "components": [
                { "name": "name", "type": "string" },
                { "name": "minAmount", "type": "uint256" },
                { "name": "maxContributors", "type": "uint256" },
                { "name": "contributorCount", "type": "uint256" },
                { "name": "tokenURI", "type": "string" }
            ],
            "name": "",
            "type": "tuple[]"
        }],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [{ "name": "_addr", "type": "address" }],
        "name": "getContribution",
        "outputs": [{ "name": "", "type": "uint256" }],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [{ "name": "_addr", "type": "address" }],
        "name": "getContributorTier",
        "outputs": [{ "name": "", "type": "string" }],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "owner",
        "outputs": [{ "name": "", "type": "address" }],
        "stateMutability": "view",
        "type": "function"
    },
    // --- State-changing functions ---
    {
        "inputs": [],
        "name": "reduceTimeForDemo",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [{ "name": "_status", "type": "bool" }],
        "name": "setIsCampaignActive",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            { "name": "_name", "type": "string" },
            { "name": "_minAmount", "type": "uint256" },
            { "name": "_maxContributors", "type": "uint256" },
            { "name": "_tokenURI", "type": "string" }
        ],
        "name": "addTier",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "contribute",
        "outputs": [],
        "stateMutability": "payable",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "claimFunds",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "claimNFT",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "refund",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [{ "name": "newOwner", "type": "address" }],
        "name": "transferOwnership",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    // --- Events ---
    {
        "anonymous": false,
        "inputs": [
            { "indexed": true, "name": "contributor", "type": "address" },
            { "indexed": false, "name": "amount", "type": "uint256" }
        ],
        "name": "Contribution",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [{ "indexed": false, "name": "amount", "type": "uint256" }],
        "name": "FundsClaimed",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [{ "indexed": true, "name": "contributor", "type": "address" }],
        "name": "ClaimedNFT",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [{ "indexed": false, "name": "message", "type": "string" }],
        "name": "Status",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            { "indexed": true, "name": "contributor", "type": "address" },
            { "indexed": false, "name": "amount", "type": "uint256" }
        ],
        "name": "Refund",
        "type": "event"
    }
];