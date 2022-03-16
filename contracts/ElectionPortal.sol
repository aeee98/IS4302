// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import "./token/ERC20.sol";
import "./Election.sol";
import "./ElectionAdministrator.sol";
import "./VotingRegions.sol";

contract ElectionPortal {
    ERC20 tokenContract;
    ElectionAdministrator administratorContract;
    uint64 electionCount;

    Election[] previousElections;
    Election currentElection;

    modifier adminOnly {
        require(administratorContract.isAdministrator(msg.sender), "Not Administrator");
        _;
    }

    constructor(ERC20 _tokenContract, ElectionAdministrator _administratorContract) {
        tokenContract = _tokenContract;
        administratorContract = _administratorContract;
        electionCount = 0;
    }


    function addNewElection(Election election) public adminOnly {
        require (address(election) != address(0), "Election contract must exist");
        currentElection = election;
    }

    

}