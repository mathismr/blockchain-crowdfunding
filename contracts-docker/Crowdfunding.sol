// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;
import '@openzeppelin/contracts/access/Ownable.sol';
import '@openzeppelin/contracts/token/ERC721/ERC721.sol';

struct ContributionTier {
    string name;
    uint minAmount;
    uint maxContributors;
    uint contributorCount;
    string tokenURI;
}

contract Crowdfunding is Ownable, ERC721 {
    // EVENTS
    //
    event Contribution(address indexed contributor, uint amount);
    event FundsClaimed(uint amount);
    event ClaimedNFT(address indexed contributor);
    event Status(string message);
    event Refund(address indexed contributor, uint amount);

    // STATE VARIABLES
    //
    uint public targetAmount;
    uint256 public deadline;

    uint private totalContributions;
    uint256 private _tokenIdCounter;
    mapping(address => uint) private contributions;
    mapping(address => uint) private contributorTier;
    mapping(address => bool) private hasClaimedNFT;
    mapping(uint256 => uint) private _tokenTier;
    bool private isCampaignActive = true;
    bool private isCampaignFinished = false;
    ContributionTier[] private tiers;

    constructor(uint _targetAmount, uint _nb_days) ERC721("CrowdfundingNFT", "CFT") {
        require(_targetAmount > 0, "_targetAmount shall be greater than 0");
        require(_nb_days > 0, "_nb_days shall be greater than 0");
        require(_nb_days <= 30, "_nb_days shall not be greater than 30");

        transferOwnership(msg.sender);
        targetAmount = _targetAmount;
        deadline = block.timestamp + (_nb_days * 1 days);
    }

    // GETTERS
    //
    function getTotalContributions() public view returns (uint) { return totalContributions; }
    function getTimeLeft() public view returns (uint) { return block.timestamp < deadline ? deadline - block.timestamp : 0; }
    function getIsCampaignActive() public view returns (bool) { return isCampaignActive; }
    function getMyContribution() public view returns (uint) { return contributions[msg.sender]; }
    function getIsCampaignFinished() public view returns (bool) { return isCampaignFinished; }
    function getDeadline() public view returns (uint256) { return deadline; }
    function getTargetAmount() public view returns (uint) { return targetAmount; }
    function getTiers() public view returns (ContributionTier[] memory) { return tiers; }
    function getContribution(address _addr) public view returns (uint) { return contributions[_addr]; }
    function getContributorTier(address _addr) public view returns (string memory) { return tiers[contributorTier[_addr]].name; }

    // FUNCTIONS
    //
    function setIsCampaignActive(bool _status) public onlyOwner {
        isCampaignActive = _status;
        if (!_status) { emit Status("Campaign is closed"); }
        else { emit Status("Campaign is active"); }
    }

    function addTier(string memory _name, uint256 _minAmount, uint _maxContributors, string memory _tokenURI) public onlyOwner {
        require(totalContributions == 0, "Contributions already started");
        tiers.push(ContributionTier(_name, _minAmount, _maxContributors, 0, _tokenURI));
    }

    function contribute() public payable {
        require(block.timestamp < deadline, "Campaign is finished");
        require(isCampaignActive, "Campaign is closed");
        require(msg.value > 0, "Invalid amount");

        bool tierFound = false;
        uint contributorTierIndex;
        for (uint i = 0; i < tiers.length; i++) {
            if (msg.value >= tiers[i].minAmount) {
                if (!tierFound || tiers[i].minAmount > tiers[contributorTierIndex].minAmount) {
                    contributorTierIndex = i;
                    tierFound = true;
                }
            }
        }

        require(tierFound, "No tier found");
        require(tiers[contributorTierIndex].contributorCount < tiers[contributorTierIndex].maxContributors, "Tier is full");

        ContributionTier storage tier = tiers[contributorTierIndex];
        totalContributions += msg.value;
        contributions[msg.sender] += msg.value;
        contributorTier[msg.sender] = contributorTierIndex;
        tier.contributorCount++;
        hasClaimedNFT[msg.sender] = false;

        emit Contribution(msg.sender, msg.value);
    }

    function claimFunds() public onlyOwner {
        require(block.timestamp >= deadline, "Campaign is still ongoing");
        require(totalContributions >= targetAmount, "Target amount not reached");
        require(isCampaignActive, "Campaign is already closed");
        
        uint sendAmount = totalContributions;
        totalContributions = 0;
        isCampaignActive = false;
        
        (bool success, ) = msg.sender.call{value: sendAmount}("");
        require(success, "Transfer failed");
        isCampaignFinished = true;

        emit FundsClaimed(sendAmount);
    }

    function claimNFT() public {
        require(isCampaignFinished, "Campaign is not finished yet");
        require(contributions[msg.sender] > 0, "You have no contribution to claim");
        require(!hasClaimedNFT[msg.sender], "NFT already claimed");
        
        hasClaimedNFT[msg.sender] = true;
        uint tierIndex = contributorTier[msg.sender];
        _tokenIdCounter++;
        _tokenTier[_tokenIdCounter] = tierIndex;

        _safeMint(msg.sender, _tokenIdCounter);
    }

    function refund() public {
        require(block.timestamp > deadline || !isCampaignActive, "Campaign is still ongoing");
        require(totalContributions < targetAmount, "Target amount reached");
        require(totalContributions > 0, "No contributions left");
        require(contributions[msg.sender] > 0, "No contribution found");
        
        uint refundAmount = contributions[msg.sender];
        contributions[msg.sender] = 0;
        
        (bool success, ) = msg.sender.call{value: refundAmount}("");
        require(success, "Transfer failed");
        
        totalContributions -= refundAmount;
        
        emit Refund(msg.sender, refundAmount);
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        return tiers[_tokenTier[tokenId]].tokenURI;
    }
}
