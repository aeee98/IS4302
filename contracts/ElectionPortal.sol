// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import "./Election.sol";
import "./ElectionAdministrator.sol";

contract ElectionPortal {
    ElectionAdministrator private administratorContract;

    mapping (uint16 => Election) private elections;
    uint16 private latestElection;
    event ElectionAdded(); // for unit testing

    modifier adminOnly {
        require(administratorContract.isAdministrator(msg.sender), "Not Administrator");
        _;
    }

    constructor(ElectionAdministrator _administratorContract) {
        administratorContract = _administratorContract;
        latestElection = 0;
    }


    function addNewElection(Election election, uint16 year) public adminOnly { //Assumption: new elections are only added once it is confirmed
        elections[year] = election;
        latestElection = year;
        emit ElectionAdded();
    }

    function getLatestElection() public view returns (Election) {
        require(address(elections[latestElection]) != address(0), "Election does not exist");
        return elections[latestElection];
    }
    
    function getElection(uint16 year) public view returns (Election) {
        require(address(elections[year]) != address(0), "Election does not exist");
        return elections[year];
    }
}