pragma solidity ^0.8.0;

contract VotingRegions {
    address[] eligibleReferenceContracts; // eligible contracts that can modify the voting region, not used yet

    modifier adminOnly {
        require (isAdministrator(msg.sender), "Error, admin only");
        _;
    }

    constructor() {
        administrators.push(msg.sender);
    }

    function getEligibleReferenceContracts() public view returns (address[] memory) {
        return eligibleReferenceContracts;
    }


    struct VotingRegion {
        string regionName;        // Name of Region
        string regionCode;        // Codename abbreviation of Region
        string regionDescription; // Description of Region (if any)
        string regionInformation; // Link (may be removed if unneeded)
    }
}

