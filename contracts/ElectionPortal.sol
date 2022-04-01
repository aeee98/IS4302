// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import "./Election.sol";
import "./ElectionAdministrator.sol";
import "./VotingRegions.sol";

contract ElectionPortal {
    ElectionAdministrator private administratorContract;

    Election[] private elections;

    modifier adminOnly {
        require(administratorContract.isAdministrator(msg.sender), "Not Administrator");
        _;
    }

    constructor(ElectionAdministrator _administratorContract) {
        administratorContract = _administratorContract;
    }


    function addNewElection(Election election) public adminOnly {
        elections.push(election);
    }

    function getLatestElection() public view returns (Election) {
        require(elections[elections.length -1].checkEnded() == false);
        return elections[elections.length - 1];
    }
}