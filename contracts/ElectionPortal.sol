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

    constructor(ERC20 _tokenContract) {
        tokenContract = _tokenContract;
        electionCount = 0;
    }




}