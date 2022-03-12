pragma solidity ^0.8.0;

import "./token/ERC223.sol";

contract ElectionPortal {
    ERC223Token tokenContract;

    mapping (address => bool) administrators;

    

}