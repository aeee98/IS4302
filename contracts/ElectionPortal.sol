// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import "./token/ERC20.sol";
import "./Election.sol";
import "./ElectionAdministrator.sol";
import "./VotingRegions.sol";

contract ElectionPortal {
    ERC20 tokenContract;
    ElectionAdministrator administratorContract;

    Election[] elections;

    modifier adminOnly {
        require(administratorContract.isAdministrator(msg.sender), "Not Administrator");
        _;
    }

    constructor(ERC20 _tokenContract, ElectionAdministrator _administratorContract) {
        tokenContract = _tokenContract;
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