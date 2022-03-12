pragma solidity ^0.8.0;

import "./token/ERC20.sol";
import "./Election.sol";

contract ElectionPortal {
    ERC20 tokenContract;

    mapping (address => bool) administrators;
    uint64 electionCount;

    Election[] previousElections;
    Election currentElection;

    constructor() {
        administrators[msg.sender] = true;
    }

    modifier adminOnly {
        require (administrators[msg.sender], "Admin Only");
        _;
    }



}