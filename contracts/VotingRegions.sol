pragma solidity ^0.8.0;

import "./ElectionAdministrator.sol";
import "./util/StringUtils.sol";

contract VotingRegions {
    address[] eligibleReferenceContracts; // eligible contracts that can modify the voting region, not used yet
    ElectionAdministrator administratorContract;
    VotingRegion[] regions;

    event RegionCreated(string regionName, string regionCode,string regionDescription, string RegionInformation);
    event RegionAlreadyExists(string regionName, string regionCode);
    event RegionCodeChanged(string oldCode, string newCode);
    event RegionRemoved(string regionCode);

    modifier adminOnly {
        require(administratorContract.isAdministrator(msg.sender), "Not Administrator");
        _;
    }

    constructor() {
    }

    struct VotingRegion {
        string regionName;        // Name of Region
        string regionCode;        // Codename abbreviation of Region (This must be unique)
        string regionDescription; // Description of Region (if any)
        string regionInformation; // Link (may be removed if unneeded)
    }
    
    function createRegion (string memory regionCode, string memory regionName, string memory regionDescription, string memory regionInformation) public adminOnly {
        for (uint i = 0; i < regions.length; ++i) {
            if (StringUtils.equal(regionCode, regions[i].regionCode)) {
                emit RegionAlreadyExists(regionName, regionCode);
                return;
            }
        }
        if (!exists) {
            VotingRegion memory newRegion = VotingRegion(regionName, regionCode, regionDescription, regionInformation);
            regions.push(newRegion);
            emit RegionCreated(regionname, regionCode, regionDescription, regionInformation);
        }
    }

    function getRegions() public view returns (VotingRegion[]) {
        return regions;
    }

    function getRegion(string memory regionCode) public view returns (VotingRegion) {
        for (uint i = 0; i < regions.length; ++i) {
            if (StringUtils.equal(regionCode, regions[i].regionCode)) {
                return regions[i];
            }
        }
        revert("No region with code " + regionCode + " found.");
    }

    function editRegion(string memory regionCode, string memory _regionName, string memory _regionDescription, string memory _regionInformation) public adminOnly {
        for (uint i = 0; i < regions.length; ++i) {
            if (StringUtils.equal(regionCode, regions[i].regionCode)) {
                regions[i].regionName = _regionName;
                regions[i].regionDescription = _regionDescription;
                regions[i].regionInformation = _regionInformation;
                return;
            }
        }
        revert("No region with code " + regionCode + " found.");
    }

    function editRegionCode(string memory oldCode, string memory newCode) public adminOnly {
         for (uint i = 0; i < regions.length; ++i) {
            if (StringUtils.equal(oldCode, regions[i].regionCode)) {
                regions[i].regionCode = newCode;
                emit RegionCodeChanged(oldCode, newCode);
                return;
            }
        }
        revert("No region with code " + regionCode + " found.");
    }

    function deleteRegion(string memory regionCode) public adminOnly {
        if (StringUtils.equal(regionCode, regions[i].regionCode)) {
            //Unordered Pop
            regions[i] = regions[regions.length - 1];
            regions.pop();
            emit RegionRemoved(regionCode);
        }
    }
}

