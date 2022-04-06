// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import "./Election.sol";
import "./ElectionAdministrator.sol";

contract ElectionPortal {
    ElectionAdministrator private administratorContract;

    Election[] private elections;

    event ElectionAdded();

    modifier adminOnly {
        require(administratorContract.isAdministrator(msg.sender), "Not Administrator");
        _;
    }

    constructor(ElectionAdministrator _administratorContract) {
        administratorContract = _administratorContract;
    }


    function addNewElection(Election election) public adminOnly {
        elections.push(election);
        emit ElectionAdded();
    }

    function getLatestElection() public view returns (Election) {
        require(elections.length > 0, "Please add an election first!");
        require(elections[elections.length -1].checkEnded() == false, "Election has ended.");
        return elections[elections.length - 1];
    }
}