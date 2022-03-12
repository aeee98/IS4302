pragma solidity ^0.8.0;

contract VotingRegions {

    address[] administrators; // eligible administrators with rights to edit the voting regions
    address[] eligibleReferenceContracts; // eligible contracts that can modify the voting region

    mapping (string => VotingRegion) regions;

    modifier adminOnly {
        require (isAdministrator(msg.sender), "Error, admin only");
        _;
    }

    constructor() {
        administrators.push(msg.sender);
    }

    function isAdministrator(address _address) private view returns (bool) {
        bool isAdmin = false;
        for (uint i = 0; i < administrators.length; ++i) {
            if (_address == administrators[i]) {
                isAdmin = true;
                break;
            }
        }

        return isAdmin;
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

