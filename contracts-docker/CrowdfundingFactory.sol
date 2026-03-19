// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;
import './Crowdfunding.sol';

contract CrowdfundingFactory {
    address[] public campaigns;
    mapping(address => address[]) public userCampaigns;

    event CampaignCreated(address indexed creator, address campaignAddress, string title, uint targetAmount, uint nbDays);

    function createCampaign(string memory _title, string memory _description, uint _targetAmount, uint _nbDays) public returns (address) {
        Crowdfunding newCampaign = new Crowdfunding(_title, _description, _targetAmount, _nbDays);
        newCampaign.transferOwnership(msg.sender);

        address campaignAddr = address(newCampaign);
        campaigns.push(campaignAddr);
        userCampaigns[msg.sender].push(campaignAddr);

        emit CampaignCreated(msg.sender, campaignAddr, _title, _targetAmount, _nbDays);

        return campaignAddr;
    }

    function getCampaigns() public view returns (address[] memory) {
        return campaigns;
    }

    function getCampaignCount() public view returns (uint) {
        return campaigns.length;
    }

    function getUserCampaigns(address _user) public view returns (address[] memory) {
        return userCampaigns[_user];
    }
}
